import { getCurrentUser, publicUser } from '../_lib/auth.js'
import { requireMethod, sendError, sendJson } from '../_lib/http.js'

export default async function handler(req, res) {
  try {
    requireMethod(req, ['GET'])
    const user = await getCurrentUser(req)
    sendJson(res, 200, { user: publicUser(user) })
  } catch (error) {
    sendError(res, error)
  }
}
