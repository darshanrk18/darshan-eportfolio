'use client'

/**
 * §5.2 scroll choreography — the SectionHeader client sub-component (~0.5KB).
 *
 * Wraps the RSC-rendered header content (passed as children, so nothing else
 * joins the client bundle) and arms the two one-shot entrance touches:
 *
 * 1. Header-rule draw — adds `shdr-armed` after mount (start state: rule
 *    scaleX(0), ticks hidden) and `shdr-in` on first viewport entry (CSS
 *    transitions draw the rule over 600ms --ease-out-expo, ticks fade after).
 * 2. Index count-up — the `[data-shdr-index]` span counts 00 → NN in 8 steps
 *    over 400ms (tabular numerals, zero width shift). The final value is
 *    server-rendered; this only swaps text content while animating.
 * 3. (§6.6.3) Contact's serif headline gets `shdr-serif` so its 1.02 → 1
 *    settle rides the same armed/in classes.
 * 4. (§6.6.1, chrome agent) The mono filename `[data-shdr-file]` runs its
 *    ONE-TIME 400ms character decode via lib/motion/decode on first entry.
 *
 * Server markup IS the finished state: classes only ADD the animated start
 * state after hydration, so no-JS and reduced motion render finals. Styles
 * live in styles/v2/scroll.css.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { decodeText } from '@/lib/motion/decode'
import { useInViewOnce } from '@/lib/motion/useInViewOnce'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'

const COUNT_STEPS = 8
const COUNT_MS = 400

export interface SectionHeaderFxProps {
  /** Final index text ('01' … '05') — server-rendered inside children. */
  index: string
  serif?: boolean
  children: ReactNode
}

export default function SectionHeaderFx({ index, serif = false, children }: SectionHeaderFxProps) {
  const reduced = usePrefersReducedMotion()
  const [armed, setArmed] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const { ref: ioRef, inView } = useInViewOnce<HTMLDivElement>({ disabled: reduced })

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node
      ioRef(node)
    },
    [ioRef],
  )

  // Arm only after hydration (never in server markup) and never under
  // reduced motion — un-armed markup is already the finished state.
  useEffect(() => {
    if (!reduced) setArmed(true)
  }, [reduced])

  // Index count-up: 00 → NN, 8 text swaps over 400ms, final text restored.
  useEffect(() => {
    if (!armed || !inView || reduced) return
    const el = rootRef.current?.querySelector<HTMLElement>('[data-shdr-index]')
    const finalNum = Number.parseInt(index, 10)
    if (!el || !Number.isFinite(finalNum)) return

    let step = 0
    el.textContent = '00'
    const interval = window.setInterval(() => {
      step += 1
      if (step >= COUNT_STEPS) {
        el.textContent = index
        window.clearInterval(interval)
        return
      }
      el.textContent = String(Math.round((finalNum * step) / COUNT_STEPS)).padStart(2, '0')
    }, COUNT_MS / COUNT_STEPS)

    return () => {
      window.clearInterval(interval)
      el.textContent = index
    }
  }, [armed, inView, reduced, index])

  // §6.6.1 filename decode — the section's ONE rationed mono decode: the
  // aria-hidden `[data-shdr-file]` span scrambles from the terminal glyph
  // set and settles left→right over 400ms on first entry (chrome agent; the
  // sr-only twin in SectionHeader.tsx keeps the announced text stable).
  useEffect(() => {
    if (!armed || !inView || reduced) return
    const el = rootRef.current?.querySelector<HTMLElement>('[data-shdr-file]')
    const final = el?.textContent
    if (!el || !final) return
    const cancel = decodeText(final, (text) => {
      el.textContent = text
    })
    return cancel
  }, [armed, inView, reduced])

  const classes = [
    'mb-12',
    armed ? 'shdr-armed' : '',
    armed && inView ? 'shdr-in' : '',
    serif ? 'shdr-serif' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div ref={setRefs} className={classes}>
      {children}
    </div>
  )
}
