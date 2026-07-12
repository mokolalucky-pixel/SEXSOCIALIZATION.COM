export async function readJson(req) {
  const chunks = []

  for await (const chunk of req) {
    chunks.push(chunk)
  }

  const rawBody = Buffer.concat(chunks).toString('utf8')

  if (!rawBody) {
    return {}
  }

  try {
    return JSON.parse(rawBody)
  } catch {
    throw Object.assign(new Error('Invalid JSON body.'), { statusCode: 400 })
  }
}

export function sendJson(res, statusCode, payload, headers = {}) {
  Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value))
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.status(statusCode).json(payload)
}

export function sendError(res, error) {
  const statusCode = error.statusCode || 500
  const message = statusCode === 500 ? 'Something went wrong.' : error.message
  sendJson(res, statusCode, { error: message })
}

export function requireMethod(req, methods) {
  if (!methods.includes(req.method)) {
    throw Object.assign(new Error('Method not allowed.'), { statusCode: 405 })
  }
}
