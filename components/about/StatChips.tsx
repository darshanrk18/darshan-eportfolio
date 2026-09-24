'use client'

/**
 * §4.4 About — stat chips rendered as inline code tokens:
 * `next: AWS · Jan 2027` · `users_served: 10k+` · `students_taught: 300+`
 * (the old grade chip is removed per CONTENT_FINAL.)
 *
 * The numeric part counts up once on scroll-enter (1.2s ease-out-expo, per
 * motion tokens); instant under reduced motion; the `next` chip is static
 * text. The server renders the real final values (no-JS visitors always see
 * truth) and every chip carries the real value in aria-label. The container
 * is a wormhole block mapped to the `stats` source line.
 */

import { useEffect, useRef, useState } from 'react'
import { animate } from 'motion/react'
import { useInViewOnce } from '@/lib/motion/useInViewOnce'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'
import { COUNT_UP_S, EASE_OUT_EXPO } from '@/lib/motion/tokens'
import { profile } from '@/lib/data/profile'

interface Chip {
  key: string
  label: string
  target: number
  format: (v: number) => string
  /** Real, owner-verified display value (SSR + aria-label). */
  final: string
}

const NEXT_FINAL = `${profile.incoming.companyShort} · ${profile.incoming.start}`

const CHIPS: readonly Chip[] = [
  {
    // Static chip — no numeric count-up; format ignores the animated value.
    key: 'next',
    label: 'next',
    target: 0,
    format: () => NEXT_FINAL,
    final: NEXT_FINAL,
  },
  {
    key: 'users',
    label: 'users_served',
    target: 10,
    format: (v) => `${Math.round(v)}k+`,
    final: '10k+',
  },
  {
    key: 'students',
    label: 'students_taught',
    target: Number.parseInt(profile.education.ta.students, 10),
    format: (v) => `${Math.round(v)}+`,
    final: profile.education.ta.students,
  },
]

const FINALS = CHIPS.map((c) => c.final)

export default function StatChips() {
  const reduced = usePrefersReducedMotion()
  const { ref, inView } = useInViewOnce<HTMLDivElement>()
  const [values, setValues] = useState<string[]>(FINALS)
  const startedRef = useRef(false)
  const armedRef = useRef(false)

  // After hydration, arm the count-up at zero — but only while the chips are
  // still off-screen and motion is allowed (SSR markup keeps final values).
  useEffect(() => {
    if (reduced || inView || startedRef.current || armedRef.current) return
    armedRef.current = true
    setValues(CHIPS.map((c) => c.format(0)))
  }, [reduced, inView])

  // Fire once on scroll-enter.
  useEffect(() => {
    if (!inView || startedRef.current) return
    startedRef.current = true
    if (reduced || !armedRef.current) {
      setValues(FINALS)
      return
    }
    const controls = CHIPS.map((chip, i) =>
      animate(0, chip.target, {
        duration: COUNT_UP_S,
        ease: EASE_OUT_EXPO,
        onUpdate: (v) => {
          setValues((prev) => {
            const next = [...prev]
            next[i] = chip.format(v)
            return next
          })
        },
        onComplete: () => {
          setValues((prev) => {
            const next = [...prev]
            next[i] = chip.final
            return next
          })
        },
      })
    )
    return () => controls.forEach((c) => c.stop())
  }, [inView, reduced])

  return (
    <div
      ref={ref}
      data-line="stats"
      tabIndex={0}
      aria-describedby="about-wormhole-hint"
      className="flex flex-wrap gap-3"
      data-component="StatChips"
      data-island="client"
    >
      {CHIPS.map((chip, i) => (
        <code key={chip.key} className="type-code hairline rounded-chip bg-raised px-3 py-1.5">
          {/* aria-label is PROHIBITED on role-less <code> (axe
              aria-prohibited-attr) — the real value ships as sr-only text
              instead, and the count-up remains aria-hidden. */}
          <span className="sr-only">{`${chip.label}: ${chip.final}`}</span>
          <span aria-hidden="true">
            <span className="text-secondary">{chip.label}:</span>{' '}
            <span className="text-primary">{values[i]}</span>
          </span>
        </code>
      ))}
    </div>
  )
}
