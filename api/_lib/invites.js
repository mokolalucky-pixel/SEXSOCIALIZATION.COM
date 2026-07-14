import { createHash, randomBytes, randomUUID } from 'node:crypto'

const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 7

export function createInviteToken() {
  return randomBytes(32).toString('base64url')
}

export function hashInviteToken(token) {
  return createHash('sha256').update(token).digest('base64url')
}

export function normalizeRecipientContact(contact) {
  return String(contact || '').trim().slice(0, 255)
}

export function deliveryMethodForContact(contact) {
  const normalizedContact = normalizeRecipientContact(contact)

  if (!normalizedContact) {
    return 'copy'
  }

  return normalizedContact.includes('@') ? 'email' : 'sms'
}

export function createInviteRecord(ownerUserId, recipientContact = '') {
  const token = createInviteToken()
  const normalizedContact = normalizeRecipientContact(recipientContact)

  return {
    id: randomUUID(),
    ownerUserId,
    token,
    tokenHash: hashInviteToken(token),
    recipientContact: normalizedContact || null,
    deliveryMethod: deliveryMethodForContact(normalizedContact),
    expiresAt: new Date(Date.now() + INVITE_TTL_MS).toISOString(),
  }
}

export function publicInvite(invite, origin) {
  const token = invite.token || invite.raw_token
  const inviteUrl = token ? `${origin}/invite/${encodeURIComponent(token)}` : null

  return {
    id: invite.id,
    status: invite.status,
    inviteUrl,
    recipientContact: invite.recipient_contact,
    deliveryMethod: invite.delivery_method,
    ownerEmail: invite.owner_email,
    partnerEmail: invite.partner_email,
    expiresAt: invite.expires_at,
    acceptedAt: invite.accepted_at,
    createdAt: invite.created_at,
  }
}
