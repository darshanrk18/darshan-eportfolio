'use client'

/**
 * Scroll-progress bar (v2 §4.2 item 4; v3 §1.7 / §5): a 2px `--accent-signal`
 * bar across the very top of the viewport = scroll progress (Motion
 * useScroll → scaleX, transform-only). Champagne in SCREEN, comic red in
 * PRINT — the token switches with html[data-edition].
 *
 * v3: the `compiled NN%` readout is gone (clutter law: no build evidence at
 * rest). The bar itself carries no number and stays.
 */

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
