import { apiRequest } from './apiClient.js'

export async function submitModerationReport(reason, targetType = 'partner', targetId = null) {
  const { report } = await apiRequest('/api/moderation/report', {
    method: 'POST',
    body: JSON.stringify({ reason, targetType, targetId }),
  })
  return report
}

export async function loadModerationReports() {
  const { reports } = await apiRequest('/api/moderation/reports')
  return reports
}

export async function updateModerationReport(id, status, adminNote = '') {
  const { report } = await apiRequest('/api/moderation/update', {
    method: 'POST',
    body: JSON.stringify({ id, status, adminNote }),
  })
  return report
}
