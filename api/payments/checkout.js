import { requireUser } from '../_lib/auth.js'
import { readJson, requireMethod, sendError, sendJson } from '../_lib/http.js'

function getPaystackConfig() {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  const plans = { monthly: process.env.PAYSTACK_MONTHLY_PLAN_CODE, annual: process.env.PAYSTACK_ANNUAL_PLAN_CODE }
  if (!secretKey) throw Object.assign(new Error('PAYSTACK_SECRET_KEY is not configured.'), { statusCode: 503 })
  if (!plans.monthly || !plans.annual) throw Object.assign(new Error('Paystack subscription plan codes are not configured.'), { statusCode: 503 })
  return { secretKey, plans }
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
    const { plan } = await readJson(req)
    const { plans } = getPaystackConfig()
    const planCode = plan === 'monthly' ? plans.monthly : plan === 'annual' ? plans.annual : null
    if (!planCode) throw Object.assign(new Error('Invalid subscription plan.'), { statusCode: 400 })

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
