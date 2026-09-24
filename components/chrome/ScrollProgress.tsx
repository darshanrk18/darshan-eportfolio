'use client'

/**
 * Build-progress bar (spec §4.2 item 4): a 2px --accent-signal bar across the
 * very top of the viewport = scroll progress (Motion useScroll → scaleX,
 * transform-only), plus a named `CompiledReadout` — the `compiled NN%`
 * --type-label-xs readout the Navbar places at the far right of the bar's
 * row (tabular numerals, updates at most 4×/s).
 */

import { useEffect, useRef, useState } from 'react'
import { LazyMotion, domAnimation, m, useScroll } from 'motion/react'

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll()

  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        aria-hidden="true"
        data-component="ScrollProgress"
        data-island="client"
        className="fixed inset-x-0 top-0 h-[2px] origin-left bg-signal"
        style={{ scaleX: scrollYProgress, zIndex: 'var(--z-nav)' }}
      />
    </LazyMotion>
  )
}

/** `compiled NN%` readout — throttled to 4 updates/s max (§4.2). */
export function CompiledReadout() {
  const { scrollYProgress } = useScroll()
  const [pct, setPct] = useState(0)
  const lastUpdate = useRef(0)
  const trailing = useRef<number | null>(null)

  useEffect(() => {
    const apply = () => {
      lastUpdate.current = performance.now()
      setPct(Math.round(scrollYProgress.get() * 100))
    }
    apply()
    const unsubscribe = scrollYProgress.on('change', () => {
      const elapsed = performance.now() - lastUpdate.current
      if (elapsed >= 250) {
        apply()
      } else if (trailing.current === null) {
        trailing.current = window.setTimeout(() => {
          trailing.current = null
          apply()
        }, 250 - elapsed)
      }
    })
    return () => {
      unsubscribe()
      if (trailing.current !== null) window.clearTimeout(trailing.current)
    }
  }, [scrollYProgress])

  return (
    <span className="type-label-xs text-secondary" aria-hidden="true">
      compiled {pct}%
    </span>
  )
}
