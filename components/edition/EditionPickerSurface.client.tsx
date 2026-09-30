'use client'

/**
 * The edition picker's surface (V3_SPEC §2.5, inventory X1-Picker) — the
 * lazy chunk behind components/edition/EditionPicker.client.tsx. Never in
 * the first-load bundle; it mounts only while html[data-pick='1'].
 *
 * The DRAWING is ./PickerFace.tsx, shared with the server-rendered shell
 * (./PickerShell.tsx) that is already on the page when this mounts. This
 * file adds the behaviour and the hand-over:
 *
 * The swap. The surface mounts invisible (picker.css: `.pk-live` without
 * `data-live` is visibility:hidden) beneath nothing — the shell is on top
 * of the page, showing the same picture. When every portrait <img> has
 * decoded (same URLs as the shell's backgrounds, so cache hits; a 2 s guard
 * never holds longer), it copies the shell's running CSS animations' times
 * onto its own (breathe, embers, seal-in, sheet-in — matched by name in
 * document order, the structure being identical), then in ONE synchronous
 * block writes html[data-picker-live='1'] (the shell goes display:none)
 * and data-live on itself (visible): the frame that shows the surface is
 * the frame the shell leaves, pixel for pixel. No entry fade. The pointer
 * state carries over too: if a half is hovered on the shell (its CSS
 * `:has(:hover)` rules draw the same hover as the surface's data-hover),
 * the surface seeds data-hover and copies the shell's running CSS
 * transitions as well, so nothing re-fades. Keyboard state carries over:
 * the half focused on the shell (its script traps Tab) is the half the
 * surface focuses. The initial (programmatic) focus draws its ring only
 * after the swap frame (`data-quiet`, lifted ~300 ms later, or at once on
 * a key press; the ring eases in) — a visible focus indicator, never in
 * the swap frame. Unmounting removes the html attribute, so the palette's
 * re-open shows the shell again until the next surface mounts.
 *
 * A queued choice. The shell's inline script records a tap / Enter /
 * 1 / 2 made before the surface was live on html[data-pick-queued]; the
 * surface reads it in the same block it goes live and chooses at once (no
 * focus, no ring) — the visitor's choice lands, just later.
 *
 * role="dialog" aria-modal, aria-label "Choose your edition". Two real
 * controls: the SCREEN half and the PRINT sheet are each ONE <button>
 * (the frame's whole-half links) named by their visible title, line and
 * call to action (label in name, WCAG 2.5.3);
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
 * Focus, at the end of the fade: left on the intro's Skip when the intro
 * took it, else back on what had it before the picker, else on the main
 * landmark (lib/utils/focusMain) — never dropped to <body>.
 *
 * One photograph, one cut: both halves draw the portrait through the same
 * silhouette clip at the same page position, so the features meet at the
 * tear; the SCREEN half shows the -41 grade, the PRINT sheet the paper
 * grade through a CSS dot screen. Phones draw the 660 px encodes — the
 * same query (PICKER_PHONE_QUERY) the shell's CSS uses, so the files match.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { PICK_ATTR, applyEdition, type Edition } from '@/lib/commands/context'
import { getLenis } from '@/lib/motion/lenis'
import { useSignalStore } from '@/lib/state/store'
import { INTRO_START_EVENT } from '@/lib/intro/events'
import { focusMain } from '@/lib/utils/focusMain'
import PickerFace from './PickerFace'
import {
  PICKER_COPY,
  PICKER_LIVE_ATTR,
  PICKER_PHONE_QUERY,
  PICKER_QUEUED_ATTR,
  PICKER_SHELL_ATTR,
  pickerPortraitSources,
} from './picker.shared'

/** Window event the picker fires after a PRINT choice; the intro gate (C6) listens (lib/intro/events). */
export { INTRO_START_EVENT }
/** The approved X1 copy — lives in ./picker.shared (server-safe); re-exported for tests. */
export { PICKER_COPY }

/** The intro overlay's root (C6: data-component="Intro"); the PRINT fade waits for it. */
const INTRO_SELECTOR = '[data-component="Intro"]'
const INTRO_WAIT_MS = 1500
const INTRO_POLL_MS = 50
/** Never hold the swap longer than this waiting for a portrait to decode. */
const LIVE_GUARD_MS = 2000
/** The initial focus ring eases in this long after the swap (never in its frame). */
const QUIET_MS = 300

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

