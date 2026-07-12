import { apiRequest } from './apiClient.js'

export async function createPartnerInvite() {
  const { invite } = await apiRequest('/api/invites/create', { method: 'POST' })
  return invite
}

export async function loadLatestPartnerInvite() {
  const { invite } = await apiRequest('/api/invites/latest')
  return invite
}

export async function acceptPartnerInvite(token) {
  const { invite } = await apiRequest('/api/invites/accept', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
  return invite
}
