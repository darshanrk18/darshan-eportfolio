'use client'

/**
 * Fire-once IntersectionObserver hook (spec §3.3).
 * Defaults: threshold 0.35, rootMargin '0px 0px -10% 0px'. Once `inView`
 * turns true it never reverts. Under reduced motion (or missing IO support)
 * it resolves true immediately on mount so content is never gated.
 *
 * Usage:
 *   const { ref, inView } = useInViewOnce<HTMLDivElement>()
 *   <div ref={ref} className={inView ? 'fade-up' : 'opacity-0'} />
 */

import { useCallback, useRef, useState } from 'react'
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

  const skip = disabled || reduced

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
          if (entries.some((e) => e.isIntersecting)) {
            firedRef.current = true
            setInView(true)
            observer.disconnect()
            observerRef.current = null
          }
        },
        { threshold, rootMargin },
      )
      observer.observe(node)
      observerRef.current = observer
    },
    [skip, threshold, rootMargin],
  )

  // Reduced-motion arriving after mount also unlocks content.
  if (skip && !firedRef.current && typeof window !== 'undefined') {
    firedRef.current = true
    // Defer to avoid setState-in-render.
    queueMicrotask(() => setInView(true))
  }

  return { ref, inView }
}
