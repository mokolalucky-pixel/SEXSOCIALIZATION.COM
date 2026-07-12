import { neon } from '@neondatabase/serverless'

let sql
let schemaReady

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw Object.assign(new Error('DATABASE_URL is not configured.'), { statusCode: 500 })
  }

  if (!sql) {
    sql = neon(process.env.DATABASE_URL)
  }

  return sql
}

export async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const db = getSql()

      await db`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        display_name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`

      await db`CREATE TABLE IF NOT EXISTS sessions (
        id_hash TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`

      await db`CREATE TABLE IF NOT EXISTS agreement_drafts (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        draft JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`

      await db`CREATE TABLE IF NOT EXISTS partner_invites (
        id TEXT PRIMARY KEY,
        owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        partner_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        token_hash TEXT UNIQUE NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        expires_at TIMESTAMPTZ NOT NULL,
        accepted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`

      await db`CREATE INDEX IF NOT EXISTS partner_invites_owner_user_id_idx
        ON partner_invites (owner_user_id, created_at DESC)`
    })()
  }

  await schemaReady
}
