/**
 * CommandCtx (spec §5.1) — the one action layer behind palette, terminal,
 * navbar, and hash-anchor handling. Build it in client components with
 * `createCommandCtx(useRouter())`. All DOM access is guarded, so importing
 * this module from server code for types is safe.
 *
 * v3 (V3_SPEC §2.1 / §2.4): the dark/light Theme API is gone — no
 * data-theme, no signal.theme, no applyTheme/getCurrentTheme. The edition
 * (SCREEN | PRINT) lives here instead: getCurrentEdition / applyEdition /
 * switchEdition / requestEditionPick and CommandCtx.setEdition.
 */

import { getLenis } from '@/lib/motion/lenis'
import { setMotionPreference } from '@/lib/motion/useReducedMotion'
import { useSignalStore } from '@/lib/state/store'
import { copyToClipboard } from '@/lib/utils/copy'
import {
  trackEditionSwitched,
  trackEmailCopied,
  trackEvent,
  trackMotionDisabled,
  trackProjectOpened,
  trackResumeDownloaded,
  type AnalyticsParams,
} from '@/lib/utils/analytics'
import {
  EDITION_ATTR,
  EDITION_STORAGE_KEY,
  PICK_ATTR,
  type Edition,
  type EditionVia,
} from '@/lib/edition/prepaint'
import type { ProjectSlug } from '@/lib/data/projects'

/* v3 §2.1 — the edition constants are DEFINED in lib/edition/prepaint.ts
   (the pre-paint script string is built from them, so the script and this
   module can never disagree) and re-exported here, the import site the
   spec names for client code. */
export {
  EDITION_ATTR,
  EDITION_STORAGE_KEY,
  INTRO_ATTR,
  INTRO_SESSION_KEY,
  PICK_ATTR,
} from '@/lib/edition/prepaint'
export type { Edition, EditionVia } from '@/lib/edition/prepaint'

/**
 * v3 §2.4 — html attribute set by switchEdition() for the lifetime of ONE
 * view transition: 'press' (SCREEN → PRINT) or 'projector' (PRINT → SCREEN).
 * styles/v3/switch.css keys its choreography off it. Never set it by hand.
 */
export const EDITION_SWITCH_ATTR = 'data-edition-switch'
/**
 * v3 §2.4 — inline html style vars switchEdition() writes before a press:
 * the centre of the control that asked (the toggle), in px, the origin of
 * the dot wave. switch.css falls back to the top-right corner without them.
 */
export const SWITCH_ORIGIN_X_VAR = '--switch-x'
export const SWITCH_ORIGIN_Y_VAR = '--switch-y'
/**
 * v3 §2.2 — `<meta name="theme-color">` per edition. The SSR meta is dark
 * for both schemes; syncEditionMeta() corrects it after mount / on switch.
 */
export const EDITION_THEME_COLOR: Record<Edition, string> = {
  screen: '#050607',
  print: '#f3e8cf',
}

/**
 * v2 §6.3 — localStorage flag ('1') that the site had been visited before.
 * v3: the boot overlay that WROTE it is retired; the key stays because the
 * §10.3 footer payoff (BuildCompleteIsland) still READS it. Nothing writes
 * it any more (a fresh read of null = first visit, which is honest) until
 * C1 re-homes the payoff behind Build info.
 */
export const SEEN_STORAGE_KEY = 'signal.seen'
/**
 * v2 §10.1 — localStorage key ('1') persisting the CRT phosphor opt-in.
 * WRITTEN + hydrate-applied by the CommandPalette island (never the pre-paint
 * script; a one-frame-late cosmetic opt-in is accepted by decision).
 */
export const CRT_STORAGE_KEY = 'signal.crt'
/** v2 §10.3 — sessionStorage key gating the footer payoff to once per session. */
export const FOOTER_SESSION_KEY = 'signal.footer'

/**
 * Cross-island DOM events (dispatched on window). The store carries the state;
 * these events additionally fire so a repeat action (same slug/id twice)
 * still re-triggers the surface.
 */
