/**
 * Form input styling utilities
 * 
 * Centralized utilities for consistent form input styling across the application.
 * Follows DRY principle by eliminating duplicate className strings.
 * 
 * @module lib/utils/formStyles
 */

/**
 * Gets the base input field className with error state support
 * 
 * @param hasError - Whether the input has a validation error
 * @param additionalClasses - Optional additional CSS classes to append
 * @returns Complete className string for form inputs
 */
export function getInputClassName(hasError: boolean, additionalClasses?: string): string {
  const baseClasses = 'w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all'
  const borderClasses = hasError
    ? 'border-red-500 dark:border-red-500'
    : 'border-gray-300 dark:border-gray-600'
  
  return `${baseClasses} ${borderClasses}${additionalClasses ? ` ${additionalClasses}` : ''}`
}

/**
 * Gets className for textarea elements
 * 
 * @param hasError - Whether the textarea has a validation error
 * @returns Complete className string for textarea elements
 */
export function getTextareaClassName(hasError: boolean): string {
  return `${getInputClassName(hasError)} resize-none`
}

