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

  // Priority: Check 12-digit formats first (country code)
  if (digitsOnly.length === 12) {
    // Format: +905XXXXXXXXX or 905XXXXXXXXX (country code 90 + area code 5)
    if (digitsOnly.startsWith('905')) {
      // Remove country code (90), keep area code (5) and add leading 0
      normalized = '0' + digitsOnly.substring(2) // 0 + 5386912283 = 05386912283
    }
    // Format: 90XXXXXXXXXX (country code 90, but not starting with 905)
    else if (digitsOnly.startsWith('90')) {
      // Remove country code, result should be 10 digits starting with 5
      normalized = digitsOnly.substring(2)
      if (normalized.length === 10 && normalized.startsWith('5')) {
        normalized = '0' + normalized
      } else {
        return { valid: false, sanitized: '', error: 'Geçersiz telefon numarası formatı' }
      }
    } else {
      return { valid: false, sanitized: '', error: 'Geçersiz telefon numarası formatı' }
    }
  }
  // 11 digits: should be 05XXXXXXXXX
  else if (digitsOnly.length === 11) {
    if (!digitsOnly.startsWith('05')) {
      return { valid: false, sanitized: '', error: 'Telefon numarası 05 ile başlamalı' }
    }
    normalized = digitsOnly
  }
  // 10 digits: should be 5XXXXXXXXX, add leading 0
  else if (digitsOnly.length === 10) {
    if (!digitsOnly.startsWith('5')) {
      return { valid: false, sanitized: '', error: 'Telefon numarası 5 ile başlamalı' }
    }
    normalized = `0${digitsOnly}`
  }
  else {
    return { valid: false, sanitized: '', error: `Geçersiz telefon numarası formatı (${digitsOnly.length} haneli, 10-12 haneli olmalı)` }
  }

  // Final validation: should be 11 digits starting with 05
  if (normalized.length !== 11 || !normalized.startsWith('05')) {
    return { valid: false, sanitized: '', error: 'Telefon numarası 05XXXXXXXXX formatında olmalı' }
  }

  return { valid: true, sanitized: normalized }
}

/**
 * Validates Turkish National ID (TC Kimlik No)
 * Performs format validation and optional algorithm check
 */
export function validateTCNo(tcNo: string, strictAlgorithmCheck: boolean = false): { valid: boolean; sanitized: string; error?: string } {
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

  // All digits must be the same? (invalid pattern)
  if (digitsOnly.split('').every(d => d === digitsOnly[0])) {
    return { valid: false, sanitized: '', error: 'TC Kimlik No tüm haneleri aynı olamaz' }
  }

  // If strict algorithm check is enabled, perform full validation
  if (strictAlgorithmCheck) {
    const digits = digitsOnly.split('').map(Number)
    
    // Calculate 10th digit
    const sum1 = (digits[0] + digits[2] + digits[4] + digits[6] + digits[8]) * 7
    const sum2 = digits[1] + digits[3] + digits[5] + digits[7]
    const digit10 = (sum1 - sum2) % 10

    if (digit10 !== digits[9]) {
      return { valid: false, sanitized: '', error: 'Geçersiz TC Kimlik No (algoritma kontrolü başarısız)' }
    }

    // Calculate 11th digit
    const sum3 = digits[0] + digits[1] + digits[2] + digits[3] + digits[4] + digits[5] + digits[6] + digits[7] + digits[8] + digits[9]
    const digit11 = sum3 % 10

    if (digit11 !== digits[10]) {
      return { valid: false, sanitized: '', error: 'Geçersiz TC Kimlik No (algoritma kontrolü başarısız)' }
    }
  }

  // Format is valid, return sanitized value
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
 * Uses DOMPurify for comprehensive XSS protection
 */
export function sanitizeText(text: string): string {
  try {
    // Use isomorphic-dompurify (works on both server and client)
    const createDOMPurify = require('isomorphic-dompurify')
    const DOMPurify = createDOMPurify()
    return DOMPurify.sanitize(text, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    }).trim().substring(0, 1000)
  } catch (error) {
    // Fallback to basic sanitization if DOMPurify fails
    return text
      .trim()
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .substring(0, 1000)
  }
}

// Rate limiting removed - single container deployment
// For multi-container deployments, implement Redis-based rate limiting

