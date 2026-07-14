import { randomUUID } from 'node:crypto'
import { requireUser } from '../_lib/auth.js'
import { getSql } from '../_lib/db.js'
import { readJson, requireMethod, sendError, sendJson } from '../_lib/http.js'

function publicContact(contact) {
  return {
    id: contact.id,
    circleId: contact.circle_id,
    displayName: contact.display_name,
    contact: contact.contact,
    relationship: contact.relationship,
    createdAt: contact.created_at,
  }
}

async function requireOwnedCircle(userId, circleId) {
  const [circle] = await getSql()`SELECT id FROM circles WHERE id = ${circleId} AND owner_user_id = ${userId} LIMIT 1`

  if (!circle) {
    throw Object.assign(new Error('Circle not found.'), { statusCode: 404 })
  }
}

export default async function handler(req, res) {
  try {
    requireMethod(req, ['GET', 'POST'])
    const user = await requireUser(req)

    if (req.method === 'GET') {
      const { circleId } = req.query

      if (!circleId) {
        throw Object.assign(new Error('circleId is required.'), { statusCode: 400 })
      }

      await requireOwnedCircle(user.id, circleId)
      const contacts = await getSql()`
        SELECT id, circle_id, display_name, contact, relationship, created_at
        FROM circle_contacts
        WHERE circle_id = ${circleId} AND owner_user_id = ${user.id}
        ORDER BY created_at DESC
      `

      sendJson(res, 200, { contacts: contacts.map(publicContact) })
      return
    }

    const { circleId, displayName, contact, relationship = '' } = await readJson(req)
    const normalizedName = String(displayName || '').trim()
    const normalizedContact = String(contact || '').trim()

    if (!circleId) {
      throw Object.assign(new Error('circleId is required.'), { statusCode: 400 })
    }

    if (normalizedName.length < 2 || normalizedName.length > 80) {
      throw Object.assign(new Error('Contact name must be between 2 and 80 characters.'), { statusCode: 400 })
    }

    if (normalizedContact.length < 3 || normalizedContact.length > 255) {
      throw Object.assign(new Error('Contact value must be between 3 and 255 characters.'), { statusCode: 400 })
    }

    await requireOwnedCircle(user.id, circleId)
    const [createdContact] = await getSql()`
      INSERT INTO circle_contacts (id, circle_id, owner_user_id, display_name, contact, relationship)
      VALUES (${randomUUID()}, ${circleId}, ${user.id}, ${normalizedName}, ${normalizedContact}, ${String(relationship).trim().slice(0, 80) || null})
      RETURNING id, circle_id, display_name, contact, relationship, created_at
    `

    sendJson(res, 201, { contact: publicContact(createdContact) })
  } catch (error) {
    sendError(res, error)
  }
}
