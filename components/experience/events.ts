/**
 * The Experience section's cross-island event (pure constants — importable
 * by the always-mounted island wrapper, the lazy panel and tests without
 * pulling either chunk).
 *
 * `signal:blame-on` turns "See which skills each job used" on from outside:
 * the guide's "Try it" (lib/guide/actions.ts, C5) and the palette dispatch
 * it on window after scrolling to #experience. Detail `{ job?: BlameJobId }`
 * also picks the job. SkillsPerJobIsland (in the first-load bundle) listens
 * from hydration and hands the request to the lazy panel, so a dispatch
 * that arrives before that chunk has mounted still lands (director call (m)).
 */

export const BLAME_ON_EVENT = 'signal:blame-on'

export interface BlameRequest {
  /** The job to show (a BlameJobId); undefined keeps the current one. */
  job?: string
  /** Bumped per event so an identical request re-fires. */
  serial: number
}
