import { apiRequest } from './apiClient.js'
export async function loadMessageThread() { return apiRequest('/api/messages/thread') }
export async function sendPrivateMessage(body) { const { message } = await apiRequest('/api/messages/thread', { method: 'POST', body: JSON.stringify({ body }) }); return message }
export async function editPrivateMessage(id, body) { const { message } = await apiRequest(`/api/messages/${id}`, { method: 'POST', body: JSON.stringify({ action: 'edit', body }) }); return message }
export async function deletePrivateMessage(id) { return apiRequest(`/api/messages/${id}`, { method: 'POST', body: JSON.stringify({ action: 'delete' }) }) }
