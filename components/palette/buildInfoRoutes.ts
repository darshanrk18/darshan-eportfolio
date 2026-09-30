/**
 * Build info — visitor-language names for the measured routes
 * (lib/build/manifest.json, written by scripts/measure-bundle.mjs).
 * Pure, dependency-free (type-only import), unit-tested in tests/chrome.test.ts.
 */

import type { RouteBundle } from '@/lib/build/inject'

/** Route path → what a visitor calls that page. Unlisted routes are hidden. */
export const ROUTE_LABELS: Readonly<Record<string, string>> = {
  '/': 'Home',
  '/cv': 'Résumé page',
  '/work/[slug]': 'Project pages',
  '/arcade': 'Arcade',
}

/** The visitor label for a route, or null when the route is internal. */
export function routeLabel(route: string): string | null {
  return Object.prototype.hasOwnProperty.call(ROUTE_LABELS, route) ? ROUTE_LABELS[route] : null
}

export interface RouteWeight {
  label: string
  /** First-load JS, gzipped, KB (1 decimal). */
  kb: number
}

/** Measured routes with a visitor label, in ROUTE_LABELS order. */
export function routeWeights(routes: readonly RouteBundle[]): RouteWeight[] {
  const byRoute = new Map(routes.map((r) => [r.route, r.firstLoadGzKb]))
  const out: RouteWeight[] = []
  for (const route of Object.keys(ROUTE_LABELS)) {
    const kb = byRoute.get(route)
    if (kb !== undefined && Number.isFinite(kb)) out.push({ label: ROUTE_LABELS[route], kb })
  }
  return out
}

/** "28 Sep 2026" from the manifest's ISO timestamp; null when unmeasured. */
export function buildDateLabel(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
