import { requireAdmin } from '../_lib/admin.js'
import { requireUser } from '../_lib/auth.js'
import { ensureSchema, getSql } from '../_lib/db.js'
import { readJson, requireMethod, sendError, sendJson } from '../_lib/http.js'

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

    if (!requestId || !action) {
      throw Object.assign(new Error('requestId and action are required.'), { statusCode: 400 })
    }

    if (!statusByAction[action]) {
      throw Object.assign(new Error('Invalid action. Use complete or reject.'), { statusCode: 400 })
    }

    await ensureSchema()
    const db = getSql()
    const nextStatus = statusByAction[action]

    const [requestResult] = await db`
      WITH existing_request AS (
        SELECT id, status
        FROM payout_requests
        WHERE id = ${requestId}
        LIMIT 1
      ),
      updated_request AS (
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
      )
      SELECT existing_request.status AS existing_status,
        updated_request.id,
        updated_request.user_id,
        updated_request.amount,
        updated_request.currency,
        updated_request.bank_name,
        updated_request.account_holder,
        updated_request.account_type,
        updated_request.status,
        updated_request.processed_at,
        updated_request.created_at
      FROM existing_request
      LEFT JOIN updated_request ON existing_request.id = updated_request.id
    `

    if (!requestResult) {
      throw Object.assign(new Error('Payout request not found.'), { statusCode: 404 })
    }

    if (!requestResult.id) {
      throw Object.assign(new Error('Only pending payout requests can be processed.'), { statusCode: 409 })
    }

    const updatedRequest = {
      id: requestResult.id,
      user_id: requestResult.user_id,
      amount: requestResult.amount,
      currency: requestResult.currency,
      bank_name: requestResult.bank_name,
      account_holder: requestResult.account_holder,
      account_type: requestResult.account_type,
      status: requestResult.status,
      processed_at: requestResult.processed_at,
      created_at: requestResult.created_at,
    }

    if (action === 'reject') {
      const refundAmount = String(updatedRequest.amount ?? '0')

      await db`
        UPDATE users
        SET
          earnings_balance = COALESCE(earnings_balance, 0) + ${refundAmount}::numeric,
          total_paid_out = GREATEST(COALESCE(total_paid_out, 0) - ${refundAmount}::numeric, 0)
        WHERE id = ${updatedRequest.user_id}
      `
    }

    sendJson(res, 200, {
      success: true,
      action,
      request: updatedRequest,
      message: action === 'complete'
        ? 'Payout marked as completed.'
        : 'Payout rejected and earnings refunded to user.',
    })
  } catch (error) {
    sendError(res, error)
  }
}
