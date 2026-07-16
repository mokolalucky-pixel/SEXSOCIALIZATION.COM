import { useEffect, useState } from 'react'
import { loadPayoutInfo, requestPayout } from '../services/payoutService.js'

function PayoutPanel() {
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    loadPayoutInfo()
      .then((data) => {
        if (isMounted) {
          setInfo(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message)
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  async function handleRequestPayout() {
    setRequesting(true)
    setError('')
    setSuccessMessage('')

    try {
      const result = await requestPayout()
      setSuccessMessage(result.message)
      // Refresh payout info after successful request
      const updated = await loadPayoutInfo()
      setInfo(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setRequesting(false)
    }
  }

  if (loading) {
    return (
      <section className="workflow-card stacked-card" aria-labelledby="payout-title">
        <div>
          <p className="eyebrow">Earnings</p>
          <h2 id="payout-title">Payout</h2>
          <p className="save-status">Loading payout info...</p>
        </div>
      </section>
    )
  }

  const balance = info?.earnings?.availableBalance ?? 0
  const totalPaidOut = info?.earnings?.totalPaidOut ?? 0
  const canPayout = balance >= 50

  return (
    <section className="workflow-card stacked-card" aria-labelledby="payout-title">
      <div>
        <p className="eyebrow">Earnings</p>
        <h2 id="payout-title">Payout</h2>

        <div className="status-card" aria-label="Earnings balance" style={{ marginBottom: '1rem' }}>
          <span className="status-value">R{Number(balance).toFixed(2)}</span>
          <span className="status-label">available balance (ZAR)</span>
        </div>

        {totalPaidOut > 0 ? (
          <p className="save-status">
            Total paid out to date: <strong>R{Number(totalPaidOut).toFixed(2)}</strong>
          </p>
        ) : null}

        {info?.payout ? (
          <p className="save-status">
            Payout bank: <strong>{info.payout.bankName}</strong> &mdash; {info.payout.accountHolder} ({info.payout.accountType})
          </p>
        ) : null}

        {!canPayout && !successMessage ? (
          <p className="save-status">
            Minimum payout is <strong>R50.00</strong>. Keep earning to unlock your payout.
          </p>
        ) : null}

        {successMessage ? (
          <p className="save-status" role="status" style={{ color: 'green' }}>
            ✅ {successMessage}
          </p>
        ) : null}

        {error ? (
          <p className="error-message" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="action-row">
        <button
          className="button"
          type="button"
          onClick={handleRequestPayout}
          disabled={!canPayout || requesting}
        >
          {requesting ? 'Submitting...' : `Request Payout (R${Number(balance).toFixed(2)})`}
        </button>
      </div>
    </section>
  )
}

export default PayoutPanel
