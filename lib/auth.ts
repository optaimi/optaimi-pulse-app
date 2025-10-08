import bcrypt from 'bcryptjs'
import crypto from 'crypto'

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Generate a cryptographically secure random token
 */
export function generateToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex')
}

/**
 * Generate a 6-digit numeric code for magic links
 */
export function generateMagicCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 * - At least 8 characters
 * - At least one letter and one number
 */
export function isValidPassword(password: string): boolean {
  if (password.length < 8) return false
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  return hasLetter && hasNumber
}

/**
 * Check if a token has expired
 */
export function isTokenExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true
  return new Date() > expiresAt
}

/**
 * Get token expiration time (1 hour from now)
 */
export function getTokenExpiration(): Date {
  return new Date(Date.now() + 60 * 60 * 1000) // 1 hour
}

/**
 * Get magic link expiration time (15 minutes from now)
 */
export function getMagicLinkExpiration(): Date {
  return new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
}