export const SIGNAL_EVENTS = {
  /** detail: { slug: ProjectSlug } — select this project window. */
  openProject: 'signal:open-project',
  /** detail: { slug: ProjectSlug } — select AND press ▶ run on it. */
  runProject: 'signal:run-project',
  /** detail: { id: string } — open the Skills inspector for this node. */
  inspectSkill: 'signal:inspect-skill',
  /**
   * v2 §7.1 — no detail. Fired by the `deploy-all` registry command (after
   * ctx.scrollTo('#skills')). SystemDiagram.client attaches its listener on
   * mount and runs the deploy sequence; it must tolerate the event firing
   * while off-screen (rings/state update, animation waits for view).
   */
  deployAll: 'signal:deploy-all',
  /**
   * v2 §10.4 — no detail. Fired by the `run-demo` registry command. The
   * ALWAYS-MOUNTED CommandPalette island listens, checks
   * store.motionReduced (toast the refusal line instead of starting), then
   * dynamically imports lib/commands/demoRunner — the chunk loads on
   * invocation only. The terminal `demo` builtin prints its own line and
   * refusal, then runs the same registry command.
   */
  demo: 'signal:demo',
  /**
   * v2 §7.2 — detail: { on: boolean }. INFORMATIONAL: dispatched by
   * setSourceMode() AFTER html[data-source-mode] is already applied/removed
   * (toggle + 6s auto-revert live in this module). Listen only to mirror
   * state (e.g. GlyphField pause); never re-toggle from this event.
   */
  sourceMode: 'signal:source-mode',
  /**
   * v3 §2.7 — no detail. Fired by the `replay-intro` registry command AFTER
   * the edition is PRINT (the command switches first when needed) and after
   * sessionStorage['signal.intro'] was cleared. The intro host (C6) listens
   * on window, dynamically imports the intro and runs it from beat one.
   */
  replayIntro: 'signal:replay-intro',
} as const

export interface CommandCtx {
  /** Scroll to a section anchor ('#about' … '#contact'), focus-managed. */
  scrollTo(anchor: string): void
  /** Minimal router facade (pass next/navigation's useRouter()). */
  router: { push(href: string): void }
  /** Copy text to the clipboard; resolves true on success. */
  copy(text: string): Promise<boolean>
  /** Trigger a same-origin file download (resume PDF). */
  download(url: string, filename?: string): void
  /**
   * v3 §2.1 — set or toggle the edition. Runs the §2.4 press / projector
   * view transition when the browser has one, then applyEdition (attribute
   * + localStorage + store mirror + theme-color meta +
   * `edition_switched { edition, via }`). `via` defaults to 'palette'; the
   * terminal passes 'terminal'. Resolves when the transition has finished
   * (immediately when there is none or the edition is already in force).
   */
  setEdition(edition: Edition | 'toggle', via?: EditionVia): Promise<void>
  /** Set reduced motion (persists; fires motion_disabled when reducing). */
  setMotion(reduced: boolean): void
  /** Scroll to Skills and open the inspector for a node id (e.g. 'docker'). */
  focusSkill(id: string): void
  /** Scroll to Projects and select a window (fires project_opened). */
  openProject(slug: ProjectSlug): void
  /** Analytics passthrough. */
  track(event: string, params?: AnalyticsParams): void
}

function prefersReducedNow(): boolean {
  return typeof document !== 'undefined' && document.documentElement.dataset.motion === 'reduced'
}

/* ------------------------------------------------------------------------- */
/* v3 §2.1 / §2.4 — editions (the ONE owner of html[data-edition])           */
/* ------------------------------------------------------------------------- */

/** Read the edition in force from the DOM ('screen' is the default and the SSR answer). */
export function getCurrentEdition(): Edition {
  if (typeof document === 'undefined') return 'screen'
  return document.documentElement.dataset.edition === 'print' ? 'print' : 'screen'
}

/** The edition that is not this one. */
export function otherEdition(edition: Edition): Edition {
  return edition === 'print' ? 'screen' : 'print'
}

/**
 * v3 §2.2 — point every `<meta name="theme-color">` at the edition's page
 * colour. Called by applyEdition() and by EditionToggle on mount (the SSR
 * meta is dark; a stored PRINT visitor gets paper after hydration).
 */
export function syncEditionMeta(edition: Edition): void {
  if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return
  const color = EDITION_THEME_COLOR[edition]
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.setAttribute('content', color)
  })
}

