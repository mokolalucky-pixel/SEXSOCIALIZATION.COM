import { apiRequest } from './apiClient.js'

export async function loadCircles() {
  return apiRequest('/api/circles')
}

export async function joinCircle(circleType) {
  return apiRequest('/api/circles', {
    method: 'POST',
    body: JSON.stringify({ circleType }),
  })
}

export async function leaveCircle(circleType) {
  return apiRequest('/api/circles', {
    method: 'DELETE',
    body: JSON.stringify({ circleType }),
  })
}

export async function loadCircleMembers(circleType) {
  const { members } = await apiRequest(`/api/circles/members?circleType=${encodeURIComponent(circleType)}`)
  return members
}
