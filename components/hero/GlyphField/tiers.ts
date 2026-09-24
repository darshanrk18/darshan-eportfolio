/**
 * Glyph-field tier plumbing (spec §5.5/§8.3). Counts come from the canonical
 * TIER_PARTICLES ladder in lib/perf/tiers — never re-declared here.
 */

import { TIER_PARTICLES, type GlyphTier } from '@/lib/perf/tiers'

/** Tiers at which the WebGL field actually renders (T0 = static SVG). */
export type ActiveTier = Exclude<GlyphTier, 0>

/** §5.5: device pixel ratio is capped at 1.5. */
export const DPR_CAP = 1.5

/**
 * v2 §4.2b — ternary depth split [far, mid, near] (fractions of the field).
 * far (aDepth 0): scale ×0.45, alpha ×0.25, +1 mip LOD blur;
 * mid (aDepth 0.5): the v1 "far" look; near (aDepth 1): full.
 */
export const LAYER_SPLIT = [0.15, 0.35, 0.5] as const

/** v2 §4.2d — instances reserved at the END of the buffer for keypress spawns. */
export const SPAWN_RING_SIZE = 32

/** Instanced FIELD sprite count for an active tier (spawn ring is extra). */
export function particleCount(tier: ActiveTier): number {
  return TIER_PARTICLES[tier]
}
