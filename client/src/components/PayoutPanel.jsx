import { useEffect, useState } from 'react'
import { loadPayoutInfo, requestPayout, savePayoutDetails } from '../services/payoutService.js'

const emptyDetails = { bankName: '', accountHolder: '', accountNumber: '', branchCode: '', accountType: '' }
function PayoutPanel() {
  const [info, setInfo] = useState(null); const [details, setDetails] = useState(emptyDetails)
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [status, setStatus] = useState('')
  async function refresh() { const data = await loadPayoutInfo(); setInfo(data); setLoading(false) }
  useEffect(() => { refresh().catch((nextError) => { setError(nextError.message); setLoading(false) }) }, [])
  async function save(event) { event.preventDefault(); setSaving(true); setError(''); try { await savePayoutDetails(details); setStatus('Payout banking details saved.'); await refresh() } catch (nextError) { setError(nextError.message) } finally { setSaving(false) } }
  async function payout() { setSaving(true); setError(''); try { const result = await requestPayout(); setStatus(result.message); await refresh() } catch (nextError) { setError(nextError.message) } finally { setSaving(false) } }
  if (loading) return <section className="workflow-card"><p>Loading payout details...</p></section>
  const balance = Number(info?.earnings?.availableBalance || 0); const configured = Boolean(info?.payout?.configured)
  return <section className="workflow-card stacked-card" aria-labelledby="payout-title"><div><p className="eyebrow">Premium earnings</p><h2 id="payout-title">Payout banking</h2><p>Available referral earnings: <strong>R{balance.toFixed(2)}</strong></p>{info?.payout ? <p className="save-status">Current account: {info.payout.bankName} — {info.payout.accountHolder} ({info.payout.accountType})</p> : null}{status ? <p className="save-status">{status}</p> : null}{error ? <p className="error-message" role="alert">{error}</p> : null}</div><form className="inline-form" onSubmit={save}>{Object.entries(details).map(([key, value]) => <label key={key}>{key.replace(/[A-Z]/g, (letter) => ` ${letter}`).replace(/^./, (letter) => letter.toUpperCase())}<input required value={value} onChange={(event) => setDetails((current) => ({ ...current, [key]: event.target.value }))} /></label>)}<button className="button" disabled={saving}>{saving ? 'Saving...' : 'Save payout details'}</button></form><button className="button secondary" type="button" disabled={!configured || balance < 50 || saving} onClick={payout}>Request payout</button></section>
}
export default PayoutPanel
