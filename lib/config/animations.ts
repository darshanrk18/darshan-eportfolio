/**
 * Animation Configuration
 * 
 * Centralized animation timing and configuration.
 * All animation durations, delays, and easing should come from here.
 * 
 * @module lib/config/animations
 */

/**
 * Animation durations in seconds
 */
export const ANIMATION_DURATIONS = {
  fast: 0.2,
  normal: 0.3,
  medium: 0.5,
  slow: 0.6,
  slower: 0.8,
  logoGradient: 8,
  nameGradient: 5,
  shimmer: 3,
} as const

/**
 * Animation delays in seconds
 */
export const ANIMATION_DELAYS = {
  stagger: 0.1,
  staggerMedium: 0.2,
  staggerLarge: 0.3,
  initial: 0.2,
  logo: 0.2,
  navItem: 0.1,
  mobileMenu: 0.1,
} as const

/**
 * Animation easing functions
 * Framer Motion compatible easing arrays (cubic-bezier format: [x1, y1, x2, y2])
 */
export const ANIMATION_EASING = {
  default: [0.4, 0, 0.2, 1] as const, // ease-in-out equivalent
  smooth: [0, 0, 0.2, 1] as const, // ease-out equivalent
  spring: [0.4, 0, 0.2, 1] as const,
  bounce: [0.68, -0.55, 0.265, 1.55] as const,
} as const

