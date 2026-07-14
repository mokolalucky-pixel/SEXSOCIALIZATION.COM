import { randomUUID } from 'node:crypto'
import { requireUser } from '../_lib/auth.js'
import { getSql } from '../_lib/db.js'
import { getPartnerForUser } from '../_lib/relationships.js'
import { readJson, requireMethod, sendError, sendJson } from '../_lib/http.js'

export default async function handler(req, res) {
  try {
    requireMethod(req, ['POST'])
    const user = await requireUser(req)
    const { targetType = 'partner', targetId = null, reason } = await readJson(req)
    const reportReason = String(reason || '').trim()

    if (reportReason.length < 10 || reportReason.length > 1000) {
      throw Object.assign(new Error('Report reason must be between 10 and 1000 characters.'), { statusCode: 400 })
    }

    const partner = await getPartnerForUser(user.id)
    const [report] = await getSql()`
      INSERT INTO moderation_reports (id, reporter_user_id, reported_user_id, target_type, target_id, reason)
      VALUES (${randomUUID()}, ${user.id}, ${partner?.partnerUserId || null}, ${targetType}, ${targetId}, ${reportReason})
      RETURNING id, status, created_at
    `

    sendJson(res, 201, { report })
  } catch (error) {
    sendError(res, error)
  }
}
