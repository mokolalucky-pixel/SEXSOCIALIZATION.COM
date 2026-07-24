import { useEffect, useState } from 'react'
import { loadAdminPayoutSetup, saveAdminPayoutSetup } from '../services/adminPayoutService.js'

const ACCOUNT_TYPES = ['cheque', 'savings', 'transmission']

/**
 * Client-side validation for South African bank details.
 * Returns an error string or empty string if valid.
 */
function validateField(name, value) {
  const v = String(value || '').trim()
  switch (name) {
    case 'accountHolder':
      if (!v) return 'Account holder name is required.'
      if (v.length < 2 || v.length > 100) return 'Account holder name must be 2–100 characters.'
      return ''
    case 'bankName':
      if (!v) return 'Bank name is required.'
      if (v.length > 100) return 'Bank name must be 100 characters or fewer.'
      return ''
    case 'accountNumber':
      if (!v) return 'Account number is required.'
      if (!/^\d{8,16}$/.test(v)) return 'Account number must be 8–16 digits.'
      return ''
    case 'branchCode':
      if (!v) return 'Branch code is required.'
      if (!/^\d{6}$/.test(v)) return 'Branch code must be exactly 6 digits (for example 632005 for FNB).'
      return ''
    case 'accountType':
      if (!v) return 'Account type is required.'
      if (!ACCOUNT_TYPES.includes(v.toLowerCase())) return `Account type must be one of: ${ACCOUNT_TYPES.join(', ')}.`
      return ''
    default:
      return ''
  }
}

function StripeStatusBadge({ stripeStatus, stripeMessage }) {
  if (!stripeStatus || stripeStatus === 'not_attempted') return null

  if (stripeStatus === 'verified') {
    return (
      <p className="save-status" role="status" style={{ color: 'green' }}>
        ✅ Stripe verified — automated payouts are enabled.
      </p>
    )
  }

  return (
    <div className="error-message" role="alert">
      <strong>⚠️ Stripe does not support automated ZA payouts</strong>
      <p style={{ marginTop: '0.5rem' }}>
        {stripeMessage || 'Your banking details are saved. Process payouts manually via EFT or Wise.'}
      </p>
      <p style={{ marginTop: '0.5rem' }}>
        <strong>What to do:</strong> When a payout request comes in, open your bank app or Wise account
        and manually transfer the payout amount to the user using EFT. Then mark the payout as completed
        in the Payout Requests table below.
      </p>
    </div>
  )
}

