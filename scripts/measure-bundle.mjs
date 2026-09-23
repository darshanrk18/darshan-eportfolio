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
    for (const f of files) bytes += await sizeOf(f)
    routes.push({ route, firstLoadGzKb: kb(bytes) })
  }

  const home = routes.find((r) => r.route === '/')
  const manifest = {
    generatedAt: new Date().toISOString(),
    totalFirstLoadGzKb: home ? home.firstLoadGzKb : null,
    sharedGzKb: kb(sharedBytes),
    routes,
  }

  await writeFile(outFile, JSON.stringify(manifest, null, 2) + '\n', 'utf8')

  console.log('[measure-bundle] gzipped first-load JS per route:')
  for (const r of routes) {
    console.log(`  ${r.route.padEnd(24)} ${String(r.firstLoadGzKb).padStart(7)} KB gz`)
  }
  console.log(`  ${'(shared)'.padEnd(24)} ${String(kb(sharedBytes)).padStart(7)} KB gz`)
  console.log(`[measure-bundle] wrote ${path.relative(root, outFile)}`)
}

main().catch((error) => {
  // Measurement must never break a deploy; budgets are enforced by size-limit in CI.
  console.warn('[measure-bundle] failed (non-fatal):', error)
})
