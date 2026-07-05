/**
 * EncryptionService - Handles credential encryption and decryption
 * 
 * Uses AES-256-GCM for encryption with a key derived from environment variables.
 * Credentials are encrypted at rest and only decrypted in memory.
 */

import * as crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const TAG_POSITION = SALT_LENGTH + IV_LENGTH
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH

/**
 * Get encryption key from environment
 * In production, this should be set via environment variable
 */
function getEncryptionKey(): Buffer {
  const key = process.env.CREDENTIAL_ENCRYPTION_KEY
  if (!key) {
    throw new Error('CREDENTIAL_ENCRYPTION_KEY environment variable is not set')
  }
  return Buffer.from(key, 'hex')
}

/**
 * Encrypt plaintext credential value
 * @param plaintext - The credential value to encrypt
 * @returns Encrypted string with salt, IV, and auth tag
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey()
  const salt = crypto.randomBytes(SALT_LENGTH)
  const iv = crypto.randomBytes(IV_LENGTH)
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const tag = cipher.getAuthTag()
  
  // Combine: salt + iv + tag + encrypted
  return Buffer.concat([
    salt,
    iv,
    tag,
    Buffer.from(encrypted, 'hex')
  ]).toString('base64')
}

/**
 * Decrypt encrypted credential value
 * @param encrypted - The encrypted string
 * @returns Decrypted plaintext
 */
export function decrypt(encrypted: string): string {
  const key = getEncryptionKey()
  const buffer = Buffer.from(encrypted, 'base64')
  
  const salt = buffer.subarray(0, SALT_LENGTH)
  const iv = buffer.subarray(SALT_LENGTH, TAG_POSITION)
  const tag = buffer.subarray(TAG_POSITION, ENCRYPTED_POSITION)
  const encryptedText = buffer.subarray(ENCRYPTED_POSITION)
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  
  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  
  return decrypted.toString('utf8')
}

/**
 * Generate a masked version of a credential for display
 * @param value - The credential value to mask
 * @param visibleChars - Number of characters to show at the end (default: 4)
 * @returns Masked string like "••••••••••••••••abcd"
 */
export function maskValue(value: string, visibleChars: number = 4): string {
  if (!value || value.length <= visibleChars) {
    return '•'.repeat(Math.max(value.length, 8))
  }
  return '•'.repeat(value.length - visibleChars) + value.slice(-visibleChars)
}

/**
 * Validate that a value is properly encrypted
 * @param encrypted - The encrypted string to validate
 * @returns true if the string appears to be valid encrypted data
 */
export function isValidEncrypted(encrypted: string): boolean {
  try {
    const buffer = Buffer.from(encrypted, 'base64')
    return buffer.length >= ENCRYPTED_POSITION
  } catch {
    return false
  }
}
