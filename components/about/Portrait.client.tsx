'use client'

/**
 * The Decompiled Portrait (v3 S2 / P2; V2_SPEC §2.1 machinery kept), the
 * About section's portrait island. ONE DOM, two reveals:
 *
 *   SCREEN — on first view the portrait resolves from mist-silver characters
 *   (PHOTO_ASCII in --ed-steel2) to the -41 photograph over ~1.2 s, top to
 *   bottom (key light and hair first, then the face, then the blazer),
 *   easing out; the rim light along the top edge warms as the photo lands.
 *   "Replay the portrait" (and hovering the resolved portrait) runs it
 *   again. Reduced motion: the photograph shows at once, no character pass,
 *   the replay control is hidden.
 *   PRINT — the panel prints as a halftone (the -paper grade under the CSS
 *   dot screen). Hover / focus / tap dissolves the dots into the
 *   continuous-tone photograph over 600 ms; leaving reverses. The whole
 *   panel is the control (`aria-pressed`) and the "Try: Reveal the portrait"
 *   tag is its label. Reduced motion: a crossfade (the global rule).
 *
 * "No-JS = finished" (§2.1): the server renders the FINISHED SCREEN state
 * (photo visible, characters hidden) and the RESTING PRINT state (halftone).
 * JS only ADDS `is-armed` after hydration (SCREEN, motion allowed, not yet
 * in view), then `is-sweeping` on viewport entry; class removal finishes.
 *
 * Guide (§2.6 item 3): the first completed reveal on a page — the automatic
 * sweep, a replay, or a PRINT dissolve — dispatches `signal:guide-tried`
 * with id `reveal-portrait` once. Other islands run the reveal by
 * dispatching PORTRAIT_REVEAL_EVENT (components/about/portrait.ts).
 *
 * Copy (narration, labels, alt) comes in as props from the About RSC so this
 * chunk carries only the character rows and the photo manifest.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type AnimationEvent,
  type FocusEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import clsx from 'clsx'
import { getCurrentEdition } from '@/lib/commands/context'
import { PHOTO_ASCII } from '@/lib/data/photoAscii'
import { PHOTOS } from '@/lib/data/photos'
import { useInViewOnce } from '@/lib/motion/useInViewOnce'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'
import {
  GUIDE_TRIED_EVENT,
  PORTRAIT_DISSOLVE_MS,
  PORTRAIT_GUIDE_ID,
  PORTRAIT_HOLD_MS,
  PORTRAIT_REVEAL_EVENT,
  PORTRAIT_SWEEP_MS,
} from './portrait'

type Phase = 'finished' | 'armed' | 'sweep'

/** Once per page load, whichever edition completes a reveal first. */
let guideReported = false
function reportTried(): void {
  if (guideReported) return
  guideReported = true
  window.dispatchEvent(new CustomEvent(GUIDE_TRIED_EVENT, { detail: { id: PORTRAIT_GUIDE_ID } }))
}

export interface PortraitProps {
  className?: string
  /** figure aria-label ("Portrait of Darshan Konnur"). */
  label: string
  /** The photograph's alt text. */
  alt: string
  /** SCREEN live control. */
  replayLabel: string
  /** PRINT tag: the red prefix and the label ("Try:" / "Reveal the portrait"). */
  tryPrefix: string
  tryLabel: string
  /** PRINT panel narration (About P1), rendered by the RSC. */
  narration?: ReactNode
}

