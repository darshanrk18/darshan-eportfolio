import { useState } from 'react'
import emailjs from '@emailjs/browser'
import type { FormData, EmailJSError } from '@/lib/types'
import { getEmailJSConfig } from '@/lib/config/env'

interface UseEmailJSOptions {
  readonly onSuccess?: () => void
  readonly onError?: (error: string) => void
}

export function useEmailJS({ onSuccess, onError }: UseEmailJSOptions = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

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
        }, 5000)
      } else {
        throw new Error('EmailJS returned an error')
      }
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      onError?.(errorMessage)
      console.error('EmailJS Error Details:', {
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
    sendEmail,
    isLoading,
    error,
    submitted,
    setError,
  }
}

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

