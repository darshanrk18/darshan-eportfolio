'use client'

/**
 * Living Glyph Field island (spec §5.5) — the orchestrator.
 *
 * SSR/first paint: renders the deterministic StaticConstellation SVG, so the
 * hero is never empty and T0 is the permanent, always-first fallback.
 * After mount (idle + fonts ready) it detects the device tier (§8.3); at T1+
 * it lazily loads the R3F scene, fades it in over 400ms, then hides the SVG.
 *
 * - Unmounts the scene entirely while the hero is ≥1 viewport off-screen.
 * - Reduced motion (live) ⇒ static. Context loss / ladder floor ⇒ static for
 *   the rest of the session (module flag: never re-upgrades, spec §8.3).
 * - Reports the effective tier to the store (Build info readout) + GA4.
 *
 * v3: a SCREEN-only device (§3 Hero). Under PRINT the island renders
 * NOTHING (no static SVG, no scene) — it reads html[data-edition] after
 * mount and follows switches through a MutationObserver; the pre-hydration
 * SVG is also hidden by CSS for stored-PRINT visitors (styles/v3/hero.css).
 * Density: the field sits behind the glass stage at low density — the
 * mounted tier is capped at DENSITY_CAP (tier detection still decides T0).
 */

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { EDITION_ATTR, PICK_ATTR, getCurrentEdition, type Edition } from '@/lib/commands/context'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'
import { detectTier, type GlyphTier } from '@/lib/perf/tiers'
import { useSignalStore } from '@/lib/state/store'
import { trackGlyphFieldTier } from '@/lib/utils/analytics'
import StaticConstellation from '../StaticConstellation'
import type { ActiveTier } from './tiers'
import { islandUnavailable } from '@/lib/utils/island'

const Scene = dynamic(() => import('./Scene').catch(islandUnavailable<typeof import('./Scene')>), { ssr: false })

/** Ladder floor / context loss is permanent for the session (§8.3). */
let sessionFloor = false

/** v3: low density behind the stage — never mount above T1 (900 sprites). */
const DENSITY_CAP: ActiveTier = 1

