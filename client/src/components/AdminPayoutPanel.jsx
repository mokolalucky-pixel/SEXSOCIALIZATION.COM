import { useEffect, useState } from 'react'
import { loadAdminPayouts, processPayoutAction } from '../services/adminPayoutService.js'

function formatAmount(amount) {
  return Number(amount || 0).toFixed(2)
}

function formatDate(value) {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleString()
}

function AdminPayoutPanel({ isAdmin }) {
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState('')
  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    if (!isAdmin) {
      return
    }

    let isMounted = true

    loadAdminPayouts()
      .then((data) => {
        if (isMounted) {
          setPayouts(Array.isArray(data) ? data : [])
          setLoading(false)
        }
      })
      .catch((nextError) => {
        if (isMounted) {
          setError(nextError.message)
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [isAdmin])

  if (!isAdmin) {
    return null
  }

  async function refreshPayouts() {
    const data = await loadAdminPayouts()
    setPayouts(Array.isArray(data) ? data : [])
  }

  async function handleAction(requestId, action) {
    setProcessingId(requestId)
    setError('')
    setStatusMessage('')

    try {
      await processPayoutAction(requestId, action)
      setStatusMessage(action === 'complete' ? 'Payout marked as completed.' : 'Payout rejected and refunded.')
      await refreshPayouts()
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setProcessingId('')
    }
  }

  return (
    <section className="workflow-card stacked-card" aria-labelledby="admin-payouts-title">
      <div>
        <p className="eyebrow">Admin payouts</p>
        <h2 id="admin-payouts-title">Payout requests</h2>
        <p>Review pending payout requests and mark each request as completed or rejected.</p>
        {statusMessage ? <p className="save-status">{statusMessage}</p> : null}
        {error ? <p className="error-message" role="alert">{error}</p> : null}
      </div>

      {loading ? (
        <p className="save-status">Loading payout requests...</p>
      ) : payouts.length ? (
        <div className="admin-report-list">
          <table>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Account Holder</th>
                <th>Bank</th>
                <th>Amount (ZAR)</th>
                <th>Account Type</th>
                <th>Status</th>
                <th>Date Requested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => {
                const isPending = payout.status === 'pending'
                const isProcessing = processingId === payout.id

                return (
                  <tr key={payout.id}>
                    <td>
                      <strong>{payout.user_id}</strong>
                      {payout.user_email ? <div>{payout.user_email}</div> : null}
                    </td>
                    <td>{payout.account_holder}</td>
                    <td>{payout.bank_name}</td>
                    <td>R{formatAmount(payout.amount)}</td>
                    <td>{payout.account_type}</td>
                    <td>{payout.status}</td>
                    <td>{formatDate(payout.created_at)}</td>
                    <td>
                      {isPending ? (
                        <div className="action-row">
                          <button
                            className="button"
                            type="button"
                            onClick={() => handleAction(payout.id, 'complete')}
                            disabled={isProcessing}
                          >
                            {isProcessing ? 'Processing...' : '✅ Mark Complete'}
                          </button>
                          <button
                            className="button secondary"
                            type="button"
                            onClick={() => handleAction(payout.id, 'reject')}
                            disabled={isProcessing}
                          >
                            ❌ Reject
                          </button>
                        </div>
                      ) : (
                        <span className="save-status">{payout.status}</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="save-status">No payout requests yet.</p>
      )}
    </section>
  )
}

export default AdminPayoutPanel
