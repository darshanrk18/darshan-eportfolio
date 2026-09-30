'use client'

/**
 * The edition picker's surface (V3_SPEC §2.5, inventory X1-Picker) — the
 * lazy chunk behind components/edition/EditionPicker.client.tsx. Never in
 * the first-load bundle; it mounts only while html[data-pick='1'].
 *
 * role="dialog" aria-modal, aria-label "Choose your edition". Two real
 * controls: the SCREEN half and the PRINT sheet are each ONE <button>
 * (the frame's whole-half links) named by the inventory's aria-labels;
 * the inner "Enter the feature" / "Open the issue" are plain spans inside
 * them (never a button in a button). Keys: ← → move focus between the two,
 * Enter/Space choose (native), Tab cycles between them (focus trap), 1 / 2
 * pick (aria-keyshortcuts). Esc does nothing — a choice is required (§6).
 *
 * While open: body scroll locked, Lenis stopped, store.overlayOpen true (so
 * useInViewOnce reveals wait, director call (l)). Choosing: applyEdition
 * (choice, 'picker'), the attribute is cleared, scroll unlocked and
 * overlayOpen released ONCE, in choose(); SCREEN fades out over 400 ms;
 * PRINT dispatches `signal:intro-start` (the intro gate, C6, listens),
 * holds opaque until the intro overlay is on the page (≤ 1.5 s — its
 * chunk is warmed on the first hover / focus of the PRINT half) and then
 * cross-fades over 500 ms into its first beat (300 ms under reduced
 * motion, where the intro does not run and the cover simply appears).
 * `onDone` tells the gate to unmount after the fade — and that
 * unmount's cleanup does NOT release the page again: by then the intro
 * owns the scroll lock and the overlay flag (C6's hand-off contract).
 *
 * One photograph, one cut: both halves draw the portrait through the same
 * silhouette clip (objectBoundingBox, from the frame's traced path) at the
 * same page position, so the features meet at the tear; the SCREEN half
 * shows the -41 grade, the PRINT sheet the paper grade through a CSS dot
 * screen. The seal is the M4 mark (DkSeal's path) on a silver disc / a
 * yellow roundel, clipped at the seam. Copy is the approved X1 text;
 * "Darshan Konnur" comes from profile.displayName.
 */

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { PICK_ATTR, applyEdition, type Edition } from '@/lib/commands/context'
import { PHOTOS } from '@/lib/data/photos'
import { profile } from '@/lib/data/profile'
import { getLenis } from '@/lib/motion/lenis'
import { useSignalStore } from '@/lib/state/store'
import { DK_SEAL_MARK_PATH } from '@/components/chrome/DkSeal'
import { INTRO_START_EVENT } from '@/lib/intro/events'

/** Window event the picker fires after a PRINT choice; the intro gate (C6) listens (lib/intro/events). */
export { INTRO_START_EVENT }

/** The silhouette of the Sep 29 studio portrait (option A: dark wall, natural
 *  crop), traced from its mask into the X1 frame's 800 × 800 space — the same
 *  file as public/photo/portrait-41.webp (design-workshop/photos/options). */
