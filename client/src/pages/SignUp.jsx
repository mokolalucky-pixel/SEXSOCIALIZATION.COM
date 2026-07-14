import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function SignUp() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    gender: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (formState.name.trim().length < 2) {
      setError('Display name must contain at least 2 characters.')
      return
    }

    if (!emailPattern.test(formState.email.trim())) {
      setError('Enter a valid email address.')
      return
    }

    if (formState.password.length < 8) {
      setError('Password must contain at least 8 characters.')
      return
    }

    if (formState.password !== formState.confirmPassword) {
      setError('Password and confirmation do not match.')
      return
    }

    setIsSubmitting(true)

    try {
      await signup({ email: formState.email, name: formState.name, password: formState.password, gender: formState.gender })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="panel form-panel" aria-labelledby="signup-title">
      <h1 id="signup-title">Create account</h1>
      <p>Start your private long-distance connection space.</p>
      <form noValidate onSubmit={handleSubmit}>
        <label htmlFor="signup-name">Display name</label>
        <input
          id="signup-name"
          name="name"
          autoComplete="name"
          value={formState.name}
          onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
          required
        />

        <label htmlFor="signup-email">Email address</label>
        <input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          value={formState.email}
          onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
          required
        />

        <label htmlFor="signup-gender">Gender</label>
        <select
          id="signup-gender"
          name="gender"
          value={formState.gender}
          onChange={(event) => setFormState((prev) => ({ ...prev, gender: event.target.value }))}
        >
          <option value="">Select gender (optional)</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="non-binary">Non-binary</option>
          <option value="prefer-not-to-say">Prefer not to say</option>
        </select>

        <label htmlFor="signup-password">Password</label>
        <input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={formState.password}
          onChange={(event) => setFormState((prev) => ({ ...prev, password: event.target.value }))}
          required
        />

        <label htmlFor="signup-confirm-password">Confirm password</label>
        <input
          id="signup-confirm-password"
          name="confirm-password"
          type="password"
          autoComplete="new-password"
          value={formState.confirmPassword}
          onChange={(event) => setFormState((prev) => ({ ...prev, confirmPassword: event.target.value }))}
          required
        />

        {error ? <p className="error-message" role="alert">{error}</p> : null}

        <button className="button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </section>
  )
}

export default SignUp