/**
 * Copy the shell's animation clocks onto the surface's, so nothing restarts
 * at the swap: same keyframes on the same nodes in the same order (both
 * render PickerFace), so matching by animation name, in document order, is
 * exact. A finished entrance (seal-in, sheet-in) stays finished. CSS
 * transitions are matched the same way, by property: a hover fade that is
 * mid-flight on the shell continues on the surface from the same point; one
 * that already ended on the shell is finished on the surface (the hover
 * seed started it from rest, the shell is already at rest at the far end).
 */
function syncAnimations(from: Element, to: Element): void {
  const key = (a: Animation): string | undefined => {
    const css = a as Partial<CSSAnimation & CSSTransition>
    if (css.animationName) return `a:${css.animationName}`
    if (css.transitionProperty) return `t:${css.transitionProperty}`
    return undefined
  }
  const queues = new Map<string, Animation[]>()
  for (const a of from.getAnimations({ subtree: true })) {
    const k = key(a)
    if (!k) continue
    const q = queues.get(k) ?? []
    q.push(a)
    queues.set(k, q)
  }
  for (const a of to.getAnimations({ subtree: true })) {
    const k = key(a)
    if (!k) continue
    const src = queues.get(k)?.shift()
    if (src && src.currentTime !== null) a.currentTime = src.currentTime
    else if (k.startsWith('t:')) a.finish()
  }
}

/** Which half the pointer rests on, read off the shell's :hover state at the swap. */
function shellHover(shell: Element): Edition | null {
  if (shell.querySelector('.pk-half-s:hover')) return 'screen'
  if (shell.querySelector('.pk-half-p:hover')) return 'print'
  return null
}

/** Which half holds keyboard focus on the shell at the swap (its script traps Tab there). */
function shellFocus(shell: Element): Edition | null {
  const active = document.activeElement
  if (!active || !shell.contains(active)) return null
  return active.classList.contains('pk-half-p') ? 'print' : 'screen'
}

export interface EditionPickerSurfaceProps {
  /** Called once the dismiss fade has finished — the gate unmounts. */
  onDone: () => void
}