const SILHOUETTE =
  'M793.8 793.8 L100.0 793.8 L97.7 793.8 L96.8 760.9 L103.2 717.3 L110.5 699.1 L120.5 685.5 L129.1 678.6 L142.7 674.1 L179.1 655.9 L237.3 617.7 L242.7 612.3 L248.2 610.5 L260.9 599.5 L274.5 592.3 L285.0 580.9 L285.9 564.5 L290.5 554.5 L285.9 527.3 L277.7 509.1 L267.7 502.7 L266.8 499.1 L261.4 495.5 L261.4 490.9 L252.3 481.8 L251.4 473.6 L238.6 446.4 L231.4 414.5 L230.5 380.0 L233.2 362.7 L235.9 307.3 L235.0 290.0 L232.3 286.4 L233.2 280.0 L231.4 275.5 L233.2 257.3 L226.8 242.7 L228.6 226.4 L225.0 200.0 L231.4 190.0 L233.2 178.2 L244.1 167.3 L254.1 150.0 L285.5 120.5 L307.3 119.5 L339.1 112.3 L349.1 107.7 L363.6 96.8 L374.5 95.0 L399.1 95.0 L425.5 104.1 L436.4 104.1 L447.3 108.6 L466.4 124.1 L490.9 137.7 L501.4 149.1 L505.9 160.9 L509.5 164.5 L519.1 171.4 L525.5 172.3 L535.0 181.8 L539.5 192.7 L537.7 206.4 L532.3 212.7 L530.5 221.8 L523.2 230.9 L523.2 235.5 L514.1 245.5 L519.5 250.9 L519.5 257.3 L516.4 261.4 L506.4 260.5 L502.3 263.6 L499.5 278.2 L495.0 285.5 L495.9 301.8 L492.3 314.5 L491.4 339.1 L493.6 342.3 L505.5 343.2 L510.5 348.2 L515.0 367.3 L505.9 405.5 L493.2 435.5 L490.9 437.7 L479.1 437.7 L476.8 440.0 L474.1 451.8 L475.9 488.2 L503.6 516.8 L539.1 543.2 L556.4 546.8 L628.2 579.5 L650.9 586.8 L672.7 598.6 L684.5 601.4 L721.8 604.1 L755.5 616.8 L763.2 624.5 L772.3 639.1 L780.5 665.5 L787.7 704.5 L791.4 712.7 L793.8 720.9 L793.8 793.8Z'

/** The approved X1 copy (inventory §3) — every visible string of the picker. */
export const PICKER_COPY = {
  ask: 'Choose your edition',
  caption: 'Same story in both. Switch anytime from the top bar.',
  screen: {
    title: 'SCREEN',
    body: 'A dark, cinematic cut.',
    cta: 'Enter the feature',
    aria: 'Screen: a dark, cinematic cut. Enter the feature.',
  },
  print: {
    title: 'PRINT',
    body: 'An inked, four-color comic.',
    cta: 'Open the issue',
    aria: 'Print: an inked, four-color comic. Open the issue.',
  },
} as const

const SCREEN_ARIA = PICKER_COPY.screen.aria
const PRINT_ARIA = PICKER_COPY.print.aria

/** The intro overlay's root (C6: data-component="Intro"); the PRINT fade waits for it. */
const INTRO_SELECTOR = '[data-component="Intro"]'
const INTRO_WAIT_MS = 1500
const INTRO_POLL_MS = 50

/**
 * The PRINT choice cross-fades into the intro's FIRST beat (§2.5), which
 * needs the intro chunk (C6's next/dynamic import) already in the cache
 * when the choice lands. Warm it on intent — the first hover / focus of the
 * PRINT half — never under reduced motion (the intro does not run there)
 * and never more than once. Same module as the gate imports, so webpack
 * shares one chunk; nothing of it rides this surface.
 */
let introWarmed = false
function warmIntro(): void {
  if (introWarmed || document.documentElement.dataset.motion === 'reduced') return
  introWarmed = true
  void import('@/components/intro/Intro.client').catch(() => {
    introWarmed = false
  })
}

export interface EditionPickerSurfaceProps {
  /** Called once the dismiss fade has finished — the gate unmounts. */
  onDone: () => void
}

function RegMark({ className }: { className: string }) {
  return (
    <svg className={`pk-reg ${className}`} aria-hidden="true" width="26" height="26" viewBox="0 0 26 26">
      <circle cx="13" cy="13" r="6" fill="none" stroke="#17141b" strokeWidth="1.2" />
      <path d="M13 0V26M0 13H26" stroke="#17141b" strokeWidth="1.2" />
    </svg>
  )
}

