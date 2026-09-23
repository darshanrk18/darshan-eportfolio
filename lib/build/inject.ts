/**
 * Build-injected facts for the self-verifying footer readout (spec §5.9).
 * Nothing here is hardcoded: SHA comes from the deploy env, sizes from the
 * CI-written manifest (scripts/measure-bundle.mjs), date from build time.
 */

import rawManifest from './manifest.json'

export interface RouteBundle {
  /** Route path, e.g. '/', '/cv', '/work/[slug]'. */
  route: string
  /** First-load JS for the route, gzipped, in KB (1 decimal). */
  firstLoadGzKb: number
}

export interface BundleManifest {
  /** ISO timestamp of the measuring build, or null for the placeholder. */
  generatedAt: string | null
  note?: string
  /** First-load gz KB for '/' — the headline footer number. Null until measured. */
  totalFirstLoadGzKb: number | null
  /** Shared-by-all-routes gz KB. Null until measured. */
  sharedGzKb: number | null
  routes: RouteBundle[]
}

/** The CI-measured bundle manifest (placeholder until the first build ran). */
export const bundleManifest: BundleManifest = rawManifest as BundleManifest

export interface BuildInfo {
  /** Full commit SHA ('dev' outside Vercel). */
  sha: string
  /** 7-char short SHA ('dev' outside Vercel). */
  shortSha: string
  /** ISO date (yyyy-mm-dd) the server bundle was built. */
  buildDate: string
}

const sha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? 'dev'

/** Evaluated at build time in static RSC output. */
export const buildInfo: BuildInfo = {
  sha,
  shortSha: sha === 'dev' ? 'dev' : sha.slice(0, 7),
  buildDate: new Date().toISOString().slice(0, 10),
}
