/**
 * EmailJS Integration Hook
 * 
 * Custom React hook for sending emails via EmailJS service.
 * Provides state management for loading, errors, and submission status.
 * Includes comprehensive error handling and validation.
 * 
 * @module hooks/useEmailJS
 */

import { useState } from 'react'
import emailjs from '@emailjs/browser'
import type { FormData, EmailJSError } from '@/lib/types'
import { getEmailJSConfig } from '@/lib/config/env'
import { DELAYS } from '@/lib/config'
import logger from '@/lib/utils/logger'

/**
 * Options for configuring the EmailJS hook
 */
interface UseEmailJSOptions {
  /** Callback function called when email is successfully sent */
  readonly onSuccess?: () => void
  /** Callback function called when an error occurs */
  readonly onError?: (error: string) => void
}

/**
 * Custom hook for sending emails via EmailJS
 * 
 * Manages the email sending process including:
 * - Loading state while sending
 * - Error handling with user-friendly messages
 * - Success state management
 * - Environment variable validation
 * 
 * @param options - Configuration options with success/error callbacks
 * @returns Object containing sendEmail function and state values
 * 
 * @example
 * ```tsx
 * const { sendEmail, isLoading, error, submitted } = useEmailJS({
 *   onSuccess: () => {
 *     // Handle success
 *   },
 *   onError: (err) => {
 *     // Handle error
 *   }
 * })
 * ```
 */
export function useEmailJS({ onSuccess, onError }: UseEmailJSOptions = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  /**
   * Sends an email using EmailJS service
   * 
   * Validates environment variables, sends the email, and handles
   * success/error states. Automatically resets submission state after 5 seconds.
   * 
   * @param formData - Form data containing name, email, and message
   * @throws Error if EmailJS is not configured or if sending fails
   */
  const sendEmail = async (formData: FormData) => {
    setIsLoading(true)
    setError(null)

    let serviceId: string
    let templateId: string
    let publicKey: string

    try {
      const config = getEmailJSConfig()
      serviceId = config.serviceId
      templateId = config.templateId
      publicKey = config.publicKey
    } catch (configError) {
      const errorMessage = configError instanceof Error ? configError.message : 'EmailJS is not configured. Please set up your environment variables.'
      setError(errorMessage)
      onError?.(errorMessage)
      setIsLoading(false)
      return
    }

    try {
      if (serviceId === 'YOUR_SERVICE_ID' || 
          templateId === 'YOUR_TEMPLATE_ID' || 
          publicKey === 'YOUR_PUBLIC_KEY') {
        throw new Error('EmailJS is not configured. Please set up your environment variables.')
      }

      const result = await emailjs.send(
        serviceId,
        templateId,
        {
          from_name: formData.name,
          from_email: formData.email,
          message: formData.message,
          reply_to: formData.email,
        },
        publicKey
      )

      if (result.text === 'OK') {
        setSubmitted(true)
        onSuccess?.()
        setTimeout(() => {
          setSubmitted(false)
        }, DELAYS.emailReset)
      } else {
        throw new Error('EmailJS returned an error')
      }
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      onError?.(errorMessage)
      logger.error('EmailJS Error Details:', {
        error: err,
        serviceId: serviceId ? `${serviceId.substring(0, 4)}...` : 'not set',
        templateId: templateId ? `${templateId.substring(0, 4)}...` : 'not set',
        hasPublicKey: !!publicKey,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return {
    /** Function to send email with form data */
    sendEmail,
    /** Loading state - true while email is being sent */
    isLoading,
    /** Error message string if sending failed, null otherwise */
    error,
    /** Success state - true when email was successfully sent */
    submitted,
    /** Function to manually clear error state */
    setError,
  }
}

/**
 * Extracts user-friendly error messages from various error types
 * Handles EmailJS errors, network errors, and configuration errors
 * 
 * @param err - Unknown error object from catch block
 * @returns Human-readable error message
 * @private
 */
function getErrorMessage(err: unknown): string {
  let errorMessage = 'Failed to send message. Please try again or contact me directly via email.'
  
  if (err instanceof Error) {
    if (err.message.includes('EmailJS is not configured')) {
      errorMessage = 'Contact form is not configured yet. Please contact me directly via email.'
    } else if (err.message.includes('Invalid') || err.message.includes('not found')) {
      errorMessage = 'EmailJS configuration error. Please check your service and template IDs in .env.local'
    } else {
      errorMessage = `Error: ${err.message}. Please contact me directly via email.`
    }
  } else if (err && typeof err === 'object' && 'status' in err) {
    const statusErr = err as EmailJSError
    if (statusErr.status === 400) {
      errorMessage = 'Invalid request. Please check your EmailJS template configuration.'
    } else if (statusErr.status === 401) {
      errorMessage = 'Authentication failed. Please check your EmailJS public key.'
    } else if (statusErr.status === 404) {
      errorMessage = 'Service or template not found. Please verify your EmailJS IDs.'
    } else {
      errorMessage = `EmailJS error (${statusErr.status}): ${statusErr.text || 'Unknown error'}. Please contact me directly via email.`
    }
  }
  
  return errorMessage
}