function AdminPayoutSetupPanel({ isAdmin }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [actionRequired, setActionRequired] = useState('')
  const [currentConfig, setCurrentConfig] = useState(null)

  const [form, setForm] = useState({
    accountHolder: '',
    bankName: '',
    accountNumber: '',
    branchCode: '',
    accountType: 'cheque',
  })
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    if (!isAdmin) return

    let isMounted = true

    loadAdminPayoutSetup()
      .then((data) => {
        if (!isMounted) return
        setCurrentConfig(data.configured ? data.config : null)
        if (data.configured && data.config) {
          setForm((prev) => ({
            ...prev,
            accountHolder: data.config.accountHolder || '',
            bankName: data.config.bankName || '',
            branchCode: data.config.branchCode || '',
            accountType: data.config.accountType || 'cheque',
            // Never pre-fill the account number field — admin must re-enter it
            accountNumber: '',
          }))
        }
        setLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err.message)
        setLoading(false)
      })

    return () => { isMounted = false }
  }, [isAdmin])

  if (!isAdmin) return null

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // Clear field error on change
    const fieldError = validateField(name, value)
    setFieldErrors((prev) => ({ ...prev, [name]: fieldError }))
  }

  async function handleSave(event) {
    event.preventDefault()
    setError('')
    setSuccessMessage('')
    setActionRequired('')

    // Validate all fields
    const errors = {}
    for (const key of Object.keys(form)) {
      const err = validateField(key, form[key])
      if (err) errors[key] = err
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError('Please fix the errors above before saving.')
      return
    }

    setSaving(true)

    try {
      const result = await saveAdminPayoutSetup(form)
      setSuccessMessage(result.message || 'Payout details saved.')
      if (result.actionRequired) {
        setActionRequired(result.actionRequired)
      }
      setCurrentConfig(result.config || null)
      // Clear account number after save (security — do not show it back)
      setForm((prev) => ({ ...prev, accountNumber: '' }))
    } catch (err) {
      setError(err.message || 'Failed to save payout details. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="workflow-card stacked-card" aria-labelledby="payout-setup-title">
      <div>
        <p className="eyebrow">Admin · South Africa payout setup</p>
        <h2 id="payout-setup-title">Configure ZA payout bank account</h2>
        <p>
          Enter the South African bank account that will receive payout transfers.
          These details are saved securely to the database and used for all payout requests.
        </p>

        {loading ? (
          <p className="save-status">Loading current payout configuration…</p>
        ) : null}

        {!loading && currentConfig ? (
          <div className="save-status" style={{ marginBottom: '1rem' }}>
            <strong>Current configuration</strong> (account number shown masked):
            <ul style={{ margin: '0.5rem 0 0 1rem', lineHeight: 1.6 }}>
              <li>Bank: <strong>{currentConfig.bankName}</strong></li>
              <li>Account holder: <strong>{currentConfig.accountHolder}</strong></li>
              <li>Account number: <strong>{currentConfig.accountNumberMasked}</strong></li>
              <li>Branch code: <strong>{currentConfig.branchCode}</strong></li>
              <li>Account type: <strong>{currentConfig.accountType}</strong></li>
              <li>Country / currency: <strong>{currentConfig.country} / {currentConfig.currency}</strong></li>
            </ul>
            <StripeStatusBadge
              stripeStatus={currentConfig.stripeStatus}
              stripeMessage={currentConfig.stripeMessage}
            />
          </div>
        ) : null}

        {!loading && !currentConfig ? (
          <p className="error-message" role="alert">
            ⚠️ No payout configuration found. Fill in the form below to set it up.
          </p>
        ) : null}
      </div>

      {!loading ? (
        <form onSubmit={handleSave} noValidate>
          <div className="stacked-card" style={{ gap: '0.75rem' }}>

            <label htmlFor="za-account-holder">
              Account holder name
              <input
                id="za-account-holder"
                name="accountHolder"
                type="text"
                value={form.accountHolder}
                onChange={handleChange}
                autoComplete="off"
                placeholder="Full legal name (e.g. Mokola Lucky Shai)"
              />
              {fieldErrors.accountHolder ? (
                <span className="error-message" role="alert">{fieldErrors.accountHolder}</span>
              ) : null}
            </label>

            <label htmlFor="za-bank-name">
              Bank name
              <input
                id="za-bank-name"
                name="bankName"
                type="text"
                value={form.bankName}
                onChange={handleChange}
                autoComplete="off"
                placeholder="e.g. TymeBank, FNB, Capitec, ABSA, Standard Bank"
              />
              {fieldErrors.bankName ? (
                <span className="error-message" role="alert">{fieldErrors.bankName}</span>
              ) : null}
            </label>

            <label htmlFor="za-account-number">
              Account number
              <input
                id="za-account-number"
                name="accountNumber"
                type="text"
                inputMode="numeric"
                value={form.accountNumber}
                onChange={handleChange}
                autoComplete="off"
                placeholder="8–16 digit account number"
              />
              {fieldErrors.accountNumber ? (
                <span className="error-message" role="alert">{fieldErrors.accountNumber}</span>
              ) : null}
            </label>

            <label htmlFor="za-branch-code">
              Branch code
              <input
                id="za-branch-code"
                name="branchCode"
                type="text"
                inputMode="numeric"
                value={form.branchCode}
                onChange={handleChange}
                autoComplete="off"
                placeholder="6-digit branch code (e.g. 678910 for TymeBank)"
              />
              {fieldErrors.branchCode ? (
                <span className="error-message" role="alert">{fieldErrors.branchCode}</span>
              ) : null}
            </label>

            <label htmlFor="za-account-type">
              Account type
              <select
                id="za-account-type"
                name="accountType"
                value={form.accountType}
                onChange={handleChange}
              >
                {ACCOUNT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
              {fieldErrors.accountType ? (
                <span className="error-message" role="alert">{fieldErrors.accountType}</span>
              ) : null}
            </label>
          </div>

          {error ? (
            <p className="error-message" role="alert" style={{ marginTop: '1rem' }}>{error}</p>
          ) : null}

          {successMessage ? (
            <p className="save-status" role="status" style={{ color: 'green', marginTop: '1rem' }}>
              ✅ {successMessage}
            </p>
          ) : null}

          {actionRequired ? (
            <div className="error-message" role="alert" style={{ marginTop: '1rem' }}>
              <strong>Action required:</strong> {actionRequired}
            </div>
          ) : null}

          <div className="action-row" style={{ marginTop: '1rem' }}>
            <button className="button" type="submit" disabled={saving}>
              {saving ? 'Saving…' : currentConfig ? 'Update payout details' : 'Save payout details'}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  )
}

export default AdminPayoutSetupPanel
