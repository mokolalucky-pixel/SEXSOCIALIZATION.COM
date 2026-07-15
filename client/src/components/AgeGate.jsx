import { useState } from 'react'

const STORAGE_KEY = 'sexsocialization.age.verified'

function hasVerified() {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === 'yes'
  } catch {
    return false
  }
}

function AgeGate({ children }) {
  const [verified, setVerified] = useState(hasVerified)

  function confirm() {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, 'yes')
    } catch {
      // sessionStorage not available — still allow access in current render
    }

    setVerified(true)
  }

  function deny() {
    window.location.href = 'https://www.google.com'
  }

  if (verified) {
    return children
  }

  return (
    <div className="age-gate" role="dialog" aria-modal="true" aria-labelledby="age-gate-title">
      <div className="age-gate-card">
        <img src="/logo.svg" alt="Sexsocialization brand logo" className="age-gate-logo" />
        <h1 id="age-gate-title">Adults Only</h1>
        <p>
          This site contains content intended exclusively for adults. You must be{' '}
          <strong>18 years of age or older</strong> to enter.
        </p>
        <p className="age-gate-sub">
          By clicking <em>I Am 18+</em> you confirm that you are of legal age in your jurisdiction
          and agree to our{' '}
          <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> and{' '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
        </p>
        <div className="age-gate-actions">
          <button className="button" type="button" onClick={confirm}>
            I Am 18+ — Enter
          </button>
          <button className="button secondary" type="button" onClick={deny}>
            I Am Under 18 — Leave
          </button>
        </div>
      </div>
    </div>
  )
}

export default AgeGate
