import { requireUser } from '../_lib/auth.js'
import { getSql } from '../_lib/db.js'
import { getPartnerForUser } from '../_lib/relationships.js'
import { readJson, requireMethod, sendError, sendJson } from '../_lib/http.js'

export default async function handler(req, res) {
  try {
    requireMethod(req, ['PATCH', 'DELETE'])
    const user = await requireUser(req)
    const partner = await getPartnerForUser(user.id)
    if (!partner) throw Object.assign(new Error('An active partner relationship is required.'), { statusCode: 403 })
    const id = String(req.query.id || '')
    if (!id) throw Object.assign(new Error('Message ID is required.'), { statusCode: 400 })
    if (req.method === 'DELETE') {
      const [deleted] = await getSql()`DELETE FROM private_messages WHERE id = ${id} AND sender_user_id = ${user.id} AND recipient_user_id = ${partner.partnerUserId} RETURNING id`
      if (!deleted) throw Object.assign(new Error('Message not found.'), { statusCode: 404 })
      sendJson(res, 200, { deleted: true, id }); return
    }
    const { body } = await readJson(req); const messageBody = String(body || '').trim()
    if (messageBody.length < 1 || messageBody.length > 1000) throw Object.assign(new Error('Message must be between 1 and 1000 characters.'), { statusCode: 400 })
    const [message] = await getSql()`UPDATE private_messages SET body = ${messageBody}, edited_at = NOW() WHERE id = ${id} AND sender_user_id = ${user.id} AND recipient_user_id = ${partner.partnerUserId} RETURNING id, body, created_at, edited_at`
    if (!message) throw Object.assign(new Error('Message not found.'), { statusCode: 404 })
    sendJson(res, 200, { message: { id: message.id, body: message.body, mine: true, createdAt: message.created_at, editedAt: message.edited_at } })
  } catch (error) { sendError(res, error) }
}
