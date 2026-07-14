import { randomUUID } from 'node:crypto'
import { requireUser } from '../_lib/auth.js'
import { getSql } from '../_lib/db.js'
import { readJson, requireMethod, sendError, sendJson } from '../_lib/http.js'

function publicCircle(circle) {
  return {
    id: circle.id,
    name: circle.name,
    description: circle.description,
    contactCount: Number(circle.contact_count || 0),
    createdAt: circle.created_at,
  }
}

export default async function handler(req, res) {
  try {
    requireMethod(req, ['GET', 'POST'])
    const user = await requireUser(req)

    if (req.method === 'GET') {
      const circles = await getSql()`
        SELECT circles.id,
          circles.name,
          circles.description,
          circles.created_at,
          COUNT(circle_contacts.id) AS contact_count
        FROM circles
        LEFT JOIN circle_contacts ON circle_contacts.circle_id = circles.id
        WHERE circles.owner_user_id = ${user.id}
        GROUP BY circles.id
        ORDER BY circles.created_at DESC
      `

      sendJson(res, 200, { circles: circles.map(publicCircle) })
      return
    }

    const { name, description = '' } = await readJson(req)
    const circleName = String(name || '').trim()

    if (circleName.length < 2 || circleName.length > 80) {
      throw Object.assign(new Error('Circle name must be between 2 and 80 characters.'), { statusCode: 400 })
    }

    const [circle] = await getSql()`
      INSERT INTO circles (id, owner_user_id, name, description)
      VALUES (${randomUUID()}, ${user.id}, ${circleName}, ${String(description).trim().slice(0, 240) || null})
      RETURNING id, name, description, created_at, 0 AS contact_count
    `

    sendJson(res, 201, { circle: publicCircle(circle) })
  } catch (error) {
    sendError(res, error)
  }
}
