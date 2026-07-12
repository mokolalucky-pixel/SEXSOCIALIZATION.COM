import { createAgreementDraft, normalizeAgreementDraft } from '../_lib/agreement.js'
import { requireUser } from '../_lib/auth.js'
import { getSql } from '../_lib/db.js'
import { readJson, requireMethod, sendError, sendJson } from '../_lib/http.js'

export default async function handler(req, res) {
  try {
    requireMethod(req, ['GET', 'PUT'])
    const user = await requireUser(req)
    const db = getSql()

    if (req.method === 'GET') {
      const [row] = await db`SELECT draft FROM agreement_drafts WHERE user_id = ${user.id} LIMIT 1`
      const draft = row?.draft || createAgreementDraft(user)
      sendJson(res, 200, { agreement: draft })
      return
    }

    const { agreement } = await readJson(req)
    const normalizedAgreement = normalizeAgreementDraft(user, agreement)

    await db`
      INSERT INTO agreement_drafts (user_id, draft, updated_at)
      VALUES (${user.id}, ${JSON.stringify(normalizedAgreement)}::jsonb, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET draft = EXCLUDED.draft, updated_at = NOW()
    `

    sendJson(res, 200, { agreement: normalizedAgreement })
  } catch (error) {
    sendError(res, error)
  }
}
