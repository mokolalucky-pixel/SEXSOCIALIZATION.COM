import { createUserRecord, emailPattern, normalizeEmail, publicUser } from '../_lib/auth.js'
import { ensureSchema, getSql } from '../_lib/db.js'
import { sendVerificationEmail } from '../_lib/email.js'
import { createVerificationRecord } from '../_lib/verification.js'
import { readJson, requireMethod, sendError, sendJson } from '../_lib/http.js'

export default async function handler(req, res) {
  try {
    requireMethod(req, ['POST'])
    await ensureSchema()

    const { email: rawEmail, name, password, gender: rawGender, region: rawRegion } = await readJson(req)
    const email = normalizeEmail(rawEmail)
    const displayName = String(name || '').trim()

    if (!emailPattern.test(email)) {
      throw Object.assign(new Error('Enter a valid email address.'), { statusCode: 400 })
    }

    if (displayName.length < 2) {
      throw Object.assign(new Error('Display name must contain at least 2 characters.'), { statusCode: 400 })
    }

    if (String(password || '').length < 8) {
      throw Object.assign(new Error('Password must contain at least 8 characters.'), { statusCode: 400 })
    }

    const allowedGenders = new Set(['female', 'male', 'non-binary', 'prefer-not-to-say'])
    const gender = allowedGenders.has(String(rawGender || '').toLowerCase()) ? String(rawGender).toLowerCase() : null
    const region = String(rawRegion || '').trim().slice(0, 100) || null

    const userRecord = createUserRecord({ email, displayName, password, gender, region })

    try {
      await getSql()`
        INSERT INTO users (id, email, display_name, password_hash, gender, region, verified)
        VALUES (${userRecord.id}, ${userRecord.email}, ${userRecord.displayName}, ${userRecord.passwordHash}, ${userRecord.gender}, ${userRecord.region}, FALSE)
      `
    } catch (error) {
      if (error.message?.includes('duplicate key') || error.code === '23505') {
        throw Object.assign(new Error('An account already exists for this email address.'), { statusCode: 409 })
      }

      throw error
    }

    const code = await createVerificationRecord(userRecord.id)
    const emailResult = await sendVerificationEmail(email, code)

    sendJson(res, 201, {
      requiresVerification: true,
      userId: userRecord.id,
      email,
      emailSent: emailResult.sent,
      message: emailResult.sent
        ? 'A verification code has been sent to your email address.'
        : 'Account created. ' + (emailResult.reason || 'Check your email for the verification code.'),
    })
  } catch (error) {
    sendError(res, error)
  }
}
