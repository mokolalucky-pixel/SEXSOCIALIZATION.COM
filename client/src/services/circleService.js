import { apiRequest } from './apiClient.js'

export async function loadCircles() {
  const { circles } = await apiRequest('/api/circles')
  return circles
}

export async function createCircle(name, description = '') {
  const { circle } = await apiRequest('/api/circles', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  })
  return circle
}

export async function loadCircleContacts(circleId) {
  const { contacts } = await apiRequest(`/api/circles/contacts?circleId=${encodeURIComponent(circleId)}`)
  return contacts
}

export async function addCircleContact(circleId, displayName, contact, relationship = '') {
  const { contact: createdContact } = await apiRequest('/api/circles/contacts', {
    method: 'POST',
    body: JSON.stringify({ circleId, displayName, contact, relationship }),
  })
  return createdContact
}
