import { requireAdmin } from '../_lib/admin.js'
import { requireUser } from '../_lib/auth.js'
import { ensureSchema, getSql } from '../_lib/db.js'
import { readJson, requireMethod, sendError, sendJson } from '../_lib/http.js'

const allowedActions = new Set(['complete', 'reject'])
const statusByAction = {
  complete: 'completed',
  reject: 'rejected',
}

export default async function handler(req, res) {
  try {
    requireMethod(req, ['POST'])
    const user = await requireUser(req)
    requireAdmin(user)
    const { requestId, action } = await readJson(req)

    if (!requestId || !allowedActions.has(action)) {
      throw Object.assign(new Error('Valid requestId and action are required.'), { statusCode: 400 })
    }

    await ensureSchema()
    const db = getSql()
    const nextStatus = statusByAction[action]

    const [updatedRequest] = await db`
      UPDATE payout_requests
      SET status = ${nextStatus}, processed_at = NOW()
      WHERE id = ${requestId}
        AND status = 'pending'
      RETURNING id,
        user_id,
        amount,
        currency,
        bank_name,
        account_holder,
        account_type,
        status,
        processed_at,
        created_at
    `

    if (!updatedRequest) {
      const [existingRequest] = await db`SELECT id, status FROM payout_requests WHERE id = ${requestId} LIMIT 1`

      if (!existingRequest) {
        throw Object.assign(new Error('Payout request not found.'), { statusCode: 404 })
      }

      throw Object.assign(new Error('Only pending payout requests can be processed.'), { statusCode: 409 })
    }

    if (action === 'reject') {
      const refundAmount = Number(updatedRequest.amount || 0)

      await db`
        UPDATE users
        SET
          earnings_balance = COALESCE(earnings_balance, 0) + ${refundAmount},
          total_paid_out = GREATEST(COALESCE(total_paid_out, 0) - ${refundAmount}, 0)
        WHERE id = ${updatedRequest.user_id}
      `
    }

    sendJson(res, 200, {
      success: true,
      payoutRequest: updatedRequest,
    })
  } catch (error) {
    sendError(res, error)
  }
}
