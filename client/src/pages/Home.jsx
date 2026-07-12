import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

function Home() {
  const { isAuthenticated } = useAuth()

  return (
    <section className="panel">
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
  )
}

export default Home
