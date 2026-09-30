'use client'

/**
 * Fire-once IntersectionObserver hook (spec §3.3).
 * Defaults: threshold 0.35, rootMargin '0px 0px -10% 0px'. Once `inView`
 * turns true it never reverts. Under reduced motion (or missing IO support)
 * it resolves true immediately on mount so content is never gated.
 *
 * v3 director call (l): while a full-screen overlay covers the page
 * (store.overlayOpen — the edition picker, the PRINT intro, the guide
 * surface) the hook DEFERS firing: an element that enters view under the
 * overlay reports `inView` only once the overlay closes, so entry
 * choreography never plays unseen. The reduced-motion / no-IO shortcut is
 * not deferred (nothing animates there).
 *
 * Usage:
 *   const { ref, inView } = useInViewOnce<HTMLDivElement>()
 *   <div ref={ref} className={inView ? 'fade-up' : 'opacity-0'} />
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSignalStore } from '@/lib/state/store'
import { usePrefersReducedMotion } from './useReducedMotion'

export interface UseInViewOnceOptions {
  threshold?: number
  rootMargin?: string
  /** true ⇒ report inView immediately (no observer). */
  disabled?: boolean
}

export function useInViewOnce<T extends Element = HTMLElement>(
  options: UseInViewOnceOptions = {},
): { ref: (node: T | null) => void; inView: boolean } {
  const { threshold = 0.35, rootMargin = '0px 0px -10% 0px', disabled = false } = options
  const reduced = usePrefersReducedMotion()
  const [inView, setInView] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const firedRef = useRef(false)
  /** Entered view while an overlay was up — fire when it closes. */
  const pendingRef = useRef(false)

  const skip = disabled || reduced

  const fire = useCallback(() => {
    if (firedRef.current) return
    firedRef.current = true
    pendingRef.current = false
    setInView(true)
    observerRef.current?.disconnect()
    observerRef.current = null
  }, [])

  const ref = useCallback(
    (node: T | null) => {
      observerRef.current?.disconnect()
      observerRef.current = null
      if (firedRef.current || node === null) return

      if (skip || typeof IntersectionObserver === 'undefined') {
        firedRef.current = true
        setInView(true)
        return
      }

      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return
          if (useSignalStore.getState().overlayOpen) {
            // Under the picker / intro / guide: wait for the overlay to close.
            pendingRef.current = true
            return
          }
          fire()
        },
        { threshold, rootMargin },
      )
      observer.observe(node)
      observerRef.current = observer
    },
    [skip, threshold, rootMargin, fire],
  )

  // Release a deferred reveal the moment the overlay closes.
  useEffect(
    () =>
      useSignalStore.subscribe((state, prev) => {
        if (prev.overlayOpen && !state.overlayOpen && pendingRef.current) fire()
      }),
    [fire],
  )

  // Reduced-motion arriving after mount also unlocks content.
  if (skip && !firedRef.current && typeof window !== 'undefined') {
    firedRef.current = true
    // Defer to avoid setState-in-render.
    queueMicrotask(() => setInView(true))
  }

  return { ref, inView }
}
