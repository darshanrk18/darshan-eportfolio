/**
 * Theme Provider Component
 * 
 * Provides dark/light theme context to the entire application.
 * Manages theme state in localStorage for persistence.
 * Automatically applies theme classes to document root.
 * 
 * @component
 * @module components/providers/ThemeProvider
 */

'use client'

import { createContext, useContext, useEffect, useState } from 'react'

/**
 * Available theme options
 */
type Theme = 'light' | 'dark'

/**
 * Theme context type definition
 */
interface ThemeContextType {
  /** Current theme ('light' or 'dark') */
  theme: Theme
  /** Function to toggle between light and dark themes */
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

/**
 * ThemeProvider component
 * 
 * Wraps the application to provide theme context.
 * Persists theme preference in localStorage.
 * 
 * @param children - Child components that will have access to theme context
 * @returns ThemeProvider wrapper component
 */
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = (localStorage.getItem('theme') as Theme) || 'dark'
    setTheme(savedTheme)
    document.documentElement.classList.add('dark')
    document.documentElement.classList.toggle('dark', savedTheme === 'dark')
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  // Always provide the context, even before mount
  // This prevents the "must be used within ThemeProvider" error
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

