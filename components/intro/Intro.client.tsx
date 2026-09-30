'use client'

/**
 * v3 §2.7 — the PRINT intro + the X4 hand-off (option A), loaded by
 * IntroGate.client.tsx through next/dynamic ONLY when it must run, so this
 * module, IntroArt, styles/v3/intro.css and the Anton face never ride the
 * first-load bundle.
 *
 * The sequence is design-workshop/intro-FINAL.html ported beat for beat —
 * montage → rush → KONNUR letterform reveal → chrome flood → lockup — in its
 * own crimson grade (never the X4 storyboard's petrol stills). The DOM below
 * mirrors the source's `#stage`; lib/intro/timeline.ts is the clock (pure,
 * unit-tested) and this runner only flips classes when the clock says so.
 *
 * Overlay contract: full-screen `role="dialog"` above the nav (--z-intro),
 * body scroll locked, Lenis stopped, "Skip" focused on mount (Tab stays on
 * it; Esc skips). Any wheel / touch-move / space / arrow before the lockup
 * fast-forwards to it (everything earlier snaps to its end state, the
 * lockup's own settle still plays). Skip / Esc go to the lockup AND start
 * the hand-off at once.
 *
 * Hand-off (X4, five beats — HANDOFF_BEATS): REST on the lockup; the next
 * scroll intent (or REST_IDLE_MS idle) prints it — PRINT: a halftone front
 * sweeps the crimson page to cream ink (600 ms; the silver letters are
 * already inked beneath it); REGISTER: the sheet fades to the real cover and
 * KONNUR FLIP-glides onto the hero's name box (700 ms --ease-structural;
 * `#hero [data-intro-name]`, else `#hero h1`, else a fade) while the masthead
 * drops (240 ms, html[data-intro-handoff]); STAMP: the DK seal prints
 * (scale 1.4 → 1 + 6° settle + ink bleed, 180 ms — director call (i)) on an
 * impact burst — the overlay's own copy of the seal (DkSeal `bug`) at the
 * Navbar seal's measured box, so the burst sits behind it; LAND: the cover
 * lands — `onLand()` (the gate marks the
 * session, removes html[data-intro] and dispatches 'signal:intro-done' so
 * the hero's entry plays) — and the overlay fades 200 ms, then `onDone()`
 * unmounts it. Reduced motion never mounts this (the gate checks); if it
 * arrives mid-run the overlay just lands.
 *
 * Content: every string is INTRO_COPY / INTRO_ASSETS (lib/data/introAssets),
 * where the §1.9 corrections live. Fonts: Anton for the letterforms (loaded
 * here, on demand) + IBM Plex Mono from the layout's variable.
 */

import { useEffect, useId, useRef, type CSSProperties } from 'react'
import { Anton } from 'next/font/google'
import { INTRO_COPY, INTRO_ASSETS } from '@/lib/data/introAssets'
import { getLenis } from '@/lib/motion/lenis'
import { useSignalStore } from '@/lib/state/store'
import {
  INTRO_HANDOFF_ATTR,
  INTRO_NAME_TARGET_ATTR,
  type IntroHandoffPhase,
} from '@/lib/intro/events'
import {
  HANDOFF_TOTAL_MS,
  MASK_STRIP,
  MONTAGE_CUTS,
  REST_IDLE_MS,
  RUSH_STRIP,
  buildTimeline,
  fastForwardPlan,
  handoffBeat,
  scheduleEvents,
  type IntroEvent,
} from '@/lib/intro/timeline'
import DkSeal from '@/components/chrome/DkSeal'
import Art from './IntroArt'
import '@/styles/v3/intro.css'

/** The letterform face of the source (`--disp`), self-hosted, fetched only with this chunk. */
const anton = Anton({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-anton',
  display: 'swap',
  preload: false,
})

export interface IntroProps {
  /** The cover has landed (the overlay is still fading): mark the session, release the hero. */
  onLand: () => void
  /** The overlay has finished — unmount it. */
  onDone: () => void
}

/* ------------------------------------------------------------ constants */

/** Start no later than this after mount, even if fonts / plates are still loading. */
const START_CAP_MS = 900
/** The land fade (intro-root-out) when reduced motion arrives mid-run. */
const REDUCED_LAND_MS = 200
/** The key presses that count as scroll intent (fast-forward / hand-off). */
const INTENT_KEYS = new Set([' ', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'End', 'Home'])

