/**
 * Error Display Component
 * 
 * Reusable component for displaying error states.
 * Used by ErrorBoundary and app error handler.
 * 
 * @component
 * @module components/ui/ErrorDisplay
 */

import React from 'react'

/**
 * Props for ErrorDisplay component
 */
interface ErrorDisplayProps {
  /** Optional error object to display details for */
  readonly error?: Error
  /** Callback function to reset/retry */
  readonly onReset?: () => void
  /** Additional description text */
  readonly description?: string
  /** Whether to show error details (for development) */
  readonly showDetails?: boolean
}

/**
 * ErrorDisplay component
 * 
 * Displays a user-friendly error message with optional reset functionality
 * and development-only error details.
 * 
 * @param props - ErrorDisplay configuration props
 * @returns Error display UI component
 */
export default function ErrorDisplay({
  error,
  onReset,
  description = 'We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.',
  showDetails = process.env.NODE_ENV === 'development',
}: ErrorDisplayProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Something went wrong
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {description}
        </p>
        {onReset && (
          <button
            onClick={onReset}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors mb-4"
          >
            Try Again
          </button>
        )}
        {showDetails && error && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400">
              Error Details (Development Only)
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

