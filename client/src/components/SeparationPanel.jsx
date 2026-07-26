import { useState } from 'react'
import { apiRequest } from '../services/apiClient.js'

function SeparationPanel() {
  const [error, setError] = useState(''); const [status, setStatus] = useState('')
  async function separate() {
    if (!window.confirm('This permanently deletes both partner accounts. Neither email can register again for 30 days. Continue?')) return
    try { const result = await apiRequest('/api/relationships/separate', { method: 'POST' }); setStatus(`Both accounts were deleted. Re-registration is available after ${new Date(result.availableAfter).toLocaleDateString()}.`); window.location.assign('/') } catch (nextError) { setError(nextError.message) }
  }
  return <section className="workflow-card stacked-card"><div><p className="eyebrow">Relationship separation</p><h2>Delete both partner accounts</h2><p>This permanently removes both accounts and begins a 30-day re-registration hold for both email addresses.</p>{status ? <p className="save-status">{status}</p> : null}{error ? <p className="error-message" role="alert">{error}</p> : null}</div><button className="button secondary" type="button" onClick={separate}>Permanently separate accounts</button></section>
}
export default SeparationPanel
