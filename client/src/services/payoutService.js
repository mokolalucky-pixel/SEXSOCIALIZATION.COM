import { apiRequest } from './apiClient.js'
export async function loadPayoutInfo() { return apiRequest('/api/payments/payout') }
export async function savePayoutDetails(details) { return apiRequest('/api/payments/payout', { method: 'POST', body: JSON.stringify(details) }) }
export async function requestPayout() { return apiRequest('/api/payments/payout-request', { method: 'POST' }) }
