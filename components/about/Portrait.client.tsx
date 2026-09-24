'use client'

/**
 * V2_SPEC §2.1 — THE DECOMPILED PORTRAIT (About's asset pane, client island).
 *
 * Three stacked layers inside a terminal-chrome frame: the 32-row ASCII
 * portrait (bottom), the phosphor-duotone photo hidden by a CSS mask, and a
 * scanline texture overlay. On first scroll-enter the mask sweeps top→bottom
 * over 900ms --ease-out-expo while a 2px signal scanline rides the edge — the
 * face compiles from glyphs into the photograph. Hover/:focus-visible (tap on
 * touch) crossfades in the true-color 880px asset, loaded on first intent only.
 *
 * State machine (the "no-JS = finished" pattern): the server renders the
 * FINISHED state (image visible, ASCII hidden, caption shown). JS only ADDS
 * the armed start state (`is-armed`) after hydration when motion is allowed,
 * then `is-sweeping` on viewport entry; class removal is the finish. Reduced
 * motion / no-JS never leave the finished state. All animation CSS lives in
 * styles/v2/portrait.css (incl. the §10.1 CRT crossover: color layer locked
 * off, scanline drift).
 *
 * `variant="static"` is the <1024px placement in the rendered flow: duotone
 * frame + caption, no ASCII sweep, tap toggles color.
 *
 * Wormhole participation (§2.1 correction): the wrapper carries
 * data-pane="rendered" (a second rendered-pane root — Wormhole's idFrom uses
 * closest()) and the frame data-line="photo", so hover/focus highlights the
 * `![darshan](./darshan.webp)` row in SourcePane.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type AnimationEvent,
  type FocusEvent,
  type PointerEvent,
} from 'react'
import Image from 'next/image'
import clsx from 'clsx'
import { PHOTO_ASCII } from '@/lib/data/photoAscii'
import { useInViewOnce } from '@/lib/motion/useInViewOnce'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'

const CAPTION_DEFAULT = 'rendered from source ✓'
const CAPTION_COLOR = 'syntax highlighting: on'
/** 6-frame mono-label decode (sanctioned: captions are mono labels). */
const DECODE_CHARS = '#{}[]<>/\\|+=*%$&'
const DECODE_FRAMES = 6
const DECODE_FRAME_MS = 30
/** Safety net if the sweep's animationend never fires (lost while hidden). */
const SWEEP_FALLBACK_MS = 1200

const IMAGE_SIZES = '(min-width: 1024px) 440px, 100vw'

type Phase = 'finished' | 'armed' | 'sweep'

/** Decode-settle a mono label over 6 frames on target change (instant when disabled). */
function useDecodedText(target: string, enabled: boolean): string {
  const [text, setText] = useState(target)
  const prevRef = useRef(target)

  useEffect(() => {
    if (prevRef.current === target) return
    prevRef.current = target
    if (!enabled) {
      setText(target)
      return
    }
    let frame = 0
    const id = setInterval(() => {
      frame += 1
      if (frame >= DECODE_FRAMES) {
        setText(target)
        clearInterval(id)
        return
      }
      const settled = Math.floor((target.length * frame) / DECODE_FRAMES)
      let out = target.slice(0, settled)
      for (let i = settled; i < target.length; i++) {
        out +=
          target[i] === ' ' ? ' ' : DECODE_CHARS[Math.floor(Math.random() * DECODE_CHARS.length)]
      }
      setText(out)
    }, DECODE_FRAME_MS)
    return () => clearInterval(id)
  }, [target, enabled])

  return text
}

export interface PortraitProps {
  /**
   * 'sweep' (default): the desktop asset pane with the ASCII compile reveal.
   * 'static': the <lg rendered-flow block — plain duotone, tap toggles color.
   */
  variant?: 'sweep' | 'static'
}

