import { requireUser } from '../_lib/auth.js'
import { getSql } from '../_lib/db.js'
import { requireMethod, sendError, sendJson } from '../_lib/http.js'
import payoutConfig from '../../config/payout.js'

/**
 * GET /api/payments/payout
 * Returns SA bank payout details and the requesting user's earnings balance.
 * Only accessible to authenticated users.
 */
export default async function handler(req, res) {
  try {
    requireMethod(req, ['GET'])
    const user = await requireUser(req)

    // Validate payout config is set up
    if (!payoutConfig.bank || !payoutConfig.accountNumber) {
      throw Object.assign(new Error('Payout configuration is not set up.'), { statusCode: 503 })
    }

    const db = getSql()

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
        bankName: payoutConfig.bank,
        accountHolder: payoutConfig.accountHolder,
        accountType: payoutConfig.accountType,
        country: payoutConfig.country,
        currency: payoutConfig.currency,
      },
      earnings: {
        availableBalance: earningsBalance,
        totalPaidOut: totalPaidOut,
        currency: 'ZAR',
      },
      message:
        earningsBalance > 0
          ? 'Payout will be processed to your registered TymeBank account.'
          : 'No earnings available for payout at this time.',
    })
  } catch (error) {
    sendError(res, error)
  }
}
