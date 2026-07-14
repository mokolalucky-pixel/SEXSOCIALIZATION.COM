export async function sendVerificationEmail(email, code) {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not configured. Verification code:', code)
    return { sent: false, reason: 'Email provider not configured.' }
  }

  const fromAddress = process.env.EMAIL_FROM || 'noreply@sexsocialization.com'

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [email],
      subject: 'Your SEXSOCIALIZATION.COM verification code',
      html: `<h2>Your verification code</h2><p style="font-size:32px;font-weight:bold;letter-spacing:8px">${code}</p><p>This code expires in 10 minutes.</p><p>If you did not sign up, ignore this email.</p>`,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    console.error('[email] Resend error:', response.status, errorBody)
    return { sent: false, reason: 'Failed to send verification email.' }
  }

  return { sent: true }
}
