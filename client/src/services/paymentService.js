import { apiRequest } from './apiClient.js'

export async function createCheckoutSession(planCode) {
  const { url } = await apiRequest('/api/payments/checkout', {
    method: 'POST',
    body: JSON.stringify({ planCode }),
    headers: { 'Content-Type': 'application/json' },
  })
  return url
}

export async function loadSubscriptionStatus() {
  const { subscriptionStatus, subscribedAt } = await apiRequest('/api/payments/status')
  return { subscriptionStatus, subscribedAt }
}
