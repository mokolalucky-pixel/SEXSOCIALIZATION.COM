import { Link } from 'react-router-dom'
import FeaturePreview from '../components/FeaturePreview.jsx'
import { useAuth } from '../hooks/useAuth.js'

const featurePreviews = [
  {
    title: 'Partner agreements',
    description: 'Create shared expectations before distance, stress, or intimacy gaps create confusion.',
    items: ['Communication rhythm', 'Privacy expectations', 'Conflict repair steps'],
  },
  {
    title: 'Consent-aware boundaries',
    description: 'Keep boundaries visible, revisit them often, and make updates a normal part of connection.',
    items: ['Mutual review', 'Versioned agreements', 'Clear withdrawal paths'],
  },
]

function Home() {
  const { isAuthenticated } = useAuth()

  return (
    <>
      <section className="panel hero-panel">
        <h1>Build healthier long-distance connection rituals</h1>
        <p>
          This baseline application focuses on secure communication workflows, clear relationship boundaries,
          and respectful consent-aware interaction patterns.
        </p>
        <div className="action-row">
          {isAuthenticated ? (
            <Link className="button" to="/dashboard">
              Open dashboard
            </Link>
          ) : (
            <>
              <Link className="button" to="/signup">
                Create account
              </Link>
              <Link className="button secondary" to="/login">
                Log in
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="preview-grid" aria-label="Agreement workflow preview">
        {featurePreviews.map((preview) => (
          <FeaturePreview key={preview.title} {...preview} />
        ))}
      </section>
    </>
  )
}

export default Home
