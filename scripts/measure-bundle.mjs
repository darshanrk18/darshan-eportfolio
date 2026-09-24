#!/usr/bin/env node
/**
 * measure-bundle.mjs (spec §5.9) — runs after `next build`.
 * Reads .next/app-build-manifest.json, gzips each route's client JS, and
 * writes lib/build/manifest.json so the footer renders MEASURED sizes.
 *
 * Note the one-build lag by construction: the manifest a deploy serves was
 * written by that same CI run *before* the final bundle is produced only if
 * you build twice; on Vercel we accept the previous run's committed numbers
 * or the numbers of this run when `npm run build` is the deploy build (the
 * script runs post-build, so the manifest bundled into the *next* build is
 * this run's measurement). Sizes are facts either way — never hand-edited.
 *
 * TODO(spec §8.6): budget ENFORCEMENT belongs to size-limit (.size-limit.json)
 * once installed; this script only measures and reports.
 */

import { readFile, writeFile, stat } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const nextDir = path.join(root, '.next')
const outFile = path.join(root, 'lib', 'build', 'manifest.json')

/**
 * V2_SPEC §0.3/§5.3/§12 — first-load gz ceiling per route. The '/' ceiling
 * moved ONCE for v2, from the measured 166.1 KB, itemized:
 *   166.1 v1 measured baseline
 *   + 9.0 Lenis (the one sanctioned immediate-bundle spend)
 *   + 0.6 provider/scrollTo glue   + 1.0 magnetic hook
 *   + 0.5 theme-wipe JS            + 0.5 SectionHeader client
 *   + 0.4 SectionsSeen island      + 0.2 narrator store write
 *   + 0.2 CRT hydrate-apply        ≈ 178 KB gz HARD ceiling.
 * Enforced here in CI (GITHUB_ACTIONS) so the gate moved in the same commit
 * as the spend; deploys still never fail on measurement (§ header note).
 * size-limit (.size-limit.json, same 178) takes over once installed.
 */
const FIRST_LOAD_BUDGET_GZ_KB = { '/': 178 }
/**
 * §0.1/§12.2 — /cv must stay zero route-own client JS (RSC purity). Next
 * emits a ~0.1KB page-stub chunk for EVERY route (identical on /_not-found,
 * also pure RSC), so the cap is 0.5: it tolerates the framework stub and
 * fails the moment any real client island reaches /cv.
 */
const ROUTE_OWN_MAX_GZ_KB = { '/cv': 0.5 }

const kb = (bytes) => Math.round((bytes / 1024) * 10) / 10

async function gzSizeOf(relFile) {
  const abs = path.join(nextDir, relFile)
  try {
    await stat(abs)
    const buf = await readFile(abs)
    return gzipSync(buf, { level: 9 }).length
  } catch {
    return 0
  }
}

async function main() {
  let appManifest
  try {
    appManifest = JSON.parse(
      await readFile(path.join(nextDir, 'app-build-manifest.json'), 'utf8'),
    )
  } catch (error) {
    console.warn(
      '[measure-bundle] .next/app-build-manifest.json not found — did `next build` run? ' +
        'Leaving lib/build/manifest.json untouched.',
      error?.message ?? error,
    )
    return
  }

  const pages = appManifest.pages ?? {}
  const routeFiles = new Map() // route → Set(files)
  for (const [page, files] of Object.entries(pages)) {
    // '/page' → '/', '/cv/page' → '/cv'; skip layouts/templates (they fold into pages).
    if (!page.endsWith('/page')) continue
    const route = page.slice(0, -'/page'.length) || '/'
    routeFiles.set(route, new Set(files.filter((f) => f.endsWith('.js'))))
  }

  // Files shared by every route = framework/shared chunk set.
  const allSets = [...routeFiles.values()]
  const shared = new Set()
  if (allSets.length > 0) {
    for (const f of allSets[0]) {
      if (allSets.every((s) => s.has(f))) shared.add(f)
    }
  }

  const gzCache = new Map()
  const sizeOf = async (f) => {
    if (!gzCache.has(f)) gzCache.set(f, await gzSizeOf(f))
    return gzCache.get(f)
  }

  let sharedBytes = 0
  for (const f of shared) sharedBytes += await sizeOf(f)

  const routes = []
  for (const [route, files] of [...routeFiles.entries()].sort()) {
    let bytes = 0
    let ownBytes = 0
    for (const f of files) {
      const size = await sizeOf(f)
      bytes += size
      // V2_SPEC §6.3: the route's OWN chunks (Next build's "Size" column) —
      // everything not shared by all routes. /cv measuring ~0 is the brag.
      if (!shared.has(f)) ownBytes += size
    }
    routes.push({ route, firstLoadGzKb: kb(bytes), routeGzKb: kb(ownBytes) })
  }

  const home = routes.find((r) => r.route === '/')
  const manifest = {
    generatedAt: new Date().toISOString(),
    totalFirstLoadGzKb: home ? home.firstLoadGzKb : null,
    sharedGzKb: kb(sharedBytes),
    routes,
  }

  await writeFile(outFile, JSON.stringify(manifest, null, 2) + '\n', 'utf8')

  console.log('[measure-bundle] gzipped first-load JS per route (own = route-only chunks):')
  for (const r of routes) {
    console.log(
      `  ${r.route.padEnd(24)} ${String(r.firstLoadGzKb).padStart(7)} KB gz` +
        `  (own ${String(r.routeGzKb).padStart(5)} KB)`,
    )
  }
  console.log(`  ${'(shared)'.padEnd(24)} ${String(kb(sharedBytes)).padStart(7)} KB gz`)
  console.log(`[measure-bundle] wrote ${path.relative(root, outFile)}`)

  // ----- §12 budget gate (fails CI only; never a deploy) --------------------
  let overBudget = false
  for (const r of routes) {
    const firstLoadCap = FIRST_LOAD_BUDGET_GZ_KB[r.route]
    if (firstLoadCap != null) {
      const ok = r.firstLoadGzKb <= firstLoadCap
      overBudget ||= !ok
      console.log(
        `[measure-bundle] budget ${r.route} first-load ${r.firstLoadGzKb} / ${firstLoadCap} KB gz ${ok ? '✓' : '✗ OVER'}`,
      )
    }
    const ownCap = ROUTE_OWN_MAX_GZ_KB[r.route]
    if (ownCap != null) {
      const ok = r.routeGzKb <= ownCap
      overBudget ||= !ok
      console.log(
        `[measure-bundle] budget ${r.route} route-own ${r.routeGzKb} / ${ownCap} KB gz ${ok ? '✓' : '✗ OVER'}`,
      )
    }
  }
  if (overBudget) {
    if (process.env.GITHUB_ACTIONS) {
      console.error('[measure-bundle] §12 budget exceeded — failing CI.')
      process.exitCode = 1
    } else {
      console.warn('[measure-bundle] §12 budget exceeded — CI (GitHub Actions) will fail on this.')
    }
  }
}

main().catch((error) => {
  // Measurement must never break a deploy; budgets are enforced by size-limit in CI.
  console.warn('[measure-bundle] failed (non-fatal):', error)
})
