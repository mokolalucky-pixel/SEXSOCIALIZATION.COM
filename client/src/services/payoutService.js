import { apiRequest } from './apiClient.js'

/**
 * Fetch the current user's payout info and earnings balance.
 */
export async function loadPayoutInfo() {
  return apiRequest('/api/payments/payout')
}

/**
 * Submit a payout request for the user's available earnings.
 */
export async function requestPayout() {
  return apiRequest('/api/payments/payout-request', {
    method: 'POST',
  })
}
