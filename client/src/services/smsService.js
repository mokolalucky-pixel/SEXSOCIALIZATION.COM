import { apiRequest } from './apiClient.js'

export async function sendSmsInvite(inviteUrl) {
  const { message } = await apiRequest('/api/sms/send', {
    method: 'POST',
    body: JSON.stringify({ inviteUrl }),
  })

  return message
}