export default function GlyphField() {
  const reduced = usePrefersReducedMotion()
  const setGlyphTier = useSignalStore((s) => s.setGlyphTier)

  const [tier, setTier] = useState<GlyphTier | null>(null)
  const [edition, setEdition] = useState<Edition | null>(null)
  const [floored, setFloored] = useState(false)
  const [visible, setVisible] = useState(true)
  const [ready, setReady] = useState(false)
  const [swapped, setSwapped] = useState(false)

  // A callback ref: PRINT unmounts the wrapper and SCREEN renders a new one,
  // so the visibility observer must follow whichever node is current.
  const [wrapper, setWrapper] = useState<HTMLDivElement | null>(null)
  const swapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const trackedTierRef = useRef<GlyphTier | null>(null)

  // v3: follow html[data-edition] — PRINT unmounts everything (render null).
  useEffect(() => {
    const sync = () => setEdition(getCurrentEdition())
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: [EDITION_ATTR] })
    return () => observer.disconnect()
  }, [])

  // Detect tier after first paint: idle callback, once fonts are ready so the
  // atlas draws with the edition's mono face. Never blocks or affects LCP.
  useEffect(() => {
    let cancelled = false
    let idleId: number | null = null
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let pickObserver: MutationObserver | null = null

    const decide = () => {
      if (cancelled) return
      const detected: GlyphTier = sessionFloor ? 0 : detectTier()
      setTier(detected)
      if (sessionFloor) setFloored(true)
      // Prefetch the WebGL chunk only where it will draw: SCREEN (PRINT never
      // mounts the scene; a later switch to SCREEN loads it on render).
      if (detected > 0 && getCurrentEdition() === 'screen') void import('./Scene').catch(() => {})
    }

    const schedule = () => {
      if (cancelled) return
      // A first visit opens on the edition picker, which covers the hero:
      // nothing behind it needs WebGL, and the chunk would compete with the
      // picker's first paint. Wait for the choice (data-pick cleared).
      const html = document.documentElement
      if (html.getAttribute(PICK_ATTR) === '1') {
        pickObserver = new MutationObserver(() => {
          if (html.getAttribute(PICK_ATTR) === '1') return
          pickObserver?.disconnect()
          pickObserver = null
          schedule()
        })
        pickObserver.observe(html, { attributes: true, attributeFilter: [PICK_ATTR] })
        return
      }
      const w = window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
      }
      if (typeof w.requestIdleCallback === 'function') {
        idleId = w.requestIdleCallback(decide, { timeout: 2000 })
      } else {
        timeoutId = setTimeout(decide, 300)
      }
    }

    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
    if (fonts?.ready) {
      fonts.ready.then(schedule, schedule)
    } else {
      schedule()
    }

    return () => {
      cancelled = true
      const w = window as Window & { cancelIdleCallback?: (id: number) => void }
      if (idleId !== null && typeof w.cancelIdleCallback === 'function') {
        w.cancelIdleCallback(idleId)
      }
      if (timeoutId !== null) clearTimeout(timeoutId)
      pickObserver?.disconnect()
    }
  }, [])

  // Unmount the scene while the hero is ≥1 viewport away (§5.5).
  useEffect(() => {
    const node = wrapper
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((e) => e.isIntersecting)
        setVisible(isVisible)
        if (!isVisible) {
          // Restore the SVG so the hero is populated the moment it returns.
          setReady(false)
          setSwapped(false)
        }
      },
      { rootMargin: '100% 0px 100% 0px' }
    )
    observer.observe(node)
    return () => {
      observer.disconnect()
      // The node is gone (a switch to PRINT): when SCREEN brings a new one
      // back, start from the SVG and wait for its first visibility report.
      setVisible(false)
      setReady(false)
      setSwapped(false)
    }
  }, [wrapper])

  // Report the effective tier to the store (Build info) + analytics, once per
  // value. The mounted tier is the detected tier capped at DENSITY_CAP.
  const effectiveTier: GlyphTier | null =
    tier === null ? null : reduced || floored ? 0 : (Math.min(tier, DENSITY_CAP) as GlyphTier)
  useEffect(() => {
    if (effectiveTier === null) return
    setGlyphTier(effectiveTier)
    if (trackedTierRef.current !== effectiveTier) {
      trackedTierRef.current = effectiveTier
      trackGlyphFieldTier(effectiveTier)
    }
  }, [effectiveTier, setGlyphTier])

  useEffect(() => {
    return () => {
      if (swapTimerRef.current !== null) clearTimeout(swapTimerRef.current)
    }
  }, [])

  const handleReady = () => {
    setReady(true)
    if (swapTimerRef.current !== null) clearTimeout(swapTimerRef.current)
    swapTimerRef.current = setTimeout(() => setSwapped(true), 450)
  }

  const handleTierChange = (next: GlyphTier) => {
    if (next === 0) {
      handleTeardown()
      return
    }
    setTier(next)
  }

  const handleTeardown = () => {
    sessionFloor = true
    setFloored(true)
    setTier(0)
    setReady(false)
    setSwapped(false)
  }

  const active = effectiveTier !== null && effectiveTier > 0

  // PRINT: the field does not exist (P1 is a comic cover, §3).
  if (edition === 'print') return null

  return (
    <div
      ref={setWrapper}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 'var(--z-canvas)' }}
      data-component="GlyphField"
      data-island="client"
    >
      {!swapped && <StaticConstellation />}
      {active && visible && (
        <div
          className="absolute inset-0"
          style={{
            opacity: ready ? 1 : 0,
            transition: 'opacity 400ms var(--ease-out-expo)',
          }}
        >
          <Scene
            initialTier={effectiveTier as ActiveTier}
            onReady={handleReady}
            onTierChange={handleTierChange}
            onTeardown={handleTeardown}
          />
        </div>
      )}
    </div>
  )
}
