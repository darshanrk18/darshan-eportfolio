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
import { NOT_TOUCH_MEDIA, TOUCH_MEDIA } from '@/lib/utils/input'
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

describe('top bar fit — Ctrl K keycap, desktop scrollbars, the completion label', () => {
  const css = read('styles/v3/chrome.css')

  it('switches compact / full on the header width (scrollbar counted), not the viewport', () => {
    expect(css).toMatch(/\.sig-nav \{[^}]*container: sig-nav \/ inline-size;/)
    expect(css).toMatch(
      /@container sig-nav \(width < 1130px\) \{\s*\.sig-nav-links,\s*\.sig-nav-desk,\s*\.sig-nav-vr,\s*\.sig-nav-issue-wrap \{\s*display: none !important;/
    )
    expect(css).not.toMatch(/@media \(max-width: 1099\.98px\)/)
  })

  it('shows the PRINT issue box only where it fits (wrapper takes the room left, clips the rest)', () => {
    const nav = read('components/chrome/Navbar.tsx')
    expect(nav).toMatch(
      /<span className="sig-nav-issue-wrap ed-print-only" aria-hidden="true">\s*<span className="sig-nav-issue">/
    )
    const wrap = css
      .match(/\.sig-nav-issue-wrap \{([^}]*)\}/g)
      ?.find((r) => r.includes('flex-wrap'))
    expect(wrap).toBeDefined()
    for (const decl of [
      'flex-wrap: wrap;',
      'flex: 1 1 0;',
      'max-width: max-content;',
      'overflow: clip;',
    ]) {
      expect(wrap).toContain(decl)
    }
  })

  it('the menu sheet reaches the command palette (the compact bar has no keycap)', () => {
    const menu = read('components/chrome/MobileMenu.tsx')
    expect(menu).toMatch(/setPaletteOpen\(true\)\s*\}\}\s*>\s*Search \/ Jump\s*</)
  })

  it('draws the PRINT bar ink boxes at 2 px, the weight Chrome renders and the fit assumes', () => {
    const print = css.slice(css.indexOf("html[data-edition='print'] {"), css.indexOf('.sig-menu {'))
    for (const sel of ['.sig-nav-issue', '.sig-nav-links a', '.sig-nav-menu']) {
      const rule = print.match(new RegExp(`${sel.replace(/[.]/g, '\\.')} \\{([^}]*)\\}`))?.[1]
      expect(rule, sel).toContain('border: 2px solid var(--text-primary);')
    }
    expect(print).toMatch(/\.sig-nav \.gd-chip \{\s*border-width: 2px;\s*\}/)
    expect(print).not.toMatch(/border: 2\.5px/)
  })

  it('the menu sheet hands the wheel to the browser, so its rows scroll on a short window', () => {
    const menu = read('components/chrome/MobileMenu.tsx')
    const sheet = menu.match(/<m\.div[^>]*className="sig-menu"/)?.[0] ?? ''
    expect(sheet).toContain('data-lenis-prevent')
  })

  it('the menu sheet keeps Tab inside in every browser (Safari tabs only to form fields)', () => {
    const menu = read('components/chrome/MobileMenu.tsx')
    const sheet = menu.match(/<m\.div[^>]*className="sig-menu"/)?.[0] ?? ''
    // a click on something Safari does not focus leaves focus on the sheet
    expect(sheet).toContain('tabIndex={-1}')
    // every Tab is handled by the trap, not left to the browser
    expect(menu).toMatch(/if \(e\.key !== 'Tab'\) return\s*e\.preventDefault\(\)/)
  })

  it('the open menu sheet covers the reduced-motion offer and the guide, under the palette', () => {
    expect(css).toMatch(/\.sig-menu \{[^}]*z-index: calc\(var\(--z-palette\) - 1\);/)
    const banner = read('components/chrome/ReducedMotionBanner.tsx')
    expect(banner).toContain("zIndex: 'var(--z-nav)'")
    const guide = read('styles/v3/guide.css')
    const guideZ = [...guide.matchAll(/z-index: (\d+);/g)].map((m) => Number(m[1]))
    expect(guideZ.length).toBeGreaterThan(0)
    // --z-palette is 60 (app/globals.css): the sheet at 59 is above every guide layer
    expect(read('app/globals.css')).toMatch(/--z-palette: 60;/)
    expect(Math.max(...guideZ)).toBeLessThan(59)
  })
})

