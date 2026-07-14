import { requireUser } from '../_lib/auth.js'
import { getSql } from '../_lib/db.js'
import { publicInvite } from '../_lib/invites.js'
import { requireMethod, sendError, sendJson } from '../_lib/http.js'

export default async function handler(req, res) {
  try {
    requireMethod(req, ['GET'])
    const user = await requireUser(req)
    const [invite] = await getSql()`
      SELECT partner_invites.id,
        partner_invites.status,
        partner_invites.recipient_contact,
        partner_invites.delivery_method,
        partner_invites.expires_at,
        partner_invites.accepted_at,
        partner_invites.created_at,
        owner.email AS owner_email,
        partner.email AS partner_email
      FROM partner_invites
      JOIN users owner ON owner.id = partner_invites.owner_user_id
      LEFT JOIN users partner ON partner.id = partner_invites.partner_user_id
      WHERE partner_invites.owner_user_id = ${user.id}
      ORDER BY partner_invites.created_at DESC
      LIMIT 1
    `

    sendJson(res, 200, { invite: invite ? publicInvite(invite, '') : null })
  } catch (error) {
    sendError(res, error)
  }
}
