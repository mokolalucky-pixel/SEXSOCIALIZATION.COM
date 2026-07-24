import { requireUser } from '../_lib/auth.js'
import { getSql, ensureSchema } from '../_lib/db.js'
import { requireMethod, sendError, sendJson } from '../_lib/http.js'
import payoutEnvConfig from '../../config/payout.js'

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
      stripeStatus: row.stripe_status || 'not_attempted',
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
    stripeStatus: 'not_attempted',
  }
}

/**
 * GET /api/payments/payout
 * Returns SA bank payout details and the requesting user's earnings balance.
 * Only accessible to authenticated users.
 */
export default async function handler(req, res) {
  try {
    requireMethod(req, ['GET'])
    const user = await requireUser(req)

    await ensureSchema()
    const db = getSql()

    const config = await getActivePayoutConfig(db)

    // Validate payout config is set up
    if (!config.bank || !config.accountNumber) {
      throw Object.assign(new Error('Payout configuration is not set up. Contact the administrator.'), { statusCode: 503 })
    }

    // Fetch the user's current earnings/payout balance from the database
    const [record] = await db`
      SELECT earnings_balance, total_paid_out
      FROM users
      WHERE id = ${user.id}
    `

    const earningsBalance = record?.earnings_balance ?? 0
    const totalPaidOut = record?.total_paid_out ?? 0

    sendJson(res, 200, {
      payout: {
        bankName: config.bank,
        accountHolder: config.accountHolder,
        accountType: config.accountType,
        country: config.country,
        currency: config.currency,
      },
      earnings: {
        availableBalance: earningsBalance,
        totalPaidOut: totalPaidOut,
        currency: 'ZAR',
      },
      message:
        earningsBalance > 0
          ? 'Payout will be processed to your registered bank account.'
          : 'No earnings available for payout at this time.',
    })
  } catch (error) {
    sendError(res, error)
  }
}
