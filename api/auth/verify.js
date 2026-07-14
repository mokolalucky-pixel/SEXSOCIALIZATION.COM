import { createSession, publicUser } from '../_lib/auth.js'
import { ensureSchema, getSql } from '../_lib/db.js'
import { verifyCode } from '../_lib/verification.js'
import { readJson, requireMethod, sendError, sendJson } from '../_lib/http.js'

export default async function handler(req, res) {
  try {
    requireMethod(req, ['POST'])
    await ensureSchema()

    const { userId, code } = await readJson(req)

    if (!userId || !code) {
      throw Object.assign(new Error('User ID and verification code are required.'), { statusCode: 400 })
    }

    await verifyCode(userId, String(code).trim())

    const [user] = await getSql()`
      SELECT id, email, display_name, gender, region
      FROM users
      WHERE id = ${userId}
      LIMIT 1
    `

    if (!user) {
      throw Object.assign(new Error('Account not found.'), { statusCode: 404 })
    }

    await createSession(req, res, user.id)
    sendJson(res, 200, { user: publicUser(user) })
  } catch (error) {
    sendError(res, error)
  }
}
