import { randomUUID } from 'node:crypto'
import { requireUser } from '../../_lib/auth.js'
import { ensureSchema, getSql } from '../../_lib/db.js'
import { isPremiumStatus } from '../../_lib/premium.js'
import { requireMethod, readJson, sendError, sendJson } from '../../_lib/http.js'

export default async function handler(req, res) {
  try {
    requireMethod(req, ['POST'])
    const user = await requireUser(req)
    await ensureSchema(); const db = getSql(); const postId = String(req.query.id || '')
    const [access] = await db`SELECT users.subscription_status FROM users JOIN community_circle_members ON community_circle_members.user_id = users.id WHERE users.id = ${user.id} AND community_circle_members.circle_type = 'mixed' LIMIT 1`
    if (!access) throw Object.assign(new Error('Join the Mixed Circle before interacting.'), { statusCode: 403 })
    if (!isPremiumStatus(access.subscription_status)) throw Object.assign(new Error('Premium membership is required to comment or react.'), { statusCode: 403 })
    const { action, body } = await readJson(req)
    const [post] = await db`SELECT id FROM circle_posts WHERE id = ${postId} AND circle_type = 'mixed' LIMIT 1`
    if (!post) throw Object.assign(new Error('Post not found.'), { statusCode: 404 })
    if (action === 'react') {
      const [existing] = await db`SELECT post_id FROM circle_reactions WHERE post_id = ${postId} AND user_id = ${user.id} LIMIT 1`
      if (existing) await db`DELETE FROM circle_reactions WHERE post_id = ${postId} AND user_id = ${user.id}`
      else await db`INSERT INTO circle_reactions (post_id, user_id, reaction) VALUES (${postId}, ${user.id}, 'like')`
      sendJson(res, 200, { updated: true }); return
    }
    if (action === 'comment') {
      const content = String(body || '').trim()
      if (content.length < 1 || content.length > 1000) throw Object.assign(new Error('Comment must be between 1 and 1000 characters.'), { statusCode: 400 })
      await db`INSERT INTO circle_comments (id, post_id, author_user_id, body) VALUES (${randomUUID()}, ${postId}, ${user.id}, ${content})`
      sendJson(res, 201, { created: true }); return
    }
    throw Object.assign(new Error('Unknown interaction.'), { statusCode: 400 })
  } catch (error) { sendError(res, error) }
}
