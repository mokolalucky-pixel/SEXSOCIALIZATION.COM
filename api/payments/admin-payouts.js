import { requireAdmin } from '../_lib/admin.js'
import { requireUser } from '../_lib/auth.js'
import { ensureSchema, getSql } from '../_lib/db.js'
import { requireMethod, sendError, sendJson } from '../_lib/http.js'

export default async function handler(req, res) {
  try {
    requireMethod(req, ['GET'])
    const user = await requireUser(req)
    requireAdmin(user)
    await ensureSchema()

    const payouts = await getSql()`
      SELECT payout_requests.id,
        payout_requests.user_id,
        payout_requests.amount,
        payout_requests.currency,
        payout_requests.bank_name,
        payout_requests.account_holder,
        payout_requests.account_type,
        payout_requests.status,
        payout_requests.processed_at,
        payout_requests.created_at,
        users.email AS user_email,
        users.display_name AS user_display_name
      FROM payout_requests
      JOIN users ON users.id = payout_requests.user_id
      ORDER BY payout_requests.created_at DESC
      LIMIT 500
    `

    sendJson(res, 200, payouts)
  } catch (error) {
    sendError(res, error)
  }
}
