/**
 * V3_SPEC §1.7 / §1.8 / §5 — tests/chrome.test.ts (C1 chrome)
 * The top bar's visitor-language items, the Build info route labels, and
 * the bundle-hygiene contract: lib/build/manifest.json (via lib/build/inject)
 * is imported ONLY by the lazy Build info panel, never by the immediate
 * chrome (Navbar, Footer, page shell, the Build info shell).
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { NAV_ITEMS, SOCIAL_LINKS, TOP_ANCHOR } from '@/components/chrome/navItems'
import {
  ROUTE_LABELS,
  buildDateLabel,
  routeLabel,
  routeWeights,
} from '@/components/palette/buildInfoRoutes'
import { SECTION_ANCHORS } from '@/lib/commands/sections'
import { profile } from '@/lib/data/profile'

const root = path.resolve(__dirname, '..')
/** Source with block + line comments removed (the doc headers name what they removed). */
const read = (rel: string) =>
  readFileSync(path.join(root, rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

describe('top bar items (§1.7 director call a)', () => {
  it('links the five anchors in page order, unchanged from v2', () => {
    expect(NAV_ITEMS.map((i) => i.anchor)).toEqual([...SECTION_ANCHORS])
  })

  it('labels them in visitor language — Work links to #projects', () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual([
      'About',
      'Skills',
      'Work',
      'Experience',
      'Contact',
    ])
    expect(NAV_ITEMS.find((i) => i.label === 'Work')?.anchor).toBe('#projects')
  })

  it('never shows a file name or path in a label (clutter law)', () => {
    for (const item of NAV_ITEMS) {
      expect(item.label).not.toMatch(/[./\\]|\.md|\.json|\.log|\.sh/)
    }
  })

  it('uses the real profile links for the icon cluster', () => {
    expect(SOCIAL_LINKS.map((l) => l.href)).toEqual([profile.githubUrl, profile.linkedinUrl])
    expect(SOCIAL_LINKS.map((l) => l.id)).toEqual(['github', 'linkedin'])
    expect(TOP_ANCHOR).toBe('#top')
  })
})

describe('Build info route labels (§1.8)', () => {
  it('names the public routes and hides internal ones', () => {
    expect(routeLabel('/')).toBe('Home')
    expect(routeLabel('/cv')).toBe('Résumé page')
    expect(routeLabel('/work/[slug]')).toBe('Project pages')
    expect(routeLabel('/arcade')).toBe('Arcade')
    expect(routeLabel('/_not-found')).toBeNull()
    expect(routeLabel('toString')).toBeNull()
  })

  it('orders measured routes as ROUTE_LABELS and drops unmeasured ones', () => {
    const rows = routeWeights([
      { route: '/_not-found', firstLoadGzKb: 100.7 },
      { route: '/cv', firstLoadGzKb: 100.7 },
      { route: '/', firstLoadGzKb: 173.8 },
    ])
    expect(rows).toEqual([
      { label: 'Home', kb: 173.8 },
      { label: 'Résumé page', kb: 100.7 },
    ])
    expect(Object.keys(ROUTE_LABELS)[0]).toBe('/')
  })

  it('formats the manifest date and tolerates the placeholder', () => {
    expect(buildDateLabel('2026-09-28T02:01:37.294Z')).toMatch(/2026/)
    expect(buildDateLabel(null)).toBeNull()
    expect(buildDateLabel('not a date')).toBeNull()
  })
})

describe('bundle hygiene — build evidence only in the lazy panel (§1.8, §7)', () => {
  const immediate = [
    'app/page.tsx',
    'components/chrome/Navbar.tsx',
    'components/chrome/MobileMenu.tsx',
    'components/chrome/ScrollProgress.tsx',
    'components/chrome/navItems.ts',
    'components/footer/Footer.tsx',
    'components/footer/BackToTop.client.tsx',
    'components/palette/BuildInfo.client.tsx',
  ]

  it('nothing in the immediate chrome imports lib/build/inject or the manifest', () => {
    for (const rel of immediate) {
      const src = read(rel)
      expect(src, rel).not.toMatch(/lib\/build\/inject/)
      expect(src, rel).not.toMatch(/manifest\.json/)
      expect(src, rel).not.toMatch(/lib\/perf\/fps/)
    }
  })

  it('the Build info shell reaches the panel only through next/dynamic', () => {
    const shell = read('components/palette/BuildInfo.client.tsx')
    expect(shell).toMatch(/dynamic\(\(\) => import\('\.\/BuildInfoPanel\.client'\)/)
    expect(shell).not.toMatch(/^import .*BuildInfoPanel/m)
    const panel = read('components/palette/BuildInfoPanel.client.tsx')
    expect(panel).toMatch(/from '@\/lib\/build\/inject'/)
  })

  it('the footer draws no numbers at rest (no SHA / KB / fps / N-of-6)', () => {
    const footer = read('components/footer/Footer.tsx')
    expect(footer).not.toMatch(/\bfps\b|KB gz|shortSha|sectionsSeen|FpsMeter|BuildComplete/)
  })

  it('the navbar carries the guide slot and the palette trigger hook', () => {
    const nav = read('components/chrome/Navbar.tsx')
    expect(nav.match(/id="guide-slot"/g)?.length).toBe(1)
    expect(nav).toMatch(/data-palette-trigger/)
    expect(nav).not.toMatch(/CompiledReadout|compiled|~\/darshan-konnur|main ✓/)
  })

  it('the home page composes the v3 order and owns the #top sentinel', () => {
    const page = read('app/page.tsx')
    const order = [
      '<EditionPicker />',
      '<IntroGate />',
      '<LenisProvider />',
      '<Navbar />',
      '<ReducedMotionBanner />',
      '<Hero />',
      '<About />',
      '<Skills />',
      '<Projects />',
      '<Experience />',
      '<Contact />',
      '<Footer />',
      '<CommandPalette />',
      '<Guide />',
      '<BuildInfo />',
      '<CursorHalo />',
    ]
    const positions = order.map((tag) => page.indexOf(tag))
    for (const [i, pos] of positions.entries()) expect(pos, order[i]).toBeGreaterThan(-1)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
    expect(page.match(/id="top"/g)?.length).toBe(1)
    expect(page).not.toMatch(/BootOverlay\b(?!.*retired)/m)
  })
})

describe('share card and web manifest take the SCREEN look (§2.8, §3)', () => {
  it('the share card is the static split cover: a 1200×630 JPEG under 300 KB, with alt text', async () => {
    const { readFileSync, statSync, existsSync } = await import('node:fs')
    const file = 'app/opengraph-image.jpg'
    expect(existsSync('app/opengraph-image.tsx')).toBe(false)
    expect(statSync(file).size).toBeLessThan(300 * 1024)
    const jpg = readFileSync(file)
    expect([jpg[0], jpg[1]]).toEqual([0xff, 0xd8]) // JPEG SOI
    // The SOF0/SOF2 frame header carries height then width (big-endian).
    let i = 2
    let size: [number, number] | null = null
    while (i < jpg.length) {
      const marker = jpg[i + 1]
      const len = jpg.readUInt16BE(i + 2)
      if (marker === 0xc0 || marker === 0xc2) {
        size = [jpg.readUInt16BE(i + 7), jpg.readUInt16BE(i + 5)]
        break
      }
      i += 2 + len
    }
    expect(size).toEqual([1200, 630])
    expect(read('app/opengraph-image.alt.txt')).toMatch(/^Darshan Konnur — Software Engineer\./)
    expect(read('lib/utils/share.ts')).toMatch(/url: '\/opengraph-image\.jpg'/)
  })

  it('the manifest is SCREEN-dark with the Studio Seal icons', async () => {
    const { default: manifest } = await import('@/app/manifest')
    const m = manifest()
    expect(m.background_color).toBe('#050607')
    expect(m.theme_color).toBe('#050607')
    expect(m.icons?.map((i) => i.src)).toEqual(['/favicon.svg', '/favicon-32.png', '/favicon-16.png'])
  })
})
