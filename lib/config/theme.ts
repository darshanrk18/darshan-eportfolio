/**
 * Theme configuration and design tokens
 * Centralized theme settings for the application
 * 
 * @module lib/config/theme
 */

export const THEME_CONFIG = {
  defaultTheme: 'dark' as const,
  storageKey: 'theme',
} as const

export type Theme = 'light' | 'dark'

