import { useEffect, useState } from 'react'
import { createCheckoutSession, loadSubscriptionStatus } from '../services/paymentService.js'

const PLANS = [
  {
    name: 'Monthly',
    description: 'Full access to all features, billed monthly.',
    price: 'R99/month',
    id: 'monthly',
    label: 'Subscribe monthly',
  },
  {
    name: 'Annual',
    description: 'Full access to all features, billed annually. Save with the yearly plan.',
    price: 'R990/year (two months free)',
    id: 'annual',
    label: 'Subscribe annually',
  },
]

function SubscriptionPanel() {
  const [status, setStatus] = useState('loading')
  const [subscribedAt, setSubscribedAt] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState('')

  useEffect(() => {
    let isMounted = true

    loadSubscriptionStatus()
      .then(({ subscriptionStatus, subscribedAt: date }) => {
        if (isMounted) {
          setStatus(subscriptionStatus)
          setSubscribedAt(date)
        }
      })
      .catch(() => {
        if (isMounted) {
          setStatus('error')
          setError('Unable to load your subscription status. Please refresh the page or try again later.')
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  async function handleSubscribe(plan) {
    setLoading(plan.name)
    setError('')

    try {
      const checkoutUrl = await createCheckoutSession(plan.id)
      window.location.href = checkoutUrl
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading('')
    }
  }

  if (status === 'loading') {
    return (
      <section className="workflow-card stacked-card" aria-labelledby="sub-title">
        <div>
          <p className="eyebrow">Subscription</p>
          <h2 id="sub-title">Premium membership</h2>
          <p className="save-status">Loading subscription status...</p>
        </div>
      </section>
    )
  }

  if (status === 'active') {
    return (
      <section className="workflow-card stacked-card" aria-labelledby="sub-title">
        <div>
          <p className="eyebrow">Subscription</p>
          <h2 id="sub-title">Premium membership</h2>
          <p>
            Your subscription is <strong>active</strong>.
            {subscribedAt ? <> Since {new Date(subscribedAt).toLocaleDateString()}.</> : null}
          </p>
          <p className="save-status">
            Thank you for supporting SEXSOCIALIZATION.COM. You have full access to all premium features.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="workflow-card stacked-card" aria-labelledby="sub-title">
      <div>
        <p className="eyebrow">Subscription</p>
        <h2 id="sub-title">Premium membership</h2>
        <p>
          Upgrade to premium for full access to video calls, advanced circles, priority support, and referral earnings.
        </p>
        {status === 'cancelled' ? (
          <p className="save-status">
            Your subscription has ended. Resubscribe below to restore premium access.
          </p>
        ) : null}
        {error ? (
          <p className="error-message" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="action-row">
        {PLANS.map((plan) => (
          <button
            key={plan.name}
            className="button"
            type="button"
            onClick={() => handleSubscribe(plan)}
            disabled={!!loading}
          >
            {loading === plan.name ? 'Redirecting...' : `${plan.label} — ${plan.price}`}
          </button>
        ))}
      </div>
    </section>
  )
}

export default SubscriptionPanel
