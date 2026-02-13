/**
 * Input Sanitization Utilities
 * Prevents XSS and injection attacks
 */

/**
 * Sanitize HTML string to prevent XSS
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Escape special characters in a string for use in HTML
 * @param str - String to escape
 * @returns Escaped string
 */
export function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return str.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Sanitize user input for safe display
 * @param input - User input string
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .slice(0, 1000); // Limit length
}

/**
 * Validate email format
 * @param email - Email string to validate
 * @returns true if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 * @param url - URL string to validate
 * @returns true if valid URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize filename to prevent directory traversal
 * @param filename - Filename to sanitize
 * @returns Safe filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars
    .replace(/\.{2,}/g, '.') // Remove multiple dots
    .slice(0, 255); // Limit length
}

/**
 * Validate and sanitize phone number
 * @param phone - Phone number string
 * @returns Sanitized phone number or null if invalid
 */
export function sanitizePhone(phone: string): string | null {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length >= 10 && cleaned.length <= 15) {
    return cleaned;
  }
  return null;
}

/**
 * Check if string contains SQL injection patterns
 * @param input - Input string to check
 * @returns true if suspicious patterns detected
 */
export function containsSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(--|;|\/\*|\*\/|xp_|sp_)/i,
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i,
  ];
  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Validate and sanitize number input
 * @param value - Value to validate
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Sanitized number or null if invalid
 */
export function sanitizeNumber(
  value: string | number,
  min?: number,
  max?: number
): number | null {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num) || !isFinite(num)) {
    return null;
  }
  
  if (min !== undefined && num < min) {
    return null;
  }
  
  if (max !== undefined && num > max) {
    return null;
  }
  
  return num;
}
