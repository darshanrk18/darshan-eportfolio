'use client'

/**
 * §4.7 big number — `300+` in the display-num scale, count-up once on scroll
 * enter (1.2s, ease-out-expo, per §3.2). Server renders the final value so the
 * number is real without JS; the real value always lives in aria-label.
 * Instant under reduced motion.
 */

import { useEffect, useRef, useState } from 'react'
import { animate } from 'motion/react'
import { COUNT_UP_S, EASE_OUT_EXPO } from '@/lib/motion/tokens'
import { useInViewOnce } from '@/lib/motion/useInViewOnce'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'

const ACCENT_CLASS: Record<'signal' | 'electron' | 'amber' | 'magenta', string> = {
  signal: 'text-signal',
  electron: 'text-electron',
  amber: 'text-amber',
  magenta: 'text-magenta',
}

export interface BigNumberProps {
  /** e.g. '300+' — leading digits count up, the suffix rides along. */
  value: string
  accent: 'signal' | 'electron' | 'amber' | 'magenta'
  /** Accessible label (the real value, for screen readers). */
  label: string
}

export default function BigNumber({ value, accent, label }: BigNumberProps) {
  const reduced = usePrefersReducedMotion()
  const { ref, inView } = useInViewOnce<HTMLParagraphElement>()
  const [display, setDisplay] = useState(value)
  const played = useRef(false)

  useEffect(() => {
    if (!inView || reduced || played.current) return
    const match = /^(\d+)(.*)$/.exec(value)
    if (!match) return
    played.current = true
    const target = Number(match[1])
    const suffix = match[2]
    const controls = animate(0, target, {
      duration: COUNT_UP_S,
      ease: EASE_OUT_EXPO,
      onUpdate: (v) => setDisplay(`${Math.round(v)}${suffix}`),
    })
    return () => controls.stop()
  }, [inView, reduced, value])

  return (
    <p ref={ref} className={`type-display-num ${ACCENT_CLASS[accent]}`} aria-label={label}>
      <span aria-hidden="true">{display}</span>
    </p>
  )
}
