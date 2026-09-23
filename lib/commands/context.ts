/**
 * CommandCtx (spec §5.1) — the one action layer behind palette, terminal,
 * navbar, and hash-anchor handling. Build it in client components with
 * `createCommandCtx(useRouter())`. All DOM access is guarded, so importing
 * this module from server code for types is safe.
 */

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

/** Focus-managed anchor scroll — the site-wide navigation primitive. */
export function scrollToAnchor(anchor: string): void {
  if (typeof document === 'undefined') return
  const id = anchor.startsWith('#') ? anchor.slice(1) : anchor
  const target = document.getElementById(id)
  if (!target) return
  target.scrollIntoView({ behavior: prefersReducedNow() ? 'auto' : 'smooth', block: 'start' })
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
  ;(target as HTMLElement).focus({ preventScroll: true })
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
