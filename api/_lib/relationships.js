import { getSql } from './db.js'

export async function getPartnerForUser(userId) {
  const [relationship] = await getSql()`
    SELECT partner_invites.id,
      owner_user_id,
      partner_user_id,
      owner.email AS owner_email,
      partner.email AS partner_email,
      owner.display_name AS owner_display_name,
      partner.display_name AS partner_display_name
    FROM partner_invites
    JOIN users owner ON owner.id = partner_invites.owner_user_id
    JOIN users partner ON partner.id = partner_invites.partner_user_id
    WHERE partner_invites.status = 'accepted'
      AND (partner_invites.owner_user_id = ${userId} OR partner_invites.partner_user_id = ${userId})
    ORDER BY partner_invites.accepted_at DESC
    LIMIT 1
  `

  if (!relationship) {
    return null
  }

  const isOwner = relationship.owner_user_id === userId

  return {
    inviteId: relationship.id,
    partnerUserId: isOwner ? relationship.partner_user_id : relationship.owner_user_id,
    partnerEmail: isOwner ? relationship.partner_email : relationship.owner_email,
    partnerDisplayName: isOwner ? relationship.partner_display_name : relationship.owner_display_name,
  }
}

export async function requirePartnerForUser(userId) {
  const partner = await getPartnerForUser(userId)

  if (!partner) {
    throw Object.assign(new Error('Accept a partner invite before using this feature.'), { statusCode: 400 })
  }

  return partner
}
