import { createHash, randomInt, randomUUID } from 'node:crypto'
import { getSql } from './db.js'

const CODE_TTL_MS = 1000 * 60 * 10
const MAX_ATTEMPTS = 5

export function generateVerificationCode() {
  return String(randomInt(100000, 999999))
}

export function hashCode(code) {
  return createHash('sha256').update(String(code).trim()).digest('base64url')
}

export async function createVerificationRecord(userId) {
  const db = getSql()
  const code = generateVerificationCode()

  await db`DELETE FROM verification_codes WHERE user_id = ${userId}`

  await db`
    INSERT INTO verification_codes (id, user_id, code_hash, expires_at)
    VALUES (${randomUUID()}, ${userId}, ${hashCode(code)}, ${new Date(Date.now() + CODE_TTL_MS).toISOString()})
  `

  return code
}

export async function verifyCode(userId, code) {
  const db = getSql()
  const [record] = await db`
    SELECT id, code_hash, attempts, expires_at, used_at
    FROM verification_codes
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 1
  `

  if (!record) {
    throw Object.assign(new Error('No verification code found. Request a new one.'), { statusCode: 400 })
  }

  if (record.used_at) {
    throw Object.assign(new Error('This code has already been used.'), { statusCode: 400 })
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    throw Object.assign(new Error('Too many incorrect attempts. Request a new code.'), { statusCode: 429 })
  }

  if (new Date(record.expires_at).getTime() <= Date.now()) {
    throw Object.assign(new Error('This code has expired. Request a new one.'), { statusCode: 400 })
  }

  await db`UPDATE verification_codes SET attempts = attempts + 1 WHERE id = ${record.id}`

  if (record.code_hash !== hashCode(code)) {
    const remaining = MAX_ATTEMPTS - record.attempts - 1
    throw Object.assign(new Error(`Incorrect code. ${remaining} attempts remaining.`), { statusCode: 400 })
  }

  await db`UPDATE verification_codes SET used_at = NOW() WHERE id = ${record.id}`
  await db`UPDATE users SET verified = TRUE WHERE id = ${userId}`
}