/**
 * v3 §2.1 — apply an edition NOW, no transition: sets html[data-edition],
 * persists localStorage['signal.edition'], mirrors the store, syncs the
 * theme-color meta and fires `edition_switched { edition, via }`. The
 * picker calls this directly (via 'picker'); everything else should go
 * through switchEdition() so the §2.4 choreography plays.
 */
export function applyEdition(edition: Edition, via: EditionVia): void {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute(EDITION_ATTR, edition)
  try {
    localStorage.setItem(EDITION_STORAGE_KEY, edition)
  } catch {
    /* storage unavailable — the attribute still applies for this page */
  }
  useSignalStore.getState().setEdition(edition)
  syncEditionMeta(edition)
  trackEditionSwitched(edition, via)
}

export interface SwitchEditionOptions {
  /** The control that asked (the toggle): its centre seeds the press dot wave. */
  originEl?: Element | null
  /** Analytics origin; defaults to 'toggle'. */
  via?: EditionVia
}

/**
 * v3 §2.4 — switch editions with the X2 choreography. With
 * document.startViewTransition: writes --switch-x/--switch-y from
 * `originEl`, sets html[data-edition-switch]='press' (→ PRINT) or
 * 'projector' (→ SCREEN), runs applyEdition inside the transition and
 * removes the attribute on `finished` (also when the transition is skipped).
 * styles/v3/switch.css plays the 700 ms press / projector under full
 * motion and a 200 ms crossfade under html[data-motion='reduced'].
 * Without the API: applyEdition immediately (instant). Already in `next`:
 * no-op. Scroll position is untouched either way.
 */
export function switchEdition(next: Edition, opts: SwitchEditionOptions = {}): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve()
  const via = opts.via ?? 'toggle'
  if (getCurrentEdition() === next) return Promise.resolve()
  const root = document.documentElement
  if (typeof document.startViewTransition !== 'function') {
    applyEdition(next, via)
    return Promise.resolve()
  }
  const origin = opts.originEl
  const rect =
    origin && typeof origin.getBoundingClientRect === 'function'
      ? origin.getBoundingClientRect()
      : null
  root.style.setProperty(
    SWITCH_ORIGIN_X_VAR,
    rect ? `${rect.left + rect.width / 2}px` : 'calc(100% - 72px)'
  )
  root.style.setProperty(SWITCH_ORIGIN_Y_VAR, rect ? `${rect.top + rect.height / 2}px` : '24px')
  root.setAttribute(EDITION_SWITCH_ATTR, next === 'print' ? 'press' : 'projector')
  const settle = () => {
    root.removeAttribute(EDITION_SWITCH_ATTR)
    // The origin vars are only meaningful for the life of one transition;
    // clear them so no inline style lingers on <html> afterwards.
    root.style.removeProperty(SWITCH_ORIGIN_X_VAR)
    root.style.removeProperty(SWITCH_ORIGIN_Y_VAR)
  }
  try {
    const transition = document.startViewTransition(() => applyEdition(next, via))
    return transition.finished
      .catch(() => {
        /* skipped / interrupted transitions still settle the attribute */
      })
      .finally(settle)
  } catch {
    settle()
    applyEdition(next, via)
    return Promise.resolve()
  }
}

/**
 * v3 §2.5 — ask the edition picker to show: sets html[data-pick='1']. The
 * EditionPicker island (mounted on '/' only) watches the attribute, renders
 * while it is set and clears it on a choice. Palette `choose-edition`.
 */
export function requestEditionPick(): void {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute(PICK_ATTR, '1')
}

/* ------------------------------------------------------------------------- */
/* v2 §7.2 — view-source mode (the ONE owner of html[data-source-mode])       */
/* ------------------------------------------------------------------------- */

/** Attribute the §7.2 annotation CSS keys off: html[data-source-mode='1']. */
export const SOURCE_MODE_ATTR = 'data-source-mode'
/** §7.2 — the mode auto-reverts this long after it was switched on. */
export const SOURCE_MODE_AUTO_REVERT_MS = 6000

let sourceModeTimer: number | null = null

