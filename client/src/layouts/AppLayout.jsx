import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import Avatar from '../components/Avatar.jsx'

function AppLayout() {
  const { isAuthenticated, logout, user } = useAuth()

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="site-header">
        <div className="brand-wrap">
          <img src="/logo.svg" alt="Sexsocialization brand" className="brand-logo" />
          <div>
            <p className="brand-title">SEXSOCIALIZATION.COM</p>
            <p className="brand-subtitle">Bridging distance with trust and communication</p>
          </div>
        </div>
        <nav aria-label="Primary">
          <ul className="nav-list">
            <li>
              <NavLink to="/">Home</NavLink>
            </li>
            {!isAuthenticated ? (
              <>
                <li>
                  <NavLink to="/login">Login</NavLink>
                </li>
                <li>
                  <NavLink to="/signup">Sign Up</NavLink>
                </li>
              </>
            ) : (
              <>
                <li>
                  <NavLink to="/dashboard" className="nav-avatar-link">
                    <Avatar url={user?.avatarUrl} name={user?.displayName} size={28} />
                    Dashboard
                  </NavLink>
                </li>
                <li>
                  <button type="button" className="ghost-button" onClick={logout}>
                    Log out
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>
      </header>
      <main id="main-content" className="main-content" tabIndex="-1">
        <Outlet />
      </main>
      <footer className="site-footer">
        {isAuthenticated ? (
          <p>
            Signed in as <strong>{user?.displayName || user?.email}</strong>
          </p>
        ) : (
          <p>Private relationship communication workspace for consenting adults 18+.</p>
        )}
      </footer>
    </>
  )
}

export default AppLayout
