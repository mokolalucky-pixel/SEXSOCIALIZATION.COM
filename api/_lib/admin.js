export function isAdminEmail(email) {
  const adminEmails = String(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)

  return adminEmails.includes(String(email || '').toLowerCase())
}

export function requireAdmin(user) {
  if (!isAdminEmail(user?.email)) {
    throw Object.assign(new Error('Admin access required.'), { statusCode: 403 })
  }
}
