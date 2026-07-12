import { createHash, randomBytes, randomUUID } from 'node:crypto'

const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 7

export function createInviteToken() {
  return randomBytes(32).toString('base64url')
}

export function hashInviteToken(token) {
  return createHash('sha256').update(token).digest('base64url')
}

export function createInviteRecord(ownerUserId) {
  const token = createInviteToken()

  return {
    id: randomUUID(),
    ownerUserId,
    token,
    tokenHash: hashInviteToken(token),
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
    ownerEmail: invite.owner_email,
    partnerEmail: invite.partner_email,
    expiresAt: invite.expires_at,
    acceptedAt: invite.accepted_at,
    createdAt: invite.created_at,
  }
}
