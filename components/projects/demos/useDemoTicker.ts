'use client'

/**
 * Shared demo-loop hook (spec §6.4 rule 5): rides the ONE shared ticker,
 * subscribes only while the demo's root element is on-screen, and stays
 * fully unsubscribed under reduced motion (demos render their final frame
 * instead). Never calls requestAnimationFrame directly.
 */

import { useEffect, useRef, useState } from 'react'
import { subscribeTicker, type TickerCallback } from '@/lib/motion/ticker'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'

export function useDemoTicker(
  onTick: TickerCallback,
  options: { disabled?: boolean } = {},
): { ref: (node: HTMLElement | null) => void; reduced: boolean } {
  const reduced = usePrefersReducedMotion()
  const disabled = options.disabled ?? false
  const tickRef = useRef(onTick)
  tickRef.current = onTick

  const [node, setNode] = useState<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!node) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => setVisible(entries.some((e) => e.isIntersecting)),
      { threshold: 0.05 },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [node])

  useEffect(() => {
    if (reduced || disabled || !visible) return
    return subscribeTicker((dt, now) => tickRef.current(dt, now))
  }, [reduced, disabled, visible])

  return { ref: setNode, reduced }
}
