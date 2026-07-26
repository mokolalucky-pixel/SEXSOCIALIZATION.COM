import { randomUUID } from 'node:crypto'
import { requireUser } from '../_lib/auth.js'
import { getSql } from '../_lib/db.js'
import { getPartnerForUser, requirePartnerForUser } from '../_lib/relationships.js'
import { requireMethod, sendError, sendJson } from '../_lib/http.js'

const ROOM_TTL_SECONDS = 60 * 60
const TOKEN_TTL_SECONDS = 15 * 60
const MAX_ROOM_CREATIONS_PER_HOUR = 3

function getDailyConfig() {
  const apiKey = process.env.DAILY_API_KEY
  if (!apiKey) {
    throw Object.assign(new Error('Video provider is not configured.'), { statusCode: 503 })
  }
  return { apiKey }
}

async function dailyRequest(path, body) {
  const { apiKey } = getDailyConfig()
  const response = await fetch(`https://api.daily.co/v1/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw Object.assign(new Error(result.info || 'Video provider request failed.'), { statusCode: response.status >= 500 ? 502 : 400 })
  }

  return result
}

async function createDailyRoom(roomName, expiresAt) {
  return dailyRequest('rooms', {
    name: roomName,
    privacy: 'private',
    properties: {
      enable_chat: true,
      enable_screenshare: true,
      exp: Math.floor(expiresAt.getTime() / 1000),
      max_participants: 2,
    },
  })
}

async function createDailyMeetingToken(roomName, userId, expiresAt) {
  const token = await dailyRequest('meeting-tokens', {
    properties: {
      room_name: roomName,
      user_id: userId,
      exp: Math.min(Math.floor(expiresAt.getTime() / 1000), Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS),
    },
  })

  if (!token.token) {
    throw Object.assign(new Error('Video provider returned an invalid meeting token.'), { statusCode: 502 })
  }

  return token.token
}

async function publicRoom(room, userId) {
  if (!room) return null

  const token = await createDailyMeetingToken(room.room_name, userId, new Date(room.expires_at))
  const joinUrl = new URL(room.room_url)
  joinUrl.searchParams.set('t', token)

  return {
    id: room.id,
    provider: room.provider,
    status: room.status,
    roomUrl: joinUrl.toString(),
    createdAt: room.created_at,
    expiresAt: room.expires_at,
  }
}

async function findActiveRoom(inviteId) {
  const [room] = await getSql()`
    SELECT id, provider, status, room_url, room_name, expires_at, created_at
    FROM call_rooms
    WHERE invite_id = ${inviteId}
      AND status = 'ready'
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
  `
  return room
}

async function reserveRoomCreation(userId) {
  const [attempt] = await getSql()`
    INSERT INTO call_room_creation_attempts (id, user_id)
    SELECT ${randomUUID()}, ${userId}
    WHERE (
      SELECT COUNT(*)
      FROM call_room_creation_attempts
      WHERE user_id = ${userId}
        AND created_at > NOW() - INTERVAL '1 hour'
    ) < ${MAX_ROOM_CREATIONS_PER_HOUR}
    RETURNING id
  `

  if (!attempt) {
    throw Object.assign(new Error('Call room creation limit reached. Try again in an hour.'), { statusCode: 429 })
  }
}

export default async function handler(req, res) {
  try {
    requireMethod(req, ['GET', 'POST'])
    const user = await requireUser(req)
    const partner = await getPartnerForUser(user.id)

    if (req.method === 'GET') {
      const room = partner ? await findActiveRoom(partner.inviteId) : null
      sendJson(res, 200, { room: await publicRoom(room, user.id), partner })
      return
    }

    const verifiedPartner = await requirePartnerForUser(user.id)
    const existingRoom = await findActiveRoom(verifiedPartner.inviteId)
    if (existingRoom) {
      sendJson(res, 200, { room: await publicRoom(existingRoom, user.id), partner: verifiedPartner })
      return
    }

    await reserveRoomCreation(user.id)
    const roomId = randomUUID()
    const roomName = `ss-${roomId.slice(0, 8)}`
    const expiresAt = new Date(Date.now() + ROOM_TTL_SECONDS * 1000)
    const dailyRoom = await createDailyRoom(roomName, expiresAt)
    const [room] = await getSql()`
      INSERT INTO call_rooms (id, owner_user_id, partner_user_id, provider, status, room_url, invite_id, room_name, expires_at)
      VALUES (${roomId}, ${user.id}, ${verifiedPartner.partnerUserId}, 'daily', 'ready', ${dailyRoom.url}, ${verifiedPartner.inviteId}, ${roomName}, ${expiresAt.toISOString()})
      RETURNING id, provider, status, room_url, room_name, expires_at, created_at
    `

    sendJson(res, 201, { room: await publicRoom(room, user.id), partner: verifiedPartner })
  } catch (error) {
    sendError(res, error)
  }
}
