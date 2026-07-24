import { requireAdmin } from '../_lib/admin.js'
import { requireUser } from '../_lib/auth.js'
import { ensureSchema, getSql } from '../_lib/db.js'
import { readJson, requireMethod, sendError, sendJson } from '../_lib/http.js'
import { validateZaPayoutDetails } from '../_lib/zaPayoutValidation.js'

/**
 * Attempt to validate a ZA bank account token via the Stripe Tokens API.
 * Returns an object { supported: boolean, error: string|null }.
 *
 * Stripe does not support South African bank accounts on automated payout rails.
 * We catch that rejection here and surface a clear admin-facing message instead
 * of letting the payout flow crash.
 */
async function attemptStripeZaBankValidation({ accountHolder, accountNumber, branchCode }) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return { supported: false, error: 'Stripe is not configured. Payouts will be processed manually.' }
  }

  const params = new URLSearchParams({
    'bank_account[country]': 'ZA',
    'bank_account[currency]': 'ZAR',
    'bank_account[account_holder_name]': accountHolder,
    'bank_account[account_holder_type]': 'individual',
    'bank_account[routing_number]': branchCode,
    'bank_account[account_number]': accountNumber,
  })

  try {
    const response = await fetch('https://api.stripe.com/v1/tokens', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + secretKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    })
    let result = {}
    try {
      result = await response.json()
    } catch {
      // Stripe returned a non-JSON body; treat as an unknown error and fall through
      // to the unsupported-country path so the payout details are still saved.
    }

    if (response.ok) {
      return { supported: true, error: null }
    }

    // Stripe returned an error — classify it
    const stripeError = result?.error || {}
    const isCountryUnsupported =
      stripeError.code === 'country_unsupported' ||
      stripeError.code === 'routing_number_invalid' ||
      stripeError.code === 'bank_account_unusable' ||
      (stripeError.message || '').toLowerCase().includes('not supported') ||
      (stripeError.message || '').toLowerCase().includes('routing number')

    if (isCountryUnsupported) {
      return {
        supported: false,
        error:
          'Stripe does not currently support automated payouts to South African bank accounts. ' +
          'Your banking details have been saved. To pay out, transfer manually via EFT or use an ' +
          'alternative payment provider such as Wise.',
      }
    }

    return {
      supported: false,
      error:
        'Stripe declined the bank account: ' +
        (stripeError.message || 'Unknown error') +
        '. Your banking details have been saved. Please verify your details or use an alternative payout method.',
    }
  } catch {
    return {
      supported: false,
      error:
        'Could not reach Stripe to verify your bank account. Your banking details have been saved. ' +
        'Payouts will be processed manually until Stripe connectivity is confirmed.',
    }
  }
}

/**
 * Load the admin payout configuration.
 * Checks the DB first; falls back to environment variables for backward compatibility.
 */
async function loadPayoutConfig(db) {
  const [row] = await db`
    SELECT bank_name, account_holder, account_number, branch_code, account_type,
           country, currency, stripe_status, stripe_message, updated_at
    FROM payout_config
    WHERE id = 'default'
    LIMIT 1
  `

  if (row) {
    return { source: 'database', ...row }
  }

  // Fallback: env vars (backward compatibility)
  const envBank = process.env.PAYOUT_BANK_NAME
  const envAccountNumber = process.env.PAYOUT_ACCOUNT_NUMBER
  if (envBank && envAccountNumber) {
    return {
      source: 'env',
      bank_name: envBank,
      account_holder: process.env.PAYOUT_ACCOUNT_HOLDER || '',
      account_number: envAccountNumber,
      branch_code: process.env.PAYOUT_BRANCH_CODE || '',
      account_type: process.env.PAYOUT_ACCOUNT_TYPE || '',
      country: 'ZA',
      currency: 'ZAR',
      stripe_status: 'not_attempted',
      stripe_message: null,
      updated_at: null,
    }
  }

  return null
}

function maskAccountNumber(accountNumber) {
  if (!accountNumber) return ''
  const str = String(accountNumber)
  if (str.length <= 4) return '****'
  return '*'.repeat(str.length - 4) + str.slice(-4)
}

