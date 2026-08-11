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
        gender TEXT,
        region TEXT,
        avatar_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`

      await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT`

      await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS region TEXT`

      await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`

      await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT FALSE`

      await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT`
      await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_id TEXT`
      await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_owner_id TEXT REFERENCES users(id) ON DELETE SET NULL`
      await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscribed_at TIMESTAMPTZ`
      await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL`
      await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS payout_bank_name TEXT`
      await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS payout_account_holder TEXT`
      await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS payout_account_number TEXT`
      await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS payout_branch_code TEXT`
      await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS payout_account_type TEXT`
      await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS payout_account_number_encrypted TEXT`
      await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS payout_branch_code_encrypted TEXT`

      await db`CREATE TABLE IF NOT EXISTS deleted_account_holds (
        email TEXT PRIMARY KEY,
        available_after TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`

      await db`CREATE TABLE IF NOT EXISTS referral_invites (
        id TEXT PRIMARY KEY,
        referrer_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        token_hash TEXT UNIQUE NOT NULL,
        is_admin_referral BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`

      await db`CREATE TABLE IF NOT EXISTS referral_commissions (
        id TEXT PRIMARY KEY,
        referred_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        beneficiary_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        payment_reference TEXT UNIQUE NOT NULL,
        amount NUMERIC(12,2) NOT NULL,
        currency TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`

      // Earnings & payout columns
      await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS earnings_balance NUMERIC(12,2) NOT NULL DEFAULT 0`
      await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS total_paid_out NUMERIC(12,2) NOT NULL DEFAULT 0`

      await db`CREATE TABLE IF NOT EXISTS verification_codes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        code_hash TEXT NOT NULL,
        attempts INT NOT NULL DEFAULT 0,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`

      await db`CREATE INDEX IF NOT EXISTS verification_codes_user_id_idx
        ON verification_codes (user_id, created_at DESC)`

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
        recipient_contact TEXT,
        delivery_method TEXT NOT NULL DEFAULT 'copy',
        status TEXT NOT NULL DEFAULT 'pending',
        expires_at TIMESTAMPTZ NOT NULL,
        accepted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`

      await db`ALTER TABLE partner_invites
        ADD COLUMN IF NOT EXISTS recipient_contact TEXT`

      await db`ALTER TABLE partner_invites
        ADD COLUMN IF NOT EXISTS delivery_method TEXT NOT NULL DEFAULT 'copy'`

      await db`CREATE INDEX IF NOT EXISTS partner_invites_owner_user_id_idx
        ON partner_invites (owner_user_id, created_at DESC)`

      await db`CREATE TABLE IF NOT EXISTS sms_send_attempts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`

      await db`CREATE INDEX IF NOT EXISTS sms_send_attempts_user_created_at_idx
        ON sms_send_attempts (user_id, created_at DESC)`

      await db`CREATE TABLE IF NOT EXISTS private_messages (
        id TEXT PRIMARY KEY,
        sender_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        recipient_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        body TEXT NOT NULL,
        edited_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`

      await db`ALTER TABLE private_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ`

      await db`CREATE INDEX IF NOT EXISTS private_messages_pair_created_at_idx
        ON private_messages (sender_user_id, recipient_user_id, created_at DESC)`

      await db`CREATE TABLE IF NOT EXISTS call_rooms (
        id TEXT PRIMARY KEY,
        owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        partner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider TEXT NOT NULL DEFAULT 'pending-provider',
        status TEXT NOT NULL DEFAULT 'ready',
        room_url TEXT,
        invite_id TEXT REFERENCES partner_invites(id) ON DELETE CASCADE,
        room_name TEXT,
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`

      await db`ALTER TABLE call_rooms ADD COLUMN IF NOT EXISTS invite_id TEXT REFERENCES partner_invites(id) ON DELETE CASCADE`
      await db`ALTER TABLE call_rooms ADD COLUMN IF NOT EXISTS room_name TEXT`
      await db`ALTER TABLE call_rooms ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ`

      await db`CREATE INDEX IF NOT EXISTS call_rooms_owner_created_at_idx
        ON call_rooms (owner_user_id, created_at DESC)`

      await db`CREATE INDEX IF NOT EXISTS call_rooms_invite_expires_at_idx
        ON call_rooms (invite_id, expires_at DESC)`

      await db`CREATE TABLE IF NOT EXISTS call_room_creation_attempts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`

      await db`CREATE INDEX IF NOT EXISTS call_room_creation_attempts_user_created_at_idx
        ON call_room_creation_attempts (user_id, created_at DESC)`

      await db`CREATE TABLE IF NOT EXISTS moderation_reports (
        id TEXT PRIMARY KEY,
        reporter_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reported_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        target_type TEXT NOT NULL,
        target_id TEXT,
        reason TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        admin_note TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`

      await db`CREATE INDEX IF NOT EXISTS moderation_reports_status_created_at_idx
        ON moderation_reports (status, created_at DESC)`

      await db`CREATE TABLE IF NOT EXISTS circles (
        id TEXT PRIMARY KEY,
        owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`

      await db`CREATE INDEX IF NOT EXISTS circles_owner_created_at_idx
        ON circles (owner_user_id, created_at DESC)`

      await db`CREATE TABLE IF NOT EXISTS circle_contacts (
        id TEXT PRIMARY KEY,
        circle_id TEXT NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
        owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        display_name TEXT NOT NULL,
        contact TEXT NOT NULL,
        relationship TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`

      await db`CREATE INDEX IF NOT EXISTS circle_contacts_circle_created_at_idx
        ON circle_contacts (circle_id, created_at DESC)`

      await db`CREATE TABLE IF NOT EXISTS community_circle_members (
        id TEXT PRIMARY KEY,
        circle_type TEXT NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (circle_type, user_id)
      )`

      await db`CREATE INDEX IF NOT EXISTS community_circle_members_type_joined_idx
        ON community_circle_members (circle_type, joined_at DESC)`

      await db`CREATE TABLE IF NOT EXISTS circle_posts (
        id TEXT PRIMARY KEY,
        circle_type TEXT NOT NULL,
        author_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        body TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`

      await db`ALTER TABLE circle_posts ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ`

      await db`CREATE INDEX IF NOT EXISTS circle_posts_type_created_at_idx
        ON circle_posts (circle_type, created_at DESC)`

      await db`CREATE TABLE IF NOT EXISTS circle_comments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL REFERENCES circle_posts(id) ON DELETE CASCADE,
        author_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        body TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`

      await db`ALTER TABLE circle_comments ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ`

      await db`CREATE INDEX IF NOT EXISTS circle_comments_post_created_at_idx
        ON circle_comments (post_id, created_at ASC)`

      await db`CREATE TABLE IF NOT EXISTS circle_reactions (
        post_id TEXT NOT NULL REFERENCES circle_posts(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reaction TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (post_id, user_id)
      )`

      // Payout requests table
      await db`CREATE TABLE IF NOT EXISTS payout_requests (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount NUMERIC(12,2) NOT NULL,
        currency TEXT NOT NULL DEFAULT 'ZAR',
        bank_name TEXT NOT NULL,
        account_holder TEXT NOT NULL,
        account_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        processed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`

      await db`CREATE INDEX IF NOT EXISTS payout_requests_user_id_idx
        ON payout_requests (user_id, created_at DESC)`

      await db`CREATE INDEX IF NOT EXISTS payout_requests_status_idx
        ON payout_requests (status, created_at DESC)`

      await db`CREATE TABLE IF NOT EXISTS policy_acceptances (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        terms_version TEXT NOT NULL,
        privacy_version TEXT NOT NULL,
        accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`

      await db`CREATE INDEX IF NOT EXISTS policy_acceptances_user_created_idx
        ON policy_acceptances (user_id, accepted_at DESC)`

      await db`CREATE TABLE IF NOT EXISTS privacy_requests (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        request_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ
      )`

      await db`CREATE INDEX IF NOT EXISTS privacy_requests_user_created_idx
        ON privacy_requests (user_id, created_at DESC)`

      await db`CREATE TABLE IF NOT EXISTS compliance_audit_events (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        event_type TEXT NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`

      await db`CREATE INDEX IF NOT EXISTS compliance_audit_events_user_created_idx
        ON compliance_audit_events (user_id, created_at DESC)`

      // Admin-configured payout settings (single-row config table)
      await db`DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referral_commissions' AND column_name = 'stripe_invoice_id') THEN
          ALTER TABLE referral_commissions RENAME COLUMN stripe_invoice_id TO payment_reference;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payout_config' AND column_name = 'stripe_status') THEN
          ALTER TABLE payout_config RENAME COLUMN stripe_status TO payout_status;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payout_config' AND column_name = 'stripe_message') THEN
          ALTER TABLE payout_config RENAME COLUMN stripe_message TO payout_message;
        END IF;
      END $$`

      await db`CREATE TABLE IF NOT EXISTS payout_config (
        id TEXT PRIMARY KEY DEFAULT 'default',
        bank_name TEXT NOT NULL,
        account_holder TEXT NOT NULL,
        account_number TEXT NOT NULL,
        branch_code TEXT NOT NULL,
        account_type TEXT NOT NULL,
        country TEXT NOT NULL DEFAULT 'ZA',
        currency TEXT NOT NULL DEFAULT 'ZAR',
        payout_status TEXT NOT NULL DEFAULT 'manual',
        payout_message TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`

    })()
  }

  await schemaReady
}