describe('SCREEN numbers read as numbers (Marcellus draws 1 and 0 like I and O)', () => {
  it('digits 0-9 come from the self-hosted Tenor Sans subset, in front of Marcellus', async () => {
    const { statSync } = await import('node:fs')
    const css = read('app/globals.css')
    expect(css).toMatch(/font-family: 'Screen Digits';[\s\S]*?unicode-range: U\+0030-0039;/)
    expect(css).toMatch(/--font-screen-body: 'Screen Digits', var\(--font-marcellus\)/)
    expect(css).toMatch(/--font-body: var\(--font-screen-body\);/)
    expect(statSync('public/fonts/tenor-sans-digits.woff2').size).toBeLessThan(4 * 1024)
    expect(statSync('public/fonts/OFL-TenorSans.txt').size).toBeGreaterThan(1000)
    // every direct use of Marcellus puts the digits face first
    const picker = read('styles/v3/picker.css')
    expect(picker.match(/var\(--font-marcellus\)/g)?.length).toBe(
      picker.match(/'Screen Digits', var\(--font-marcellus\)/g)?.length
    )
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

  it('the homepage description is long enough for LinkedIn (100+ characters, Post Inspector)', async () => {
    const { siteDescription } = await import('@/lib/utils/share')
    expect(siteDescription.length).toBeGreaterThanOrEqual(100)
    expect(siteDescription.length).toBeLessThanOrEqual(160)
  })

  it('the manifest is SCREEN-dark with the Studio Seal icons', async () => {
    const { default: manifest } = await import('@/app/manifest')
    const m = manifest()
    expect(m.background_color).toBe('#050607')
    expect(m.theme_color).toBe('#050607')
    expect(m.icons?.map((i) => i.src)).toEqual(['/favicon.svg', '/favicon-32.png', '/favicon-16.png'])
  })
})

/**
 * Mouse or touch words (styles/v3/README.md §4a): both wordings render and
 * two unlayered !important rules show one — under complementary queries, so
 * exactly one shows on every device, and no component's own display rule
 * can bring the hidden one back (the SCREEN hero pill's inline-flex did).
 */
describe('mouse or touch words (§4a)', () => {
  const css = (rel: string) => read(rel).replace(/\s+/g, ' ')
  const media = (q: string) => q.replace(/\s+/g, ' ').trim()

  it('globals.css hides .touch-only off touch and .mouse-only on touch, !important', () => {
    const g = css('app/globals.css')
    expect(g).toContain(
      `@media ${media(NOT_TOUCH_MEDIA)} { .touch-only { display: none !important; } }`
    )
    expect(g).toContain(
      `@media ${media(TOUCH_MEDIA)} { .mouse-only { display: none !important; } }`
    )
    // unlayered (a layered rule would lose to any unlayered display rule):
    // the hides sit after the last @layer block has closed
    let i = g.indexOf('{', g.lastIndexOf('@layer'))
    for (let depth = 0; ; i++) {
      if (g[i] === '{') depth++
      else if (g[i] === '}' && --depth === 0) break
    }
    expect(g.indexOf('.touch-only')).toBeGreaterThan(i)
    expect(g.indexOf('.mouse-only')).toBeGreaterThan(i)
  })

  it('the two queries are exact complements (hover: none|hover × pointer: none|coarse|fine)', () => {
    const touch = (hover: string, pointer: string) => hover === 'none' && pointer === 'coarse'
    const notTouch = (hover: string, pointer: string) =>
      hover === 'hover' || pointer === 'fine' || pointer === 'none'
    for (const hover of ['none', 'hover'])
      for (const pointer of ['none', 'coarse', 'fine'])
        expect(touch(hover, pointer) !== notTouch(hover, pointer), `${hover}/${pointer}`).toBe(true)
    expect(NOT_TOUCH_MEDIA).toBe('(hover: hover), (pointer: fine), (pointer: none)')
  })

  it('touch means what the top bar means: its ⌘K chip hides under the same query', () => {
    expect(css('styles/v3/chrome.css')).toContain(
      `@media ${media(TOUCH_MEDIA)} { .sig-nav-kbd { display: none; } }`
    )
  })

  it('the hero ⌘K hint is mouse-only, with no losing touch rule left behind', () => {
    // the wrapper holds only the hint, so no empty flex item is left on touch
    expect(read('components/hero/Hero.tsx')).toMatch(
      /<div className="hero-foot-l ed-screen-only mouse-only">\s*<PalettePill \/>\s*<\/div>/
    )
    expect(css('styles/v3/hero.css')).not.toMatch(/@media \(hover: none\) \{ \.hero-pill/)
  })

  it("PRINT's guide footer says Jump only where the bar draws the Jump chip", () => {
    // the words carry the chip's own hides: touch, and the compact bar's .sig-nav-desk
    expect(read('components/chrome/Navbar.tsx')).toContain('className="sig-nav-kbd sig-nav-desk"')
    const surface = read('components/guide/GuideSurface.client.tsx')
    expect(surface).toContain(
      '<span className="mouse-only sig-nav-desk">{GUIDE_MORE_LABEL.print}</span>'
    )
    // the plain words show with the compact bar's Menu, and on touch
    expect(surface).toContain(
      '<span className="sig-nav-phone gd-more-plain">{GUIDE_MORE_TOUCH_LABEL}</span>'
    )
    const nav = css('styles/v3/chrome.css')
    expect(nav).toContain('.sig-nav-phone { display: none; }')
    expect(nav).toMatch(
      /@media \(max-width: [\d.]+px\) \{ [^}]*\.sig-nav-desk,[^}]*\{ display: none !important; \} \.sig-nav-phone \{ display: inline-flex; \}/
    )
    expect(css('styles/v3/guide.css')).toContain(
      `@media ${media(TOUCH_MEDIA)} { .gd-more .gd-more-plain { display: inline; } }`
    )
  })

  it('InputWords renders both wordings (server markup too) and a shared wording once', async () => {
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { createElement } = await import('react')
    const { default: InputWords } = await import('@/components/chrome/InputWords')
    expect(
      renderToStaticMarkup(
        createElement(InputWords, { mouse: 'Hover a job.', touch: 'Tap a job.' })
      )
    ).toBe('<span class="mouse-only">Hover a job.</span><span class="touch-only">Tap a job.</span>')
    expect(
      renderToStaticMarkup(
        createElement(InputWords, { mouse: 'Pick a job.', touch: 'Pick a job.' })
      )
    ).toBe('Pick a job.')
  })
})
