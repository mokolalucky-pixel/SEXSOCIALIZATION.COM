export function isPremiumStatus(status) {
  return status === 'active' || status === 'trialing'
}

export function requirePremium(user) {
  if (!isPremiumStatus(user?.subscription_status)) {
    throw Object.assign(new Error('Premium membership is required.'), { statusCode: 403 })
  }
}
