'use client'

import { useEffect } from 'react'
import logger from '@/lib/utils/logger'
import ErrorDisplay from '@/components/ui/ErrorDisplay'

interface ErrorProps {
  readonly error: Error & { digest?: string }
  readonly reset: () => void
}

/**
 * Global error boundary component for Next.js App Router
 * Displays a user-friendly error page when errors occur
 */
export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    logger.error('Application error:', error)
  }, [error])

  return (
    <ErrorDisplay
      error={error}
      onReset={reset}
      description="We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists."
    />
  )
}

