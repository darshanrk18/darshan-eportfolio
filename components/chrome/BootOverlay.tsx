'use client'

/**
 * Boot preloader — `$ darshan --init` (spec §4.1).
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
 * unmounts itself.
 */

import { useEffect, useRef, useState } from 'react'
import { BOOT_STORAGE_KEY } from '@/lib/commands/context'
import { TYPE_MS_PER_CHAR } from '@/lib/motion/tokens'
import { trackBootCompleted } from '@/lib/utils/analytics'

const COMMAND = '$ darshan --init'
/** 80ms stagger between the instant status lines (§4.1). */
const LINE_STAGGER_MS = 80
/** Hard cap — the overlay dismisses no matter what (§4.1). */
const CAP_MS = 800
/** Exit choreography: lines 250ms swift, background 200ms. */
const EXIT_MS = 280

type Phase = 'idle' | 'running' | 'exiting' | 'done'

export default function BootOverlay() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [typedCount, setTypedCount] = useState(0)
  const [lines, setLines] = useState<string[]>([])

  const exitedRef = useRef(false)

  useEffect(() => {
    const root = document.documentElement
    if (root.dataset.boot !== '1') {
      // Not boot-eligible this session (reduced motion, repeat visit, or
      // storage said no) — never run, never listen.
      setPhase('done')
      return
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

    // Line 1 types at 24ms/char; lines 2–4 appear instantly, 80ms staggered.
    // The ready-time number is REAL: performance.now() at render of that line.
    let chars = 0
    const typeTimer = window.setInterval(() => {
      chars += 1
      setTypedCount(chars)
      if (chars >= COMMAND.length) {
        window.clearInterval(typeTimer)
        timers.push(
          window.setTimeout(() => setLines(['resolving modules… ok']), LINE_STAGGER_MS),
          window.setTimeout(
            () => setLines(['resolving modules… ok', 'hydrating experience… ok']),
            LINE_STAGGER_MS * 2
          ),
          window.setTimeout(
            () =>
              setLines([
                'resolving modules… ok',
                'hydrating experience… ok',
                `ready in ${(performance.now() / 1000).toFixed(2)}s`,
              ]),
            LINE_STAGGER_MS * 3
          )
        )
      }
    }, TYPE_MS_PER_CHAR)

    timers.push(window.setTimeout(exit, CAP_MS))

    return () => {
      window.clearInterval(typeTimer)
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
          <p key={line} className="type-code text-secondary">
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
