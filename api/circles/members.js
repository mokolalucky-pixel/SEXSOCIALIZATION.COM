import { requireUser } from '../_lib/auth.js'
import { getSql } from '../_lib/db.js'
import { requireMethod, sendError, sendJson } from '../_lib/http.js'

export default async function handler(req, res) {
  try {
    requireMethod(req, ['GET'])
    const user = await requireUser(req)
    const { circleType } = req.query

    if (!circleType) {
      throw Object.assign(new Error('circleType is required.'), { statusCode: 400 })
    }

    const [membership] = await getSql()`
      SELECT id FROM community_circle_members WHERE circle_type = ${circleType} AND user_id = ${user.id} LIMIT 1
    `

    if (!membership) {
      throw Object.assign(new Error('Join this circle to view its members.'), { statusCode: 403 })
    }

    const members = await getSql()`
      SELECT users.id, users.display_name, users.gender, community_circle_members.joined_at
      FROM community_circle_members
      JOIN users ON users.id = community_circle_members.user_id
      WHERE community_circle_members.circle_type = ${circleType}
      ORDER BY community_circle_members.joined_at DESC
      LIMIT 100
    `

    sendJson(res, 200, {
      members: members.map((member) => ({
        id: member.id,
        displayName: member.display_name,
        gender: member.gender,
        joinedAt: member.joined_at,
        isYou: member.id === user.id,
      })),
    })
  } catch (error) {
    sendError(res, error)
  }
}
