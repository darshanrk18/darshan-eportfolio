'use client'

/**
 * v3 — the hero's entry gate (replaces the v2 BOOT_DELAY_SCRIPT that read
 * html[data-boot], which no longer exists). Renders nothing.
 *
 * The hero's on-load motion is declarative CSS (styles/v3/hero.css, the
 * `.hero-in` nodes) that starts at page load. Two overlays can be covering
 * the page at that moment: the edition picker (html[data-pick='1'],
 * pre-paint) and the PRINT intro (html[data-intro='1'] pre-paint, or
 * started by the picker's PRINT choice). CSS pauses the entry animations
 * while either pre-paint attribute is set (`animation-play-state: paused`
 * — delays do not tick while paused); this island resolves the cases CSS
 * cannot see, through `#hero[data-entry='held' | 'play']`:
 *
 * - picker → SCREEN: data-pick is removed → the CSS hold lifts, the entry
 *   plays as the picker fades;
 * - picker → PRINT with the intro about to run: hold until the intro
 *   reports the cover has landed — `signal:intro-done` (C6), OR the
 *   hand-off attribute html[data-intro-handoff] passing through 'land',
 *   OR sessionStorage['signal.intro'] appearing (polled while held);
 *   a 16 s fallback (intro ≤ 14 s + hand-off) releases it regardless;
 * - stored PRINT + data-intro: same release paths.
 * Reduced motion never holds (nothing animates; the intro does not run).
 *
 * It also pauses the resting loops (name sheen, light breathe, floats,
 * embers, live dot) while the hero is a viewport away (§4: "paused when
 * off-screen") via `#hero[data-off]`.
 */

import { useEffect } from 'react'
import { INTRO_ATTR, INTRO_SESSION_KEY, PICK_ATTR, getCurrentEdition } from '@/lib/commands/context'

/** Dispatched by the intro island (C6) when the cover lands. */
export const INTRO_DONE_EVENT = 'signal:intro-done'
/** The hand-off attribute the intro runner writes (styles/v3/intro.css). */
const HANDOFF_ATTR = 'data-intro-handoff'
/** Safety net: never hold the hero longer than this. */
const HOLD_FALLBACK_MS = 16_000
const POLL_MS = 400

function introSeen(): boolean {
  try {
    return sessionStorage.getItem(INTRO_SESSION_KEY) === '1'
  } catch {
    return true
  }
}

export default function HeroEntry() {
  useEffect(() => {
    const hero = document.getElementById('hero')
    if (!hero) return
    const html = document.documentElement
    if (html.dataset.motion === 'reduced') return

    let fallback: ReturnType<typeof setTimeout> | null = null
    let poll: ReturnType<typeof setInterval> | null = null
    let sawLand = false

    const clearTimers = () => {
      if (fallback !== null) clearTimeout(fallback)
      if (poll !== null) clearInterval(poll)
      fallback = null
      poll = null
    }
    const play = () => {
      clearTimers()
      hero.setAttribute('data-entry', 'play')
    }
    const hold = () => {
      if (hero.getAttribute('data-entry') === 'play') return
      hero.setAttribute('data-entry', 'held')
      if (fallback === null) fallback = setTimeout(play, HOLD_FALLBACK_MS)
      if (poll === null) {
        poll = setInterval(() => {
          if (introSeen() && !html.hasAttribute(INTRO_ATTR) && !html.hasAttribute(HANDOFF_ATTR)) play()
        }, POLL_MS)
      }
    }

    // The intro will run when PRINT is in force with full motion and the
    // session has not seen it yet — exactly the pre-paint's data-intro rule.
    const introPending = () =>
      getCurrentEdition() === 'print' && html.dataset.motion !== 'reduced' && !introSeen()

    if (html.hasAttribute(PICK_ATTR) || html.hasAttribute(INTRO_ATTR)) hold()

    const observer = new MutationObserver(() => {
      const handoff = html.getAttribute(HANDOFF_ATTR)
      if (handoff === 'land') sawLand = true
      if (handoff === null && sawLand) {
        play()
        return
      }
      if (html.hasAttribute(PICK_ATTR) || html.hasAttribute(INTRO_ATTR) || handoff !== null) return
      if (hero.getAttribute('data-entry') !== 'held') return
      if (introPending()) return // the intro island takes over; wait for its report
      play()
    })
    observer.observe(html, {
      attributes: true,
      attributeFilter: [PICK_ATTR, INTRO_ATTR, HANDOFF_ATTR, 'data-edition'],
    })

    window.addEventListener(INTRO_DONE_EVENT, play)

    // Resting loops pause while the hero is a viewport away (§4).
    let io: IntersectionObserver | null = null
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        (entries) => {
          const on = entries.some((e) => e.isIntersecting)
          if (on) hero.removeAttribute('data-off')
          else hero.setAttribute('data-off', '')
        },
        { rootMargin: '25% 0px 25% 0px' },
      )
      io.observe(hero)
    }

    return () => {
      observer.disconnect()
      io?.disconnect()
      window.removeEventListener(INTRO_DONE_EVENT, play)
      clearTimers()
    }
  }, [])

  return null
}
