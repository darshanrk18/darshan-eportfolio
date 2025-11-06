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
    const isProduction = process.env.NODE_ENV === 'production'
    const envHint = isProduction
      ? 'Please set them in your deployment platform (e.g., Vercel dashboard).'
      : 'Please check your .env.local file.'
    
    throw new Error(
      `Missing required EmailJS environment variables: NEXT_PUBLIC_EMAILJS_SERVICE_ID, NEXT_PUBLIC_EMAILJS_TEMPLATE_ID, NEXT_PUBLIC_EMAILJS_PUBLIC_KEY. ${envHint}`
    )
  }

  return {
    serviceId,
    templateId,
    publicKey,
  }
}

/**
 * Retrieves Google Analytics 4 configuration
 * Returns null if not configured (optional feature)
 * @returns Object containing GA4 measurement ID or null
 */
export function getGA4Config() {
  const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID

  if (!measurementId) {
    return null
  }

  return {
    measurementId,
  }
}

/**
 * Gets all environment configuration
 * Use this for validating required env vars on app startup
 */
export function getEnvConfig() {
  return {
    emailjs: getEmailJSConfig(),
    ga4: getGA4Config(),
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
  }
}

