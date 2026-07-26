import { randomUUID } from 'node:crypto'
import { requireUser } from '../../_lib/auth.js'
import { ensureSchema, getSql } from '../../_lib/db.js'
import { isPremiumStatus } from '../../_lib/premium.js'
import { requireMethod, readJson, sendError, sendJson } from '../../_lib/http.js'

const CIRCLE_TYPES = new Set(['womens', 'mens', 'mixed'])

async function requireMembership(db, userId, circleType) {
  if (!CIRCLE_TYPES.has(circleType)) throw Object.assign(new Error('Unknown circle type.'), { statusCode: 400 })
  const [membership] = await db`SELECT id FROM community_circle_members WHERE circle_type = ${circleType} AND user_id = ${userId} LIMIT 1`
  if (!membership) throw Object.assign(new Error('Join this circle before viewing its topics.'), { statusCode: 403 })
}

async function postsForViewer(db, userId, circleType) {
  const posts = await db`
    SELECT circle_posts.id, circle_posts.body, circle_posts.created_at, users.display_name,
      COALESCE(reactions.count, 0)::int AS reaction_count,
      EXISTS(SELECT 1 FROM circle_reactions WHERE post_id = circle_posts.id AND user_id = ${userId}) AS reacted
    FROM circle_posts JOIN users ON users.id = circle_posts.author_user_id
    LEFT JOIN (SELECT post_id, COUNT(*) AS count FROM circle_reactions GROUP BY post_id) reactions ON reactions.post_id = circle_posts.id
    WHERE circle_posts.circle_type = ${circleType}
    ORDER BY circle_posts.created_at DESC LIMIT 50`
  const comments = await db`
    SELECT circle_comments.id, circle_comments.post_id, circle_comments.body, circle_comments.created_at, users.display_name
    FROM circle_comments JOIN users ON users.id = circle_comments.author_user_id
    WHERE circle_comments.post_id IN (SELECT id FROM circle_posts WHERE circle_type = ${circleType})
    ORDER BY circle_comments.created_at ASC`
  return posts.map((post) => ({ id: post.id, body: post.body, createdAt: post.created_at, authorName: post.display_name, reactionCount: post.reaction_count, reacted: post.reacted, comments: comments.filter((comment) => comment.post_id === post.id).map((comment) => ({ id: comment.id, body: comment.body, createdAt: comment.created_at, authorName: comment.display_name })) }))
}

export default async function handler(req, res) {
  try {
    requireMethod(req, ['GET', 'POST'])
    const user = await requireUser(req)
    await ensureSchema(); const db = getSql()
    const requestBody = req.method === 'POST' ? await readJson(req) : null
    const circleType = req.method === 'GET' ? String(req.query.circleType || '') : String(requestBody.circleType || '')
    await requireMembership(db, user.id, circleType)
    const [account] = await db`SELECT subscription_status FROM users WHERE id = ${user.id}`
    const premium = isPremiumStatus(account?.subscription_status)
    if (req.method === 'GET') {
      sendJson(res, 200, { posts: await postsForViewer(db, user.id, circleType), canPost: premium, canComment: premium, canReact: premium || circleType === 'mixed' }); return
    }
    if (!premium) throw Object.assign(new Error('Premium membership is required to start a topic.'), { statusCode: 403 })
    const content = String(requestBody.body || '').trim()
    if (content.length < 1 || content.length > 2000) throw Object.assign(new Error('Topic must be between 1 and 2000 characters.'), { statusCode: 400 })
    await db`INSERT INTO circle_posts (id, circle_type, author_user_id, body) VALUES (${randomUUID()}, ${circleType}, ${user.id}, ${content})`
    sendJson(res, 201, { posts: await postsForViewer(db, user.id, circleType) })
  } catch (error) { sendError(res, error) }
}
