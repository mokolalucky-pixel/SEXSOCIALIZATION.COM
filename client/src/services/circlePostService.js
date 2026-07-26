import { apiRequest } from './apiClient.js'
export async function loadCirclePosts(circleType) { return apiRequest(`/api/circles/posts?${new URLSearchParams({ circleType })}`) }
export async function createCirclePost(circleType, body) { return apiRequest('/api/circles/posts', { method: 'POST', body: JSON.stringify({ circleType, body }) }) }
export async function interactWithCirclePost(id, action, body, commentId) { return apiRequest(`/api/circles/posts/${id}`, { method: 'POST', body: JSON.stringify({ action, body, commentId }) }) }
