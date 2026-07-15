import { createHmac } from 'node:crypto'
import { getSql, ensureSchema } from '../_lib/db.js'
import { sendError, sendJson } from '../_lib/http.js'

function getWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    throw Object.assign(new Error('Webhook secret is not configured.'), { statusCode: 503 })
  }
  return secret
}

function verifyStripeSignature(rawBody, signatureHeader, secret) {
  const parts = Object.fromEntries(
    String(signatureHeader || '')
      .split(',')
      .map((pair) => pair.split('='))
  )

  const timestamp = parts.t
  const signature = parts.v1

  if (!timestamp || !signature) {
    throw Object.assign(new Error('Invalid signature.'), { statusCode: 400 })
  }

  // Reject events older than 5 minutes
  const age = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (age > 300) {
    throw Object.assign(new Error('Webhook timestamp too old.'), { statusCode: 400 })
  }

  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')

  if (expected !== signature) {
    throw Object.assign(new Error('Signature verification failed.'), { statusCode: 400 })
  }
}

async function readRawBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      throw Object.assign(new Error('Method not allowed.'), { statusCode: 405 })
    }

    const rawBody = await readRawBody(req)
    const webhookSecret = getWebhookSecret()

    verifyStripeSignature(rawBody, req.headers['stripe-signature'], webhookSecret)

    const event = JSON.parse(rawBody)

    await ensureSchema()
    const db = getSql()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.user_id || session.client_reference_id

        if (userId) {
          await db`
            UPDATE users
            SET subscription_status = 'active',
                stripe_customer_id = ${session.customer},
                subscription_id = ${session.subscription},
                subscribed_at = NOW()
            WHERE id = ${userId}
          `
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        await db`
          UPDATE users
          SET subscription_status = ${subscription.status}
          WHERE stripe_customer_id = ${subscription.customer}
        `
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        await db`
          UPDATE users
          SET subscription_status = 'cancelled'
          WHERE stripe_customer_id = ${subscription.customer}
        `
        break
      }

      default:
        // Unhandled event type — acknowledge receipt
        break
    }

    sendJson(res, 200, { received: true })
  } catch (error) {
    sendError(res, error)
  }
}
