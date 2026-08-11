import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const VERSION = 'v1'

function encryptionKey() {
  const key = Buffer.from(String(process.env.PAYOUT_ENCRYPTION_KEY || ''), 'base64url')
  if (key.length !== 32) {
    throw Object.assign(new Error('PAYOUT_ENCRYPTION_KEY must be a 32-byte base64url value.'), { statusCode: 503 })
  }
  return key
}

export function encryptSensitive(value) {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, encryptionKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${VERSION}.${iv.toString('base64url')}.${tag.toString('base64url')}.${ciphertext.toString('base64url')}`
}

export function decryptSensitive(payload) {
  const [version, ivValue, tagValue, ciphertextValue] = String(payload || '').split('.')
  if (version !== VERSION || !ivValue || !tagValue || !ciphertextValue) {
    throw Object.assign(new Error('Stored payout data is not in a supported encrypted format.'), { statusCode: 500 })
  }
  const decipher = createDecipheriv(ALGORITHM, encryptionKey(), Buffer.from(ivValue, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'))
  return Buffer.concat([decipher.update(Buffer.from(ciphertextValue, 'base64url')), decipher.final()]).toString('utf8')
}
