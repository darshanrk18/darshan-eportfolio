'use client'

/**
 * Scroll-progress bar (v2 §4.2 item 4; v3 §1.7 / §5): a 2px `--accent-signal`
 * bar across the very top of the viewport = scroll progress (a passive scroll
 * listener, batched to one rAF write of scaleX: transform-only). Champagne in
 * SCREEN, comic red in PRINT — the token switches with html[data-edition].
 * Plain listeners rather than motion's useScroll, which would put motion's
 * scroll tracking into the '/' first load for this one bar. One coalesced
 * rAF per change, like CursorHalo (not the shared ticker: nothing runs at rest).
 *
 * v3: the `compiled NN%` readout is gone (clutter law: no build evidence at
 * rest). The bar itself carries no number and stays.
 */

import { useEffect, useRef } from 'react'

export default function ScrollProgress() {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const update = () => {
      raf = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      el.style.transform = `scaleX(${p})`
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    const ro = new ResizeObserver(schedule)
    ro.observe(document.documentElement)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      ro.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-component="ScrollProgress"
      data-island="client"
      className="fixed inset-x-0 top-0 h-[2px] origin-left bg-signal"
      style={{ transform: 'scaleX(0)', zIndex: 'var(--z-nav)' }}
    />
  )
}