export default function EditionPickerSurface({ onDone }: EditionPickerSurfaceProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const screenRef = useRef<HTMLButtonElement>(null)
  const printRef = useRef<HTMLButtonElement>(null)
  const [leaving, setLeaving] = useState<Edition | null>(null)
  const [hover, setHover] = useState<Edition | null>(null)
  /* The initial focus is programmatic: its ring is held back for the swap
     frame (picker.css `.pk[data-quiet]`) and eases in QUIET_MS later, or at
     once on the first key. */
  const [quiet, setQuiet] = useState(true)
  const chosen = useRef(false)
  /* What had focus before the picker took it (restored if the surface
     leaves without a choice). Captured before the swap moves focus — the
     scroll-lock effect below runs after the swap, too late to see it. */
  const restoreFocus = useRef<HTMLElement | null>(null)
  /* choose() is defined after the swap effect that may need it (a queued
     choice); the ref keeps the effect's dependency list empty. */
  const chooseRef = useRef<(edition: Edition) => void>(() => {})
  /* The swap effect has an empty dependency list; it reaches onDone through a ref. */
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  /* Decided once per mount: the same query picker.css uses for the shell's encode. */
  const [portrait] = useState(() => pickerPortraitSources(window.matchMedia(PICKER_PHONE_QUERY).matches))

  // Scroll lock + Lenis stop + overlay flag. The cleanup restores them ONLY
  // when the surface leaves without a choice (the gate hiding it): after
  // choose() the page was released there, and the intro (PRINT) or the
  // hero (SCREEN) owns the lock and the flag by the time the fade ends —
  // releasing again from here would land mid-intro.
  useEffect(() => {
    // A queued choice was honoured in the swap effect (before this runs):
    // the page is already released, and the intro or the hero owns it.
    if (chosen.current) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    getLenis()?.stop()
    useSignalStore.getState().setOverlayOpen(true)
    return () => {
      if (chosen.current) return
      document.body.style.overflow = previousOverflow
      getLenis()?.start()
      useSignalStore.getState().setOverlayOpen(false)
      const el = restoreFocus.current
      if (el && el.isConnected && !el.closest(`[${PICKER_SHELL_ATTR}]`)) el.focus({ preventScroll: true })
    }
  }, [])

  // The swap (see the header): go live once the portraits have decoded,
  // in one synchronous block with the shell's exit; initial focus follows
  // (a visibility:hidden button cannot take it before).
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const html = document.documentElement
    const active = document.activeElement as HTMLElement | null
    restoreFocus.current = active && active !== document.body ? active : null
    let done = false
    let guard = 0
    let quietTimer = 0
    const goLive = () => {
      if (done) return
      done = true
      window.clearTimeout(guard)
      // The shell's fallback (picker.shared PICKER_FALLBACK_MS) may already
      // have applied a queued choice and cleared data-pick while this chunk
      // was slow: the picker is over, so step aside instead of showing it.
      if (html.getAttribute(PICK_ATTR) !== '1') {
        onDoneRef.current()
        return
      }
      const shell = document.querySelector(`[${PICKER_SHELL_ATTR}]`)
      const queued = html.getAttribute(PICKER_QUEUED_ATTR)
      html.removeAttribute(PICKER_QUEUED_ATTR)
      const hovered = shell ? shellHover(shell) : null
      const focused = shell ? shellFocus(shell) : null
      // The surface's first style pass, at rest: the hover seed below then
      // starts the same transitions the shell's hover did (from rest), and
      // a queued choice's fade has a style to fade from.
      void getComputedStyle(root).opacity
      if (hovered) {
        root.setAttribute('data-hover', hovered)
        setHover(hovered)
        void getComputedStyle(root).opacity
      }
      if (shell) syncAnimations(shell, root)
      html.setAttribute(PICKER_LIVE_ATTR, '1')
      root.setAttribute('data-live', '1')
      if (queued === 'screen' || queued === 'print') {
        chooseRef.current(queued)
        return
      }
      ;(focused === 'print' ? printRef.current : screenRef.current)?.focus({ preventScroll: true })
      quietTimer = window.setTimeout(() => setQuiet(false), QUIET_MS)
    }
    const imgs = Array.from(root.querySelectorAll('img'))
    const decoded = imgs.map((img) =>
      img.complete && img.naturalWidth > 0 ? Promise.resolve() : img.decode().catch(() => undefined),
    )
    if (imgs.every((img) => img.complete)) goLive()
    else {
      void Promise.all(decoded).then(goLive)
      guard = window.setTimeout(goLive, LIVE_GUARD_MS)
    }
    return () => {
      done = true
      window.clearTimeout(guard)
      window.clearTimeout(quietTimer)
      html.removeAttribute(PICKER_LIVE_ATTR)
    }
  }, [])

  /* After a choice the picker's two buttons leave with it: focus goes back
     to what held it before the picker (a re-pick opened from elsewhere), else
     to the page's main landmark — never to <body>. When the intro runs it has
     already taken focus (its Skip), and that is left alone. */
  const handFocusOn = useCallback(() => {
    const active = document.activeElement
    const inPicker = (el: Element | null) =>
      !!el && (!!rootRef.current?.contains(el) || !!el.closest(`[${PICKER_SHELL_ATTR}]`))
    if (active && active !== document.body && !inPicker(active)) return
    const el = restoreFocus.current
    if (el && el.isConnected && !inPicker(el)) {
      el.focus({ preventScroll: true })
      if (document.activeElement === el) return
    }
    focusMain()
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
        window.setTimeout(() => {
          handFocusOn()
          onDone()
        }, ms + 40)
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
    [onDone, handFocusOn]
  )
  chooseRef.current = choose

  // ← → move between the two controls; Tab cycles; 1 / 2 pick; Esc is inert.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    setQuiet(false)
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

  return (
    <PickerFace
      variant="surface"
      ids="pk"
      portrait={portrait}
      rootRef={rootRef}
      screenRef={screenRef}
      printRef={printRef}
      rootProps={{
        'data-leaving': leaving ?? undefined,
        'data-hover': hover ?? undefined,
        'data-quiet': quiet ? '1' : undefined,
        onKeyDown,
      }}
      screenProps={{
        onClick: () => choose('screen'),
        onPointerEnter: () => setHover('screen'),
        onPointerLeave: () => setHover(null),
      }}
      printProps={{
        onClick: () => choose('print'),
        onPointerEnter: () => {
          setHover('print')
          warmIntro()
        },
        onPointerLeave: () => setHover(null),
        onFocus: warmIntro,
      }}
    />
  )
}
