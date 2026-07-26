import { randomBytes, createHash, randomUUID } from 'node:crypto'
import { requireUser } from '../_lib/auth.js'
import { ensureSchema, getSql } from '../_lib/db.js'
import { isAdminEmail } from '../_lib/admin.js'
import { requirePremium } from '../_lib/premium.js'
import { requireMethod, sendError, sendJson } from '../_lib/http.js'

export default async function handler(req, res) {
  try {
    requireMethod(req, ['POST'])
    const user = await requireUser(req)
    await ensureSchema()
    const db = getSql()
    const [record] = await db`SELECT subscription_status FROM users WHERE id = ${user.id}`
    requirePremium(record)
    const token = randomBytes(32).toString('base64url')
    await db`INSERT INTO referral_invites (id, referrer_user_id, token_hash, is_admin_referral)
      VALUES (${randomUUID()}, ${user.id}, ${createHash('sha256').update(token).digest('base64url')}, ${isAdminEmail(user.email)})`
    const origin = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`
    sendJson(res, 201, { referralUrl: `${origin}/signup?ref=${encodeURIComponent(token)}` })
  } catch (error) { sendError(res, error) }
}
