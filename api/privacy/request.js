import { randomUUID } from 'node:crypto'
import { requireUser } from '../_lib/auth.js'
import { ensureSchema, getSql } from '../_lib/db.js'
import { readJson, requireMethod, sendError, sendJson } from '../_lib/http.js'

const requestTypes = new Set(['access', 'deletion'])

export default async function handler(req, res) {
  try {
    requireMethod(req, ['GET', 'POST'])
    const user = await requireUser(req)
    await ensureSchema()
    const db = getSql()

    if (req.method === 'GET') {
      const requests = await db`SELECT id, request_type, status, created_at, completed_at FROM privacy_requests WHERE user_id = ${user.id} ORDER BY created_at DESC LIMIT 20`
      sendJson(res, 200, { requests })
      return
    }

    const { requestType } = await readJson(req)
    if (!requestTypes.has(requestType)) throw Object.assign(new Error('Choose access or deletion.'), { statusCode: 400 })
    const [existing] = await db`SELECT id FROM privacy_requests WHERE user_id = ${user.id} AND request_type = ${requestType} AND status = 'open' LIMIT 1`
    if (existing) throw Object.assign(new Error('An open request of this type already exists.'), { statusCode: 409 })

    const id = randomUUID()
    await db`INSERT INTO privacy_requests (id, user_id, request_type) VALUES (${id}, ${user.id}, ${requestType})`
    await db`INSERT INTO compliance_audit_events (id, user_id, event_type, metadata) VALUES (${randomUUID()}, ${user.id}, ${requestType === 'access' ? 'privacy_access_requested' : 'privacy_deletion_requested'}, ${JSON.stringify({ requestId: id })}::jsonb)`
    sendJson(res, 201, { request: { id, requestType, status: 'open' } })
  } catch (error) { sendError(res, error) }
}
