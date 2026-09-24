/**
 * CommandCtx (spec §5.1) — the one action layer behind palette, terminal,
 * navbar, and hash-anchor handling. Build it in client components with
 * `createCommandCtx(useRouter())`. All DOM access is guarded, so importing
 * this module from server code for types is safe.
 */

import { getLenis } from '@/lib/motion/lenis'
import { setMotionPreference } from '@/lib/motion/useReducedMotion'
import { useSignalStore } from '@/lib/state/store'
import { copyToClipboard } from '@/lib/utils/copy'
import {
  trackEvent,
  trackEmailCopied,
  trackMotionDisabled,
  trackProjectOpened,
  trackResumeDownloaded,
  trackThemeToggled,
  type AnalyticsParams,
} from '@/lib/utils/analytics'
import type { ProjectSlug } from '@/lib/data/projects'

export type Theme = 'dark' | 'light'

/** localStorage key read by the pre-paint inline script in app/layout.tsx. */
export const THEME_STORAGE_KEY = 'signal.theme'
/** sessionStorage key marking the boot overlay as already shown (§4.1). */
export const BOOT_STORAGE_KEY = 'signal.boot'
/**
 * v2 §6.3 — localStorage flag ('1') that a boot has completed once on this
 * browser. WRITTEN by BootOverlay's finalize(); READ by BootOverlay
 * (first-vs-return variant) and by the §10.3 footer payoff (`--incremental`).
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
  /** Set or toggle the theme (persists + fires theme_toggled). */
  setTheme(theme: Theme | 'toggle'): void
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

/** Read the current theme from the DOM (dark is the default). */
export function getCurrentTheme(): Theme {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

/** Apply + persist a theme. Exported for ThemeToggle. Fires theme_toggled. */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    /* storage unavailable — attribute still applies */
  }
  trackThemeToggled(theme)
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

    setTheme(theme) {
      const next: Theme =
        theme === 'toggle' ? (getCurrentTheme() === 'dark' ? 'light' : 'dark') : theme
      applyTheme(next)
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
