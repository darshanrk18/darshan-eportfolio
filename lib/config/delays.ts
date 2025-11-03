/**
 * Delay Configuration
 * 
 * Centralized delay values for timeouts, intervals, and waiting periods.
 * 
 * @module lib/config/delays
 */

/**
 * Delay values in milliseconds
 */
export const DELAYS = {
  /** Default typing delay between characters (ms) */
  typing: 100,
  /** Delay before cycling to next command (ms) */
  commandCycle: 2000,
  /** Cursor blink interval (ms) */
  cursorBlink: 530,
  /** Scroll timeout for active section detection (ms) */
  scrollTimeout: 150,
  /** Email submission reset timeout (ms) */
  emailReset: 5000,
} as const

