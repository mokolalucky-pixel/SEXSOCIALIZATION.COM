import { createSession, emailPattern, normalizeEmail, publicUser, verifyPassword } from '../_lib/auth.js'
import { ensureSchema, getSql } from '../_lib/db.js'
import { readJson, requireMethod, sendError, sendJson } from '../_lib/http.js'

export default async function handler(req, res) {
  try {
    requireMethod(req, ['POST'])
    await ensureSchema()

    const { email: rawEmail, password } = await readJson(req)
    const email = normalizeEmail(rawEmail)

    if (!emailPattern.test(email) || String(password || '').length < 8) {
      throw Object.assign(new Error('Invalid email or password.'), { statusCode: 401 })
    }

    const [user] = await getSql()`
      SELECT id, email, display_name, password_hash
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `

    if (!user || !verifyPassword(password, user.password_hash)) {
      throw Object.assign(new Error('Invalid email or password.'), { statusCode: 401 })
    }

    await createSession(req, res, user.id)
    sendJson(res, 200, { user: publicUser(user) })
  } catch (error) {
    sendError(res, error)
  }
}
