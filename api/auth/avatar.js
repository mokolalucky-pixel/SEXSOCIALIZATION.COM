import { put } from '@vercel/blob'
import { requireUser, publicUser } from '../_lib/auth.js'
import { ensureSchema, getSql } from '../_lib/db.js'
import { requireMethod, sendError, sendJson } from '../_lib/http.js'

const MAX_SIZE = 2 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export const config = {
  api: { bodyParser: false },
}

export default async function handler(req, res) {
  try {
    requireMethod(req, ['PUT'])
    await ensureSchema()
    const user = await requireUser(req)

    const contentType = req.headers['content-type'] || ''

    if (!ALLOWED_TYPES.has(contentType)) {
      throw Object.assign(new Error('Upload a JPEG, PNG, WebP, or GIF image.'), { statusCode: 400 })
    }

    const contentLength = Number(req.headers['content-length'] || 0)

    if (contentLength > MAX_SIZE) {
      throw Object.assign(new Error('Image must be under 2 MB.'), { statusCode: 400 })
    }

    const chunks = []
    let totalSize = 0

    for await (const chunk of req) {
      totalSize += chunk.length

      if (totalSize > MAX_SIZE) {
        throw Object.assign(new Error('Image must be under 2 MB.'), { statusCode: 400 })
      }

      chunks.push(chunk)
    }

    const buffer = Buffer.concat(chunks)
    const extension = contentType.split('/')[1] === 'jpeg' ? 'jpg' : contentType.split('/')[1]
    const filename = `avatars/${user.id}.${extension}`

    const blob = await put(filename, buffer, {
      access: 'public',
      contentType,
      addRandomSuffix: true,
    })

    await getSql()`UPDATE users SET avatar_url = ${blob.url} WHERE id = ${user.id}`

    const [updatedUser] = await getSql()`
      SELECT id, email, display_name, gender, region, avatar_url
      FROM users WHERE id = ${user.id} LIMIT 1
    `

    sendJson(res, 200, { user: publicUser(updatedUser) })
  } catch (error) {
    sendError(res, error)
  }
}
