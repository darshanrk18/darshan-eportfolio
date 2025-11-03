/**
 * Color Configuration
 * 
 * Centralized color definitions for the entire application.
 * All colors should be imported from here to maintain consistency.
 * 
 * @module lib/config/colors
 */

/**
 * Primary color palette
 * Matches Tailwind config primary colors
 */
export const PRIMARY_COLORS = {
  50: '#f0f9ff',
  100: '#e0f2fe',
  200: '#bae6fd',
  300: '#7dd3fc',
  400: '#38bdf8',
  500: '#0ea5e9',
  600: '#0284c7',
  700: '#0369a1',
  800: '#075985',
  900: '#0c4a6e',
} as const

/**
 * Gradient color definitions
 */
export const GRADIENT_COLORS = {
  nameGradient: {
    light: ['#3b82f6', '#8b5cf6', '#ec4899'],
    dark: ['#60a5fa', '#a78bfa', '#f472b6'],
  },
  logoGradient: {
    light: ['#0ea5e9', '#38bdf8', '#60a5fa', '#0284c7'],
    dark: ['#38bdf8', '#60a5fa', '#7dd3fc', '#0284c7'],
  },
} as const

/**
 * CSS custom property helpers
 */
export const CSS_COLOR_VARS = {
  background: 'var(--background)',
  foreground: 'var(--foreground)',
} as const

