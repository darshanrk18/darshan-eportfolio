#!/usr/bin/env node
/**
 * Post-build guard for the pre-paint script (lib/edition/prepaint.ts).
 *
 * The production minifier once folded the inline script into broken JS, so
 * a deployed page never set html[data-edition] / data-pick / data-motion /
 * data-intro (no picker, no editions, no intro). This script reads the
 * prerendered home page, extracts the inline script that mentions the
 * edition key, checks that it PARSES and that every attribute and storage
 * key it must write is present, and exits 1 otherwise so CI fails.
 *
 * Run by `npm run build` after `next build`.
 */
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const candidates = ['.next/server/app/index.html', '.next/server/app/page.html']
const file = candidates.map((p) => path.join(root, p)).find((p) => existsSync(p))
if (!file) {
  console.error('[check-prepaint] no prerendered home page under .next/server/app — run `next build` first')
  process.exit(1)
}
const html = readFileSync(file, 'utf8')
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1])
// The pre-paint script is the one that reads the stored edition AND the
// reduced-motion preference (the picker shell's inline script also names the
// storage key, for its fallback, but never the media query).
const script = scripts.find((s) => s.includes('signal.edition') && s.includes('prefers-reduced-motion'))
if (!script) {
  console.error('[check-prepaint] the pre-paint inline script is missing from', path.relative(root, file))
  process.exit(1)
}
try {
  // Syntax only: never executed here.
  new Function(script)
} catch (err) {
  console.error('[check-prepaint] the pre-paint inline script does not parse:', err.message)
  console.error(script)
  process.exit(1)
}
const required = [
  "localStorage.getItem('signal.edition')",
  "localStorage.getItem('signal.motion')",
  "sessionStorage.getItem('signal.intro')",
  "a('data-pick','1')",
  "a('data-edition',e)",
  "a('data-motion',r?'reduced':'full')",
  "a('data-intro','1')",
  'prefers-reduced-motion:reduce',
  // the lead theme-color meta, first in <head>: paper for a stored PRINT visit
  "t.name='theme-color'",
  "if(e=='print')t.content='#f3e8cf'",
  'document.head.prepend(t)',
]
const missing = required.filter((needle) => !script.includes(needle))
if (missing.length) {
  console.error('[check-prepaint] the pre-paint inline script lost these pieces:', missing)
  console.error(script)
  process.exit(1)
}
console.log(`[check-prepaint] pre-paint script intact (${Buffer.byteLength(script, 'utf8')} B) in ${path.relative(root, file)}`)
