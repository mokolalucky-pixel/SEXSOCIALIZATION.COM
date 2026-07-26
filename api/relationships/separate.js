import { requireUser } from '../_lib/auth.js'
import { ensureSchema, getSql } from '../_lib/db.js'
import { requirePartnerForUser } from '../_lib/relationships.js'
import { requireMethod, sendError, sendJson } from '../_lib/http.js'

const HOLD_DAYS = 30

export default async function handler(req, res) {
  try {
    requireMethod(req, ['POST'])
    const user = await requireUser(req)
    await ensureSchema()
    const partner = await requirePartnerForUser(user.id)
    const db = getSql()
    const users = await db`SELECT id, email FROM users WHERE id = ${user.id} OR id = ${partner.partnerUserId}`
    const availableAfter = new Date(Date.now() + HOLD_DAYS * 24 * 60 * 60 * 1000).toISOString()
    for (const account of users) {
      await db`INSERT INTO deleted_account_holds (email, available_after) VALUES (${account.email}, ${availableAfter})
        ON CONFLICT (email) DO UPDATE SET available_after = EXCLUDED.available_after`
    }
    await db`DELETE FROM users WHERE id = ${user.id} OR id = ${partner.partnerUserId}`
    sendJson(res, 200, { deleted: true, availableAfter })
  } catch (error) { sendError(res, error) }
}
