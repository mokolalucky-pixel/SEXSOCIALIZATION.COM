import { requireUser } from '../_lib/auth.js'
import { readJson, requireMethod, sendError, sendJson } from '../_lib/http.js'

function getPaystackConfig() {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  const planCodes = [process.env.PAYSTACK_MONTHLY_PLAN_CODE, process.env.PAYSTACK_ANNUAL_PLAN_CODE].filter(Boolean)
  if (!secretKey || planCodes.length === 0) {
    throw Object.assign(new Error('Payment provider is not configured.'), { statusCode: 503 })
  }
  return { secretKey, planCodes }
}

async function paystackRequest(path, body) {
  const { secretKey } = getPaystackConfig()
  const response = await fetch(`https://api.paystack.co${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok || !result.status) {
    throw Object.assign(new Error(result.message || 'Payment request failed.'), { statusCode: response.status >= 500 ? 502 : 400 })
  }
  return result.data
}

export default async function handler(req, res) {
  try {
    requireMethod(req, ['POST'])
    const user = await requireUser(req)
    const { planCode } = await readJson(req)
    if (!planCode) throw Object.assign(new Error('planCode is required.'), { statusCode: 400 })

    const { planCodes } = getPaystackConfig()
    if (!planCodes.includes(planCode)) throw Object.assign(new Error('Invalid subscription plan.'), { statusCode: 400 })

    const origin = `https://${req.headers.host}`
    const transaction = await paystackRequest('/transaction/initialize', {
      email: user.email,
      plan: planCode,
      callback_url: `${origin}/dashboard?payment=success`,
      metadata: { user_id: user.id, user_email: user.email },
    })
    sendJson(res, 200, { url: transaction.authorization_url, reference: transaction.reference })
  } catch (error) {
    sendError(res, error)
  }
}
