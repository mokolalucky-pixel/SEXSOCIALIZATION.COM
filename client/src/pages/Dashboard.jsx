import { useEffect, useState } from 'react'
import { boundarySections, countBoundaryItems } from '../data/boundarySections.js'
import {
  countAcceptedItems,
  createAgreementDraft,
  getPersistenceMode,
  isAgreementItemAccepted,
  loadAgreementDraft,
  saveAgreementDraft,
  toggleAgreementItem,
} from '../services/agreementService.js'
import { useAuth } from '../hooks/useAuth.js'
import { createPartnerInvite, loadLatestPartnerInvite } from '../services/inviteService.js'
import MessagingPanel from '../components/MessagingPanel.jsx'
import CallPanel from '../components/CallPanel.jsx'
import ModerationPanel from '../components/ModerationPanel.jsx'
import CirclesPanel from '../components/CirclesPanel.jsx'

function Dashboard() {
  const { user } = useAuth()
  const [agreement, setAgreement] = useState(() => createAgreementDraft(user))
  const [statusMessage, setStatusMessage] = useState('Loading saved draft…')
  const [saveError, setSaveError] = useState('')
  const [invite, setInvite] = useState(null)
  const [inviteStatus, setInviteStatus] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [recipientContact, setRecipientContact] = useState('')
  const [isCreatingInvite, setIsCreatingInvite] = useState(false)

  useEffect(() => {
    let isMounted = true

    setStatusMessage('Loading saved draft…')
    setSaveError('')
    loadAgreementDraft(user)
      .then((savedAgreement) => {
        if (isMounted) {
          setAgreement(savedAgreement)
          setStatusMessage('Saved to database')
        }
      })
      .catch((error) => {
        if (isMounted) {
          setSaveError(error.message)
          setStatusMessage('Using unsaved draft')
        }
      })

    return () => {
      isMounted = false
    }
  }, [user])


  useEffect(() => {
    let isMounted = true

    loadLatestPartnerInvite()
      .then((latestInvite) => {
        if (isMounted) {
          setInvite(latestInvite)
        }
      })
      .catch(() => {
        if (isMounted) {
          setInvite(null)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const totalItems = countBoundaryItems()
  const completedCount = countAcceptedItems(agreement)
  const persistenceMode = getPersistenceMode()


  async function handleCreateInvite() {
    setIsCreatingInvite(true)
    setInviteError('')
    setInviteStatus('Creating invite…')

    try {
      const nextInvite = await createPartnerInvite(recipientContact)
      setInvite(nextInvite)
      setRecipientContact(nextInvite.recipientContact || recipientContact)
      setInviteStatus(nextInvite.recipientContact ? 'Invite link ready. Use a delivery action below.' : 'Invite link ready. Copy it and send it to your partner.')
    } catch (error) {
      setInviteError(error.message)
      setInviteStatus('')
    } finally {
      setIsCreatingInvite(false)
    }
  }

  async function handleCopyInvite() {
    if (!invite?.inviteUrl) {
      return
    }

    try {
      await navigator.clipboard.writeText(invite.inviteUrl)
      setInviteStatus('Invite link copied.')
    } catch {
      setInviteStatus('Copy failed. Select and copy the invite link manually.')
    }
  }

  function handleToggleItem(sectionId, itemId) {
    const nextAgreement = toggleAgreementItem(agreement, sectionId, itemId)

    setAgreement(nextAgreement)
    setStatusMessage('Saving…')
    setSaveError('')

    saveAgreementDraft(user, nextAgreement)
      .then((savedAgreement) => {
        setAgreement(savedAgreement)
        setStatusMessage('Saved to database')
      })
      .catch((error) => {
        setSaveError(error.message)
        setStatusMessage('Save failed')
      })
  }

  return (
    <section className="panel dashboard-panel" aria-labelledby="dashboard-title">
      <div className="dashboard-header">
        <div>
          <h1 id="dashboard-title">Partner agreement workspace</h1>
          <p>Welcome back, {user?.displayName || user?.email}.</p>
          <p className="save-status">
            Draft storage: <strong>{persistenceMode}</strong>. Status: <strong>{statusMessage}</strong>. Last updated:{' '}
            <strong>{new Date(agreement.updatedAt).toLocaleString()}</strong>
          </p>
          {saveError ? <p className="error-message" role="alert">{saveError}</p> : null}
        </div>
        <div className="status-card" aria-label="Agreement progress">
          <span className="status-value">
            {completedCount}/{totalItems}
          </span>
          <span className="status-label">boundaries reviewed</span>
        </div>
      </div>

      <section className="workflow-card" aria-labelledby="invite-title">
        <div>
          <p className="eyebrow">Step 1</p>
          <h2 id="invite-title">Invite your partner</h2>
          <p>
            Create a private invite link for your partner. When they accept it while signed in,
            the connection is saved to the backend database.
          </p>
          <label className="invite-link-field" htmlFor="partner-recipient-contact">
            Partner email or phone/contact
            <input
              id="partner-recipient-contact"
              value={recipientContact}
              onChange={(event) => setRecipientContact(event.target.value)}
              placeholder="partner@example.com or +15551234567"
            />
          </label>
          {invite?.status ? (
            <p className="save-status">
              Invite status: <strong>{invite.status}</strong>
              {invite.recipientContact ? <> for <strong>{invite.recipientContact}</strong></> : null}
              {invite.partnerEmail ? <> accepted by <strong>{invite.partnerEmail}</strong></> : null}
            </p>
          ) : null}
          {invite?.inviteUrl ? (
            <label className="invite-link-field" htmlFor="partner-invite-link">
              Partner invite link
              <input id="partner-invite-link" readOnly value={invite.inviteUrl} onFocus={(event) => event.target.select()} />
            </label>
          ) : null}
          {inviteStatus ? <p className="save-status">{inviteStatus}</p> : null}
          {inviteError ? <p className="error-message" role="alert">{inviteError}</p> : null}
        </div>
        <div className="invite-actions">
          <button className="button" type="button" onClick={handleCreateInvite} disabled={isCreatingInvite}>
            {isCreatingInvite ? 'Creating…' : invite?.inviteUrl ? 'Create new invite' : 'Create invite link'}
          </button>
          {invite?.inviteUrl ? (
            <button className="button secondary" type="button" onClick={handleCopyInvite}>
              Copy link
            </button>
          ) : null}
          {invite?.inviteUrl && invite.deliveryMethod === 'email' ? (
            <a
              className="button secondary"
              href={`mailto:${invite.recipientContact}?subject=${encodeURIComponent('Your SEXSOCIALIZATION.COM partner invite')}&body=${encodeURIComponent(`Use this private invite link to connect with me: ${invite.inviteUrl}`)}`}
            >
              Email invite
            </a>
          ) : null}
          {invite?.inviteUrl && invite.deliveryMethod === 'sms' ? (
            <a
              className="button secondary"
              href={`sms:${invite.recipientContact}?&body=${encodeURIComponent(`Use this private invite link to connect with me: ${invite.inviteUrl}`)}`}
            >
              Text invite
            </a>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="boundaries-title">
        <div className="section-heading">
          <p className="eyebrow">Step 2</p>
          <h2 id="boundaries-title">Review boundaries checklist</h2>
          <p>
            Checklist progress now saves to the backend database for the signed-in account.
          </p>
        </div>

        <div className="boundary-grid">
          {boundarySections.map((section) => (
            <article className="boundary-card" key={section.id}>
              <h3>{section.title}</h3>
              <p>{section.description}</p>
              <ul className="checklist">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={isAgreementItemAccepted(agreement, section.id, item.id)}
                        onChange={() => handleToggleItem(section.id, item.id)}
                      />
                      <span>{item.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="workflow-card" aria-labelledby="summary-title">
        <div>
          <p className="eyebrow">Step 3</p>
          <h2 id="summary-title">Agreement summary</h2>
          <p>
            This draft has a stable schema version, status, partner invite status, accepted boundary IDs, and
            timestamps stored through the backend API.
          </p>
        </div>
      </section>

      <CirclesPanel />
      <MessagingPanel />
      <CallPanel />
      <ModerationPanel isAdmin={user?.isAdmin} />
    </section>
  )
}

export default Dashboard
