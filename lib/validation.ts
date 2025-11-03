/**
 * Client-side form validation utilities
 * Provides validation functions for form inputs
 */

export interface ValidationResult {
  readonly isValid: boolean
  readonly error?: string
}

/**
 * Validates an email address
 * @param email - Email string to validate
 * @returns ValidationResult with isValid flag and optional error message
 */
export function validateEmail(email: string): ValidationResult {
  if (!email.trim()) {
    return { isValid: false, error: 'Email is required' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' }
  }

  return { isValid: true }
}

/**
 * Validates a name field
 * @param name - Name string to validate
 * @param minLength - Minimum length required (default: 2)
 * @param maxLength - Maximum length allowed (default: 100)
 * @returns ValidationResult with isValid flag and optional error message
 */
export function validateName(name: string, minLength = 2, maxLength = 100): ValidationResult {
  if (!name.trim()) {
    return { isValid: false, error: 'Name is required' }
  }

  if (name.trim().length < minLength) {
    return { isValid: false, error: `Name must be at least ${minLength} characters` }
  }

  if (name.length > maxLength) {
    return { isValid: false, error: `Name must be less than ${maxLength} characters` }
  }

  const nameRegex = /^[a-zA-Z\s'-]+$/
  if (!nameRegex.test(name.trim())) {
    return { isValid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' }
  }

  return { isValid: true }
}

/**
 * Validates a message field
 * @param message - Message string to validate
 * @param minLength - Minimum length required (default: 10)
 * @param maxLength - Maximum length allowed (default: 1000)
 * @returns ValidationResult with isValid flag and optional error message
 */
export function validateMessage(message: string, minLength = 10, maxLength = 1000): ValidationResult {
  if (!message.trim()) {
    return { isValid: false, error: 'Message is required' }
  }

  if (message.trim().length < minLength) {
    return { isValid: false, error: `Message must be at least ${minLength} characters` }
  }

  if (message.length > maxLength) {
    return { isValid: false, error: `Message must be less than ${maxLength} characters` }
  }

  return { isValid: true }
}

/**
 * Sanitizes user input to prevent XSS attacks
 * @param input - Input string to sanitize
 * @returns Sanitized string with HTML entities escaped
 */
export function sanitizeInput(input: string): string {
  const div = document.createElement('div')
  div.textContent = input
  return div.innerHTML
}

/**
 * Validates entire form data
 * @param formData - Form data object containing name, email, and message
 * @returns Object with validation results for each field
 */
export function validateFormData(formData: { name: string; email: string; message: string }) {
  return {
    name: validateName(formData.name),
    email: validateEmail(formData.email),
    message: validateMessage(formData.message),
  }
}

