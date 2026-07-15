import { apiRequest } from './apiClient.js'

export async function sendSmsInvite(to, inviteUrl) {
  const { message } = await apiRequest('/api/sms/send', {
    method: 'POST',
    body: JSON.stringify({
      to,
      message: `Use this private invite link to connect with me on SEXSOCIALIZATION.COM: ${inviteUrl}`,
    }),
  })

  return message
}
