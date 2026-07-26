import { useState } from 'react'
import { apiRequest } from '../services/apiClient.js'

function ReferralPanel() {
  const [url, setUrl] = useState(''); const [error, setError] = useState('')
  async function createReferral() {
    setError('')
    try { const { referralUrl } = await apiRequest('/api/referrals/create', { method: 'POST' }); setUrl(referralUrl) } catch (nextError) { setError(nextError.message) }
  }
  return <section className="workflow-card stacked-card"><div><p className="eyebrow">Premium referrals</p><h2>Invite and earn</h2><p>Premium members earn 25% of each successful premium payment by a referred user. Your active partner is upgraded when you become premium.</p>{url ? <p className="save-status">Referral link: <a href={url}>{url}</a></p> : null}{error ? <p className="error-message" role="alert">{error}</p> : null}</div><button className="button" type="button" onClick={createReferral}>Create referral link</button></section>
}
export default ReferralPanel
