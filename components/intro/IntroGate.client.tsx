'use client'

/**
 * v3 §2.7 — the intro's always-mounted gate (app/page.tsx, '/' only).
 * Renders nothing and costs nothing until the intro must run; then it
 * `next/dynamic`-imports ./Intro.client (ssr: false), so the sequence, its
 * art, styles/v3/intro.css and the Anton face live in their own chunk and
 * never ride the first-load bundle (V3_SPEC §7).
 *
 * It runs the intro when:
 *   - html[data-intro='1'] is set at mount — a PRINT return visit, decided
 *     pre-paint (stored print + full motion + sessionStorage['signal.intro']
 *     absent; lib/edition/prepaint.ts);
 *   - window fires 'signal:intro-start' — the picker (C5) chose PRINT on a
 *     first visit (dispatched after applyEdition);
 *   - window fires 'signal:replay-intro' (SIGNAL_EVENTS.replayIntro) — the
 *     palette `replay-intro` command or the cover's "Replay the intro"
 *     (both clear the session flag first; a replay while running restarts).
 * Never under html[data-motion='reduced'] (the picker's PRINT choice then
 * just fades to the cover; a stray data-intro is cleared).
 *
 * While it runs: store.overlayOpen = true (director call (l) — reveals
 * under the overlay defer until it closes), re-asserted if anything clears
 * it mid-run (the picker's surface does, when it unmounts ~0.5 s after
 * handing over). When the cover LANDS (before
 * the overlay's fade): sessionStorage['signal.intro'] = '1',
 * html[data-intro] removed, 'signal:intro-done' dispatched (the hero's
 * entry gate listens). When the overlay has faded: overlayOpen = false and
 * the intro unmounts fully. If the chunk fails to load, the same release
 * happens at once so the page is never held.
 */

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import { SIGNAL_EVENTS } from '@/lib/commands/context'
import { INTRO_ATTR, INTRO_SESSION_KEY } from '@/lib/edition/prepaint'
import { INTRO_DONE_EVENT, INTRO_START_EVENT } from '@/lib/intro/events'
import { useSignalStore } from '@/lib/state/store'
import type { IntroProps } from './Intro.client'

/** The chunk did not load: release the page immediately, no choreography. */
function IntroUnavailable({ onLand, onDone }: IntroProps) {
  useEffect(() => {
    onLand()
    onDone()
  }, [onLand, onDone])
  return null
}

const Intro = dynamic<IntroProps>(
  () => import('./Intro.client').catch(() => ({ default: IntroUnavailable })),
  { ssr: false },
)

function motionReduced(): boolean {
  return document.documentElement.dataset.motion === 'reduced'
}

export default function IntroGate() {
  /** 0 = idle; otherwise the run's serial (the key — a replay restarts). */
  const [run, setRun] = useState(0)
  const landed = useRef(false)
  /** True from start() until onDone(): the window in which overlayOpen must hold. */
  const active = useRef(false)

  const start = useCallback(() => {
    if (motionReduced()) {
      document.documentElement.removeAttribute(INTRO_ATTR)
      return
    }
    landed.current = false
    active.current = true
    useSignalStore.getState().setOverlayOpen(true)
    setRun((n) => n + 1)
  }, [])

  /* Director call (l): the flag must hold for the WHOLE run. The picker's
     surface (which handed us the PRINT choice) clears overlayOpen when IT
     unmounts, ~0.5 s later — mid-intro for us — so re-assert it until the
     overlay has gone. Zustand calls listeners synchronously, so the nested
     set lands before any deferred reveal can observe the gap. */
  useEffect(
    () =>
      useSignalStore.subscribe((state) => {
        if (active.current && !state.overlayOpen) useSignalStore.getState().setOverlayOpen(true)
      }),
    [],
  )

  const onLand = useCallback(() => {
    if (landed.current) return
    landed.current = true
    try {
      sessionStorage.setItem(INTRO_SESSION_KEY, '1')
    } catch {
      /* storage unavailable — the attribute and the event still release the page */
    }
    document.documentElement.removeAttribute(INTRO_ATTR)
    window.dispatchEvent(new CustomEvent(INTRO_DONE_EVENT))
  }, [])

  const onDone = useCallback(() => {
    onLand()
    active.current = false
    useSignalStore.getState().setOverlayOpen(false)
    setRun(0)
  }, [onLand])

  useEffect(() => {
    if (document.documentElement.getAttribute(INTRO_ATTR) === '1') start()
    const onStart = () => start()
    window.addEventListener(INTRO_START_EVENT, onStart)
    window.addEventListener(SIGNAL_EVENTS.replayIntro, onStart)
    return () => {
      window.removeEventListener(INTRO_START_EVENT, onStart)
      window.removeEventListener(SIGNAL_EVENTS.replayIntro, onStart)
    }
  }, [start])

  if (run === 0) return null
  return <Intro key={run} onLand={onLand} onDone={onDone} />
}
