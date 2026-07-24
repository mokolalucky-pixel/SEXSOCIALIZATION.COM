/**
 * South African bank account validation utilities.
 * Used by both admin payout setup and payout-request endpoints.
 */

const VALID_ACCOUNT_TYPES = ['cheque', 'savings', 'transmission']

/**
 * Validate a set of ZA bank detail fields.
 * Returns an array of validation error strings (empty array = valid).
 */
export function validateZaPayoutDetails({ accountHolder, bankName, accountNumber, branchCode, accountType }) {
  const errors = []

  if (!accountHolder || !String(accountHolder).trim()) {
    errors.push('Account holder name is required.')
  } else if (!/^[\p{L}\s'-]{2,100}$/u.test(String(accountHolder).trim())) {
    errors.push('Account holder name must be 2–100 characters (letters, spaces, hyphens, apostrophes only).')
  }

  if (!bankName || !String(bankName).trim()) {
    errors.push('Bank name is required.')
  } else if (String(bankName).trim().length > 100) {
    errors.push('Bank name must be 100 characters or fewer.')
  }

  if (!accountNumber || !String(accountNumber).trim()) {
    errors.push('Account number is required.')
  } else if (!/^\d{8,16}$/.test(String(accountNumber).trim())) {
    errors.push('Account number must be 8–16 digits.')
  }

  if (!branchCode || !String(branchCode).trim()) {
    errors.push('Branch code is required.')
  } else if (!/^\d{6}$/.test(String(branchCode).trim())) {
    errors.push('Branch code must be exactly 6 digits (for example 632005 for FNB).')
  }

  if (!accountType || !String(accountType).trim()) {
    errors.push('Account type is required.')
  } else if (!VALID_ACCOUNT_TYPES.includes(String(accountType).trim().toLowerCase())) {
    errors.push(`Account type must be one of: ${VALID_ACCOUNT_TYPES.join(', ')}.`)
  }

  return errors
}

export { VALID_ACCOUNT_TYPES }
