import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { getSql, ensureSchema } from '../_lib/db.js'
import { isAdminEmail } from '../_lib/admin.js'
import { isPremiumStatus } from '../_lib/premium.js'
import { sendError, sendJson } from '../_lib/http.js'

function getPaystackSecret() {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) throw Object.assign(new Error('Payment provider is not configured.'), { statusCode: 503 })
  return secret
}
function verifyPaystackSignature(rawBody, signatureHeader, secret) {
  const expected = createHmac('sha512', secret).update(rawBody).digest('hex')
  const received = String(signatureHeader || '')
  if (received.length !== expected.length || !timingSafeEqual(Buffer.from(received), Buffer.from(expected))) {
    throw Object.assign(new Error('Signature verification failed.'), { statusCode: 400 })
  }
}
async function readRawBody(req) { const chunks = []; for await (const chunk of req) chunks.push(chunk); return Buffer.concat(chunks).toString('utf8') }
async function activatePartnerPremium(db, userId) {
  const [relationship] = await db`
    SELECT owner_user_id, partner_user_id FROM partner_invites
    WHERE status = 'accepted' AND (owner_user_id = ${userId} OR partner_user_id = ${userId})
    ORDER BY accepted_at DESC LIMIT 1`
  if (!relationship) return
  const partnerId = relationship.owner_user_id === userId ? relationship.partner_user_id : relationship.owner_user_id
  await db`
    UPDATE users
    SET subscription_status = 'active', subscription_owner_id = ${userId}, subscribed_at = COALESCE(subscribed_at, NOW())
    WHERE id = ${partnerId} AND paystack_customer_code IS NULL`
}
async function deactivatePartnerPremium(db, userId) {
  const [relationship] = await db`
    SELECT owner_user_id, partner_user_id FROM partner_invites
    WHERE status = 'accepted' AND (owner_user_id = ${userId} OR partner_user_id = ${userId})
    ORDER BY accepted_at DESC LIMIT 1`
  if (!relationship) return
  const partnerId = relationship.owner_user_id === userId ? relationship.partner_user_id : relationship.owner_user_id
  await db`
    UPDATE users SET subscription_status = 'cancelled', subscription_owner_id = NULL
    WHERE id = ${partnerId} AND subscription_owner_id = ${userId}`
}
async function awardCommission(db, charge, userId) {
  if (!charge.reference || Number(charge.amount || 0) <= 0) return
  const [referred] = await db`SELECT id, referred_by_user_id FROM users WHERE id = ${userId} LIMIT 1`
  if (!referred) return
  let beneficiaryId = referred.referred_by_user_id
  if (beneficiaryId) {
    const [referrer] = await db`SELECT subscription_status FROM users WHERE id = ${beneficiaryId}`
    if (!isPremiumStatus(referrer?.subscription_status)) beneficiaryId = null
  }
  if (!beneficiaryId) {
    const admins = await db`SELECT id, email FROM users`
    beneficiaryId = admins.find((admin) => isAdminEmail(admin.email))?.id || null
  }
  const amount = Number(charge.amount) / 100 * 0.25
  const [commission] = await db`
    INSERT INTO referral_commissions (id, referred_user_id, beneficiary_user_id, payment_reference, amount, currency)
    VALUES (${randomUUID()}, ${referred.id}, ${beneficiaryId}, ${charge.reference}, ${amount}, ${String(charge.currency || 'ZAR').toUpperCase()})
    ON CONFLICT (payment_reference) DO NOTHING RETURNING id`
  if (commission && beneficiaryId) await db`UPDATE users SET earnings_balance = COALESCE(earnings_balance, 0) + ${amount} WHERE id = ${beneficiaryId}`
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') throw Object.assign(new Error('Method not allowed.'), { statusCode: 405 })
    const rawBody = await readRawBody(req)
    verifyPaystackSignature(rawBody, req.headers['x-paystack-signature'], getPaystackSecret())
    const event = JSON.parse(rawBody)
    await ensureSchema(); const db = getSql(); const payload = event.data || {}
    if (event.event === 'charge.success') {
      const userId = payload.metadata?.user_id
      const [subscriber] = userId
        ? await db`SELECT id FROM users WHERE id = ${userId} LIMIT 1`
        : await db`SELECT id FROM users WHERE email = ${payload.customer?.email || ''} LIMIT 1`
      if (!subscriber) throw Object.assign(new Error('Payment cannot be matched to a customer.'), { statusCode: 400 })
      await db`
        UPDATE users
        SET subscription_status = 'active', subscription_owner_id = NULL,
            paystack_customer_code = ${payload.customer?.customer_code || null}, subscribed_at = NOW()
        WHERE id = ${subscriber.id}`
      await activatePartnerPremium(db, subscriber.id)
      await awardCommission(db, payload, subscriber.id)
    } else if (event.event === 'subscription.disable') {
      const [subscriber] = await db`SELECT id FROM users WHERE paystack_customer_code = ${payload.customer?.customer_code} LIMIT 1`
      if (subscriber) {
        await db`UPDATE users SET subscription_status = 'cancelled' WHERE id = ${subscriber.id}`
        await deactivatePartnerPremium(db, subscriber.id)
      }
    }
    sendJson(res, 200, { received: true })
  } catch (error) { sendError(res, error) }
}
