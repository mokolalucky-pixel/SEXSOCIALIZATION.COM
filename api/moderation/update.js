import { requireAdmin } from '../_lib/admin.js'
import { requireUser } from '../_lib/auth.js'
import { getSql } from '../_lib/db.js'
import { readJson, requireMethod, sendError, sendJson } from '../_lib/http.js'

const allowedStatuses = new Set(['open', 'reviewing', 'resolved', 'dismissed'])

export default async function handler(req, res) {
  try {
    requireMethod(req, ['POST'])
    const user = await requireUser(req)
    requireAdmin(user)

    const { id, status, adminNote = '' } = await readJson(req)

    if (!id || !allowedStatuses.has(status)) {
      throw Object.assign(new Error('Valid report id and status are required.'), { statusCode: 400 })
    }

    const [report] = await getSql()`
      UPDATE moderation_reports
      SET status = ${status}, admin_note = ${String(adminNote).slice(0, 1000)}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, status, admin_note, updated_at
    `

    if (!report) {
      throw Object.assign(new Error('Report not found.'), { statusCode: 404 })
    }

    sendJson(res, 200, { report })
  } catch (error) {
    sendError(res, error)
  }
}