interface Ember {
  x: string
  s: string
  d: string
  dl: string
  dx: string
  cool?: boolean
}

/** The lockup's slow embers (far plane). */
const EMBERS: readonly Ember[] = [
  { x: '16%', s: '4px', d: '6.4s', dl: '.2s', dx: '30px' },
  { x: '28%', s: '3px', d: '7.6s', dl: '2.1s', dx: '-24px', cool: true },
  { x: '44%', s: '5px', d: '5.6s', dl: '1.2s', dx: '18px' },
  { x: '58%', s: '3px', d: '8.2s', dl: '3.4s', dx: '-30px' },
  { x: '70%', s: '4px', d: '6.9s', dl: '.9s', dx: '26px', cool: true },
  { x: '82%', s: '3px', d: '7.2s', dl: '2.8s', dx: '-18px' },
  { x: '36%', s: '3px', d: '9s', dl: '4.4s', dx: '40px' },
]
/** Near-field embers (the close plane of the living rest). */
const NEAR_EMBERS: readonly Ember[] = [
  { x: '21%', s: '7px', d: '5.4s', dl: '.6s', dx: '36px' },
  { x: '63%', s: '6px', d: '6.2s', dl: '3.1s', dx: '-42px', cool: true },
  { x: '84%', s: '8px', d: '5s', dl: '5.2s', dx: '28px' },
]
/** The landing flurry — burns out in ~1 s. */
const FLURRY: readonly Ember[] = [
  { x: '20%', s: '4px', d: '.85s', dl: '0s', dx: '26px' },
  { x: '30%', s: '3px', d: '1.05s', dl: '.1s', dx: '-20px', cool: true },
  { x: '40%', s: '5px', d: '.9s', dl: '.04s', dx: '14px' },
  { x: '48%', s: '3px', d: '1.1s', dl: '.14s', dx: '-28px' },
  { x: '56%', s: '4px', d: '.8s', dl: '.02s', dx: '22px', cool: true },
  { x: '64%', s: '5px', d: '1s', dl: '.08s', dx: '-16px' },
  { x: '74%', s: '3px', d: '.95s', dl: '.16s', dx: '30px' },
  { x: '82%', s: '4px', d: '.88s', dl: '.06s', dx: '-24px', cool: true },
  { x: '12%', s: '3px', d: '1.08s', dl: '.12s', dx: '18px' },
]

const emberStyle = (e: Ember): CSSProperties =>
  ({ '--x': e.x, '--s': e.s, '--d': e.d, '--dl': e.dl, '--dx': e.dx }) as CSSProperties

/** X4 tier 4 — a 28-point impact burst (yellow over a red copy) in a 200 × 180 box. */
const BURST_POINTS = (() => {
  const pts: string[] = []
  for (let k = 0; k < 56; k++) {
    const a = (k / 56) * Math.PI * 2 - Math.PI / 2
    const r = k % 2 === 0 ? 88 : 60
    pts.push(`${(100 + Math.cos(a) * r).toFixed(1)},${(90 + Math.sin(a) * r * 0.9).toFixed(1)}`)
  }
  return pts.join(' ')
})()
const BURST_SPECKS: readonly [number, number, number][] = [
  [18, 22, 3],
  [186, 30, 2.5],
  [12, 150, 2.5],
  [190, 158, 3],
  [104, 6, 2],
]

type Phase = 'boot' | 'run' | 'lock' | 'rest' | 'handoff' | 'done'

/* -------------------------------------------------------------- helpers */

interface NameTarget {
  el: Element
  /** The box is the surname word itself (match by width), not a whole name line (fit inside). */
  word: boolean
  /** An explicit resting rotation from data-intro-name="-1.2deg", else '' (read from the DOM). */
  rotate: string
}

/**
 * The hero element the flyer lands on, most specific first: the hook C2
 * marks (`data-intro-name`), the cover name's surname span, the cover
 * name block, the h1.
 */
function findNameTarget(hero: HTMLElement): NameTarget | null {
  const marked = hero.querySelector(`[${INTRO_NAME_TARGET_ATTR}]`)
  if (marked) {
    const value = marked.getAttribute(INTRO_NAME_TARGET_ATTR) ?? ''
    return { el: marked, word: true, rotate: /^-?\d+(\.\d+)?deg$/.test(value) ? value : '' }
  }
  const last = hero.querySelector('[data-cover-name] .hero-name-last')
  if (last) return { el: last, word: true, rotate: '' }
  const block = hero.querySelector('[data-cover-name]') ?? hero.querySelector('h1')
  return block ? { el: block, word: false, rotate: '' } : null
}

