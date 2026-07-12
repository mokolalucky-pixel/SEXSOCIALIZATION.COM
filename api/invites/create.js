import { createInviteRecord, publicInvite } from '../_lib/invites.js'
import { requireUser } from '../_lib/auth.js'
import { getSql } from '../_lib/db.js'
import { requireMethod, sendError, sendJson } from '../_lib/http.js'

function requestOrigin(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'https'
  return `${protocol}://${req.headers.host}`
}

export default async function handler(req, res) {
  try {
    requireMethod(req, ['POST'])
    const user = await requireUser(req)
    const db = getSql()
    const invite = createInviteRecord(user.id)

    await db`UPDATE partner_invites
      SET status = 'revoked'
      WHERE owner_user_id = ${user.id} AND status = 'pending'`

    const [row] = await db`
      INSERT INTO partner_invites (id, owner_user_id, token_hash, expires_at)
      VALUES (${invite.id}, ${invite.ownerUserId}, ${invite.tokenHash}, ${invite.expiresAt})
      RETURNING id, status, expires_at, accepted_at, created_at
    `

    sendJson(res, 201, {
      invite: publicInvite({ ...row, token: invite.token }, requestOrigin(req)),
    })
  } catch (error) {
    sendError(res, error)
  }
}
