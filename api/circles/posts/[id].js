import { randomUUID } from 'node:crypto'
import { requireUser } from '../../_lib/auth.js'
import { ensureSchema, getSql } from '../../_lib/db.js'
import { isPremiumStatus } from '../../_lib/premium.js'
import { requireMethod, readJson, sendError, sendJson } from '../../_lib/http.js'

function validatedBody(body, label, maxLength) {
  const content = String(body || '').trim()
  if (content.length < 1 || content.length > maxLength) throw Object.assign(new Error(`${label} must be between 1 and ${maxLength} characters.`), { statusCode: 400 })
  return content
}

export default async function handler(req, res) {
  try {
    requireMethod(req, ['POST'])
    const user = await requireUser(req)
    await ensureSchema(); const db = getSql(); const postId = String(req.query.id || '')
    const [post] = await db`SELECT id, circle_type, author_user_id FROM circle_posts WHERE id = ${postId} LIMIT 1`
    if (!post) throw Object.assign(new Error('Topic not found.'), { statusCode: 404 })
    const [access] = await db`SELECT users.subscription_status FROM users JOIN community_circle_members ON community_circle_members.user_id = users.id WHERE users.id = ${user.id} AND community_circle_members.circle_type = ${post.circle_type} LIMIT 1`
    if (!access) throw Object.assign(new Error('Join this circle before interacting.'), { statusCode: 403 })
    const { action, body, commentId } = await readJson(req)

    if (action === 'edit-post') {
      const content = validatedBody(body, 'Topic', 2000)
      const [updated] = await db`UPDATE circle_posts SET body = ${content}, edited_at = NOW() WHERE id = ${postId} AND author_user_id = ${user.id} RETURNING id`
      if (!updated) throw Object.assign(new Error('You can only edit your own topic.'), { statusCode: 403 })
      sendJson(res, 200, { updated: true }); return
    }
    if (action === 'delete-post') {
      const [deleted] = await db`DELETE FROM circle_posts WHERE id = ${postId} AND author_user_id = ${user.id} RETURNING id`
      if (!deleted) throw Object.assign(new Error('You can only delete your own topic.'), { statusCode: 403 })
      sendJson(res, 200, { deleted: true }); return
    }
    if (action === 'edit-comment') {
      const content = validatedBody(body, 'Comment', 1000)
      const [updated] = await db`UPDATE circle_comments SET body = ${content}, edited_at = NOW() WHERE id = ${String(commentId || '')} AND post_id = ${postId} AND author_user_id = ${user.id} RETURNING id`
      if (!updated) throw Object.assign(new Error('You can only edit your own comment.'), { statusCode: 403 })
      sendJson(res, 200, { updated: true }); return
    }
    if (action === 'delete-comment') {
      const [deleted] = await db`DELETE FROM circle_comments WHERE id = ${String(commentId || '')} AND post_id = ${postId} AND author_user_id = ${user.id} RETURNING id`
      if (!deleted) throw Object.assign(new Error('You can only delete your own comment.'), { statusCode: 403 })
      sendJson(res, 200, { deleted: true }); return
    }
    if (action === 'react') {
      if (!isPremiumStatus(access.subscription_status) && post.circle_type !== 'mixed') throw Object.assign(new Error('Premium membership is required to react outside the Mixed Circle.'), { statusCode: 403 })
      const [existing] = await db`SELECT post_id FROM circle_reactions WHERE post_id = ${postId} AND user_id = ${user.id} LIMIT 1`
      if (existing) await db`DELETE FROM circle_reactions WHERE post_id = ${postId} AND user_id = ${user.id}`
      else await db`INSERT INTO circle_reactions (post_id, user_id, reaction) VALUES (${postId}, ${user.id}, 'like')`
      sendJson(res, 200, { updated: true }); return
    }
    if (action === 'comment') {
      if (!isPremiumStatus(access.subscription_status)) throw Object.assign(new Error('Premium membership is required to comment.'), { statusCode: 403 })
      const content = validatedBody(body, 'Comment', 1000)
      await db`INSERT INTO circle_comments (id, post_id, author_user_id, body) VALUES (${randomUUID()}, ${postId}, ${user.id}, ${content})`
      sendJson(res, 201, { created: true }); return
    }
    throw Object.assign(new Error('Unknown interaction.'), { statusCode: 400 })
  } catch (error) { sendError(res, error) }
}
