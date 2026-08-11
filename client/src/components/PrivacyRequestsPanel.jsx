import { useEffect, useState } from 'react'
import { apiRequest } from '../services/apiClient.js'

function PrivacyRequestsPanel() {
  const [requests, setRequests] = useState([])
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { apiRequest('/api/privacy/request').then(({ requests: next }) => setRequests(next)).catch((nextError) => setError(nextError.message)) }, [])
  async function submit(requestType) {
    if (requestType === 'deletion' && !window.confirm('Request deletion of your account data? This request is irreversible once completed.')) return
    setError(''); setStatus('Submitting request…')
    try {
      const { request } = await apiRequest('/api/privacy/request', { method: 'POST', body: JSON.stringify({ requestType }) })
      setRequests((current) => [request, ...current]); setStatus('Request submitted. We will verify and process it using the Privacy Policy process.')
    } catch (nextError) { setStatus(''); setError(nextError.message) }
  }
  return <section className="workflow-card stacked-card" aria-labelledby="privacy-requests-title"><div><p className="eyebrow">Privacy controls</p><h2 id="privacy-requests-title">Your data requests</h2><p>Request a copy of your data or request deletion. Requests require account verification before processing.</p>{status ? <p className="save-status">{status}</p> : null}{error ? <p className="error-message" role="alert">{error}</p> : null}{requests.length ? <ul className="privacy-request-list">{requests.map((request) => <li key={request.id}>{request.request_type || request.requestType}: <strong>{request.status}</strong></li>)}</ul> : null}</div><div className="invite-actions"><button className="button secondary" type="button" onClick={() => submit('access')}>Request my data</button><button className="button secondary" type="button" onClick={() => submit('deletion')}>Request account deletion</button></div></section>
}
export default PrivacyRequestsPanel
