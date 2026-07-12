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

const nextModules = [
  'Secure messaging: connect private messages to authenticated users and a datastore.',
  'Video calls: add a WebRTC provider and update camera/microphone security policy.',
  'Admin moderation: add admin roles, report queue, and account safety actions.',
]

function Dashboard() {
  const { user } = useAuth()
  const [agreement, setAgreement] = useState(() => createAgreementDraft(user))
  const [statusMessage, setStatusMessage] = useState('Loading saved draft…')
  const [saveError, setSaveError] = useState('')

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

  const totalItems = countBoundaryItems()
  const completedCount = countAcceptedItems(agreement)
  const persistenceMode = getPersistenceMode()

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
            Start by confirming both partners want to define communication expectations, privacy rules,
            and repair steps together. Partner-backed invites can be connected when server authentication and a datastore
            are added.
          </p>
        </div>
        <button className="button" type="button" disabled>
          Invite flow pending
        </button>
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

      <section aria-labelledby="next-modules-title">
        <div className="section-heading">
          <p className="eyebrow">What stays pending</p>
          <h2 id="next-modules-title">Next integrations after this MVP</h2>
        </div>
        <ul className="feature-list">
          {nextModules.map((module) => (
            <li key={module}>{module}</li>
          ))}
        </ul>
      </section>
    </section>
  )
}

export default Dashboard
