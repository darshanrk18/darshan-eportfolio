/**
 * Lazy islands fail alone (lib/utils/island.ts).
 *
 * A `dynamic(() => import(…))` whose chunk fails to load (a dropped request on
 * a bad connection, or a tab left open across a redeploy) used to reject into
 * the page's error boundary and replace the whole site with the error screen.
 * Every lazy island now ends its import in a `.catch` that renders nothing,
 * so only that island is missing. This suite keeps it that way.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { islandUnavailable } from '@/lib/utils/island'

const root = path.resolve(__dirname, '..')

function sources(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(path.join(root, dir))) {
    const rel = path.join(dir, name)
    if (statSync(path.join(root, rel)).isDirectory()) out.push(...sources(rel))
    else if (/\.tsx?$/.test(name)) out.push(rel)
  }
  return out
}

describe('lazy islands fail alone', () => {
  it('every dynamic() import in components/ and app/ handles a failed chunk', () => {
    const unguarded: string[] = []
    let sites = 0
    for (const file of [...sources('components'), ...sources('app')]) {
      const src = readFileSync(path.join(root, file), 'utf8')
      for (const m of src.matchAll(/\b(?:nextDynamic|dynamic)(?:<[^>()]+>)?\(/g)) {
        // the whole call, by balancing parentheses from its opening one
        let depth = 0
        let end = m.index + m[0].length - 1
        for (; end < src.length; end++) {
          if (src[end] === '(') depth++
          else if (src[end] === ')' && --depth === 0) break
        }
        const call = src.slice(m.index, end + 1)
        if (!/import\(|load[A-Z]\w*\(\)/.test(call)) continue
        sites++
        if (!call.includes('.catch(')) unguarded.push(`${file}: ${call.slice(0, 100)}`)
      }
    }
    expect(sites).toBeGreaterThanOrEqual(34) // the scan still sees every island
    expect(unguarded).toEqual([])
  })

  it('a failed island renders nothing and reports the failure', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const mod = islandUnavailable<{ default: () => null }>(new Error('ChunkLoadError'))
    expect(mod.default()).toBeNull()
    expect(spy).toHaveBeenCalledOnce()
    spy.mockRestore()
  })

  it('the picker gate hands a failed surface over to the shell (a tap is then applied at once)', () => {
    const gate = readFileSync(path.join(root, 'components/edition/EditionPicker.client.tsx'), 'utf8')
    expect(gate).toMatch(/import\('\.\/EditionPickerSurface\.client'\)\.catch\(surfaceFailed\)/)
    expect(gate).toContain('html.setAttribute(PICKER_FAILED_ATTR')
    expect(gate).toMatch(/\.pk-half\.is-queued`\)\?\.click\(\)/)
  })
})
