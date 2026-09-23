/**
 * Glyph-field tier plumbing (spec §5.5/§8.3). Counts come from the canonical
 * TIER_PARTICLES ladder in lib/perf/tiers — never re-declared here.
 */

import { TIER_PARTICLES, type GlyphTier } from '@/lib/perf/tiers'

/** Tiers at which the WebGL field actually renders (T0 = static SVG). */
export type ActiveTier = Exclude<GlyphTier, 0>

/** §5.5: device pixel ratio is capped at 1.5. */
export const DPR_CAP = 1.5

/** Fraction of sprites assigned to the far depth layer (smaller, dimmer). */
export const FAR_LAYER_RATIO = 0.45

/** Instanced sprite count for an active tier. */
export function particleCount(tier: ActiveTier): number {
  return TIER_PARTICLES[tier]
}
