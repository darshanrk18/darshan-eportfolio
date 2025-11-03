/**
 * Environment variable validation and configuration
 * Ensures all required environment variables are present
 */

/**
 * Validates and retrieves EmailJS environment variables
 * @returns Object containing EmailJS configuration
 * @throws Error if required variables are missing
 */
export function getEmailJSConfig() {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY

  if (!serviceId || !templateId || !publicKey) {
    throw new Error(
      'Missing required EmailJS environment variables. Please check your .env.local file.'
    )
  }

  return {
    serviceId,
    templateId,
    publicKey,
  }
}

/**
 * Gets all environment configuration
 * Use this for validating required env vars on app startup
 */
export function getEnvConfig() {
  return {
    emailjs: getEmailJSConfig(),
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
  }
}