/**
 * The target's RESTING box and rotation. While the hero is held its entry
 * animations sit paused on their first frame (offset / faded), so for this
 * one layout read every animation on the target's chain up to #hero is
 * neutralised inline and restored right after (they are paused at 0 anyway,
 * so restarting them changes nothing). A `word` target is measured by its
 * TEXT (a Range), not its element box: the cover sets `.hero-name-last` to
 * display:block, so the element spans the whole column while the ink is
 * only as wide as KONNUR.
 */
function measureResting(
  target: Element,
  hero: HTMLElement,
  word: boolean,
): { rect: DOMRect; angle: number } {
  const touched: { el: HTMLElement; animation: string }[] = []
  for (let node: Element | null = target; node; node = node.parentElement) {
    if (node instanceof HTMLElement && getComputedStyle(node).animationName !== 'none') {
      touched.push({ el: node, animation: node.style.animation })
      node.style.animation = 'none'
    }
    if (node === hero) break
  }
  let rect = target.getBoundingClientRect()
  if (word) {
    try {
      const range = document.createRange()
      range.selectNodeContents(target)
      const ink = range.getBoundingClientRect()
      if (ink.width > 0 && ink.height > 0) rect = ink
    } catch {
      /* no Range — the element box will do */
    }
  }
  let angle = 0
  for (let node: Element | null = target; node && node !== hero; node = node.parentElement) {
    const t = getComputedStyle(node).transform
    if (t && t !== 'none') {
      try {
        const m = new DOMMatrix(t)
        angle += (Math.atan2(m.b, m.a) * 180) / Math.PI
      } catch {
        /* no DOMMatrix — land unrotated */
      }
    }
  }
  for (const { el, animation } of touched) el.style.animation = animation
  return { rect, angle }
}

/** The seal the STAMP prints: the Navbar's visible one (PRINT shows the bug). */
function findSeal(): Element | null {
  const seals = document.querySelectorAll("[data-component='Navbar'] .dk-seal")
  for (const seal of seals) {
    const r = seal.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) return seal
  }
  return null
}

function setHandoffAttr(phase: IntroHandoffPhase | null): void {
  const html = document.documentElement
  if (phase) html.setAttribute(INTRO_HANDOFF_ATTR, phase)
  else html.removeAttribute(INTRO_HANDOFF_ATTR)
}

/* ------------------------------------------------------------ component */

