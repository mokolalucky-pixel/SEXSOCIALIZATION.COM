import { requireAdmin } from '../_lib/admin.js'
import { requireUser } from '../_lib/auth.js'
import { ensureSchema, getSql } from '../_lib/db.js'
import { readJson, requireMethod, sendError, sendJson } from '../_lib/http.js'
import { validateZaPayoutDetails } from '../_lib/zaPayoutValidation.js'

function maskAccountNumber(accountNumber) {
  const value = String(accountNumber || '')
  return value.length <= 4 ? '****' : '*'.repeat(value.length - 4) + value.slice(-4)
}

async function loadPayoutConfig(db) {
  const [row] = await db`
    SELECT bank_name, account_holder, account_number, branch_code, account_type,
           country, currency, payout_status, payout_message, updated_at
    FROM payout_config WHERE id = 'default' LIMIT 1`
  if (row) return { source: 'database', ...row }

  const bankName = process.env.PAYOUT_BANK_NAME
  const accountNumber = process.env.PAYOUT_ACCOUNT_NUMBER
  if (!bankName || !accountNumber) return null
  return {
    source: 'env', bank_name: bankName, account_holder: process.env.PAYOUT_ACCOUNT_HOLDER || '',
    account_number: accountNumber, branch_code: process.env.PAYOUT_BRANCH_CODE || '',
    account_type: process.env.PAYOUT_ACCOUNT_TYPE || '', country: 'ZA', currency: 'ZAR',
    payout_status: 'manual', payout_message: 'Payouts are processed manually by EFT.', updated_at: null,
  }
}

export default async function handler(req, res) {
  try {
    const user = await requireUser(req)
    requireAdmin(user)
    await ensureSchema()
    const db = getSql()

    if (req.method === 'GET') {
      const config = await loadPayoutConfig(db)
      if (!config) return sendJson(res, 200, { configured: false, config: null })
      return sendJson(res, 200, {
        configured: true, source: config.source,
        config: {
          bankName: config.bank_name, accountHolder: config.account_holder,
          accountNumberMasked: maskAccountNumber(config.account_number), branchCode: config.branch_code,
          accountType: config.account_type, country: config.country || 'ZA', currency: config.currency || 'ZAR',
          payoutStatus: config.payout_status || 'manual', payoutMessage: config.payout_message || null,
          updatedAt: config.updated_at || null,
        },
      })
    }

    requireMethod(req, ['POST'])
    const { accountHolder, bankName, accountNumber, branchCode, accountType } = await readJson(req)
    const validationErrors = validateZaPayoutDetails({ accountHolder, bankName, accountNumber, branchCode, accountType })
    if (validationErrors.length) throw Object.assign(new Error(validationErrors[0]), { statusCode: 400 })
    const details = {
      accountHolder: String(accountHolder).trim(), bankName: String(bankName).trim(),
      accountNumber: String(accountNumber).trim(), branchCode: String(branchCode).trim(),
      accountType: String(accountType).trim().toLowerCase(),
    }
    const payoutMessage = 'Bank details saved. Payouts are processed manually by EFT.'
    await db`
      INSERT INTO payout_config (
        id, bank_name, account_holder, account_number, branch_code, account_type,
        country, currency, payout_status, payout_message, updated_at
      ) VALUES (
        'default', ${details.bankName}, ${details.accountHolder}, ${details.accountNumber},
        ${details.branchCode}, ${details.accountType}, 'ZA', 'ZAR', 'manual', ${payoutMessage}, NOW()
      ) ON CONFLICT (id) DO UPDATE SET
        bank_name = EXCLUDED.bank_name, account_holder = EXCLUDED.account_holder,
        account_number = EXCLUDED.account_number, branch_code = EXCLUDED.branch_code,
        account_type = EXCLUDED.account_type, payout_status = EXCLUDED.payout_status,
        payout_message = EXCLUDED.payout_message, updated_at = NOW()`
    sendJson(res, 200, {
      success: true, payoutStatus: 'manual', message: payoutMessage,
      actionRequired: 'Process approved payout requests manually through your bank or EFT provider.',
      config: { bankName: details.bankName, accountHolder: details.accountHolder, accountNumberMasked: maskAccountNumber(details.accountNumber), branchCode: details.branchCode, accountType: details.accountType, country: 'ZA', currency: 'ZAR', payoutStatus: 'manual', payoutMessage },
    })
  } catch (error) { sendError(res, error) }
}
