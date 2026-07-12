import { requireUser } from '../_lib/auth.js'
import { getSql } from '../_lib/db.js'
import { hashInviteToken } from '../_lib/invites.js'
import { readJson, requireMethod, sendError, sendJson } from '../_lib/http.js'

export default async function handler(req, res) {
  try {
    requireMethod(req, ['POST'])
    const user = await requireUser(req)
    const { token } = await readJson(req)

    if (!token) {
      throw Object.assign(new Error('Invite token is required.'), { statusCode: 400 })
    }

    const db = getSql()
    const [invite] = await db`
      SELECT id, owner_user_id, status, expires_at
      FROM partner_invites
      WHERE token_hash = ${hashInviteToken(token)}
      LIMIT 1
    `

    if (!invite || invite.status !== 'pending' || new Date(invite.expires_at).getTime() <= Date.now()) {
      throw Object.assign(new Error('This invite is invalid or expired.'), { statusCode: 404 })
    }

    if (invite.owner_user_id === user.id) {
      throw Object.assign(new Error('You cannot accept your own invite.'), { statusCode: 400 })
    }

    const [acceptedInvite] = await db`
      UPDATE partner_invites
      SET status = 'accepted', partner_user_id = ${user.id}, accepted_at = NOW()
      WHERE id = ${invite.id}
      RETURNING id, status, accepted_at
    `

    sendJson(res, 200, { invite: acceptedInvite })
  } catch (error) {
    sendError(res, error)
  }
}
