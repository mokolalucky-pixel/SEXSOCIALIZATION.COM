import { randomUUID } from 'node:crypto'
import { requireUser } from '../_lib/auth.js'
import { getSql } from '../_lib/db.js'
import { getPartnerForUser, requirePartnerForUser } from '../_lib/relationships.js'
import { requireMethod, sendError, sendJson } from '../_lib/http.js'

function publicRoom(room) {
  return room
    ? {
        id: room.id,
        provider: room.provider,
        status: room.status,
        roomUrl: room.room_url,
        createdAt: room.created_at,
      }
    : null
}

export default async function handler(req, res) {
  try {
    requireMethod(req, ['GET', 'POST'])
    const user = await requireUser(req)

    if (req.method === 'GET') {
      const [room] = await getSql()`
        SELECT id, provider, status, room_url, created_at
        FROM call_rooms
        WHERE owner_user_id = ${user.id} OR partner_user_id = ${user.id}
        ORDER BY created_at DESC
        LIMIT 1
      `
      sendJson(res, 200, { room: publicRoom(room), partner: await getPartnerForUser(user.id) })
      return
    }

    const partner = await requirePartnerForUser(user.id)
    const roomId = randomUUID()
    const providerConfigured = Boolean(process.env.VIDEO_PROVIDER_JOIN_URL)
    const roomUrl = providerConfigured ? `${process.env.VIDEO_PROVIDER_JOIN_URL}?room=${encodeURIComponent(roomId)}` : null

    const [room] = await getSql()`
      INSERT INTO call_rooms (id, owner_user_id, partner_user_id, provider, status, room_url)
      VALUES (${roomId}, ${user.id}, ${partner.partnerUserId}, ${providerConfigured ? 'external-provider' : 'pending-provider'}, ${providerConfigured ? 'ready' : 'provider_required'}, ${roomUrl})
      RETURNING id, provider, status, room_url, created_at
    `

    sendJson(res, 201, { room: publicRoom(room), partner })
  } catch (error) {
    sendError(res, error)
  }
}