export default function Portrait({
  className,
  label,
  alt,
  replayLabel,
  tryPrefix,
  tryLabel,
  narration,
}: PortraitProps) {
  const reduced = usePrefersReducedMotion()
  const { ref: inViewRef, inView } = useInViewOnce<HTMLElement>({ threshold: 0.3 })
  const [phase, setPhase] = useState<Phase>('finished')
  const [revealed, setRevealed] = useState(false)
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dissolveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rootRef = useRef<HTMLElement | null>(null)

  const setRefs = useCallback(
    (node: HTMLElement | null) => {
      rootRef.current = node
      inViewRef(node)
    },
    [inViewRef],
  )

  // Arm the start state only after hydration, only in SCREEN with motion.
  useEffect(() => {
    if (reduced) {
      setPhase('finished')
      return
    }
    if (getCurrentEdition() !== 'screen') return
    setPhase((p) => (p === 'finished' && !inView ? 'armed' : p))
    // `inView` is read once at arm time (updater guard): if reduced motion
    // flips off after the section was seen, stay finished.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced])

  useEffect(() => {
    if (reduced || !inView) return
    setPhase((p) => (p === 'armed' ? 'sweep' : p))
  }, [reduced, inView])

  // The section's entrance (PRINT: the page settles panel by panel, about.css)
  // keys off attributes this island writes on its section: `data-armed` after
  // hydration while still off-screen, `data-in` on first view. No JS = final.
  useEffect(() => {
    const section = rootRef.current?.closest('section')
    if (!section) return
    if (reduced || inView) {
      section.setAttribute('data-in', '1')
    } else {
      section.setAttribute('data-armed', '1')
    }
  }, [inView, reduced])

  // animationend can be lost (tab hidden mid-sweep) — settle regardless.
  useEffect(() => {
    if (phase !== 'sweep') return
    const t = setTimeout(() => {
      setPhase('finished')
      reportTried()
    }, PORTRAIT_SWEEP_MS + 200)
    return () => clearTimeout(t)
  }, [phase])

  const onSweepEnd = (e: AnimationEvent<HTMLElement>) => {
    if (e.animationName !== 'pf-sweep') return
    setPhase('finished')
    reportTried()
  }

  /** SCREEN: run the character → photograph pass again. */
  const replay = useCallback(() => {
    if (reduced) return
    setPhase((p) => (p === 'finished' ? 'sweep' : p))
  }, [reduced])

  /** PRINT: dissolve the dots (true) or print them back (false). */
  const setDissolved = useCallback((on: boolean) => {
    setRevealed(on)
    if (dissolveRef.current !== null) clearTimeout(dissolveRef.current)
    dissolveRef.current = null
    if (on) dissolveRef.current = setTimeout(reportTried, PORTRAIT_DISSOLVE_MS)
  }, [])

  // The guide / palette run the reveal from outside.
  useEffect(() => {
    const run = () => {
      if (getCurrentEdition() === 'print') {
        setDissolved(true)
        if (holdRef.current !== null) clearTimeout(holdRef.current)
        holdRef.current = setTimeout(() => setDissolved(false), PORTRAIT_HOLD_MS)
      } else {
        replay()
      }
    }
    window.addEventListener(PORTRAIT_REVEAL_EVENT, run)
    return () => {
      window.removeEventListener(PORTRAIT_REVEAL_EVENT, run)
      if (holdRef.current !== null) clearTimeout(holdRef.current)
      if (dissolveRef.current !== null) clearTimeout(dissolveRef.current)
    }
  }, [replay, setDissolved])

  const onPointerEnter = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse') return
    if (getCurrentEdition() === 'print') setDissolved(true)
    else replay()
  }
  const onPointerLeave = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse') return
    if (getCurrentEdition() === 'print') setDissolved(false)
  }
  /** PRINT tag button: tap / Enter toggles; focus-visible reveals. */
  const onTryClick = () => setDissolved(!revealed)
  const onTryFocus = (e: FocusEvent<HTMLButtonElement>) => {
    try {
      if (e.currentTarget.matches(':focus-visible')) setDissolved(true)
    } catch {
      setDissolved(true)
    }
  }
  const onTryBlur = () => setDissolved(false)

  const portrait = PHOTOS.portrait

  return (
    <figure
      ref={setRefs}
      className={clsx(
        'pf',
        className,
        phase === 'armed' && 'is-armed',
        phase === 'sweep' && 'is-sweeping',
        revealed && 'is-revealed',
      )}
      aria-label={label}
      data-component="Portrait"
      data-island="client"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onAnimationEnd={onSweepEnd}
    >
      <i aria-hidden="true" className="pf-rim ed-screen-only" />
      <div className="pf-body">
        {/* SCREEN: the character rows the photograph resolves from. */}
        <div className="pf-chars ed-screen-only" aria-hidden="true">
          <pre>{PHOTO_ASCII.join('\n')}</pre>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="pf-photo pf-photo-screen ed-screen-only"
          src={portrait.screen}
          alt={alt}
          width={portrait.width}
          height={portrait.height}
          loading="lazy"
          decoding="async"
        />
        <i aria-hidden="true" className="pf-g pf-g-room ed-screen-only" />
        <i aria-hidden="true" className="pf-g pf-g-key ed-screen-only" />
        <i aria-hidden="true" className="pf-g pf-g-rim ed-screen-only" />
        <i aria-hidden="true" className="pf-g pf-g-spill ed-screen-only" />
        <i aria-hidden="true" className="pf-g pf-g-edge ed-screen-only" />
        <i aria-hidden="true" className="pf-scan ed-screen-only" />

        {/* PRINT: the continuous-tone photograph under the dot screen. */}
        <i aria-hidden="true" className="pf-ink ed-print-only" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="pf-photo pf-photo-print ed-print-only"
          src={portrait.print}
          alt={alt}
          width={portrait.width}
          height={portrait.height}
          loading="lazy"
          decoding="async"
        />
        <div className="ed-ht pf-ht ed-print-only" aria-hidden="true">
          <div className="ed-ht-in">
            <i className="pf-ht-bg" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={portrait.print} alt="" width={portrait.width} height={portrait.height} loading="lazy" decoding="async" />
            <i className="ed-ht-scr" />
          </div>
        </div>
      </div>

      {narration !== undefined ? (
        <figcaption className="ab-nar pf-nar ed-print-only">{narration}</figcaption>
      ) : null}

      {/* SCREEN live control. */}
      <button type="button" className="pf-replay ed-screen-only" onClick={replay}>
        <i aria-hidden="true" className="pf-rc">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11.6 5.2A5 5 0 1 0 12 8.2" />
            <path d="M12.4 1.8v3.8H8.6" />
          </svg>
        </i>
        {replayLabel}
      </button>
      {/* PRINT: the panel's try tag is the control. */}
      <button
        type="button"
        className="pf-try ab-tag ed-print-only"
        aria-pressed={revealed}
        onClick={onTryClick}
        onFocus={onTryFocus}
        onBlur={onTryBlur}
      >
        <b className="pf-trylbl">{tryPrefix}</b> {tryLabel}
      </button>
    </figure>
  )
}
