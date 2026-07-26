import { apiRequest } from './apiClient.js'
export async function loadMixedCirclePosts() { return apiRequest('/api/circles/posts') }
export async function createMixedCirclePost(body) { return apiRequest('/api/circles/posts', { method: 'POST', body: JSON.stringify({ body }) }) }
export async function interactWithMixedCirclePost(id, action, body) { return apiRequest(`/api/circles/posts/${id}`, { method: 'POST', body: JSON.stringify({ action, body }) }) }
