/**
 * Boot v2 BIOS POST lines (spec §6.3) — pure formatter, NO 'use client'.
 *
 * Called from the RSC `app/page.tsx` against `bundleManifest`, so every
 * number is interpolated at BUILD time from `lib/build/manifest.json`
 * (measured by scripts/measure-bundle.mjs — never hardcoded, rail §0.4) and
 * reaches the client BootOverlay island as plain string props.
 *
 * Layout: dotted leaders right-aligned to a 40ch column, rendered in the
 * mono `type-code` face with `whitespace-pre` so the padding survives:
 *
 *   check /            166.6 KB gz ...... ok
 *   check /cv          0.1 KB route js .. ok
 *   check /work/[slug] .................. ok
 *
 * A route whose size was not measured (placeholder manifest) prints leaders
 * only — never a number that pretends to be measured (§6.3: "never print
 * '0 KB' for a number that isn't measured ~0").
 */

import type { BundleManifest } from '@/lib/build/inject'

/** Leaders right-align to this column; ' ok' sits after it (§6.3). */
const LEADER_COL = 40
/** Width of the padded route cell — fits '/work/[slug]' exactly. */
const ROUTE_PAD = 12

/** One `check <route> <detail> ..... ok` POST line. */
function postLine(route: string, detail: string): string {
  const head = `check ${route.padEnd(ROUTE_PAD)} ${detail === '' ? '' : `${detail} `}`
  const dots = Math.max(2, LEADER_COL - ' ok'.length - head.length)
  return `${head}${'.'.repeat(dots)} ok`
}

/** Format a measured gz size (manifest writes 1-decimal KB values). */
function kb(value: number): string {
  return value.toFixed(1)
}

/**
 * The first-visit POST check lines, in render order. The client appends the
 * real `ready in …s` performance.now() line itself (it must be measured at
 * render time, not build time).
 */
export function buildPostLines(manifest: BundleManifest): string[] {
  const byRoute = new Map(manifest.routes.map((r) => [r.route, r]))
  const home = byRoute.get('/')
  const cv = byRoute.get('/cv')

  const homeKb = home?.firstLoadGzKb ?? manifest.totalFirstLoadGzKb
  const cvKb = cv?.routeGzKb

  return [
    postLine('/', typeof homeKb === 'number' ? `${kb(homeKb)} KB gz` : ''),
    postLine('/cv', typeof cvKb === 'number' ? `${kb(cvKb)} KB route js` : ''),
    postLine('/work/[slug]', ''),
  ]
}
