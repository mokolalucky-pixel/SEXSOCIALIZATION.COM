import { apiRequest } from './apiClient.js'

export async function loadMessageThread() {
  return apiRequest('/api/messages/thread')
}

export async function sendPrivateMessage(body) {
  const { message } = await apiRequest('/api/messages/thread', {
    method: 'POST',
    body: JSON.stringify({ body }),
  })
  return message
}
