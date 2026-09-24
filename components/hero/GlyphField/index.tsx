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
 * - Reports the effective tier to the store (footer readout) + GA4.
 */

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'
import { detectTier, type GlyphTier } from '@/lib/perf/tiers'
import { useSignalStore } from '@/lib/state/store'
import { trackGlyphFieldTier } from '@/lib/utils/analytics'
import StaticConstellation from '../StaticConstellation'
import type { ActiveTier } from './tiers'

const Scene = dynamic(() => import('./Scene'), { ssr: false })

/** Ladder floor / context loss is permanent for the session (§8.3). */
let sessionFloor = false

export default function GlyphField() {
  const reduced = usePrefersReducedMotion()
  const setGlyphTier = useSignalStore((s) => s.setGlyphTier)

  const [tier, setTier] = useState<GlyphTier | null>(null)
  const [floored, setFloored] = useState(false)
  const [visible, setVisible] = useState(true)
  const [ready, setReady] = useState(false)
  const [swapped, setSwapped] = useState(false)

  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const swapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const trackedTierRef = useRef<GlyphTier | null>(null)

  // Detect tier after first paint: idle callback, once fonts are ready so the
  // atlas draws with JetBrains Mono. Never blocks or affects LCP.
  useEffect(() => {
    let cancelled = false
    let idleId: number | null = null
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const decide = () => {
      if (cancelled) return
      const detected: GlyphTier = sessionFloor ? 0 : detectTier()
      setTier(detected)
      if (sessionFloor) setFloored(true)
      if (detected > 0) void import('./Scene') // prefetch the deferred chunk
    }

    const schedule = () => {
      if (cancelled) return
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
    }
  }, [])

  // Unmount the scene while the hero is ≥1 viewport away (§5.5).
  useEffect(() => {
    const node = wrapperRef.current
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
    return () => observer.disconnect()
  }, [])

  // Report the effective tier to the store (footer) + analytics, once per value.
  const effectiveTier: GlyphTier | null = tier === null ? null : reduced || floored ? 0 : tier
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

  return (
    <div
      ref={wrapperRef}
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
