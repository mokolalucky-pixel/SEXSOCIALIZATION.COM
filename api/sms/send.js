import { requireUser } from '../_lib/auth.js'
import { readJson, requireMethod, sendError, sendJson } from '../_lib/http.js'

const MAX_SMS_BODY_LENGTH = 1600
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

function normalizePhoneNumber(value) {
  return String(value || '').trim().replace(/[\s().-]/g, '')
}

function normalizeMessage(value) {
  return String(value || '').trim()
}

async function sendTwilioSms({ to, body }) {
  const { accountSid, authToken, fromNumber } = getTwilioConfig()
  const payload = new URLSearchParams({
    To: to,
    From: fromNumber,
    Body: body,
  })

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
    await requireUser(req)

    const { to, message } = await readJson(req)
    const recipient = normalizePhoneNumber(to)
    const body = normalizeMessage(message)

    if (!E164_PHONE_NUMBER.test(recipient)) {
      throw Object.assign(new Error('Use an E.164 phone number, for example +15551234567.'), { statusCode: 400 })
    }

    if (body.length < 1 || body.length > MAX_SMS_BODY_LENGTH) {
      throw Object.assign(new Error(`Message must be between 1 and ${MAX_SMS_BODY_LENGTH} characters.`), { statusCode: 400 })
    }

    const sms = await sendTwilioSms({ to: recipient, body })

    sendJson(res, 202, {
      message: {
        id: sms.sid,
        status: sms.status,
        to: recipient,
      },
    })
  } catch (error) {
    sendError(res, error)
  }
}
