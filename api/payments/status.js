import { requireUser } from '../_lib/auth.js'
import { getSql } from '../_lib/db.js'
import { requireMethod, sendError, sendJson } from '../_lib/http.js'

export default async function handler(req, res) {
  try {
    requireMethod(req, ['GET'])
    const user = await requireUser(req)

    const [row] = await getSql()`
      SELECT subscription_status, subscribed_at
      FROM users
      WHERE id = ${user.id}
    `

    sendJson(res, 200, {
      subscriptionStatus: row?.subscription_status || 'none',
      subscribedAt: row?.subscribed_at || null,
    })
  } catch (error) {
    sendError(res, error)
  }
}