export default function EditionPickerSurface({ onDone }: EditionPickerSurfaceProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const screenRef = useRef<HTMLButtonElement>(null)
  const printRef = useRef<HTMLButtonElement>(null)
  const [leaving, setLeaving] = useState<Edition | null>(null)
  const [hover, setHover] = useState<Edition | null>(null)
  const chosen = useRef(false)

  // Scroll lock + Lenis stop + overlay flag + initial focus. The cleanup
  // restores them ONLY when the surface leaves without a choice (the gate
  // hiding it): after choose() the page was released there, and the intro
  // (PRINT) or the hero (SCREEN) owns the lock and the flag by the time the
  // fade ends — releasing again from here would land mid-intro.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    getLenis()?.stop()
    useSignalStore.getState().setOverlayOpen(true)
    screenRef.current?.focus({ preventScroll: true })
    return () => {
      if (chosen.current) return
      document.body.style.overflow = previousOverflow
      getLenis()?.start()
      useSignalStore.getState().setOverlayOpen(false)
      previouslyFocused?.focus?.({ preventScroll: true })
    }
  }, [])

  const choose = useCallback(
    (edition: Edition) => {
      if (chosen.current) return
      chosen.current = true
      applyEdition(edition, 'picker')
      document.documentElement.removeAttribute(PICK_ATTR)
      // Release the page before the fade: SCREEN's entry motion runs under
      // the fade; PRINT's intro takes the overlay flag over from here.
      document.body.style.overflow = ''
      getLenis()?.start()
      useSignalStore.getState().setOverlayOpen(false)
      const reduced = document.documentElement.dataset.motion === 'reduced'
      const fade = (ms: number) => {
        setLeaving(edition)
        window.setTimeout(onDone, ms + 40)
      }
      if (edition !== 'print') {
        fade(400)
        return
      }
      window.dispatchEvent(new CustomEvent(INTRO_START_EVENT, { detail: { via: 'picker' } }))
      if (reduced) {
        fade(300) // the intro does not run: straight to the cover
        return
      }
      // Cross-fade into the intro's FIRST beat: hold the sheet, opaque, until
      // the intro overlay is actually on the page (its chunk may still be
      // arriving), then fade over 500 ms; never hold longer than ~1.5 s.
      const started = Date.now()
      const tick = () => {
        if (document.querySelector(INTRO_SELECTOR) || Date.now() - started >= INTRO_WAIT_MS) fade(500)
        else window.setTimeout(tick, INTRO_POLL_MS)
      }
      tick()
    },
    [onDone]
  )

  // ← → move between the two controls; Tab cycles; 1 / 2 pick; Esc is inert.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (chosen.current) return
    const screen = screenRef.current
    const print = printRef.current
    if (!screen || !print) return
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault()
        print.focus()
        return
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault()
        screen.focus()
        return
      case 'Tab': {
        e.preventDefault()
        const onScreen = document.activeElement === screen
        ;(e.shiftKey ? (onScreen ? print : screen) : onScreen ? print : screen).focus()
        return
      }
      case '1':
        e.preventDefault()
        choose('screen')
        return
      case '2':
        e.preventDefault()
        choose('print')
        return
      case 'Escape':
        e.preventDefault()
        return
      default:
    }
  }

  const portrait = PHOTOS.portrait

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Choose your edition"
      className="pk"
      data-component="EditionPicker"
      data-island="client"
      data-leaving={leaving ?? undefined}
      data-hover={hover ?? undefined}
      style={{ ['--vs-i' as string]: 7 }}
      onKeyDown={onKeyDown}
    >
      {/* shared drawing defs: ONE silhouette cut and the seal's clips */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
        <defs>
          <path id="pk-silp" d={SILHOUETTE} />
          <clipPath id="pk-sil" clipPathUnits="objectBoundingBox">
            <path d={SILHOUETTE} transform="scale(0.00125)" />
          </clipPath>
          <clipPath id="pk-cl">
            <rect x="0" y="0" width="60" height="120" />
          </clipPath>
          <clipPath id="pk-cr">
            <rect x="60" y="0" width="60" height="120" />
          </clipPath>
          <clipPath id="pk-ct">
            <rect x="0" y="0" width="120" height="60" />
          </clipPath>
          <clipPath id="pk-cb">
            <rect x="0" y="60" width="120" height="60" />
          </clipPath>
          <radialGradient id="pk-disc" cx="46" cy="16" r="104" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#f2f3f5" />
            <stop offset=".34" stopColor="#d9dde4" />
            <stop offset=".72" stopColor="#b9bec8" />
            <stop offset="1" stopColor="#85878f" />
          </radialGradient>
          <radialGradient id="pk-spec" cx="42" cy="22" r="30" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fff" stopOpacity=".75" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <filter id="pk-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <filter id="pk-rimblur" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation=".8" />
          </filter>
          <filter id="pk-rimwide" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <linearGradient id="pk-rimfx" x1="0" y1="0" x2="367" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fff" />
            <stop offset=".6" stopColor="#fff" stopOpacity=".9" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="pk-rimfy" x1="0" y1="0" x2="0" y2="800" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fff" />
            <stop offset=".62" stopColor="#fff" stopOpacity=".9" />
            <stop offset=".86" stopColor="#fff" stopOpacity=".25" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id="pk-rimmy" maskUnits="userSpaceOnUse" x="0" y="0" width="800" height="800">
            <rect width="800" height="800" fill="url(#pk-rimfy)" />
          </mask>
          <mask id="pk-rimm" maskUnits="userSpaceOnUse" x="0" y="0" width="800" height="800">
            <g mask="url(#pk-rimmy)">
              <rect width="800" height="800" fill="url(#pk-rimfx)" />
            </g>
          </mask>
        </defs>
      </svg>

      {/* ================= SCREEN ================= */}
      <button
        ref={screenRef}
        type="button"
        className="pk-half pk-half-s"
        aria-label={SCREEN_ARIA}
        aria-keyshortcuts="1"
        onClick={() => choose('screen')}
        onPointerEnter={() => setHover('screen')}
        onPointerLeave={() => setHover(null)}
      >
        <span className="pk-atm pk-beam" aria-hidden="true" />
        <span className="pk-atm pk-light" aria-hidden="true" />
        <span className="pk-atm pk-spot" aria-hidden="true" />
        <span className="pk-atm pk-leak" aria-hidden="true" />
        <span className="pk-atm pk-halo" aria-hidden="true" />

        <span className="pk-fig pk-fig-s" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={portrait.screen}
            width={portrait.width}
            height={portrait.height}
            alt=""
            decoding="async"
            fetchPriority="high"
          />
          <span className="pk-ov pk-key" />
          <span className="pk-ov pk-turn" />
          <svg className="pk-rim" viewBox="0 0 800 800">
            <use
              href="#pk-silp"
              fill="none"
              stroke="#9aa5b3"
              strokeOpacity=".34"
              strokeWidth="18"
              strokeLinejoin="round"
              filter="url(#pk-rimwide)"
              mask="url(#pk-rimm)"
            />
            <use
              href="#pk-silp"
              fill="none"
              stroke="#e4e8ee"
              strokeOpacity=".9"
              strokeWidth="3.6"
              strokeLinejoin="round"
              filter="url(#pk-rimblur)"
              mask="url(#pk-rimm)"
            />
          </svg>
        </span>
        <span className="pk-gate" aria-hidden="true" />
        <span className="pk-filmgate" aria-hidden="true" />

        <span className="pk-abs pk-name" aria-hidden="true">
          {profile.displayName}
        </span>
        <span className="pk-abs pk-rule" aria-hidden="true" />

        <span className="pk-abs pk-blk-s">
          <span className="pk-h-s" style={{ display: 'block' }}>
            SCREEN
          </span>
          <span className="pk-body-s" style={{ display: 'block' }}>
            A dark, cinematic cut.
          </span>
          <span className="pk-cta-s">
            Enter the feature
            <svg width="18" height="10" viewBox="0 0 18 10" aria-hidden="true">
              <path d="M0 5H16M12 1L16.5 5L12 9" fill="none" stroke="#0b0d10" strokeWidth="1.4" />
            </svg>
          </span>
        </span>

        <span className="pk-ember" aria-hidden="true" style={{ left: '12%', bottom: '19%' }} />
        <span
          className="pk-ember is-steel"
          aria-hidden="true"
          style={{ left: '26%', bottom: '29%', animationDuration: '18s', animationDelay: '3s' }}
        />
        <span
          className="pk-ember"
          aria-hidden="true"
          style={{ left: '37%', bottom: '12%', width: 2, height: 2, animationDuration: '16s', animationDelay: '7s' }}
        />
        <span
          className="pk-ember"
          aria-hidden="true"
          style={{ left: '18%', bottom: '67%', width: 2, height: 2, animationDuration: '20s', animationDelay: '10s' }}
        />
        <span className="pk-grain" aria-hidden="true" />
      </button>

      {/* the question, on the axis: ivory on the screen, continuing in ink on the paper */}
      <h1 className="pk-ask">
        <span className="pk-ask-a">Choose your</span>
        <span className="pk-ask-g" aria-hidden="true">
          {' '}
        </span>
        <span className="pk-ask-b">edition</span>
      </h1>
      <p className="pk-cap">Same story in both. Switch anytime from the top bar.</p>

      {/* ================= PRINT: a torn sheet lying over the screen ================= */}
      <div className="pk-sheet-wrap">
        <span className="pk-fiber" aria-hidden="true" />
        <button
          ref={printRef}
          type="button"
          className="pk-half pk-half-p pk-sheet"
          aria-label={PRINT_ARIA}
          aria-keyshortcuts="2"
          onClick={() => choose('print')}
          onPointerEnter={() => {
            setHover('print')
            warmIntro()
          }}
          onPointerLeave={() => setHover(null)}
          onFocus={warmIntro}
        >
          <span className="pk-halftone" aria-hidden="true" />
          <span className="pk-sun" aria-hidden="true" />
          <span className="pk-sun-dots" aria-hidden="true" />

          <span className="pk-fig pk-fig-p" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="pk-photo"
              src={portrait.print}
              width={portrait.width}
              height={portrait.height}
              alt=""
              decoding="async"
            />
            <span className="pk-ht">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={portrait.print} width={portrait.width} height={portrait.height} alt="" decoding="async" />
              <span className="pk-scr" />
            </span>
            <span className="pk-ov pk-tint" />
          </span>
          <svg className="pk-outline" viewBox="0 0 800 800" aria-hidden="true">
            <use href="#pk-silp" fill="none" stroke="#17141b" strokeWidth="3.4" strokeLinejoin="round" />
          </svg>
          <span className="pk-curl" aria-hidden="true" />

          <span className="pk-burst" aria-hidden="true">
            No.&nbsp;1
          </span>

          <span className="pk-abs pk-mast-rule" aria-hidden="true" />
          <span className="pk-abs pk-mast" aria-hidden="true">
            <span className="pk-price">10¢</span>
            <span className="pk-word">
              KONNUR
              <br />
              COMICS
            </span>
          </span>

          <span className="pk-ask" aria-hidden="true">
            <span className="pk-ask-a">Choose your</span>
            <span className="pk-ask-g"> </span>
            <span className="pk-ask-b">edition</span>
          </span>

          <span className="pk-abs pk-blk-p">
            <span className="pk-h-p" style={{ display: 'block' }}>
              PRINT
            </span>
            <span className="pk-body-p" style={{ display: 'block' }}>
              An inked, four-color comic.
            </span>
            <span className="pk-cta-p">Open the issue</span>
          </span>

          <RegMark className="is-top" />
          <RegMark className="is-bottom" />
          <span className="pk-cmyk" aria-hidden="true">
            <i style={{ background: '#1e6fd6' }} />
            <i style={{ background: '#d7262d' }} />
            <i style={{ background: '#f6c21c' }} />
            <i style={{ background: '#17141b' }} />
          </span>
        </button>
      </div>

      {/* ================= the seal presides over the seam ================= */}
      <svg className="pk-seal" viewBox="0 0 120 120" role="img" aria-label="DK monogram">
        {/* SCREEN half: satin silver, top-lit, a dark rim; the mark in ink */}
        {/* The M4 mark carries its own ring (r 53.5 here), which is the coin's rim. */}
        <g className="pk-seal-l">
          <circle cx="60" cy="64" r="55" fill="#000" opacity=".62" filter="url(#pk-glow)" />
          <circle cx="60" cy="60" r="55" fill="url(#pk-disc)" />
          <circle className="pk-spec" cx="60" cy="60" r="55" fill="url(#pk-spec)" />
          <circle cx="60" cy="60" r="47" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth=".8" />
          <svg x="6.5" y="6.5" width="107" height="107" viewBox="0 0 100 100" overflow="visible">
            <path fill="#0b0d10" d={DK_SEAL_MARK_PATH} />
          </svg>
        </g>
        {/* PRINT half: the same mark in ink on a yellow roundel */}
        <g className="pk-seal-r">
          <circle cx="64" cy="64" r="55" fill="#17141b" />
          <circle cx="60" cy="60" r="54" fill="#f6c21c" />
          <svg x="6.5" y="6.5" width="107" height="107" viewBox="0 0 100 100" overflow="visible">
            <path fill="#17141b" d={DK_SEAL_MARK_PATH} />
          </svg>
        </g>
      </svg>
    </div>
  )
}
