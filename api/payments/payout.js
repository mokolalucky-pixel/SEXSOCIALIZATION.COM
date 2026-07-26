import { requireUser } from '../_lib/auth.js'
import { ensureSchema, getSql } from '../_lib/db.js'
import { requirePremium } from '../_lib/premium.js'
import { readJson, requireMethod, sendError, sendJson } from '../_lib/http.js'

function clean(value, max = 120) { return String(value || '').trim().slice(0, max) }

export default async function handler(req, res) {
  try {
    requireMethod(req, ['GET', 'POST'])
    const user = await requireUser(req)
    await ensureSchema(); const db = getSql()
    const [record] = await db`SELECT subscription_status, earnings_balance, total_paid_out, payout_bank_name, payout_account_holder, payout_account_number, payout_branch_code, payout_account_type FROM users WHERE id = ${user.id}`
    requirePremium(record)
    if (req.method === 'POST') {
      const { bankName, accountHolder, accountNumber, branchCode, accountType } = await readJson(req)
      const details = { bankName: clean(bankName), accountHolder: clean(accountHolder), accountNumber: clean(accountNumber, 64), branchCode: clean(branchCode, 32), accountType: clean(accountType, 32) }
      if (Object.values(details).some((value) => !value)) throw Object.assign(new Error('Complete all payout banking fields.'), { statusCode: 400 })
      await db`UPDATE users SET payout_bank_name = ${details.bankName}, payout_account_holder = ${details.accountHolder}, payout_account_number = ${details.accountNumber}, payout_branch_code = ${details.branchCode}, payout_account_type = ${details.accountType} WHERE id = ${user.id}`
      sendJson(res, 200, { payout: { bankName: details.bankName, accountHolder: details.accountHolder, accountType: details.accountType, configured: true } })
      return
    }
    sendJson(res, 200, {
      payout: record?.payout_bank_name ? { bankName: record.payout_bank_name, accountHolder: record.payout_account_holder, accountType: record.payout_account_type, configured: true } : null,
      earnings: { availableBalance: record?.earnings_balance ?? 0, totalPaidOut: record?.total_paid_out ?? 0, currency: 'ZAR' },
    })
  } catch (error) { sendError(res, error) }
}
