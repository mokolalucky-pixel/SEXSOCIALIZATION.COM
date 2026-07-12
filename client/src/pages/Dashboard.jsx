import { useAuth } from '../context/AuthContext.jsx'

function Dashboard() {
  const { user } = useAuth()

  return (
    <section className="panel" aria-labelledby="dashboard-title">
      <h1 id="dashboard-title">Dashboard</h1>
      <p>Welcome back, {user?.displayName || user?.email}.</p>
      <ul className="feature-list">
        <li>Secure messaging module integration pending</li>
        <li>Video call module integration pending</li>
        <li>Partner agreement and boundaries workflow pending</li>
        <li>Admin moderation tooling pending</li>
      </ul>
    </section>
  )
}

export default Dashboard
