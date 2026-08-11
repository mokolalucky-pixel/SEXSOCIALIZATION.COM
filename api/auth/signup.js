import { createHash, randomUUID } from 'node:crypto'
import { createUserRecord, emailPattern, normalizeEmail, publicUser } from '../_lib/auth.js'
import { ensureSchema, getSql } from '../_lib/db.js'
import { sendVerificationEmail } from '../_lib/email.js'
import { createVerificationRecord } from '../_lib/verification.js'
import { readJson, requireMethod, sendError, sendJson } from '../_lib/http.js'

export default async function handler(req, res) {
  try {
    requireMethod(req, ['POST'])
    await ensureSchema()

    const { email: rawEmail, name, password, gender: rawGender, region: rawRegion, referralToken, acceptedTerms, termsVersion, privacyVersion } = await readJson(req)
    if (acceptedTerms !== true || termsVersion !== '2026-07-15' || privacyVersion !== '2026-07-15') {
      throw Object.assign(new Error('You must accept the current Terms of Service and Privacy Policy.'), { statusCode: 400 })
    }

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

    const [hold] = await getSql()`SELECT available_after FROM deleted_account_holds WHERE email = ${email}`
    if (hold && new Date(hold.available_after).getTime() > Date.now()) {
      throw Object.assign(new Error('This account can be registered again after the 30-day separation hold.'), { statusCode: 403 })
    }
    if (hold) await getSql()`DELETE FROM deleted_account_holds WHERE email = ${email}`
    const [referral] = referralToken ? await getSql()`
      SELECT referrer_user_id FROM referral_invites WHERE token_hash = ${createHash('sha256').update(String(referralToken)).digest('base64url')} LIMIT 1` : []
    const userRecord = createUserRecord({ email, displayName, password, gender, region })

    try {
      await getSql()`
        INSERT INTO users (id, email, display_name, password_hash, gender, region, verified, referred_by_user_id)
        VALUES (${userRecord.id}, ${userRecord.email}, ${userRecord.displayName}, ${userRecord.passwordHash}, ${userRecord.gender}, ${userRecord.region}, FALSE, ${referral?.referrer_user_id || null})
      `
    } catch (error) {
      if (error.message?.includes('duplicate key') || error.code === '23505') {
        throw Object.assign(new Error('An account already exists for this email address.'), { statusCode: 409 })
      }

      throw error
    }

    await getSql()`INSERT INTO policy_acceptances (id, user_id, terms_version, privacy_version)
      VALUES (${randomUUID()}, ${userRecord.id}, ${termsVersion}, ${privacyVersion})`
    await getSql()`INSERT INTO compliance_audit_events (id, user_id, event_type, metadata)
      VALUES (${randomUUID()}, ${userRecord.id}, 'policy_accepted', ${JSON.stringify({ termsVersion, privacyVersion })}::jsonb)`

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
