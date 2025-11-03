/**
 * Logger Utility
 * 
 * Centralized logging utility that conditionally logs based on environment.
 * In production, errors are logged but debug messages are suppressed.
 * 
 * @module lib/utils/logger
 */

/**
 * Log levels
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

/**
 * Checks if logging should be enabled for a given level
 */
function shouldLog(level: LogLevel): boolean {
  if (level === LogLevel.ERROR || level === LogLevel.WARN) {
    return true // Always log errors and warnings
  }
  
  // In development, log everything
  if (process.env.NODE_ENV === 'development') {
    return true
  }
  
  // In production, only log errors and warnings
  return false
}

/**
 * Logger interface
 */
interface Logger {
  error: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  debug: (...args: unknown[]) => void
}

/**
 * Logger implementation
 */
const logger: Logger = {
  error: (...args: unknown[]) => {
    if (shouldLog(LogLevel.ERROR)) {
      console.error('[ERROR]', ...args)
    }
  },
  warn: (...args: unknown[]) => {
    if (shouldLog(LogLevel.WARN)) {
      console.warn('[WARN]', ...args)
    }
  },
  info: (...args: unknown[]) => {
    if (shouldLog(LogLevel.INFO)) {
      console.info('[INFO]', ...args)
    }
  },
  debug: (...args: unknown[]) => {
    if (shouldLog(LogLevel.DEBUG)) {
      console.debug('[DEBUG]', ...args)
    }
  },
}

export default logger

