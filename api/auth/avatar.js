import { del, get, put } from '@vercel/blob'
import { Readable } from 'node:stream'
import { requireUser, publicUser } from '../_lib/auth.js'
import { ensureSchema, getSql } from '../_lib/db.js'
import { requireMethod, sendError, sendJson } from '../_lib/http.js'

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

function hasValidImageSignature(buffer, contentType) {
  if (contentType === 'image/jpeg') return buffer.length >= 3 && buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
  if (contentType === 'image/png') return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  if (contentType === 'image/gif') return buffer.length >= 6 && (buffer.subarray(0, 6).equals(Buffer.from('GIF87a')) || buffer.subarray(0, 6).equals(Buffer.from('GIF89a')))
  if (contentType === 'image/webp') return buffer.length >= 12 && buffer.subarray(0, 4).equals(Buffer.from('RIFF')) && buffer.subarray(8, 12).equals(Buffer.from('WEBP'))
  return false
}

export const config = {
  api: { bodyParser: false },
}

async function getUpdatedUser(userId) {
  const [updatedUser] = await getSql()`
    SELECT id, email, display_name, gender, region, avatar_url
    FROM users WHERE id = ${userId} LIMIT 1
  `

  return publicUser(updatedUser)
}

async function removeBlob(url) {
  if (!url) return

  try {
    await del(url)
  } catch (error) {
    console.error('Failed to remove avatar blob', error)
  }
}

export default async function handler(req, res) {
  try {
    requireMethod(req, ['GET', 'PUT', 'DELETE'])
    await ensureSchema()
    const user = await requireUser(req)

    if (req.method === 'GET') {
      const [account] = await getSql()`SELECT avatar_url FROM users WHERE id = ${user.id} LIMIT 1`
      if (!account?.avatar_url) throw Object.assign(new Error('Profile picture not found.'), { statusCode: 404 })
      const { stream, blob } = await get(account.avatar_url, { access: 'private' })
      res.setHeader('Content-Type', blob.contentType || 'application/octet-stream')
      res.setHeader('Cache-Control', 'private, max-age=3600')
      Readable.fromWeb(stream).pipe(res)
      return
    }

    if (req.method === 'DELETE') {
      await getSql()`UPDATE users SET avatar_url = NULL WHERE id = ${user.id}`
      await removeBlob(user.avatar_url)
      sendJson(res, 200, { user: await getUpdatedUser(user.id) })
      return
    }

    const contentType = req.headers['content-type'] || ''

    if (!ALLOWED_TYPES.has(contentType)) {
      throw Object.assign(new Error('Upload a JPEG, PNG, WebP, or GIF image.'), { statusCode: 400 })
    }

    const contentLength = Number(req.headers['content-length'] || 0)

    if (contentLength > MAX_SIZE) {
      throw Object.assign(new Error('Image must be 5 MB or smaller after compression.'), { statusCode: 400 })
    }

    const chunks = []
    let totalSize = 0

    for await (const chunk of req) {
      totalSize += chunk.length

      if (totalSize > MAX_SIZE) {
        throw Object.assign(new Error('Image must be 5 MB or smaller after compression.'), { statusCode: 400 })
      }

      chunks.push(chunk)
    }

    const buffer = Buffer.concat(chunks)

    if (!hasValidImageSignature(buffer, contentType)) {
      throw Object.assign(new Error('Uploaded file does not match the selected image type.'), { statusCode: 400 })
    }

    const extension = contentType.split('/')[1] === 'jpeg' ? 'jpg' : contentType.split('/')[1]
    const filename = `avatars/${user.id}.${extension}`

    const blob = await put(filename, buffer, {
      access: 'private',
      contentType,
      addRandomSuffix: true,
    })

    await getSql()`UPDATE users SET avatar_url = ${blob.url} WHERE id = ${user.id}`
    await removeBlob(user.avatar_url)

    sendJson(res, 200, { user: await getUpdatedUser(user.id) })
  } catch (error) {
    sendError(res, error)
  }
}
