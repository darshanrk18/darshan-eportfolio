'use client'

/**
 * Boot preloader — `$ darshan --init` (v1 spec §4.1, upgraded by v2 §6.3
 * "BIOS POST with real numbers + first-vs-return").
 *
 * Session-gated: the pre-paint script in app/layout.tsx sets
 * html[data-boot='1'] only when eligible (motion not reduced AND
 * sessionStorage['signal.boot'] absent); globals.css shows `.boot-overlay`
 * only under that attribute, so the SSR markup below is invisible otherwise.
 *
 * Paint-only: same-color background, pointer-events none, aria-hidden — the
 * server-rendered hero paints beneath it and stays the LCP. Hard 800ms cap;
 * any scroll / keydown / pointerdown dismisses instantly. On exit the lines
 * slide up 16px + fade (250ms swift), the background fades (200ms), then the
 * component sets sessionStorage['signal.boot']='1', clears data-boot and
 * unmounts itself. All of that is inherited from v1 untouched (§6.3
 * non-negotiable).
 *
 * v2 §6.3 additions ONLY:
 *  - First visit (no localStorage['signal.seen']): after the command types
 *    (24ms/char, unchanged), the POST `check <route> … ok` lines — real
 *    build-measured sizes passed as props from the RSC (`bootLines.ts` over
 *    lib/build/manifest.json) — render at the existing 80ms stagger, then
 *    the real `ready in …s` performance.now() line. finalize() additionally
 *    writes localStorage['signal.seen']='1'.
 *  - Return visit (signal.seen present but this session is still
 *    boot-eligible): a 350ms "restoring from cache… hit / welcome back"
 *    variant — the command renders instantly (cache-hit, nothing to type)
 *    and the cap shrinks to 350ms for this branch only.
 *  - The variant only changes line CONTENT, never eligibility, so the
 *    signal.seen read happens here in the island (sanctioned §6.3 fallback:
 *    the ≤350B pre-paint script stays untouched).
 */

import { useEffect, useRef, useState } from 'react'
import { BOOT_STORAGE_KEY, SEEN_STORAGE_KEY } from '@/lib/commands/context'
import { TYPE_MS_PER_CHAR } from '@/lib/motion/tokens'
import { trackBootCompleted } from '@/lib/utils/analytics'

const COMMAND = '$ darshan --init'
/** 80ms stagger between the instant status lines (§4.1 / v2 §6.3). */
const LINE_STAGGER_MS = 80
/** Hard cap — the overlay dismisses no matter what (§4.1, unchanged). */
const CAP_MS = 800
/** v2 §6.3 — the return-visit variant caps at 350ms (this branch only). */
const RETURN_CAP_MS = 350
/** Exit choreography: lines 250ms swift, background 200ms. */
const EXIT_MS = 280

/**
 * §6.3 auto-truncation: POST lines are scheduled relative to the moment the
 * command finishes typing (that is where the timeouts attach); any line
 * whose stagger offset lands beyond CAP_MS − EXIT_MS is dropped from the
 * schedule instead of rendering into the exit fade. The current 4-line list
 * (3 checks + ready) tops out at 320ms of offset — well inside — but the
 * guard keeps a longer future manifest honest.
 */
const MAX_LINE_OFFSET_MS = CAP_MS - EXIT_MS

const RETURN_LINES = ['restoring from cache… hit', 'welcome back'] as const

type Phase = 'idle' | 'running' | 'exiting' | 'done'

export interface BootOverlayProps {
  /**
   * v2 §6.3 — the pre-formatted `check <route> … ok` POST lines, built at
   * BUILD time by the RSC (`bootLines.ts` from lib/build/manifest.json).
   */
  postLines: readonly string[]
}

