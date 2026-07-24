import { apiRequest } from './apiClient.js'

export async function loadAdminPayouts() {
  return apiRequest('/api/payments/admin-payouts')
}

export async function processPayoutAction(requestId, action) {
  return apiRequest('/api/payments/admin-payout-action', {
    method: 'POST',
    body: JSON.stringify({ requestId, action }),
  })
}

export async function loadAdminPayoutSetup() {
  return apiRequest('/api/payments/admin-payout-setup')
}

export async function saveAdminPayoutSetup(details) {
  return apiRequest('/api/payments/admin-payout-setup', {
    method: 'POST',
    body: JSON.stringify(details),
  })
}
