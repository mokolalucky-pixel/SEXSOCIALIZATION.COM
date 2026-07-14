import { randomUUID } from 'node:crypto'
import { requireUser } from '../_lib/auth.js'
import { getSql } from '../_lib/db.js'
import { getPartnerForUser, requirePartnerForUser } from '../_lib/relationships.js'
import { readJson, requireMethod, sendError, sendJson } from '../_lib/http.js'

function publicMessage(message, userId) {
  return {
    id: message.id,
    body: message.body,
    mine: message.sender_user_id === userId,
    createdAt: message.created_at,
  }
}

async function listMessages(user, partner) {
  const rows = await getSql()`
    SELECT id, sender_user_id, recipient_user_id, body, created_at
    FROM private_messages
    WHERE (sender_user_id = ${user.id} AND recipient_user_id = ${partner.partnerUserId})
      OR (sender_user_id = ${partner.partnerUserId} AND recipient_user_id = ${user.id})
    ORDER BY created_at ASC
    LIMIT 100
  `

  return rows.map((message) => publicMessage(message, user.id))
}

export default async function handler(req, res) {
  try {
    requireMethod(req, ['GET', 'POST'])
    const user = await requireUser(req)

    if (req.method === 'GET') {
      const partner = await getPartnerForUser(user.id)
      if (!partner) {
        sendJson(res, 200, { partner: null, messages: [] })
        return
      }

      sendJson(res, 200, { partner, messages: await listMessages(user, partner) })
      return
    }

    const partner = await requirePartnerForUser(user.id)
    const { body } = await readJson(req)
    const messageBody = String(body || '').trim()

    if (messageBody.length < 1 || messageBody.length > 1000) {
      throw Object.assign(new Error('Message must be between 1 and 1000 characters.'), { statusCode: 400 })
    }

    const [message] = await getSql()`
      INSERT INTO private_messages (id, sender_user_id, recipient_user_id, body)
      VALUES (${randomUUID()}, ${user.id}, ${partner.partnerUserId}, ${messageBody})
      RETURNING id, sender_user_id, recipient_user_id, body, created_at
    `

    sendJson(res, 201, { message: publicMessage(message, user.id) })
  } catch (error) {
    sendError(res, error)
  }
}
