/**
 * Theme configuration and design tokens
 * Centralized theme settings for the application
 */

export const THEME_CONFIG = {
  defaultTheme: 'dark' as const,
  storageKey: 'theme',
} as const

export const DESIGN_TOKENS = {
  colors: {
    primary: {
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
    },
  },
  fonts: {
    sans: 'var(--font-inter)',
    mono: 'var(--font-mono)',
    heading: 'var(--font-heading)',
  },
  animations: {
    transition: {
      fast: '0.2s',
      normal: '0.3s',
      slow: '0.5s',
    },
  },
} as const

export type Theme = 'light' | 'dark'

