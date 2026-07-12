import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'

const initialBoundarySections = [
  {
    id: 'communication',
    title: 'Communication rhythm',
    description: 'Set expectations for replies, quiet hours, and check-ins before problems escalate.',
    items: [
      'Preferred daily check-in window is documented',
      'Quiet hours and do-not-disturb times are agreed',
      'Both partners know how to pause a difficult conversation',
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy and consent',
    description: 'Capture what can be shared, stored, screenshotted, or revisited later.',
    items: [
      'Private content sharing rules are explicit',
      'Screenshot and recording boundaries are explicit',
      'Either partner can withdraw consent and request deletion',
    ],
  },
  {
    id: 'conflict',
    title: 'Conflict repair plan',
    description: 'Create a low-pressure path for cooling down, apologizing, and reconnecting.',
    items: [
      'Cooldown time limit is agreed',
      'Repair conversation format is agreed',
      'Escalation or safety support steps are documented',
    ],
  },
]

const nextModules = [
  'Secure messaging: connect private messages to authenticated users and a datastore.',
  'Video calls: add a WebRTC provider and update camera/microphone security policy.',
  'Admin moderation: add admin roles, report queue, and account safety actions.',
]

function Dashboard() {
  const { user } = useAuth()
  const [completedItems, setCompletedItems] = useState(() => new Set())

  const totalItems = initialBoundarySections.reduce((count, section) => count + section.items.length, 0)
  const completedCount = completedItems.size

  function toggleItem(item) {
    setCompletedItems((currentItems) => {
      const nextItems = new Set(currentItems)

      if (nextItems.has(item)) {
        nextItems.delete(item)
      } else {
        nextItems.add(item)
      }

      return nextItems
    })
  }

  return (
    <section className="panel dashboard-panel" aria-labelledby="dashboard-title">
      <div className="dashboard-header">
        <div>
          <h1 id="dashboard-title">Partner agreement workspace</h1>
          <p>Welcome back, {user?.displayName || user?.email}.</p>
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
            and repair steps together. Backend-backed invites will be connected after real auth and a datastore
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
            Use this scaffold to decide what the first real agreement workflow should save for each couple.
          </p>
        </div>

        <div className="boundary-grid">
          {initialBoundarySections.map((section) => (
            <article className="boundary-card" key={section.id}>
              <h3>{section.title}</h3>
              <p>{section.description}</p>
              <ul className="checklist">
                {section.items.map((item) => (
                  <li key={item}>
                    <label>
                      <input
                        type="checkbox"
                        checked={completedItems.has(item)}
                        onChange={() => toggleItem(item)}
                      />
                      <span>{item}</span>
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
            After backend integration, this area should generate a versioned agreement both partners can accept,
            revisit, and update when boundaries change.
          </p>
        </div>
      </section>

      <section aria-labelledby="next-modules-title">
        <div className="section-heading">
          <p className="eyebrow">What stays pending</p>
          <h2 id="next-modules-title">Next integrations after this scaffold</h2>
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
