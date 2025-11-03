/**
 * Theme Toggle Button Component
 * 
 * Reusable button component for toggling between light and dark themes.
 * Follows DRY principle by extracting duplicate theme toggle logic.
 * 
 * @component
 * @module components/ui/ThemeToggle
 */

'use client'

import { FiMoon, FiSun } from 'react-icons/fi'
import { useTheme } from '@/components/providers/ThemeProvider'

interface ThemeToggleProps {
  /** Additional CSS classes to apply */
  readonly className?: string
  /** Whether to show label text */
  readonly showLabel?: boolean
}

/**
 * ThemeToggle component for switching between light and dark themes
 * 
 * @param className - Additional CSS classes
 * @param showLabel - Whether to display label text (default: false)
 * @returns Theme toggle button component
 */
export default function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${className}`}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <FiMoon className="w-5 h-5" />
      ) : (
        <FiSun className="w-5 h-5" />
      )}
      {showLabel && (
        <span className="ml-2 text-sm">
          {theme === 'light' ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  )
}

