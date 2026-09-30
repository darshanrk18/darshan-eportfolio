'use client'

/**
 * The career graph's draw-in trigger (S5 motion note: "the career graph
 * draws in from the NEXT marker downward, one node every 90 ms"; P5: the
 * NEXT ISSUE node pulses once on load). The RSC renders the graph in its
 * finished state; this ~0.3 KB island arms the entrance on mount
 * ([data-armed] on the graph root) and plays it once the graph is in view
 * ([data-drawn]). The choreography itself is CSS (styles/v3/experience.css,
 * per-entry `--k` stagger). No-JS: the finished state. Reduced motion:
 * useInViewOnce resolves at mount and the global rule collapses the
 * animations, so the graph simply appears.
 *
 * v2's scroll-linked SVG rail (CareerDag.client + motion's useScroll) is
 * retired: both frames draw the rail as static lines.
 */

import { useCallback, useEffect, useRef } from 'react'
import { useInViewOnce } from '@/lib/motion/useInViewOnce'

export default function CareerDraw() {
  const nodeRef = useRef<HTMLSpanElement | null>(null)
  const { ref, inView } = useInViewOnce<HTMLSpanElement>({ threshold: 0.1 })

  const setRef = useCallback(
    (node: HTMLSpanElement | null) => {
      nodeRef.current = node
      ref(node)
    },
    [ref]
  )

  useEffect(() => {
    const root = nodeRef.current?.closest<HTMLElement>('[data-dag-root]')
    if (!root) return
    root.setAttribute('data-armed', '1')
  }, [])

  useEffect(() => {
    if (!inView) return
    const root = nodeRef.current?.closest<HTMLElement>('[data-dag-root]')
    root?.setAttribute('data-drawn', '1')
  }, [inView])

  return (
    <span
      ref={setRef}
      aria-hidden="true"
      className="xp-draw-sentinel"
      data-component="CareerDraw"
      data-island="client"
    />
  )
}
