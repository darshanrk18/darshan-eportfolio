/**
 * Device tiers + self-throttle for the glyph field and all canvases (spec §8.3).
 * T0 is the permanent static-SVG fallback path and ships first.
 */

export type GlyphTier = 0 | 1 | 2 | 3

/** Instanced sprite counts per tier (T0 renders the static SVG instead). */
export const TIER_PARTICLES: Record<GlyphTier, number> = {
  0: 0,
  1: 900,
  2: 1600,
  3: 2500,
}

/** Human label for the footer readout. */
export function tierLabel(tier: GlyphTier | null): string {
  if (tier === null) return '—'
  return tier === 0 ? 'static' : `T${tier}`
}

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number
}

let webgl2Cache: boolean | null = null

/** WebGL2 availability (probed once, cached). Client-only; false on server. */
export function supportsWebGL2(): boolean {
  if (typeof window === 'undefined') return false
  if (webgl2Cache !== null) return webgl2Cache
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')
    webgl2Cache = gl !== null
    // Free the probe context where supported.
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    webgl2Cache = false
  }
  return webgl2Cache
}

/**
 * Initial tier per §8.3. Client-only (returns 0 on the server).
 * T0: reduced motion, no WebGL2, or deviceMemory < 4.
 * T1: coarse pointer OR deviceMemory === 4 OR viewport < 768.
 * T3: fine pointer AND (deviceMemory ≥ 8 OR hardwareConcurrency ≥ 8).
 * T2: default desktop.
 */
export function detectTier(): GlyphTier {
  if (typeof window === 'undefined') return 0
  if (document.documentElement.dataset.motion === 'reduced') return 0
  if (!supportsWebGL2()) return 0

  const deviceMemory = (navigator as NavigatorWithMemory).deviceMemory
  if (deviceMemory !== undefined && deviceMemory < 4) return 0

  const coarse = window.matchMedia('(pointer: coarse)').matches
  if (coarse || deviceMemory === 4 || window.innerWidth < 768) return 1

  const cores = navigator.hardwareConcurrency ?? 0
  if ((deviceMemory !== undefined && deviceMemory >= 8) || cores >= 8) return 3
  return 2
}

/**
 * Self-throttle governor (§8.3, verbatim rules):
 * - rolling 60-frame average frame time > 22ms → drop one tier
 * - > 33ms sustained for 3s while at T1 → freeze to T0
 * - never re-upgrades within a session
 *
 * Feed it every animation frame: `governor.sample(dtMs, nowMs)`.
 */
export class TierGovernor {
  private readonly window: number[] = []
  private sum = 0
  private over33Since: number | null = null
  private currentTier: GlyphTier

  constructor(
    initial: GlyphTier,
    private readonly onChange?: (tier: GlyphTier) => void,
  ) {
    this.currentTier = initial
  }

  get tier(): GlyphTier {
    return this.currentTier
  }

  /** Record one frame; returns the (possibly downgraded) tier. */
  sample(frameMs: number, nowMs: number): GlyphTier {
    if (this.currentTier === 0) return 0

    this.window.push(frameMs)
    this.sum += frameMs
    if (this.window.length > 60) {
      this.sum -= this.window.shift() as number
    }

    const avg = this.sum / this.window.length

    if (this.currentTier === 1) {
      if (avg > 33) {
        if (this.over33Since === null) this.over33Since = nowMs
        if (nowMs - this.over33Since >= 3000) this.drop(0)
      } else {
        this.over33Since = null
      }
    }

    if (this.window.length === 60 && avg > 22 && this.currentTier > 0) {
      this.drop((this.currentTier - 1) as GlyphTier)
    }

    return this.currentTier
  }

  private drop(to: GlyphTier): void {
    if (to >= this.currentTier) return
    this.currentTier = to
    this.window.length = 0
    this.sum = 0
    this.over33Since = null
    this.onChange?.(to)
  }
}
