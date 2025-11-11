/**
 * Input validation and sanitization utilities
 * Provides security against SQL injection, XSS, and other attacks
 */

/**
 * Validates and sanitizes email input
 */
export function validateEmail(email: string): { valid: boolean; sanitized: string; error?: string } {
  // Remove whitespace
  const trimmed = email.trim()

  // Basic length check
  if (trimmed.length === 0) {
    return { valid: false, sanitized: '', error: 'E-posta adresi gerekli' }
  }

  if (trimmed.length > 255) {
    return { valid: false, sanitized: '', error: 'E-posta adresi çok uzun' }
  }

  // Email regex (RFC 5322 simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

  if (!emailRegex.test(trimmed)) {
    return { valid: false, sanitized: '', error: 'Geçersiz e-posta formatı' }
  }

  // Convert to lowercase for consistency
  return { valid: true, sanitized: trimmed.toLowerCase() }
}

/**
 * Validates and sanitizes phone number input (Turkish format)
 * Handles formats: +905XXXXXXXXX, 905XXXXXXXXX, 05XXXXXXXXX, 5XXXXXXXXX
 */
export function validatePhone(phone: string): { valid: boolean; sanitized: string; error?: string } {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '')

  // Handle different formats
  let normalized = digitsOnly

  // If starts with 90 (country code without +), remove it
  if (digitsOnly.length === 12 && digitsOnly.startsWith('90')) {
    normalized = digitsOnly.substring(2)
  }
  // If starts with 905 (country code + area code), remove country code
  else if (digitsOnly.length === 12 && digitsOnly.startsWith('905')) {
    normalized = '0' + digitsOnly.substring(2)
  }
  // If 10 digits starting with 5, add leading 0
  else if (digitsOnly.length === 10) {
    if (!digitsOnly.startsWith('5')) {
      return { valid: false, sanitized: '', error: 'Telefon numarası 5 ile başlamalı' }
    }
    normalized = `0${digitsOnly}`
  }
  // If 11 digits, check if it starts with 05
  else if (digitsOnly.length === 11) {
    if (!digitsOnly.startsWith('05')) {
      return { valid: false, sanitized: '', error: 'Telefon numarası 05 ile başlamalı' }
    }
    normalized = digitsOnly
  }
  else {
    return { valid: false, sanitized: '', error: 'Geçersiz telefon numarası formatı' }
  }

  // Final validation: should be 11 digits starting with 05
  if (normalized.length !== 11 || !normalized.startsWith('05')) {
    return { valid: false, sanitized: '', error: 'Telefon numarası 05XXXXXXXXX formatında olmalı' }
  }

  return { valid: true, sanitized: normalized }
}

/**
 * Validates Turkish National ID (TC Kimlik No)
 */
export function validateTCNo(tcNo: string): { valid: boolean; sanitized: string; error?: string } {
  // Remove all non-digit characters
  const digitsOnly = tcNo.replace(/\D/g, '')

  // TC Kimlik No must be 11 digits
  if (digitsOnly.length !== 11) {
    return { valid: false, sanitized: '', error: 'TC Kimlik No 11 haneli olmalı' }
  }

  // First digit cannot be 0
  if (digitsOnly[0] === '0') {
    return { valid: false, sanitized: '', error: 'TC Kimlik No 0 ile başlayamaz' }
  }

  // TC Kimlik No validation algorithm
  const digits = digitsOnly.split('').map(Number)
  
  // Calculate 10th digit
  const sum1 = (digits[0] + digits[2] + digits[4] + digits[6] + digits[8]) * 7
  const sum2 = digits[1] + digits[3] + digits[5] + digits[7]
  const digit10 = (sum1 - sum2) % 10

  if (digit10 !== digits[9]) {
    return { valid: false, sanitized: '', error: 'Geçersiz TC Kimlik No' }
  }

  // Calculate 11th digit
  const sum3 = digits[0] + digits[1] + digits[2] + digits[3] + digits[4] + digits[5] + digits[6] + digits[7] + digits[8] + digits[9]
  const digit11 = sum3 % 10

  if (digit11 !== digits[10]) {
    return { valid: false, sanitized: '', error: 'Geçersiz TC Kimlik No' }
  }

  return { valid: true, sanitized: digitsOnly }
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 6) {
    return { valid: false, error: 'Şifre en az 6 karakter olmalı' }
  }

  if (password.length > 128) {
    return { valid: false, error: 'Şifre çok uzun' }
  }

  return { valid: true }
}

/**
 * Sanitizes general text input (prevents XSS)
 */
export function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000) // Limit length
}

/**
 * Rate limiting storage (in-memory, for simple cases)
 * In production, use Redis or similar
 */
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()

/**
 * Check if login should be rate limited
 */
export function checkRateLimit(identifier: string, maxAttempts = 5, windowMs = 15 * 60 * 1000): { allowed: boolean; remaining: number; resetIn?: number } {
  const now = Date.now()
  const attempt = loginAttempts.get(identifier)

  if (!attempt) {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now })
    return { allowed: true, remaining: maxAttempts - 1 }
  }

  // Reset if window expired
  if (now - attempt.lastAttempt > windowMs) {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now })
    return { allowed: true, remaining: maxAttempts - 1 }
  }

  // Increment attempt
  attempt.count++
  attempt.lastAttempt = now

  if (attempt.count > maxAttempts) {
    const resetIn = Math.ceil((windowMs - (now - attempt.lastAttempt)) / 1000)
    return { allowed: false, remaining: 0, resetIn }
  }

  return { allowed: true, remaining: maxAttempts - attempt.count }
}

/**
 * Clear rate limit for a specific identifier (after successful login)
 */
export function clearRateLimit(identifier: string): void {
  loginAttempts.delete(identifier)
}

/**
 * Cleanup old rate limit entries (call periodically)
 */
export function cleanupRateLimits(windowMs = 15 * 60 * 1000): void {
  const now = Date.now()
  for (const [key, value] of loginAttempts.entries()) {
    if (now - value.lastAttempt > windowMs) {
      loginAttempts.delete(key)
    }
  }
}

// Run cleanup every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => cleanupRateLimits(), 5 * 60 * 1000)
}

