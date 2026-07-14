import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function SignUp() {
  const { signup, verify, resendCode } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState('register')
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    gender: '',
    region: '',
    password: '',
    confirmPassword: '',
  })
  const [verificationState, setVerificationState] = useState({
    userId: '',
    code: '',
    email: '',
    message: '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleRegister(event) {
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
      const result = await signup({
        email: formState.email,
        name: formState.name,
        password: formState.password,
        gender: formState.gender,
        region: formState.region,
      })

      setVerificationState({
        userId: result.userId,
        code: '',
        email: result.email,
        message: result.message,
      })
      setStep('verify')
    } catch (error) {
      setError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleVerify(event) {
    event.preventDefault()
    setError('')

    if (verificationState.code.trim().length !== 6) {
      setError('Enter the 6-digit verification code.')
      return
    }

    setIsSubmitting(true)

    try {
      await verify({ userId: verificationState.userId, code: verificationState.code })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResend() {
    setError('')
    setIsSubmitting(true)

    try {
      const result = await resendCode({ userId: verificationState.userId })
      setVerificationState((prev) => ({ ...prev, message: result.message, code: '' }))
    } catch (error) {
      setError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (step === 'verify') {
    return (
      <section className="panel form-panel" aria-labelledby="verify-title">
        <h1 id="verify-title">Verify your account</h1>
        <p>A 6-digit verification code was sent to <strong>{verificationState.email}</strong>.</p>
        {verificationState.message ? <p className="save-status">{verificationState.message}</p> : null}

        <form noValidate onSubmit={handleVerify}>
          <label htmlFor="verify-code">Verification code</label>
          <input
            id="verify-code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={verificationState.code}
            onChange={(event) => setVerificationState((prev) => ({ ...prev, code: event.target.value.replace(/\D/g, '').slice(0, 6) }))}
            placeholder="000000"
            required
          />

          {error ? <p className="error-message" role="alert">{error}</p> : null}

          <button className="button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying…' : 'Verify and continue'}
          </button>
        </form>

        <div className="action-row">
          <button className="button secondary" type="button" onClick={handleResend} disabled={isSubmitting}>
            Resend code
          </button>
        </div>

        <p>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </section>
    )
  }

  return (
    <section className="panel form-panel" aria-labelledby="signup-title">
      <h1 id="signup-title">Create account</h1>
      <p>Start your private long-distance connection space.</p>
      <form noValidate onSubmit={handleRegister}>
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

        <label htmlFor="signup-region">Region / City</label>
        <input
          id="signup-region"
          name="region"
          autoComplete="address-level1"
          value={formState.region}
          onChange={(event) => setFormState((prev) => ({ ...prev, region: event.target.value }))}
          placeholder="e.g. New York, London, Nairobi"
        />

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
