/**
 * Animation Configurations
 * 
 * Centralized Framer Motion animation configurations for consistent
 * animations across the portfolio. All animations use common timing
 * and easing for a cohesive feel.
 * 
 * @module lib/styles/animations
 */

/**
 * Fade in animation with upward motion
 * Use for general content appearance
 */
export const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
}

/**
 * Slide in from left animation
 * Use for left-aligned content or left column elements
 */
export const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, delay: 0.2 },
}

/**
 * Slide in from right animation
 * Use for right-aligned content or right column elements
 */
export const slideInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, delay: 0.4 },
}

/**
 * Stagger animation for children elements
 * Use for animating lists or grids where items should appear sequentially
 * 
 * @param delay - Delay in seconds between each child animation (default: 0.1)
 * @returns Animation configuration object
 */
export const staggerChildren = (delay = 0.1) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay },
})

/**
 * Intersection Observer configuration for viewport-based animations
 * Configures when elements should animate based on scroll position
 */
export const inViewConfig = {
  /** Only trigger animation once (don't re-animate on scroll back up) */
  triggerOnce: true,
  /** Trigger when 10% of element is visible */
  threshold: 0.1,
} as const

/**
 * Alias for inViewConfig (backward compatibility)
 */
export const useInViewConfig = inViewConfig

