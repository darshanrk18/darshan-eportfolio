/**
 * Size Configuration
 * 
 * Centralized size definitions for consistent spacing, sizing, and dimensions.
 * 
 * @module lib/config/sizes
 */

/**
 * Spacing values
 */
export const SPACING = {
  navbarHeight: 80,
  sectionPadding: {
    vertical: 20,
    horizontal: 4,
    sm: 6,
    lg: 8,
  },
  cardPadding: 8,
  inputPadding: {
    x: 4,
    y: 3,
  },
  /** Scroll detection threshold in pixels */
  scrollThreshold: 20,
} as const

/**
 * Border radius values
 */
export const BORDER_RADIUS = {
  small: 'rounded-lg',
  medium: 'rounded-xl',
  large: 'rounded-2xl',
  full: 'rounded-full',
} as const

/**
 * Font sizes
 */
export const FONT_SIZES = {
  logo: {
    base: 'text-2xl',
    md: 'md:text-3xl',
  },
  navItem: 'text-sm',
  mobileNavItem: 'text-base',
} as const

/**
 * Letter spacing
 */
export const LETTER_SPACING = {
  logo: '0.2rem',
  tight: '0.05rem',
  normal: '0rem',
} as const

