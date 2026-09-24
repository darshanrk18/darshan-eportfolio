'use client'

/**
 * v2 §9.1 git-blame cross-highlighting + §9.2 HEAD dash-march gating.
 *
 * Renders the `git blame: off ⇄ on` mono toggle above the DAG. While on, ONE
 * delegated listener pair on [data-dag-root] maps hover/focus over the RSC
 * bullet rows (each carries data-blame + data-skills, from ./blame) to
 * store.setFocusedSkills(ids) — the Skills diagram subscribes to focusedSkills
 * and marks those nodes [data-blamed] (store-only contract, §9.1). The
 * `jump to diagram ↑` chip (RSC markup, CSS-revealed on row hover/focus)
 * rides the same delegated click → Lenis-eased scrollToAnchor('#skills'),
 * then pulses the rings once on arrival via a data-blame-pulse attribute.
 *
 * §9.2: while the Experience section is in view, an IO here sets
 * [data-march='1'] on the DAG root, which arms the aws-future HEAD marker's
 * 3s dashed-stroke march (styles/v2/experience.css).
 *
 * Hidden under reduced motion (spec rule: the toggle doesn't render; the
 * march is absent). Touch: tapping a bullet focuses it (rows get tabindex=0
 * while blame is on) which triggers the same highlight; the chip is the jump
 * affordance.
 */

import { useEffect, useRef, useState } from 'react'
import { scrollToAnchor } from '@/lib/commands/context'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'
import { useSignalStore } from '@/lib/state/store'

/** Lenis anchor glide is 1.1s (§5.1) — pulse fires just after arrival. */
const JUMP_ARRIVAL_MS = 1150
/** blame-ring-pulse runs 600ms; attribute is held slightly longer. */
const PULSE_MS = 700

function dagRootFrom(el: HTMLElement | null): HTMLElement | null {
  return el?.closest('section')?.querySelector<HTMLElement>('[data-dag-root]') ?? null
}

export default function GitBlame() {
  const reduced = usePrefersReducedMotion()
  const [on, setOn] = useState(false)
  const btnRef = useRef<HTMLButtonElement | null>(null)
  /** True from jump-chip click until the arrival pulse ends — suppresses the
   *  hover/focus-out clear so the rings survive the scroll. */
  const jumpingRef = useRef(false)

  // §9.2 — march runs ONLY while the section is in view (IO toggles the attr).
  useEffect(() => {
    if (reduced) return
    const section = btnRef.current?.closest('section')
    const root = dagRootFrom(btnRef.current)
    if (!section || !root) return
    if (typeof IntersectionObserver === 'undefined') {
      root.setAttribute('data-march', '1')
      return () => root.removeAttribute('data-march')
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) root.setAttribute('data-march', '1')
        else root.removeAttribute('data-march')
      },
      { threshold: 0 }
    )
    io.observe(section)
    return () => {
      io.disconnect()
      root.removeAttribute('data-march')
    }
  }, [reduced])

  // §9.1 — delegated blame listeners while the toggle is on.
  useEffect(() => {
    if (reduced || !on) return
    const root = dagRootFrom(btnRef.current)
    if (!root) return
    const rows = Array.from(root.querySelectorAll<HTMLElement>('[data-blame]'))
    root.setAttribute('data-blame-on', '1')
    rows.forEach((r) => r.setAttribute('tabindex', '0'))

    const setFocusedSkills = (ids: string[]) => useSignalStore.getState().setFocusedSkills(ids)
    let hotRow: HTMLElement | null = null
    const timers: number[] = []

    const rowFrom = (t: EventTarget | null) =>
      t instanceof Element ? t.closest<HTMLElement>('[data-blame]') : null
    const apply = (row: HTMLElement) => {
      if (row === hotRow) return
      hotRow = row
      setFocusedSkills((row.dataset.skills ?? '').split(',').filter(Boolean))
    }
    const clear = (row: HTMLElement, related: EventTarget | null) => {
      if (related instanceof Node && row.contains(related)) return
      if (row === hotRow) hotRow = null
      if (!jumpingRef.current) setFocusedSkills([])
    }

    const onPointerOver = (e: PointerEvent) => {
      const row = rowFrom(e.target)
      if (row) apply(row)
    }
    const onPointerOut = (e: PointerEvent) => {
      const row = rowFrom(e.target)
      if (row) clear(row, e.relatedTarget)
    }
    const onFocusIn = (e: FocusEvent) => {
      const row = rowFrom(e.target)
      if (row) apply(row)
    }
    const onFocusOut = (e: FocusEvent) => {
      const row = rowFrom(e.target)
      if (row) clear(row, e.relatedTarget)
    }
    const onClick = (e: MouseEvent) => {
      const chip = e.target instanceof Element ? e.target.closest('[data-blame-jump]') : null
      if (!chip) return
      e.preventDefault()
      jumpingRef.current = true
      scrollToAnchor('#skills')
      const skillsEl = document.getElementById('skills')
      timers.push(
        window.setTimeout(() => {
          skillsEl?.setAttribute('data-blame-pulse', '1')
          timers.push(
            window.setTimeout(() => {
              skillsEl?.removeAttribute('data-blame-pulse')
              jumpingRef.current = false
              setFocusedSkills([])
            }, PULSE_MS)
          )
        }, JUMP_ARRIVAL_MS)
      )
    }

    root.addEventListener('pointerover', onPointerOver)
    root.addEventListener('pointerout', onPointerOut)
    root.addEventListener('focusin', onFocusIn)
    root.addEventListener('focusout', onFocusOut)
    root.addEventListener('click', onClick)
    return () => {
      root.removeEventListener('pointerover', onPointerOver)
      root.removeEventListener('pointerout', onPointerOut)
      root.removeEventListener('focusin', onFocusIn)
      root.removeEventListener('focusout', onFocusOut)
      root.removeEventListener('click', onClick)
      timers.forEach((t) => window.clearTimeout(t))
      root.removeAttribute('data-blame-on')
      rows.forEach((r) => r.removeAttribute('tabindex'))
      document.getElementById('skills')?.removeAttribute('data-blame-pulse')
      jumpingRef.current = false
      setFocusedSkills([])
    }
  }, [reduced, on])

  // Spec §9.1: hidden under reduced motion — the toggle doesn't render.
  if (reduced) return null

  return (
    <button
      ref={btnRef}
      type="button"
      aria-pressed={on}
      aria-label="git blame"
      onClick={() => setOn((v) => !v)}
      data-component="GitBlame"
      data-island="client"
      className="type-label-sm text-secondary hover:text-primary flex h-6 cursor-pointer items-center gap-1 [transition:color_180ms_var(--ease-swift)]"
    >
      <span aria-hidden="true">git blame:</span>
      <span className={on ? 'text-signal' : 'text-tertiary'} aria-hidden="true">
        {on ? 'on' : 'off'}
      </span>
    </button>
  )
}
