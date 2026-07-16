/**
 * SA Payout Bank Details
 * Actual values are stored securely as environment variables.
 * Set these in your Vercel Project Settings > Environment Variables.
 */

const payoutConfig = {
  bank: process.env.PAYOUT_BANK_NAME,
  accountHolder: process.env.PAYOUT_ACCOUNT_HOLDER,
  accountNumber: process.env.PAYOUT_ACCOUNT_NUMBER,
  branchCode: process.env.PAYOUT_BRANCH_CODE,
  accountType: process.env.PAYOUT_ACCOUNT_TYPE,
  country: 'ZA',
  currency: 'ZAR',
};

module.exports = payoutConfig;
