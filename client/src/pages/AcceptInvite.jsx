import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { acceptPartnerInvite } from '../services/inviteService.js'

function AcceptInvite() {
  const { token } = useParams()
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState('')
  const [isAccepting, setIsAccepting] = useState(false)

  if (isLoading) {
    return <section className="panel">Checking your session…</section>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: `/invite/${token}` }} />
  }

  async function handleAcceptInvite() {
    setIsAccepting(true)
    setError('')
    setStatusMessage('Accepting invite…')

    try {
      await acceptPartnerInvite(token)
      setStatusMessage('Invite accepted. Your partner connection is saved.')
      window.setTimeout(() => navigate('/dashboard', { replace: true }), 900)
    } catch (error) {
      setError(error.message)
      setStatusMessage('')
    } finally {
      setIsAccepting(false)
    }
  }

  return (
    <section className="panel form-panel" aria-labelledby="accept-invite-title">
      <h1 id="accept-invite-title">Accept partner invite</h1>
      <p>Confirm that you want to connect this account to your partner agreement workspace.</p>

      {statusMessage ? <p className="save-status">{statusMessage}</p> : null}
      {error ? <p className="error-message" role="alert">{error}</p> : null}

      <div className="action-row">
        <button className="button" type="button" onClick={handleAcceptInvite} disabled={isAccepting}>
          {isAccepting ? 'Accepting…' : 'Accept invite'}
        </button>
        <Link className="button secondary" to="/dashboard">
          Back to dashboard
        </Link>
      </div>
    </section>
  )
}

export default AcceptInvite