export default function Portrait({ variant = 'sweep' }: PortraitProps) {
  const isSweep = variant === 'sweep'
  const reduced = usePrefersReducedMotion()
  const { ref: inViewRef, inView } = useInViewOnce<HTMLDivElement>({
    threshold: 0.35,
    disabled: !isSweep,
  })
  const [phase, setPhase] = useState<Phase>('finished')
  const [colorOn, setColorOn] = useState(false)
  /** True after first hover/focus/tap — mounts the 880px color layer. */
  const [colorRequested, setColorRequested] = useState(false)

  const setFrameRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isSweep) inViewRef(node)
    },
    [isSweep, inViewRef]
  )

  // Arm the start state only after hydration, only with motion allowed.
  useEffect(() => {
    if (!isSweep) return
    if (reduced) {
      setPhase('finished')
      return
    }
    setPhase((p) => (p === 'finished' && !inView ? 'armed' : p))
    // `inView` intentionally read once at arm time via the updater guard: if
    // reduced-motion flips off mid-session after the section was already seen,
    // stay finished rather than re-hiding the photo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSweep, reduced])

  useEffect(() => {
    if (!isSweep || reduced || !inView) return
    setPhase((p) => (p === 'armed' ? 'sweep' : p))
  }, [isSweep, reduced, inView])

  // animationend can be lost (tab hidden mid-sweep) — settle regardless.
  useEffect(() => {
    if (phase !== 'sweep') return
    const t = setTimeout(() => setPhase('finished'), SWEEP_FALLBACK_MS)
    return () => clearTimeout(t)
  }, [phase])

  const onSweepEnd = (e: AnimationEvent<HTMLDivElement>) => {
    if (e.animationName === 'portrait-sweep') setPhase('finished')
  }

  const requestColor = () => setColorRequested(true)

  const onPointerEnter = (e: PointerEvent<HTMLDivElement>) => {
    requestColor()
    if (e.pointerType === 'mouse') setColorOn(true)
  }
  const onPointerLeave = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse') setColorOn(false)
  }
  /** Coarse pointers: tap toggles true color (§2.1). */
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse') return
    requestColor()
    setColorOn((v) => !v)
  }
  const onFocus = (e: FocusEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return
    requestColor()
    try {
      if (e.currentTarget.matches(':focus-visible')) setColorOn(true)
    } catch {
      setColorOn(true)
    }
  }
  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return
    setColorOn(false)
  }

  const caption = useDecodedText(colorOn ? CAPTION_COLOR : CAPTION_DEFAULT, !reduced)

  return (
    <div
      data-component="Portrait"
      data-island="client"
      {...(isSweep ? { 'data-pane': 'rendered' } : {})}
    >
      <div
        ref={setFrameRef}
        {...(isSweep ? { 'data-line': 'photo' } : {})}
        tabIndex={0}
        role="figure"
        aria-label="Portrait of Darshan Konnur — focus to view in color"
        data-color={colorOn ? '1' : undefined}
        className={clsx(
          'portrait-frame bg-panel hairline elev-window reg-marks',
          phase === 'armed' && 'is-armed',
          phase === 'sweep' && 'is-sweeping'
        )}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onPointerUp={onPointerUp}
        onFocus={onFocus}
        onBlur={onBlur}
        onAnimationEnd={isSweep ? onSweepEnd : undefined}
      >
        <div className="portrait-titlebar type-label-xs text-tertiary">
          assets/darshan.webp · 879×880 · duotone
        </div>
        <div className="portrait-body">
          {isSweep ? (
            <div className="portrait-ascii" aria-hidden="true">
              <pre>{PHOTO_ASCII.join('\n')}</pre>
            </div>
          ) : null}
          <Image
            src="/photo/darshan-duotone.webp"
            alt="Darshan Konnur"
            fill
            sizes={IMAGE_SIZES}
            className="portrait-duotone"
          />
          {colorRequested ? (
            <Image
              src="/photo/darshan-880.webp"
              alt=""
              fill
              sizes={IMAGE_SIZES}
              className="portrait-color"
            />
          ) : null}
          {isSweep && phase !== 'finished' ? (
            <div className="portrait-scanline" aria-hidden="true" />
          ) : null}
        </div>
      </div>
      <p className="portrait-caption type-label-xs text-tertiary">
        {caption === CAPTION_DEFAULT ? (
          <>
            rendered from source <span className="text-signal">✓</span>
          </>
        ) : (
          caption
        )}
      </p>
    </div>
  )
}