export default function BootOverlay({ postLines }: BootOverlayProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [typedCount, setTypedCount] = useState(0)
  const [lines, setLines] = useState<string[]>([])

  const exitedRef = useRef(false)
  /** Props are build-time constants; keep the run-once effect honest. */
  const postLinesRef = useRef(postLines)

  useEffect(() => {
    const root = document.documentElement
    if (root.dataset.boot !== '1') {
      // Not boot-eligible this session (reduced motion, repeat visit, or
      // storage said no) — never run, never listen.
      setPhase('done')
      return
    }

    // v2 §6.3 — first-vs-return variant. Content-only: eligibility was
    // already decided by the pre-paint script.
    let returning = false
    try {
      returning = localStorage.getItem(SEEN_STORAGE_KEY) === '1'
    } catch {
      /* storage unavailable — treat as first visit */
    }

    setPhase('running')
    const startedAt = performance.now()
    const timers: number[] = []

    const finalize = () => {
      try {
        sessionStorage.setItem(BOOT_STORAGE_KEY, '1')
      } catch {
        /* storage unavailable — attribute removal below still hides it */
      }
      try {
        // v2 §6.3 — a boot has now completed once on this browser (read by
        // the return-visit branch above and the §10.3 footer payoff).
        localStorage.setItem(SEEN_STORAGE_KEY, '1')
      } catch {
        /* storage unavailable — next visit simply boots as first again */
      }
      delete root.dataset.boot
      setPhase('done')
    }

    const exit = () => {
      if (exitedRef.current) return
      exitedRef.current = true
      removeDismissListeners()
      trackBootCompleted(performance.now() - startedAt)
      setPhase('exiting')
      timers.push(window.setTimeout(finalize, EXIT_MS))
    }

    const dismissEvents: Array<keyof WindowEventMap> = [
      'keydown',
      'pointerdown',
      'wheel',
      'touchmove',
      'scroll',
    ]
    const removeDismissListeners = () => {
      for (const ev of dismissEvents) window.removeEventListener(ev, exit)
    }
    for (const ev of dismissEvents) window.addEventListener(ev, exit, { passive: true })

    /** Schedule the staggered status lines from "now" (typing just ended). */
    const scheduleLines = (entries: ReadonlyArray<() => string>) => {
      const shown: string[] = []
      entries.forEach((text, i) => {
        const at = LINE_STAGGER_MS * (i + 1)
        if (at > MAX_LINE_OFFSET_MS) return // §6.3 auto-truncation
        timers.push(
          window.setTimeout(() => {
            shown.push(text())
            setLines([...shown])
          }, at)
        )
      })
    }

    if (returning) {
      // Return visit: cache hit — the command renders instantly, two lines,
      // 350ms cap for this branch only (§6.3).
      setTypedCount(COMMAND.length)
      scheduleLines(RETURN_LINES.map((line) => () => line))
      timers.push(window.setTimeout(exit, RETURN_CAP_MS))
    } else {
      // First visit: line 1 types at 24ms/char (unchanged), then the BIOS
      // POST check lines at the 80ms stagger, then the ready line — its
      // number is REAL: performance.now() at render of that line.
      let chars = 0
      const typeTimer = window.setInterval(() => {
        chars += 1
        setTypedCount(chars)
        if (chars >= COMMAND.length) {
          window.clearInterval(typeTimer)
          scheduleLines([
            ...postLinesRef.current.map((line) => () => line),
            () => `ready in ${(performance.now() / 1000).toFixed(2)}s`,
          ])
        }
      }, TYPE_MS_PER_CHAR)
      timers.push(window.setTimeout(exit, CAP_MS))

      return () => {
        window.clearInterval(typeTimer)
        for (const t of timers) window.clearTimeout(t)
        removeDismissListeners()
      }
    }

    return () => {
      for (const t of timers) window.clearTimeout(t)
      removeDismissListeners()
    }
    // Runs once: eligibility is decided pre-paint and never changes mid-session.
  }, [])

  if (phase === 'done') return null

  const exiting = phase === 'exiting'

  return (
    <div
      className="boot-overlay fixed inset-0 bg-page"
      aria-hidden="true"
      data-component="BootOverlay"
      data-island="client"
      style={{
        zIndex: 'var(--z-boot)',
        pointerEvents: 'none',
        opacity: exiting ? 0 : 1,
        transition: 'opacity 200ms var(--ease-swift)',
      }}
    >
      <div
        className="p-6"
        style={{
          transform: exiting ? 'translateY(-16px)' : 'none',
          opacity: exiting ? 0 : 1,
          transition: 'transform 250ms var(--ease-swift), opacity 250ms var(--ease-swift)',
        }}
      >
        <p className="type-code text-primary">
          {COMMAND.slice(0, typedCount)}
          {phase === 'running' && lines.length === 0 ? (
            <span className="caret" aria-hidden="true" />
          ) : null}
        </p>
        {lines.map((line, i) => (
          <p key={line} className="type-code text-secondary whitespace-pre">
            {line}
            {phase === 'running' && i === lines.length - 1 ? (
              <span className="caret" aria-hidden="true" />
            ) : null}
          </p>
        ))}
      </div>
    </div>
  )
}
