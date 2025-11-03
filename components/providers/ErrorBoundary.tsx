/**
 * Error Boundary Component
 * 
 * React class component that catches JavaScript errors anywhere in the child
 * component tree, logs those errors, and displays a fallback UI instead of
 * crashing the entire application.
 * 
 * Uses React Error Boundary pattern to provide graceful error handling.
 * 
 * @component
 * @module components/providers/ErrorBoundary
 */

'use client'

import React from 'react'

/**
 * Error boundary internal state
 */
interface ErrorBoundaryState {
  /** Whether an error has been caught */
  readonly hasError: boolean
  /** The error that was caught */
  readonly error?: Error
}

/**
 * Error boundary props
 */
interface ErrorBoundaryProps {
  /** Child components to wrap */
  readonly children: React.ReactNode
  /** Optional custom fallback component */
  readonly fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>
}

/**
 * ErrorBoundary class component
 * 
 * Catches errors in child components and displays fallback UI.
 * Provides error recovery functionality.
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const Fallback = this.props.fallback
        return <Fallback error={this.state.error} resetError={this.resetError} />
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            <button
              onClick={this.resetError}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

