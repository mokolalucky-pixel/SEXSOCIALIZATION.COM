import { requireAdmin } from '../_lib/admin.js'
import { requireUser } from '../_lib/auth.js'
import { getSql } from '../_lib/db.js'
import { requireMethod, sendError, sendJson } from '../_lib/http.js'

export default async function handler(req, res) {
  try {
    requireMethod(req, ['GET'])
    const user = await requireUser(req)
    requireAdmin(user)

    const reports = await getSql()`
      SELECT moderation_reports.id,
        moderation_reports.target_type,
        moderation_reports.target_id,
        moderation_reports.reason,
        moderation_reports.status,
        moderation_reports.admin_note,
        moderation_reports.created_at,
        reporter.email AS reporter_email,
        reported.email AS reported_email
      FROM moderation_reports
      JOIN users reporter ON reporter.id = moderation_reports.reporter_user_id
      LEFT JOIN users reported ON reported.id = moderation_reports.reported_user_id
      ORDER BY moderation_reports.created_at DESC
      LIMIT 100
    `

    sendJson(res, 200, { reports })
  } catch (error) {
    sendError(res, error)
  }
}
