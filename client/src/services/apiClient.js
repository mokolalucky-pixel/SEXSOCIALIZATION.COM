async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = payload.error || `Request failed (${response.status}).`
    throw new Error(message)
  }

  return payload
}

export async function apiRequest(path, options = {}) {
  let response

  try {
    response = await fetch(path, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    })
  } catch {
    throw new Error('Unable to reach the server. Check your internet connection and try again.')
  }

  return parseResponse(response)
}
