/**
 * Minimal verification script for ZA payout validation rules.
 *
 * Run with:
 *   node scripts/verify-za-payout-validation.mjs
 */

// Inline the validation rules (mirrors api/_lib/zaPayoutValidation.js)
const VALID_ACCOUNT_TYPES = ['cheque', 'savings', 'transmission']

function validateZaPayoutDetails({ accountHolder, bankName, accountNumber, branchCode, accountType }) {
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

// --- Test cases ---
let passed = 0
let failed = 0

function expect(description, errors, expectedEmpty) {
  const ok = expectedEmpty ? errors.length === 0 : errors.length > 0
  if (ok) {
    console.log(`  ✅ ${description}`)
    passed++
  } else {
    console.error(`  ❌ ${description}`)
    if (!expectedEmpty) console.error(`     Expected errors but got none`)
    if (expectedEmpty) console.error(`     Got unexpected errors: ${errors.join('; ')}`)
    failed++
  }
}

console.log('\nZA payout validation checks\n')

const valid = {
  accountHolder: 'Mokola Lucky Shai',
  bankName: 'TymeBank',
  accountNumber: '1234567890',
  branchCode: '678910',
  accountType: 'cheque',
}

console.log('Valid inputs:')
expect('Valid complete details', validateZaPayoutDetails(valid), true)
expect('Account type "savings"', validateZaPayoutDetails({ ...valid, accountType: 'savings' }), true)
expect('Account type "transmission"', validateZaPayoutDetails({ ...valid, accountType: 'transmission' }), true)
expect('Account type case-insensitive', validateZaPayoutDetails({ ...valid, accountType: 'CHEQUE' }), true)
expect('Min account number 8 digits', validateZaPayoutDetails({ ...valid, accountNumber: '12345678' }), true)
expect('Max account number 16 digits', validateZaPayoutDetails({ ...valid, accountNumber: '1234567890123456' }), true)

console.log('\nInvalid inputs:')
expect('Missing account holder', validateZaPayoutDetails({ ...valid, accountHolder: '' }), false)
expect('Missing bank name', validateZaPayoutDetails({ ...valid, bankName: '' }), false)
expect('Missing account number', validateZaPayoutDetails({ ...valid, accountNumber: '' }), false)
expect('Account number too short (7 digits)', validateZaPayoutDetails({ ...valid, accountNumber: '1234567' }), false)
expect('Account number too long (17 digits)', validateZaPayoutDetails({ ...valid, accountNumber: '12345678901234567' }), false)
expect('Non-numeric account number', validateZaPayoutDetails({ ...valid, accountNumber: 'ABC12345' }), false)
expect('Missing branch code', validateZaPayoutDetails({ ...valid, branchCode: '' }), false)
expect('Branch code wrong length (5 digits)', validateZaPayoutDetails({ ...valid, branchCode: '12345' }), false)
expect('Branch code wrong length (7 digits)', validateZaPayoutDetails({ ...valid, branchCode: '1234567' }), false)
expect('Non-numeric branch code', validateZaPayoutDetails({ ...valid, branchCode: 'ABCDEF' }), false)
expect('Invalid account type', validateZaPayoutDetails({ ...valid, accountType: 'current' }), false)
expect('Missing account type', validateZaPayoutDetails({ ...valid, accountType: '' }), false)

console.log(`\n${passed} passed, ${failed} failed\n`)

if (failed > 0) {
  process.exit(1)
}
