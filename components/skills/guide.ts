/**
 * v3 §2.6 — the guide's completion hook, as the spec names it: every area
 * dispatches `signal:guide-tried` with the item's id at the exact trigger;
 * the guide island (C5) listens on window. No import from lib/guide is
 * needed (or wanted — it would ride the lazy chunks for one string).
 *
 * C3 fires two of the eight: `light-toolkit` when the light-up sequence
 * starts (button or SIGNAL_EVENTS.deployAll) and `skills-per-job` when the
 * "See which skills each job used" switch turns on.
 */

export const GUIDE_TRIED_EVENT = 'signal:guide-tried'

export type C3GuideId = 'light-toolkit' | 'skills-per-job'

/**
 * A request the always-mounted SystemDiagramIsland queues for the lazy
 * diagram: `light` = SIGNAL_EVENTS.deployAll (the palette / terminal
 * "deploy-all", the guide's "Light up the toolkit"), `inspect` =
 * SIGNAL_EVENTS.inspectSkill (the palette's `skill-<id>` deep-link). The
 * serial is bumped per event so an identical request re-fires.
 */
export type DiagramRequest =
  | { kind: 'light'; serial: number }
  | { kind: 'inspect'; id: string; serial: number }

export function markGuideTried(id: C3GuideId): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(GUIDE_TRIED_EVENT, { detail: { id } }))
}

/**
 * Cross-island events are heard only once the lazy island has mounted
 * (director call (m)): dispatch now, and keep re-dispatching every 150 ms
 * until `mountedSelector` exists or ~1.5 s has passed. Returns a cancel.
 */
export function dispatchWhenMounted(
  eventName: string,
  detail: unknown,
  mountedSelector: string,
  maxMs = 1500
): () => void {
  if (typeof window === 'undefined') return () => {}
  const fire = () => window.dispatchEvent(new CustomEvent(eventName, { detail }))
  if (document.querySelector(mountedSelector)) {
    fire()
    return () => {}
  }
  const started = performance.now()
  const timer = window.setInterval(() => {
    const mounted = document.querySelector(mountedSelector) !== null
    if (mounted || performance.now() - started > maxMs) {
      window.clearInterval(timer)
      if (mounted) fire()
    }
  }, 150)
  return () => window.clearInterval(timer)
}
