import { requireUser } from '../_lib/auth.js'
import { readJson, requireMethod, sendError, sendJson } from '../_lib/http.js'

function getStripeConfig() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw Object.assign(new Error('Payment provider is not configured.'), { statusCode: 503 })
  }
  return { secretKey }
}

async function stripeRequest(path, body) {
  const { secretKey } = getStripeConfig()

  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body),
  })

  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = result.error?.message || 'Payment request failed.'
    throw Object.assign(new Error(message), {
      statusCode: response.status >= 500 ? 502 : 400,
    })
  }

  return result
}

export default async function handler(req, res) {
  try {
    requireMethod(req, ['POST'])
    const user = await requireUser(req)
    const { priceId } = await readJson(req)

    if (!priceId) {
      throw Object.assign(new Error('priceId is required.'), { statusCode: 400 })
    }

    const origin = `https://${req.headers.host}`

    const session = await stripeRequest('/checkout/sessions', {
      mode: 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      success_url: `${origin}/dashboard?payment=success`,
      cancel_url: `${origin}/dashboard?payment=cancelled`,
      customer_email: user.email,
      client_reference_id: user.id,
      'metadata[user_id]': user.id,
      'metadata[user_email]': user.email,
    })

    sendJson(res, 200, { url: session.url, sessionId: session.id })
  } catch (error) {
    sendError(res, error)
  }
}
