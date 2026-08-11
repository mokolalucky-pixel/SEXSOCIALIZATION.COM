import { randomUUID } from 'node:crypto'
import { requireUser } from '../_lib/auth.js'
import { ensureSchema, getSql } from '../_lib/db.js'
import { requirePremium } from '../_lib/premium.js'
import { requireMethod, sendError, sendJson } from '../_lib/http.js'

const MINIMUM_PAYOUT_ZAR = 50

export default async function handler(req, res) {
  try {
    requireMethod(req, ['POST'])
    const user = await requireUser(req)
    await ensureSchema(); const db = getSql()
    const [account] = await db`
      SELECT subscription_status, earnings_balance, payout_bank_name, payout_account_holder, payout_account_number, payout_account_number_encrypted, payout_account_type
      FROM users WHERE id = ${user.id}`
    requirePremium(account)
    if (!account?.payout_bank_name || (!account?.payout_account_number_encrypted && !account?.payout_account_number)) throw Object.assign(new Error('Add your payout banking details before requesting a payout.'), { statusCode: 400 })
    const balance = Number(account.earnings_balance || 0)
    if (balance < MINIMUM_PAYOUT_ZAR) throw Object.assign(new Error(`Minimum payout is R${MINIMUM_PAYOUT_ZAR}.`), { statusCode: 400 })
    const [existing] = await db`SELECT id FROM payout_requests WHERE user_id = ${user.id} AND status = 'pending' LIMIT 1`
    if (existing) throw Object.assign(new Error('You already have a pending payout request.'), { statusCode: 409 })
    const requestId = randomUUID()
    await db`INSERT INTO payout_requests (id, user_id, amount, currency, bank_name, account_holder, account_type, status)
      VALUES (${requestId}, ${user.id}, ${balance}, 'ZAR', ${account.payout_bank_name}, ${account.payout_account_holder}, ${account.payout_account_type}, 'pending')`
    await db`UPDATE users SET earnings_balance = 0, total_paid_out = COALESCE(total_paid_out, 0) + ${balance} WHERE id = ${user.id}`
    sendJson(res, 201, { success: true, requestId, amount: balance, currency: 'ZAR', status: 'pending', message: `Payout of R${balance.toFixed(2)} has been submitted to your registered bank account.` })
  } catch (error) { sendError(res, error) }
}
