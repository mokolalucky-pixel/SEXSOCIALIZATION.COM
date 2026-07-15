import { apiRequest } from './apiClient.js'

export async function createCheckoutSession(priceId) {
  const { url } = await apiRequest('/api/payments/checkout', {
    method: 'POST',
    body: JSON.stringify({ priceId }),
    headers: { 'Content-Type': 'application/json' },
  })
  return url
}

export async function loadSubscriptionStatus() {
  const { subscriptionStatus, subscribedAt } = await apiRequest('/api/payments/status')
  return { subscriptionStatus, subscribedAt }
}
