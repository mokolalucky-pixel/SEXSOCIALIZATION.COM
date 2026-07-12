import { clearSession } from '../_lib/auth.js'
import { requireMethod, sendError, sendJson } from '../_lib/http.js'

export default async function handler(req, res) {
  try {
    requireMethod(req, ['POST'])
    await clearSession(req, res)
    sendJson(res, 200, { ok: true })
  } catch (error) {
    sendError(res, error)
  }
}