/**
 * GET  /api/payments/admin-payout-setup
 *   Returns the current ZA payout configuration for the admin.
 *
 * POST /api/payments/admin-payout-setup
 *   Saves new ZA banking details, attempts Stripe validation, and returns
 *   the resulting status (including a clear fallback message when Stripe
 *   does not support ZA payouts).
 */
export default async function handler(req, res) {
  try {
    const user = await requireUser(req)
    requireAdmin(user)
    await ensureSchema()
    const db = getSql()

    if (req.method === 'GET') {
      requireMethod(req, ['GET'])
      const config = await loadPayoutConfig(db)
      if (!config) {
        return sendJson(res, 200, { configured: false, config: null })
      }
      return sendJson(res, 200, {
        configured: true,
        source: config.source,
        config: {
          bankName: config.bank_name,
          accountHolder: config.account_holder,
          accountNumberMasked: maskAccountNumber(config.account_number),
          branchCode: config.branch_code,
          accountType: config.account_type,
          country: config.country || 'ZA',
          currency: config.currency || 'ZAR',
          stripeStatus: config.stripe_status || 'not_attempted',
          stripeMessage: config.stripe_message || null,
          updatedAt: config.updated_at || null,
        },
      })
    }

    if (req.method === 'POST') {
      requireMethod(req, ['POST'])

      const body = await readJson(req)
      const { accountHolder, bankName, accountNumber, branchCode, accountType } = body

      // Server-side validation
      const validationErrors = validateZaPayoutDetails({ accountHolder, bankName, accountNumber, branchCode, accountType })
      if (validationErrors.length > 0) {
        throw Object.assign(new Error(validationErrors[0]), { statusCode: 400 })
      }

      const trimmed = {
        accountHolder: String(accountHolder).trim(),
        bankName: String(bankName).trim(),
        accountNumber: String(accountNumber).trim(),
        branchCode: String(branchCode).trim(),
        accountType: String(accountType).trim().toLowerCase(),
      }

      // Attempt Stripe bank account validation (will likely fail for ZA)
      const stripeResult = await attemptStripeZaBankValidation(trimmed)
      const stripeStatus = stripeResult.supported ? 'verified' : 'unsupported_or_manual'
      const stripeMessage = stripeResult.error

      // Persist to DB (upsert)
      await db`
        INSERT INTO payout_config (
          id, bank_name, account_holder, account_number, branch_code, account_type,
          country, currency, stripe_status, stripe_message, updated_at
        ) VALUES (
          'default',
          ${trimmed.bankName},
          ${trimmed.accountHolder},
          ${trimmed.accountNumber},
          ${trimmed.branchCode},
          ${trimmed.accountType},
          'ZA', 'ZAR',
          ${stripeStatus},
          ${stripeMessage},
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          bank_name      = EXCLUDED.bank_name,
          account_holder = EXCLUDED.account_holder,
          account_number = EXCLUDED.account_number,
          branch_code    = EXCLUDED.branch_code,
          account_type   = EXCLUDED.account_type,
          stripe_status  = EXCLUDED.stripe_status,
          stripe_message = EXCLUDED.stripe_message,
          updated_at     = NOW()
      `

      return sendJson(res, 200, {
        success: true,
        stripeSupported: stripeResult.supported,
        stripeStatus,
        message: stripeResult.supported
          ? 'South African payout details saved and verified with Stripe. Automated payouts are enabled.'
          : 'South African payout details saved. ' + (stripeMessage || 'Payouts will be processed manually.'),
        actionRequired: !stripeResult.supported
          ? 'Stripe does not support automated ZA payouts. To pay out earnings, transfer the amount manually via EFT or use an alternative provider (e.g. Wise) using the banking details stored here.'
          : null,
        config: {
          bankName: trimmed.bankName,
          accountHolder: trimmed.accountHolder,
          accountNumberMasked: maskAccountNumber(trimmed.accountNumber),
          branchCode: trimmed.branchCode,
          accountType: trimmed.accountType,
          country: 'ZA',
          currency: 'ZAR',
          stripeStatus,
          stripeMessage,
        },
      })
    }

    throw Object.assign(new Error('Method not allowed.'), { statusCode: 405 })
  } catch (error) {
    sendError(res, error)
  }
}
