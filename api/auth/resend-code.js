import { ensureSchema, getSql } from '../_lib/db.js'
import { sendVerificationEmail } from '../_lib/email.js'
import { createVerificationRecord } from '../_lib/verification.js'
import { readJson, requireMethod, sendError, sendJson } from '../_lib/http.js'

export default async function handler(req, res) {
  try {
    requireMethod(req, ['POST'])
    await ensureSchema()

    const { userId } = await readJson(req)

    if (!userId) {
      throw Object.assign(new Error('User ID is required.'), { statusCode: 400 })
    }

    const [user] = await getSql()`
      SELECT id, email, verified FROM users WHERE id = ${userId} LIMIT 1
    `

    if (!user) {
      throw Object.assign(new Error('Account not found.'), { statusCode: 404 })
    }

    if (user.verified) {
      throw Object.assign(new Error('This account is already verified.'), { statusCode: 400 })
    }

    const code = await createVerificationRecord(user.id)
    const emailResult = await sendVerificationEmail(user.email, code)

    sendJson(res, 200, {
      emailSent: emailResult.sent,
      message: emailResult.sent
        ? 'A new verification code has been sent.'
        : emailResult.reason || 'Check your email for the verification code.',
    })
  } catch (error) {
    sendError(res, error)
  }
}
