import { randomUUID } from 'node:crypto'
import { requireUser } from '../_lib/auth.js'
import { getSql } from '../_lib/db.js'
import { hashInviteToken } from '../_lib/invites.js'
import { readJson, requireMethod, sendError, sendJson } from '../_lib/http.js'

const MAX_SMS_PER_HOUR = 5
const E164_PHONE_NUMBER = /^\+[1-9]\d{7,14}$/

function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_FROM_NUMBER

  if (!accountSid || !authToken || !fromNumber) {
    throw Object.assign(new Error('SMS provider is not configured.'), { statusCode: 503 })
  }

  return { accountSid, authToken, fromNumber }
}

function inviteTokenFromUrl(value) {
  try {
    const url = new URL(String(value || ''))
    const match = url.pathname.match(/^\/invite\/([^/]+)$/)

    if (!match) {
      throw new Error('Missing invite token.')
    }

    return decodeURIComponent(match[1])
  } catch {
    throw Object.assign(new Error('A valid invite link is required.'), { statusCode: 400 })
  }
}

function requestOrigin(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'https'
  return `${protocol}://${req.headers.host}`
}

async function reserveSmsSend(userId) {
  const [attempt] = await getSql()`
    INSERT INTO sms_send_attempts (id, user_id)
    SELECT ${randomUUID()}, ${userId}
    WHERE (
      SELECT COUNT(*)
      FROM sms_send_attempts
      WHERE user_id = ${userId}
        AND created_at > NOW() - INTERVAL '1 hour'
    ) < ${MAX_SMS_PER_HOUR}
    RETURNING id
  `

  if (!attempt) {
    throw Object.assign(new Error(`SMS limit reached. Try again in an hour.`), { statusCode: 429 })
  }
}

async function sendTwilioSms({ to, body }) {
  const { accountSid, authToken, fromNumber } = getTwilioConfig()
  const payload = new URLSearchParams({ To: to, From: fromNumber, Body: body })
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload,
  })
  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = result.message || 'SMS provider rejected the message.'
    throw Object.assign(new Error(message), { statusCode: response.status >= 500 ? 502 : 400 })
  }

  return result
}

export default async function handler(req, res) {
  try {
    requireMethod(req, ['POST'])
    const user = await requireUser(req)
    const { inviteUrl } = await readJson(req)
    const token = inviteTokenFromUrl(inviteUrl)
    const [invite] = await getSql()`
      SELECT recipient_contact
      FROM partner_invites
      WHERE owner_user_id = ${user.id}
        AND token_hash = ${hashInviteToken(token)}
        AND status = 'pending'
        AND delivery_method = 'sms'
        AND expires_at > NOW()
      LIMIT 1
    `

    if (!invite || !E164_PHONE_NUMBER.test(invite.recipient_contact)) {
      throw Object.assign(new Error('No eligible SMS invite was found.'), { statusCode: 404 })
    }

    await reserveSmsSend(user.id)
    const canonicalInviteUrl = `${requestOrigin(req)}/invite/${encodeURIComponent(token)}`
    const sms = await sendTwilioSms({
      to: invite.recipient_contact,
      body: `Use this private invite link to connect with me on SEXSOCIALIZATION.COM: ${canonicalInviteUrl}`,
    })

    sendJson(res, 202, { message: { id: sms.sid, status: sms.status, to: invite.recipient_contact } })
  } catch (error) {
    sendError(res, error)
  }
}
