'use client'

/**
 * v2 §10.3 client-boundary wrapper for the footer build-complete payoff.
 * `dynamic()` splits BuildComplete.client out of the immediate bundle; the
 * chunk loads only when the footer approaches the viewport (one IO, +200px
 * margin) — §12.1 ladder step 3 ("in view"). No-JS: never mounts, footer is
 * exactly v1.
 *
 * SEEN is captured at module-eval time — hydration bundles evaluate before
 * any component effect, so this read happens strictly before BootOverlay's
 * finalize() can write the flag during THIS visit. That makes the
 * `--incremental` variant honest: it only shows when a previous visit
 * completed a boot.
 */

import dynamic from 'next/dynamic'
import { SEEN_STORAGE_KEY } from '@/lib/commands/context'
import { useInViewOnce } from '@/lib/motion/useInViewOnce'

const BuildComplete = dynamic(() => import('./BuildComplete.client'), { ssr: false })

const seenBeforeVisit = (() => {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(SEEN_STORAGE_KEY) === '1'
  } catch {
    return false
  }
})()

export default function BuildCompleteIsland() {
  // Zero-height sentinel: threshold must be 0 (a zero-area target never
  // reaches a positive intersection ratio).
  const { ref, inView } = useInViewOnce<HTMLDivElement>({
    threshold: 0,
    rootMargin: '0px 0px 200px 0px',
  })
  return (
    <div ref={ref} data-component="BuildComplete" data-island="client">
      {inView ? <BuildComplete incremental={seenBeforeVisit} /> : null}
    </div>
  )
}
