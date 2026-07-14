import { randomUUID } from 'node:crypto'
import { requireUser } from '../_lib/auth.js'
import { getSql } from '../_lib/db.js'
import { readJson, requireMethod, sendError, sendJson } from '../_lib/http.js'

const CIRCLES = [
  { type: 'womens', name: "Women's Circle", description: 'A safe space for women to connect and share.', allowedGenders: ['female'] },
  { type: 'mens', name: "Men's Circle", description: 'A safe space for men to connect and share.', allowedGenders: ['male'] },
  { type: 'mixed', name: 'Mixed Circle', description: 'An inclusive space for all genders to connect.', allowedGenders: null },
]

function circleDefinition(type) {
  return CIRCLES.find((circle) => circle.type === type)
}

function canJoinCircle(circle, userGender) {
  if (!circle.allowedGenders) {
    return true
  }

  return circle.allowedGenders.includes(userGender)
}

export default async function handler(req, res) {
  try {
    requireMethod(req, ['GET', 'POST', 'DELETE'])
    const user = await requireUser(req)
    const db = getSql()

    if (req.method === 'GET') {
      const memberships = await db`
        SELECT circle_type FROM community_circle_members WHERE user_id = ${user.id}
      `
      const joinedTypes = new Set(memberships.map((row) => row.circle_type))

      const memberCounts = await db`
        SELECT circle_type, COUNT(*)::int AS member_count
        FROM community_circle_members
        GROUP BY circle_type
      `
      const countByType = Object.fromEntries(memberCounts.map((row) => [row.circle_type, row.member_count]))

      const circles = CIRCLES.map((circle) => ({
        type: circle.type,
        name: circle.name,
        description: circle.description,
        allowedGenders: circle.allowedGenders,
        canJoin: canJoinCircle(circle, user.gender),
        joined: joinedTypes.has(circle.type),
        memberCount: countByType[circle.type] || 0,
      }))

      sendJson(res, 200, { circles, userGender: user.gender })
      return
    }

    if (req.method === 'POST') {
      const { circleType } = await readJson(req)
      const circle = circleDefinition(circleType)

      if (!circle) {
        throw Object.assign(new Error('Unknown circle type.'), { statusCode: 400 })
      }

      if (!canJoinCircle(circle, user.gender)) {
        throw Object.assign(new Error(`This circle is restricted to ${circle.allowedGenders.join(' or ')} members.`), { statusCode: 403 })
      }

      try {
        await db`
          INSERT INTO community_circle_members (id, circle_type, user_id)
          VALUES (${randomUUID()}, ${circleType}, ${user.id})
        `
      } catch (error) {
        if (error.message?.includes('duplicate key') || error.code === '23505') {
          throw Object.assign(new Error('You have already joined this circle.'), { statusCode: 409 })
        }
        throw error
      }

      sendJson(res, 201, { joined: circleType })
      return
    }

    if (req.method === 'DELETE') {
      const { circleType } = await readJson(req)
      await db`DELETE FROM community_circle_members WHERE circle_type = ${circleType} AND user_id = ${user.id}`
      sendJson(res, 200, { left: circleType })
    }
  } catch (error) {
    sendError(res, error)
  }
}
