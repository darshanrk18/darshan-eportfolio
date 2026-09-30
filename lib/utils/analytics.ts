/**
 * Analytics — Google Analytics 4 (spec §7.3).
 *
 * Extends the pre-rebuild util: same GA4 config pattern (reads the optional
 * NEXT_PUBLIC_GA4_MEASUREMENT_ID at build time; every function is safe to call
 * when GA4 is not configured or gtag has not loaded), now self-contained and
 * carrying the SIGNAL event taxonomy.
 *
 * The <Script> tags that load gtag.js live in app/layout.tsx.
 *
 * v3 (V3_SPEC §2.1): `theme_toggled` → `edition_switched { edition, via }`;
 * `boot_completed` is gone with the boot overlay.
 *
 * @module lib/utils/analytics
 */

import type { Edition, EditionVia } from '@/lib/edition/prepaint'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (command: string, targetId: string, config?: Record<string, unknown>) => void
  }
}

export type AnalyticsParams = Record<string, string | number | boolean>

/** GA4 measurement id, or null when analytics are disabled. */
export function getGa4MeasurementId(): string | null {
  return process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ?? null
}

/**
 * Tracks a custom event. Silently a no-op on the server, when GA4 is not
 * configured, or before gtag.js has loaded.
 */
export function trackEvent(eventName: string, eventParams?: AnalyticsParams): void {
  if (typeof window === 'undefined') return
  const measurementId = getGa4MeasurementId()
  if (!measurementId || !window.gtag) return
  try {
    window.gtag('event', eventName, eventParams)
  } catch (error) {
    console.error('Failed to track event:', error)
  }
}

/** Tracks a page view manually (route transitions beyond GA4's automatic one). */
export function trackPageView(pagePath: string, pageTitle?: string): void {
  if (typeof window === 'undefined') return
  const measurementId = getGa4MeasurementId()
  if (!measurementId || !window.gtag) return
  try {
    window.gtag('config', measurementId, { page_path: pagePath, page_title: pageTitle })
  } catch (error) {
    console.error('Failed to track page view:', error)
  }
}

/* ----------------------------------------------------------------------------
   SIGNAL event taxonomy (§7.3) — use these helpers, not ad-hoc names.
   -------------------------------------------------------------------------- */

/** `palette_opened` */
export const trackPaletteOpened = () => trackEvent('palette_opened')

/** `palette_action { id }` — a palette command was executed. */
export const trackPaletteAction = (id: string) => trackEvent('palette_action', { id })

/** `terminal_opened` — terminal focused/first interacted. */
export const trackTerminalOpened = () => trackEvent('terminal_opened')

/** `terminal_command { cmd }` — a terminal command line was executed. */
export const trackTerminalCommand = (cmd: string) => trackEvent('terminal_command', { cmd })

/** `minimax_game_started` | `minimax_game_won` | `minimax_game_lost` */
export const trackMinimaxGame = (outcome: 'started' | 'won' | 'lost') =>
  trackEvent(`minimax_game_${outcome}`)

/** `project_opened { slug }` — a project window was selected. */
export const trackProjectOpened = (slug: string) => trackEvent('project_opened', { slug })

/** `project_run { slug }` — ▶ run pressed on a project window. */
export const trackProjectRun = (slug: string) => trackEvent('project_run', { slug })

/** `cv_viewed` — fired from the main site's /cv link handlers (never from /cv itself). */
export const trackCvViewed = () => trackEvent('cv_viewed')

/** `resume_downloaded` */
export const trackResumeDownloaded = (source?: string) =>
  trackEvent('resume_downloaded', source ? { source } : undefined)

/** `email_copied` */
export const trackEmailCopied = () => trackEvent('email_copied')

/**
 * v3 §2.1 `edition_switched { edition, via }` — the edition in force after a
 * switch and the surface that asked for it (picker / toggle / palette /
 * terminal). Fired by applyEdition() only — never call this directly.
 */
export const trackEditionSwitched = (edition: Edition, via: EditionVia) =>
  trackEvent('edition_switched', { edition, via })

/** `motion_disabled` — manual reduced-motion opt-in. */
export const trackMotionDisabled = () => trackEvent('motion_disabled')

/** `glyphfield_tier { tier }` — glyph-field tier chosen/settled (0–3). */
export const trackGlyphFieldTier = (tier: number) => trackEvent('glyphfield_tier', { tier })
