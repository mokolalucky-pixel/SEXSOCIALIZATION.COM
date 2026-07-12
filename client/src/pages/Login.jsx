import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function Login() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formState, setFormState] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!emailPattern.test(formState.email.trim())) {
      setError('Enter a valid email address.')
      return
    }

    if (formState.password.length < 8) {
      setError('Password must contain at least 8 characters.')
      return
    }

    login({ email: formState.email })
    navigate(location.state?.from || '/dashboard', { replace: true })
  }

  return (
    <section className="panel form-panel" aria-labelledby="login-title">
      <h1 id="login-title">Log in</h1>
      <p>Continue where you left off.</p>
      <form noValidate onSubmit={handleSubmit}>
        <label htmlFor="login-email">Email address</label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          value={formState.email}
          onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
          required
        />

        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={formState.password}
          onChange={(event) => setFormState((prev) => ({ ...prev, password: event.target.value }))}
          required
        />

        {error ? <p className="error-message" role="alert">{error}</p> : null}

        <button className="button" type="submit">
          Log in
        </button>
      </form>
      <p>
        Need an account? <Link to="/signup">Sign up</Link>
      </p>
    </section>
  )
}

export default Login
