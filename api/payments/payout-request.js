import { requireUser } from '../_lib/auth.js'
import { getSql, ensureSchema } from '../_lib/db.js'
import { requireMethod, sendError, sendJson } from '../_lib/http.js'
import payoutEnvConfig from '../../config/payout.js'

const MINIMUM_PAYOUT_ZAR = 50 // Minimum R50 to request a payout

/**
 * Load the active payout configuration.
 * DB-stored admin config takes precedence; env vars are the fallback.
 */
async function getActivePayoutConfig(db) {
  const [row] = await db`
    SELECT bank_name, account_holder, account_number, branch_code, account_type,
           country, currency, stripe_status
    FROM payout_config
    WHERE id = 'default'
    LIMIT 1
  `
  if (row) {
    return {
      bank: row.bank_name,
      accountHolder: row.account_holder,
      accountNumber: row.account_number,
      branchCode: row.branch_code,
      accountType: row.account_type,
      country: row.country || 'ZA',
      currency: row.currency || 'ZAR',
    }
  }
  // Fall back to environment variables
  return {
    bank: payoutEnvConfig.bank,
    accountHolder: payoutEnvConfig.accountHolder,
    accountNumber: payoutEnvConfig.accountNumber,
    branchCode: payoutEnvConfig.branchCode,
    accountType: payoutEnvConfig.accountType,
    country: payoutEnvConfig.country || 'ZA',
    currency: payoutEnvConfig.currency || 'ZAR',
  }
}

/**
 * POST /api/payments/payout-request
 * Authenticated user requests a payout of their available earnings.
 * Creates a payout_request record and deducts the balance.
 */
export default async function handler(req, res) {
  try {
    requireMethod(req, ['POST'])
    const user = await requireUser(req)

    await ensureSchema()
    const db = getSql()

    // Load payout config (DB first, then env vars)
    const config = await getActivePayoutConfig(db)

    // Validate payout config
    if (!config.bank || !config.accountNumber) {
      throw Object.assign(new Error('Payout is not configured. Contact support.'), { statusCode: 503 })
    }

    // Fetch current earnings balance
    const [record] = await db`
      SELECT earnings_balance FROM users WHERE id = ${user.id}
    `

    const balance = parseFloat(record?.earnings_balance ?? 0)

    if (balance < MINIMUM_PAYOUT_ZAR) {
      throw Object.assign(
        new Error(`Minimum payout is R${MINIMUM_PAYOUT_ZAR}. Your balance is R${balance.toFixed(2)}.`),
        { statusCode: 400 }
      )
    }

    // Check for a pending payout request
    const [existing] = await db`
      SELECT id FROM payout_requests
      WHERE user_id = ${user.id} AND status = 'pending'
      LIMIT 1
    `

    if (existing) {
      throw Object.assign(
        new Error('You already have a pending payout request. Please wait for it to be processed.'),
        { statusCode: 409 }
      )
    }

    const requestId = crypto.randomUUID()
    const now = new Date().toISOString()

    // Create payout request and deduct balance atomically
    await db`
      INSERT INTO payout_requests (
        id, user_id, amount, currency,
        bank_name, account_holder, account_type,
        status, created_at
      ) VALUES (
        ${requestId}, ${user.id}, ${balance}, 'ZAR',
        ${config.bank}, ${config.accountHolder}, ${config.accountType},
        'pending', ${now}
      )
    `

    await db`
      UPDATE users
      SET
        earnings_balance = 0,
        total_paid_out = COALESCE(total_paid_out, 0) + ${balance}
      WHERE id = ${user.id}
    `

    sendJson(res, 201, {
      success: true,
      requestId,
      amount: balance,
      currency: 'ZAR',
      bank: config.bank,
      accountHolder: config.accountHolder,
      status: 'pending',
      message: `Payout of R${balance.toFixed(2)} has been submitted and will be processed to your bank account.`,
    })
  } catch (error) {
    sendError(res, error)
  }
}
