'use client'

/**
 * §5.1 — the ONE sanctioned immediate-bundle spend: Lenis smooth scroll.
 *
 * Mounted ONCE in app/page.tsx (NEVER app/layout.tsx — /cv stays zero-JS).
 * Renders nothing; it only owns the Lenis lifecycle:
 *
 * - Instantiates only on fine pointers with motion not reduced (touch and
 *   `html[data-motion="reduced"]` hard-off → getLenis() stays null and every
 *   caller keeps its native fallback).
 * - Driven by the shared ticker (`subscribeTicker` → `lenis.raf(now)`), so
 *   there is no second rAF loop and the ticker's `document.hidden` pause and
 *   battery guard apply automatically.
 * - Live-destroys when reduced motion turns on mid-session (the
 *   `usePrefersReducedMotion` subscription re-runs the effect), and destroys
 *   + `setLenis(null)` on unmount.
 *
 * No velocity bus (§5.1 correction): Lenis animates NATIVE scrollTop, so the
 * glyph field's uTurb (window.scrollY deltas in its ticker callback) and the
 * scroll listeners (the top bar's progress line) keep working untouched and
 * simply feel authored.
 */

import { useEffect } from 'react'
import Lenis from 'lenis'
import { setLenis } from '@/lib/motion/lenis'
import { subscribeTicker } from '@/lib/motion/ticker'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'

export default function LenisProvider(): null {
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (reduced) return
    // Touch never instantiates (§5.1) — coarse pointers keep native scroll.
    if (!window.matchMedia('(pointer: fine)').matches) return
    // The pre-paint script may have set reduced before the store synced.
    if (document.documentElement.dataset.motion === 'reduced') return

    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true })
    setLenis(lenis)
    const unsubscribe = subscribeTicker((_dt, now) => {
      lenis.raf(now)
    })

    return () => {
      unsubscribe()
      setLenis(null)
      lenis.destroy()
    }
  }, [reduced])

  return null
}
