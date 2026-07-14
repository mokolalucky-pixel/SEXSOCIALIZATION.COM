import { apiRequest } from './apiClient.js'

export async function loadLatestCallRoom() {
  const { room, partner } = await apiRequest('/api/calls/rooms')
  return { room, partner }
}

export async function createCallRoom() {
  const { room, partner } = await apiRequest('/api/calls/rooms', { method: 'POST' })
  return { room, partner }
}
