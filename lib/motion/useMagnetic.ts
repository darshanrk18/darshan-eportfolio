'use client'

/**
 * v2 §6.5 — magnetic tactility layer (the shared hook).
 *
 * `useMagnetic(ref, { strength: 0.25, radius: 80 })` gives the referenced
 * element a subtle pull toward the cursor:
 * - ONE `pointermove` listener per element, attached on `pointerenter` and
 *   detached on leave — never a global listener.
 * - rAF-throttled via the shared ticker (no private rAF loops, §6.4 rule).
 * - The element translates up to 4px (`transform: translate` only, via the
 *   `--mag-x/--mag-y` custom props that `.magnetic` in styles/v2/chrome.css
 *   consumes); a `[data-mag-label]` child translates up to 6px for a subtle
 *   frame/label parallax.
 * - On leave, a critically-damped lerp on the ticker springs it back.
 * - `:active` scale 0.97 is pure CSS (`.magnetic:active`, chrome.css).
 *
 * Inert (no listeners, no transforms) on coarse pointers and under reduced
 * motion — reduced state comes from the store (usePrefersReducedMotion),
 * never a direct matchMedia query; pointer fineness is a static capability
 * check, same as the LenisProvider gate (§5.1).
 *
 * Scope discipline: applied ONLY to the ~10 elements §6.5 names (hero pill,
 * quick-row links, 3 contact buttons, project ▶ run, nav cv↗ + ⌘K chips).
 * A signature, not a gimmick — do not spread it.
 */

import { useEffect, type RefObject } from 'react'
import { subscribeTicker } from '@/lib/motion/ticker'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'

export interface MagneticOptions {
  /** Fraction of the cursor's offset from center applied as pull. */
  strength?: number
  /** Influence radius in px — pull fades to the 4px cap across it. */
  radius?: number
}

const MAX_ELEMENT_PX = 4
const MAX_LABEL_PX = 6
/** Critically-damped time constant (ms) for the follow/return lerp. */
const TAU_MS = 50
/** Below this offset (px) the spring-back is considered settled. */
const SETTLE_PX = 0.05

export function useMagnetic<T extends HTMLElement>(
  ref: RefObject<T | null>,
  options: MagneticOptions = {},
): void {
  const { strength = 0.25, radius = 80 } = options
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return
    // Capability gate, same shape as the Lenis mount gate (§5.1): magnetic
    // pull is meaningless without a fine pointer.
    if (typeof window.matchMedia !== 'function' || !window.matchMedia('(pointer: fine)').matches) {
      return
    }

    el.classList.add('magnetic')
    const label = el.querySelector<HTMLElement>('[data-mag-label]')

    let targetX = 0
    let targetY = 0
    let curX = 0
    let curY = 0
    let hovering = false
    let unsubTicker: (() => void) | null = null

    const apply = () => {
      el.style.setProperty('--mag-x', `${curX.toFixed(2)}px`)
      el.style.setProperty('--mag-y', `${curY.toFixed(2)}px`)
      if (label) {
        const scale = MAX_LABEL_PX / MAX_ELEMENT_PX
        label.style.setProperty('--mag-lx', `${(curX * scale).toFixed(2)}px`)
        label.style.setProperty('--mag-ly', `${(curY * scale).toFixed(2)}px`)
      }
    }

    const tick = (dtMs: number) => {
      // Critically-damped exponential approach — no overshoot, frame-rate safe.
      const k = 1 - Math.exp(-dtMs / TAU_MS)
      curX += (targetX - curX) * k
      curY += (targetY - curY) * k
      apply()
      if (!hovering && Math.abs(curX) < SETTLE_PX && Math.abs(curY) < SETTLE_PX) {
        curX = 0
        curY = 0
        apply()
        unsubTicker?.()
        unsubTicker = null
      }
    }

    const ensureTicking = () => {
      if (!unsubTicker) unsubTicker = subscribeTicker(tick)
    }

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      const dist = Math.hypot(dx, dy)
      // Pull toward the cursor, fading across `radius`, capped at 4px.
      const falloff = Math.max(0, 1 - dist / (radius * 2))
      const rawX = dx * strength * (0.5 + falloff)
      const rawY = dy * strength * (0.5 + falloff)
      const mag = Math.hypot(rawX, rawY)
      const clamp = mag > MAX_ELEMENT_PX ? MAX_ELEMENT_PX / mag : 1
      targetX = rawX * clamp
      targetY = rawY * clamp
      ensureTicking()
    }

    const onEnter = () => {
      hovering = true
      el.addEventListener('pointermove', onMove, { passive: true })
      ensureTicking()
    }

    const onLeave = () => {
      hovering = false
      el.removeEventListener('pointermove', onMove)
      targetX = 0
      targetY = 0
      ensureTicking() // spring back; tick() unsubscribes itself once settled
    }

    el.addEventListener('pointerenter', onEnter)
    el.addEventListener('pointerleave', onLeave)

    return () => {
      el.removeEventListener('pointerenter', onEnter)
      el.removeEventListener('pointerleave', onLeave)
      el.removeEventListener('pointermove', onMove)
      unsubTicker?.()
      unsubTicker = null
      el.classList.remove('magnetic')
      el.style.removeProperty('--mag-x')
      el.style.removeProperty('--mag-y')
      if (label) {
        label.style.removeProperty('--mag-lx')
        label.style.removeProperty('--mag-ly')
      }
    }
  }, [ref, reduced, strength, radius])
}