export default function Intro({ onLand, onDone }: IntroProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const montageRef = useRef<HTMLDivElement>(null)
  const rushRef = useRef<HTMLDivElement>(null)
  const whipRef = useRef<HTMLDivElement>(null)
  const maskboxRef = useRef<HTMLDivElement>(null)
  const mtextRef = useRef<SVGTextElement>(null)
  const kctRef = useRef<SVGTextElement>(null)
  const skipRef = useRef<HTMLButtonElement>(null)
  const flyerRef = useRef<HTMLSpanElement>(null)
  const landRef = useRef(onLand)
  const doneRef = useRef(onDone)
  landRef.current = onLand
  doneRef.current = onDone

  const kcId = `intro-kc-${useId().replace(/[^A-Za-z0-9_-]/g, '')}`
  const surname = INTRO_COPY.surname
  const firstName = Array.from(INTRO_COPY.firstName)

  useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    const montage = montageRef.current
    const rush = rushRef.current
    const whip = whipRef.current
    const maskbox = maskboxRef.current
    const mtext = mtextRef.current
    const kct = kctRef.current
    const skip = skipRef.current
    if (!root || !stage || !montage || !rush || !whip || !maskbox || !mtext || !kct || !skip) return

    const html = document.documentElement
    const pans = Array.from(montage.querySelectorAll<HTMLElement>('.pan'))
    const beats = buildTimeline()
    const events = scheduleEvents(beats)

    let phase: Phase = 'boot'
    let queue: IntroEvent[] = []
    let raf = 0
    let t0 = 0
    let zc = 10
    let idle = 0
    let disposed = false
    const timers: number[] = []
    const later = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(fn, ms))
    }

    /* ---- the page beneath: scroll locked, Lenis stopped, focus held ---- */
    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement
    const lock = () => {
      if (document.body.style.overflow !== 'hidden') document.body.style.overflow = 'hidden'
      getLenis()?.stop()
    }
    lock()
    skip.focus({ preventScroll: true })
    /* The picker's surface, which handed us the PRINT choice, releases the
       page again when IT unmounts (~0.5 s in): re-lock on that write. Only a
       differing value is rewritten, so the observer cannot loop. */
    const relock = new MutationObserver(() => {
      if (!disposed && document.body.style.overflow !== 'hidden') lock()
    })
    relock.observe(document.body, { attributes: true, attributeFilter: ['style'] })

    /* ---- the KONNUR clip, sized to the wordbox (intro-FINAL sizeWord) ---- */
    const sizeWord = () => {
      let ok = false
      try {
        const clip = `url(#${kcId})`
        if (
          typeof CSS !== 'undefined' &&
          typeof CSS.supports === 'function' &&
          !(CSS.supports('clip-path', clip) || CSS.supports('-webkit-clip-path', clip))
        ) {
          throw new Error('noclip')
        }
        const bb = mtext.getBBox()
        if (bb && bb.width > 10 && bb.height > 10) {
          /* tight cap-ink vertical bounds (getBBox gives the loose em box) */
          let inkTop = bb.y
          let inkH = bb.height
          try {
            const ctx = document.createElement('canvas').getContext('2d')
            if (ctx) {
              ctx.font = `100px ${getComputedStyle(mtext).fontFamily}`
              const m = ctx.measureText(surname)
              if (m && isFinite(m.actualBoundingBoxAscent) && m.actualBoundingBoxAscent > 10) {
                inkTop = 100 - m.actualBoundingBoxAscent
                inkH = m.actualBoundingBoxAscent + Math.max(m.actualBoundingBoxDescent, 0)
              }
            }
          } catch {
            /* canvas text metrics unavailable — the loose box will do */
          }
          const vw = Math.max(html.clientWidth || 0, 320)
          const W = Math.min(vw * 0.88, 720)
          const s = W / bb.width
          const H = inkH * s
          maskbox.style.width = `${W}px`
          maskbox.style.height = `${H}px`
          root.style.setProperty('--mbw', `${W}px`)
          root.style.setProperty('--mbh', `${H}px`)
          kct.setAttribute('transform', `translate(${-bb.x * s} ${-inkTop * s}) scale(${s})`)
          ok = true
        }
      } catch {
        /* fall back to plain chrome text (.kfall) */
      }
      root.classList.toggle('is-noclip', !ok)
    }

    /* ---- the runner ---------------------------------------------------- */
    const whipFlash = () => {
      whip.classList.remove('is-go')
      void whip.offsetWidth
      whip.classList.add('is-go')
    }

    const apply = (e: IntroEvent, silent = false) => {
      switch (e.type) {
        case 'cut': {
          if (silent) return
          const i = e.cut ?? 0
          const pan = pans[i]
          if (!pan) return
          pan.style.zIndex = String(zc++)
          pan.style.setProperty('--td', `${Math.min(Math.round(MONTAGE_CUTS[i].hold * 0.85), 440)}ms`)
          pan.classList.add('on')
          if (MONTAGE_CUTS[i].fx === 'whip') whipFlash()
          pans[i - 1]?.classList.add('off') /* keep .on so fill-both poses hold beneath */
          return
        }
        case 'cut-clear':
          if (silent) return
          pans[e.cut ?? 0]?.classList.remove('on', 'off')
          return
        case 'rush':
          if (silent) return
          whipFlash()
          rush.classList.add('is-on')
          pans[pans.length - 1]?.classList.add('off')
          return
        case 'montage-done':
          montage.classList.add('is-done')
          return
        case 'reveal':
          if (!silent) whipFlash()
          stage.classList.add('is-reveal')
          rush.classList.remove('is-on')
          return
        case 'who':
          stage.classList.add('is-who')
          return
        case 'flood':
          stage.classList.add('is-flood', 'is-land')
          return
        case 'lock':
          stage.classList.add('is-lock')
          phase = 'lock'
          return
        case 'rest':
          phase = 'rest'
          idle = window.setTimeout(startHandoff, REST_IDLE_MS)
          return
      }
    }

    const frame = (now: number) => {
      raf = 0
      const elapsed = now - t0
      while (queue.length && elapsed >= queue[0].at) apply(queue.shift() as IntroEvent)
      if (queue.length) raf = requestAnimationFrame(frame)
    }

    const run = () => {
      if (disposed || phase !== 'boot') return
      phase = 'run'
      queue = events.slice()
      t0 = performance.now()
      raf = requestAnimationFrame(frame)
    }

    /** Everything before the lockup snaps to its end state; the settle still plays. */
    const fastForward = () => {
      if (phase === 'boot') run()
      if (phase !== 'run') return
      const now = performance.now()
      const plan = fastForwardPlan(beats, events, now - t0)
      stage.classList.add('is-ff')
      for (const e of plan.flush) apply(e, true)
      queue = queue.filter((e) => e.at > plan.resumeAt)
      t0 = now - plan.resumeAt
      phase = 'lock'
      if (!raf && queue.length) raf = requestAnimationFrame(frame)
    }

    /* ---- the hand-off (X4 option A) ----------------------------------- */
    const register = () => {
      const hero = document.getElementById('hero')
      const target = hero ? findNameTarget(hero) : null
      const from = flyerRef.current?.getBoundingClientRect()
      let flip = false
      if (hero && target && from && from.width > 0 && from.height > 0) {
        const { rect: to, angle } = measureResting(target.el, hero, target.word)
        /* a replay mid-page: the hero is off-screen → fade instead of flying away */
        const visible = to.width > 0 && to.height > 0 && to.bottom > 0 && to.top < window.innerHeight
        if (visible) {
          const scale = target.word
            ? to.width / from.width
            : Math.min(to.width / from.width, to.height / from.height)
          root.style.setProperty('--fx', `${to.left + to.width / 2 - (from.left + from.width / 2)}px`)
          root.style.setProperty('--fy', `${to.top + to.height / 2 - (from.top + from.height / 2)}px`)
          root.style.setProperty('--fs', String(Math.max(0.2, Math.min(scale, 4))))
          root.style.setProperty('--fr', target.rotate || `${angle.toFixed(2)}deg`)
          flip = true
        }
      }
      if (!flip) root.classList.add('is-fade')
      root.classList.add('is-register')
      setHandoffAttr('register')
    }

    const stamp = () => {
      const seal = findSeal()
      if (seal) {
        const r = seal.getBoundingClientRect()
        root.style.setProperty('--bx', `${r.left + r.width / 2}px`)
        root.style.setProperty('--by', `${r.top + r.height / 2}px`)
        /* the overlay's own copy of the seal stamps at exactly the Navbar's box
           (the burst sits BEHIND it — X4 tier 4 — which the page's seal, under
           the overlay, could never do) */
        root.style.setProperty('--sw', `${r.width}px`)
        root.style.setProperty('--sh', `${r.height}px`)
        /* X4 tier 4: the burst is ≈ 1.5 × the mark; the seal's box includes its ring */
        root.style.setProperty('--bs', `${Math.max(88, Math.round(r.width * 2.2))}px`)
      }
      root.classList.add('is-stamp')
      setHandoffAttr('stamp')
    }

    const land = () => {
      root.classList.add('is-land')
      setHandoffAttr('land')
      landRef.current()
    }

    const finish = () => {
      if (phase === 'done') return
      phase = 'done'
      doneRef.current()
    }

    /* a const (not a hoisted declaration) so the `root` narrowing above applies;
       `apply` only calls it once the queue runs, long after initialisation */
    const startHandoff = () => {
      if (disposed || phase === 'handoff' || phase === 'done') return
      if (phase === 'boot' || phase === 'run') fastForward()
      phase = 'handoff'
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      queue = []
      window.clearTimeout(idle)
      root.classList.add('is-print')
      setHandoffAttr('print')
      later(register, handoffBeat('register').at)
      later(stamp, handoffBeat('stamp').at)
      later(land, handoffBeat('land').at)
      later(finish, HANDOFF_TOTAL_MS)
    }

    /** Reduced motion arrived mid-run: no choreography, just land. */
    const landNow = () => {
      if (disposed || phase === 'done') return
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      queue = []
      window.clearTimeout(idle)
      for (const t of timers) window.clearTimeout(t)
      timers.length = 0
      phase = 'handoff'
      root.classList.add('is-land')
      landRef.current()
      later(finish, REDUCED_LAND_MS)
    }

    /* ---- input --------------------------------------------------------- */
    const intent = () => {
      if (phase === 'boot' || phase === 'run') fastForward()
      else if (phase === 'lock' || phase === 'rest') startHandoff()
    }
    const skipAll = () => {
      if (phase === 'handoff' || phase === 'done') return
      startHandoff()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        skipAll()
        return
      }
      if (e.key === 'Tab') {
        /* the only control is Skip — keep focus on it (dialog focus trap) */
        e.preventDefault()
        skip.focus({ preventScroll: true })
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        /* modal: the palette must not open beneath the overlay */
        e.preventDefault()
        e.stopPropagation()
        return
      }
      if (INTENT_KEYS.has(e.key)) {
        e.preventDefault()
        intent()
      }
    }
    const onWheel = () => intent()
    const onTouchMove = () => intent()
    const onClick = (e: MouseEvent) => {
      if (skip.contains(e.target as Node)) return
      if (phase === 'lock' || phase === 'rest') startHandoff()
    }
    const onSkipClick = () => skipAll()
    let resizeRaf = 0
    const onResize = () => {
      if (resizeRaf) return
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0
        sizeWord()
      })
    }

    window.addEventListener('keydown', onKey, true)
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('resize', onResize)
    root.addEventListener('click', onClick)
    skip.addEventListener('click', onSkipClick)
    const unsubscribe = useSignalStore.subscribe((state, prev) => {
      if (state.motionReduced && !prev.motionReduced) landNow()
    })

    /* ---- go: size the word, wait (briefly) for fonts + the first plates ---- */
    sizeWord()
    const fontsReady: Promise<unknown> =
      typeof document.fonts?.ready?.then === 'function' ? document.fonts.ready : Promise.resolve()
    fontsReady.then(() => {
      if (!disposed) sizeWord()
    })
    const early = new Set(INTRO_ASSETS.slice(0, 2).map((a) => a.src))
    const plates = Array.from(montage.querySelectorAll('img'))
      .filter((img) => early.has(img.getAttribute('src') ?? ''))
      .map((img) => img.decode().catch(() => undefined))
    const ready = Promise.all([fontsReady, ...plates])
    const cap = new Promise<void>((resolve) => later(resolve, START_CAP_MS))
    Promise.race([ready, cap]).then(run, run)

    return () => {
      disposed = true
      relock.disconnect()
      if (raf) cancelAnimationFrame(raf)
      if (resizeRaf) cancelAnimationFrame(resizeRaf)
      window.clearTimeout(idle)
      for (const t of timers) window.clearTimeout(t)
      unsubscribe()
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('resize', onResize)
      root.removeEventListener('click', onClick)
      skip.removeEventListener('click', onSkipClick)
      setHandoffAttr(null)
      document.body.style.overflow = previousOverflow
      getLenis()?.start()
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true })
      }
    }
  }, [kcId, surname])

  return (
    <div
      ref={rootRef}
      className={`intro-root ${anton.variable}`}
      role="dialog"
      aria-modal="true"
      aria-label={INTRO_COPY.dialogLabel}
      data-component="Intro"
      data-island="client"
      style={{ '--vs-i': 9 } as CSSProperties}
    >
      <button ref={skipRef} type="button" className="intro-skip" aria-label={INTRO_COPY.skipLabel}>
        {INTRO_COPY.skip}
      </button>

      {/* the KONNUR clip path, sized to the wordbox by sizeWord() */}
      <svg className="intro-msvg" aria-hidden="true">
        <defs>
          <clipPath id={kcId}>
            <text ref={kctRef} className="ktext" x="0" y="100">
              {surname}
            </text>
          </clipPath>
        </defs>
        <text ref={mtextRef} className="ktext" x="0" y="100" visibility="hidden">
          {surname}
        </text>
      </svg>

      <div ref={stageRef} className="intro-stage">
        {/* BEAT 0 — the montage */}
        <div ref={montageRef} className="intro-montage" aria-hidden="true">
          {MONTAGE_CUTS.map((cut) => (
            <div
              key={cut.art}
              className={`pan fx${cut.fx}`}
              style={
                {
                  '--s0': cut.s0,
                  '--s1': cut.s1,
                  '--x0': cut.x0,
                  '--y0': cut.y0,
                  '--x1': cut.x1,
                  '--y1': cut.y1,
                  ...(cut.sx ? { '--sx': cut.sx } : null),
                } as CSSProperties
              }
            >
              <div className="cam">
                <Art id={cut.art} />
              </div>
              <i className="dimr" />
              <i className="fold" />
            </div>
          ))}
        </div>

        {/* BEAT 1 — the rush */}
        <div ref={rushRef} className="intro-rush" aria-hidden="true">
          <div className="strip">
            {RUSH_STRIP.map((id, i) => (
              <div key={`${id}-${i}`} className="cell">
                <Art id={id} />
              </div>
            ))}
          </div>
        </div>

        {/* BEATS 2–4 — reveal, flood, lockup */}
        <div className="intro-tcard">
          <div className="field" aria-hidden="true" />
          <div className="plx plxf" aria-hidden="true">
            <div className="glow" />
          </div>
          {EMBERS.map((e, i) => (
            <i key={i} className={e.cool ? 'em cool' : 'em'} style={emberStyle(e)} aria-hidden="true" />
          ))}
          <div className="plx plxn" aria-hidden="true">
            {NEAR_EMBERS.map((e, i) => (
              <i key={i} className={e.cool ? 'em nf cool' : 'em nf'} style={emberStyle(e)} />
            ))}
          </div>
          <div className="flurry" aria-hidden="true">
            {FLURRY.map((e, i) => (
              <i key={i} className={e.cool ? 'emb cool' : 'emb'} style={emberStyle(e)} />
            ))}
          </div>

          <p className="over" aria-hidden="true">
            {firstName.map((ch, i) => (
              <span
                key={i}
                style={{ '--lx': `${((i - (firstName.length - 1) / 2) * 0.12).toFixed(2)}em` } as CSSProperties}
              >
                {ch}
              </span>
            ))}
          </p>
          <div className="wordwrap" role="heading" aria-level={1} aria-label={INTRO_COPY.lockupLabel}>
            <i className="shock" aria-hidden="true" />
            <div className="wordbox">
              <div
                ref={maskboxRef}
                className="maskbox"
                aria-hidden="true"
                style={{ '--i-clip': `url(#${kcId})` } as CSSProperties}
              >
                <div className="strip s2">
                  {MASK_STRIP.map((id, i) => (
                    <div key={`${id}-${i}`} className="cell">
                      <Art id={id} />
                    </div>
                  ))}
                </div>
                <div className="flood" />
                <div className="lsweep" />
                <div className="lsweep2" />
              </div>
              <span className="kfall" aria-hidden="true">
                {surname}
              </span>
            </div>
          </div>
          <div className="rule" aria-hidden="true" />
          <p className="role">{INTRO_COPY.role}</p>
          <div className="invite" aria-hidden="true">
            <div className="inv">
              <span className="invt">{INTRO_COPY.invite}</span>
              <svg className="chev" viewBox="0 0 16 9">
                <path d="M1.5 1.5 8 7.5l6.5-6" />
              </svg>
            </div>
          </div>
        </div>

        <div ref={whipRef} className="intro-whip" aria-hidden="true" />
      </div>

      <div className="intro-vig" aria-hidden="true" />
      <div className="intro-grain" aria-hidden="true" />

      {/* THE HAND-OFF — the printed page beneath the front, the same column in ink */}
      <div className="intro-paper" aria-hidden="true">
        <div className="intro-sheet" />
        <i className="intro-regmark tl" />
        <i className="intro-regmark bl" />
        <div className="intro-cmyk">
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="intro-inked">
          <p className="intro-ink-over">{INTRO_COPY.firstName}</p>
          <div className="intro-ink-slot">
            <div className="intro-flyer">
              <span ref={flyerRef}>{surname}</span>
              <i className="intro-speed" />
            </div>
          </div>
          <div className="intro-ink-rule" />
          <p className="intro-ink-role">{INTRO_COPY.role}</p>
          <div className="intro-ink-invite" />
        </div>
      </div>
      <div className="intro-front" aria-hidden="true" />
      <svg className="intro-burst" viewBox="0 0 200 180" aria-hidden="true">
        <polygon transform="translate(7 7)" fill="var(--i-cover-red)" points={BURST_POINTS} />
        <polygon fill="var(--i-cover-yellow)" stroke="var(--i-cover-ink)" strokeWidth="3" points={BURST_POINTS} />
        {BURST_SPECKS.map(([cx, cy, r]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="var(--i-cover-ink)" />
        ))}
      </svg>
      {/* the seal that stamps over the burst, at the Navbar seal's measured box
          (--bx --by --sw --sh); the page's own seal appears beneath at LAND */}
      <div className="intro-seal" aria-hidden="true">
        <span className="intro-seal-ink">
          <DkSeal variant="bug" size={40} />
        </span>
      </div>
    </div>
  )
}
