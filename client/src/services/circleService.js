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

export async function loadCircleMembers(circleType, region = '') {
  const params = new URLSearchParams({ circleType })
  if (region) {
    params.set('region', region)
  }
  const { members } = await apiRequest(`/api/circles/members?${params}`)
  return members
}