/**
 * v2 §7.2 — set/clear the sitewide annotation mode. Owns the attribute AND
 * the 6s auto-revert timer; afterwards dispatches SIGNAL_EVENTS.sourceMode
 * with { on }. Esc handling (CommandPalette, palette closed) and re-toggles
 * call setSourceMode(false) — never touch the attribute directly.
 */
export function setSourceMode(on: boolean): void {
  if (typeof document === 'undefined') return
  if (sourceModeTimer !== null) {
    window.clearTimeout(sourceModeTimer)
    sourceModeTimer = null
  }
  if (on) {
    document.documentElement.setAttribute(SOURCE_MODE_ATTR, '1')
    sourceModeTimer = window.setTimeout(() => setSourceMode(false), SOURCE_MODE_AUTO_REVERT_MS)
  } else {
    document.documentElement.removeAttribute(SOURCE_MODE_ATTR)
  }
  window.dispatchEvent(new CustomEvent(SIGNAL_EVENTS.sourceMode, { detail: { on } }))
}

/** True when html[data-source-mode='1'] is currently set. */
export function isSourceModeOn(): boolean {
  return (
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute(SOURCE_MODE_ATTR) === '1'
  )
}

/** Toggle §7.2 view-source mode; returns the new state. */
export function toggleSourceMode(): boolean {
  const next = !isSourceModeOn()
  setSourceMode(next)
  return next
}

/**
 * Focus-managed anchor scroll — the site-wide navigation primitive.
 * v2 §5.1: when the LenisProvider has an instance (fine pointer, motion not
 * reduced, '/' route), anchors glide on Lenis with the expo-out curve and
 * focus lands on arrival; everywhere else this is exactly the v1 behavior.
 */
export function scrollToAnchor(anchor: string): void {
  if (typeof document === 'undefined') return
  const id = anchor.startsWith('#') ? anchor.slice(1) : anchor
  const target = document.getElementById(id)
  if (!target) return
  const focusTarget = () => {
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
    ;(target as HTMLElement).focus({ preventScroll: true })
  }
  const lenis = getLenis()
  if (lenis) {
    lenis.scrollTo(target, {
      duration: 1.1,
      /* expo-out — matches the --ease-out-expo feel (§5.1) */
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
      onComplete: focusTarget,
    })
    return
  }
  target.scrollIntoView({ behavior: prefersReducedNow() ? 'auto' : 'smooth', block: 'start' })
  focusTarget()
}

export function createCommandCtx(router: { push(href: string): void }): CommandCtx {
  return {
    scrollTo: scrollToAnchor,
    router,

    copy: copyToClipboard,

    download(url, filename) {
      if (typeof document === 'undefined') return
      const a = document.createElement('a')
      a.href = url
      a.download = filename ?? ''
      document.body.appendChild(a)
      a.click()
      a.remove()
    },

    setEdition(edition, via = 'palette') {
      const next: Edition = edition === 'toggle' ? otherEdition(getCurrentEdition()) : edition
      return switchEdition(next, { via })
    },

    setMotion(reduced) {
      setMotionPreference(reduced)
      if (reduced) trackMotionDisabled()
    },

    focusSkill(id) {
      useSignalStore.getState().setFocusedSkills([id])
      scrollToAnchor('#skills')
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(SIGNAL_EVENTS.inspectSkill, { detail: { id } }))
      }
    },

    openProject(slug) {
      useSignalStore.getState().setActiveProject(slug)
      scrollToAnchor('#projects')
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(SIGNAL_EVENTS.openProject, { detail: { slug } }))
      }
      trackProjectOpened(slug)
    },

    track(event, params) {
      trackEvent(event, params)
    },
  }
}

/* Convenience actions shared by hero quick-row / contact buttons / commands. */

/** Copy the email address + fire email_copied. Resolves clipboard success. */
export async function copyEmailAction(email: string): Promise<boolean> {
  const ok = await copyToClipboard(email)
  if (ok) trackEmailCopied()
  return ok
}

/** Download the resume + fire resume_downloaded. */
export function downloadResumeAction(ctx: CommandCtx, resumePdf: string, source?: string): void {
  ctx.download(resumePdf, 'darshan-konnur.pdf')
  trackResumeDownloaded(source)
}
