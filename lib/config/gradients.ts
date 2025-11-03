/**
 * Gradient Configuration
 * 
 * Centralized gradient definitions for consistent color gradients across the app.
 * 
 * @module lib/config/gradients
 */

import { GRADIENT_COLORS } from './colors'

/**
 * Logo gradient configuration
 */
export const LOGO_GRADIENT = {
  angle: 135,
  stops: {
    light: [
      { color: GRADIENT_COLORS.logoGradient.light[0], position: 0 },
      { color: GRADIENT_COLORS.logoGradient.light[1], position: 20 },
      { color: GRADIENT_COLORS.logoGradient.light[2], position: 40 },
      { color: GRADIENT_COLORS.logoGradient.light[3], position: 60 },
      { color: GRADIENT_COLORS.logoGradient.light[0], position: 80 },
      { color: GRADIENT_COLORS.logoGradient.light[1], position: 100 },
    ],
    dark: [
      { color: GRADIENT_COLORS.logoGradient.dark[0], position: 0 },
      { color: GRADIENT_COLORS.logoGradient.dark[1], position: 20 },
      { color: GRADIENT_COLORS.logoGradient.dark[2], position: 40 },
      { color: GRADIENT_COLORS.logoGradient.dark[3], position: 60 },
      { color: GRADIENT_COLORS.logoGradient.dark[0], position: 80 },
      { color: GRADIENT_COLORS.logoGradient.dark[1], position: 100 },
    ],
  },
  backgroundSize: '250% 250%',
  filter: {
    light: { brightness: 1.1, saturation: 1.15 },
    dark: { brightness: 1.15, saturation: 1.2 },
  },
  hover: {
    light: { brightness: 1.2, saturation: 1.25 },
    dark: { brightness: 1.3, saturation: 1.3 },
  },
} as const

/**
 * Name gradient configuration
 */
export const NAME_GRADIENT = {
  angle: 135,
  stops: {
    light: [
      { color: GRADIENT_COLORS.nameGradient.light[0], position: 0 },
      { color: GRADIENT_COLORS.nameGradient.light[1], position: 50 },
      { color: GRADIENT_COLORS.nameGradient.light[2], position: 100 },
    ],
    dark: [
      { color: GRADIENT_COLORS.nameGradient.dark[0], position: 0 },
      { color: GRADIENT_COLORS.nameGradient.dark[1], position: 50 },
      { color: GRADIENT_COLORS.nameGradient.dark[2], position: 100 },
    ],
  },
  backgroundSize: '200% 200%',
} as const

/**
 * Helper to build gradient string from stops
 */
export function buildGradient(
  angle: number,
  stops: readonly { color: string; position: number }[]
): string {
  const stopStrings = stops.map((stop) => `${stop.color} ${stop.position}%`)
  return `linear-gradient(${angle}deg, ${stopStrings.join(', ')})`
}

