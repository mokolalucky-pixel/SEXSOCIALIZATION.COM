import { randomBytes, randomUUID, pbkdf2Sync, timingSafeEqual, createHmac } from 'node:crypto'
import { ensureSchema, getSql } from './db.js'
import { isAdminEmail } from './admin.js'

const SESSION_COOKIE = 'sexsocialization_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14
const PASSWORD_ITERATIONS = 310000
const PASSWORD_KEY_LENGTH = 32
const PASSWORD_DIGEST = 'sha256'

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

export function publicUser(user) {
  if (!user) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    isAdmin: isAdminEmail(user.email),
  }
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString('base64url')
  const hash = pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEY_LENGTH, PASSWORD_DIGEST).toString('base64url')

  return `${PASSWORD_ITERATIONS}:${salt}:${hash}`
}

export function verifyPassword(password, storedHash) {
  const [iterations, salt, hash] = String(storedHash || '').split(':')

  if (!iterations || !salt || !hash) {
    return false
  }

  const expected = Buffer.from(hash, 'base64url')
  const actual = pbkdf2Sync(password, salt, Number(iterations), expected.length, PASSWORD_DIGEST)

  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

function hashSessionToken(token) {
  if (!process.env.SESSION_SECRET) {
    throw Object.assign(new Error('SESSION_SECRET is not configured.'), { statusCode: 500 })
  }

  return createHmac('sha256', process.env.SESSION_SECRET).update(token).digest('base64url')
}

function parseCookies(req) {
  return Object.fromEntries(
    String(req.headers.cookie || '')
      .split(';')
      .map((cookie) => cookie.trim())
      .filter(Boolean)
      .map((cookie) => {
        const separatorIndex = cookie.indexOf('=')

        if (separatorIndex === -1) {
          return [cookie, '']
        }

        return [cookie.slice(0, separatorIndex), decodeURIComponent(cookie.slice(separatorIndex + 1))]
      }),
  )
}

function cookieOptions(req, maxAgeSeconds) {
  const secure = process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https'

  return [
    `${SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
    secure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ')
}

export async function createSession(req, res, userId) {
  await ensureSchema()
  const db = getSql()
  const token = randomBytes(32).toString('base64url')
  const idHash = hashSessionToken(token)
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString()

  await db`INSERT INTO sessions (id_hash, user_id, expires_at) VALUES (${idHash}, ${userId}, ${expiresAt})`
  res.setHeader('Set-Cookie', cookieOptions(req, Math.floor(SESSION_TTL_MS / 1000)).replace(`${SESSION_COOKIE}=`, `${SESSION_COOKIE}=${encodeURIComponent(token)}`))
}

export async function clearSession(req, res) {
  await ensureSchema()
  const token = parseCookies(req)[SESSION_COOKIE]

  if (token) {
    await getSql()`DELETE FROM sessions WHERE id_hash = ${hashSessionToken(token)}`
  }

  res.setHeader('Set-Cookie', cookieOptions(req, 0))
}

export async function getCurrentUser(req) {
  await ensureSchema()
  const token = parseCookies(req)[SESSION_COOKIE]

  if (!token) {
    return null
  }

  const [user] = await getSql()`
    SELECT users.id, users.email, users.display_name
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.id_hash = ${hashSessionToken(token)}
      AND sessions.expires_at > NOW()
    LIMIT 1
  `

  return user || null
}

export async function requireUser(req) {
  const user = await getCurrentUser(req)

  if (!user) {
    throw Object.assign(new Error('Authentication required.'), { statusCode: 401 })
  }

  return user
}

export function createUserRecord({ email, displayName, password }) {
  return {
    id: randomUUID(),
    email,
    displayName,
    passwordHash: hashPassword(password),
  }
}
