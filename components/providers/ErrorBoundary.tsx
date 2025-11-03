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
import logger from '@/lib/utils/logger'
import ErrorDisplay from '@/components/ui/ErrorDisplay'

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
    logger.error('Error caught by boundary:', error, errorInfo)
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
        <ErrorDisplay
          error={this.state.error}
          onReset={this.resetError}
          description="We encountered an unexpected error. Please try refreshing the page."
        />
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

