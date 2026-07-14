import { createSession, emailPattern, normalizeEmail, publicUser, verifyPassword } from '../_lib/auth.js'
import { ensureSchema, getSql } from '../_lib/db.js'
import { readJson, requireMethod, sendError, sendJson } from '../_lib/http.js'

export default async function handler(req, res) {
  try {
    requireMethod(req, ['POST'])
    await ensureSchema()

    const { email: rawEmail, password } = await readJson(req)
    const email = normalizeEmail(rawEmail)

    if (!emailPattern.test(email)) {
      throw Object.assign(new Error('Enter a valid email address.'), { statusCode: 400 })
    }

    if (String(password || '').length < 8) {
      throw Object.assign(new Error('Password must contain at least 8 characters.'), { statusCode: 400 })
    }

    const [user] = await getSql()`
      SELECT id, email, display_name, password_hash
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `

    if (!user) {
      throw Object.assign(new Error('No account found for this email address. Sign up first.'), { statusCode: 401 })
    }

    if (!verifyPassword(password, user.password_hash)) {
      throw Object.assign(new Error('Incorrect password. Please try again.'), { statusCode: 401 })
    }

    await createSession(req, res, user.id)
    sendJson(res, 200, { user: publicUser(user) })
  } catch (error) {
    sendError(res, error)
  }
}
