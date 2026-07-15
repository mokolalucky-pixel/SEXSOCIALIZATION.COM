import { randomUUID } from 'node:crypto'
import { requireUser } from '../_lib/auth.js'
import { getSql } from '../_lib/db.js'
import { getPartnerForUser, requirePartnerForUser } from '../_lib/relationships.js'
import { requireMethod, sendError, sendJson } from '../_lib/http.js'

function getDailyConfig() {
  const apiKey = process.env.DAILY_API_KEY
  if (!apiKey) {
    throw Object.assign(new Error('Video provider is not configured.'), { statusCode: 503 })
  }
  return { apiKey }
}

async function createDailyRoom(roomName) {
  const { apiKey } = getDailyConfig()

  const response = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: roomName,
      properties: {
        enable_chat: true,
        enable_screenshare: true,
        exp: Math.floor(Date.now() / 1000) + 3600,
        max_participants: 2,
      },
    }),
  })

  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = result.info || 'Failed to create video room.'
    throw Object.assign(new Error(message), { statusCode: response.status >= 500 ? 502 : 400 })
  }

  return result
}

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
    const roomName = `ss-${roomId.slice(0, 8)}`

    const dailyRoom = await createDailyRoom(roomName)

    const [room] = await getSql()`
      INSERT INTO call_rooms (id, owner_user_id, partner_user_id, provider, status, room_url)
      VALUES (${roomId}, ${user.id}, ${partner.partnerUserId}, 'daily', 'ready', ${dailyRoom.url})
      RETURNING id, provider, status, room_url, created_at
    `

    sendJson(res, 201, { room: publicRoom(room), partner })
  } catch (error) {
    sendError(res, error)
  }
}
