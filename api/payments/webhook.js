import { createHmac, randomUUID } from 'node:crypto'
import { getSql, ensureSchema } from '../_lib/db.js'
import { isAdminEmail } from '../_lib/admin.js'
import { isPremiumStatus } from '../_lib/premium.js'
import { sendError, sendJson } from '../_lib/http.js'

function getWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw Object.assign(new Error('Webhook secret is not configured.'), { statusCode: 503 })
  return secret
}
function verifyStripeSignature(rawBody, signatureHeader, secret) {
  const parts = Object.fromEntries(String(signatureHeader || '').split(',').map((pair) => pair.split('=')))
  if (!parts.t || !parts.v1 || Math.abs(Date.now() / 1000 - Number(parts.t)) > 300) throw Object.assign(new Error('Invalid signature.'), { statusCode: 400 })
  const expected = createHmac('sha256', secret).update(`${parts.t}.${rawBody}`).digest('hex')
  if (expected !== parts.v1) throw Object.assign(new Error('Signature verification failed.'), { statusCode: 400 })
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
    WHERE id = ${partnerId} AND stripe_customer_id IS NULL`
}
async function deactivatePartnerPremium(db, userId) {
  const [relationship] = await db`
    SELECT owner_user_id, partner_user_id FROM partner_invites
    WHERE status = 'accepted' AND (owner_user_id = ${userId} OR partner_user_id = ${userId})
    ORDER BY accepted_at DESC LIMIT 1`
  if (!relationship) return
  const partnerId = relationship.owner_user_id === userId ? relationship.partner_user_id : relationship.owner_user_id
  await db`
    UPDATE users
    SET subscription_status = 'cancelled', subscription_owner_id = NULL
    WHERE id = ${partnerId} AND subscription_owner_id = ${userId}`
}
async function awardCommission(db, invoice) {
  const [referred] = await db`SELECT id, referred_by_user_id FROM users WHERE stripe_customer_id = ${invoice.customer} LIMIT 1`
  if (!referred || !invoice.id || Number(invoice.amount_paid || 0) <= 0) return
  let beneficiaryId = referred.referred_by_user_id
  if (beneficiaryId) {
    const [referrer] = await db`SELECT subscription_status FROM users WHERE id = ${beneficiaryId}`
    if (!isPremiumStatus(referrer?.subscription_status)) beneficiaryId = null
  }
  if (!beneficiaryId) {
    const admins = await db`SELECT id, email FROM users`
    beneficiaryId = admins.find((admin) => isAdminEmail(admin.email))?.id || null
  }
  const amount = Number(invoice.amount_paid) / 100 * 0.25
  const [commission] = await db`
    INSERT INTO referral_commissions (id, referred_user_id, beneficiary_user_id, stripe_invoice_id, amount, currency)
    VALUES (${randomUUID()}, ${referred.id}, ${beneficiaryId}, ${invoice.id}, ${amount}, ${String(invoice.currency || 'zar').toUpperCase()})
    ON CONFLICT (stripe_invoice_id) DO NOTHING RETURNING id`
  if (commission && beneficiaryId) await db`UPDATE users SET earnings_balance = COALESCE(earnings_balance, 0) + ${amount} WHERE id = ${beneficiaryId}`
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') throw Object.assign(new Error('Method not allowed.'), { statusCode: 405 })
    const rawBody = await readRawBody(req)
    verifyStripeSignature(rawBody, req.headers['stripe-signature'], getWebhookSecret())
    const event = JSON.parse(rawBody)
    await ensureSchema(); const db = getSql()
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object; const userId = session.metadata?.user_id || session.client_reference_id
      if (userId) {
        await db`UPDATE users SET subscription_status = 'active', subscription_owner_id = NULL, stripe_customer_id = ${session.customer}, subscription_id = ${session.subscription}, subscribed_at = NOW() WHERE id = ${userId}`
        await activatePartnerPremium(db, userId)
      }
    } else if (event.type === 'invoice.payment_succeeded') {
      await awardCommission(db, event.data.object)
    } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object; const status = event.type === 'customer.subscription.deleted' ? 'cancelled' : subscription.status
      const [subscriber] = await db`SELECT id FROM users WHERE stripe_customer_id = ${subscription.customer} LIMIT 1`
      await db`UPDATE users SET subscription_status = ${status} WHERE stripe_customer_id = ${subscription.customer}`
      if (subscriber && !isPremiumStatus(status)) await deactivatePartnerPremium(db, subscriber.id)
    }
    sendJson(res, 200, { received: true })
  } catch (error) { sendError(res, error) }
}
