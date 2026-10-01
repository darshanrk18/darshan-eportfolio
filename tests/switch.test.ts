/**
 * V3_SPEC §2.4 / §2.5 — tests/switch.test.ts (C5)
 * The switching contract between lib/commands/context.ts and
 * styles/v3/switch.css (X2's two 700 ms choreographies + the reduced-motion
 * crossfade), the picker's approved copy and its intro hand-off event.
 * tests/edition.test.ts covers the switchEdition fallbacks; this file
 * checks the choreography's inputs and the stylesheet's promises.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  EDITION_ATTR,
  EDITION_SWITCH_ATTR,
  SWITCH_ORIGIN_X_VAR,
  SWITCH_ORIGIN_Y_VAR,
  switchEdition,
} from '@/lib/commands/context'
import { INTRO_START_EVENT, PICKER_COPY } from '@/components/edition/EditionPickerSurface.client'
import { INTRO_START_EVENT as INTRO_GATE_START_EVENT } from '@/lib/intro/events'
import { useSignalStore } from '@/lib/state/store'

const root = path.resolve(__dirname, '..')

/**
 * The accessible name a browser computes from an element's content, for the
 * static markup React renders: text outside aria-hidden subtrees, in order,
 * whitespace collapsed (enough for these buttons: spans, svg, br, i).
 */
function nameFromContent(html: string): string {
  const hidden: boolean[] = [false]
  let out = ''
  for (const m of html.matchAll(/<(\/?)([a-zA-Z0-9]+)([^>]*?)(\/?)>|([^<]+)/g)) {
    const [, close, tag, attrs, selfClose, text] = m
    if (text !== undefined) {
      if (!hidden[hidden.length - 1]) out += text
      continue
    }
    if (close) {
      hidden.pop()
      continue
    }
    if (selfClose || tag === 'br') {
      if (tag === 'br' && !hidden[hidden.length - 1]) out += ' '
      continue
    }
    hidden.push(hidden[hidden.length - 1] || /aria-hidden="true"/.test(attrs))
  }
  return out.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/\s+/g, ' ').trim()
}
const css = readFileSync(path.join(root, 'styles/v3/switch.css'), 'utf8')
const picker = readFileSync(path.join(root, 'styles/v3/picker.css'), 'utf8')

/** The keyframe block for a name (balanced braces, one level deep). */
function keyframes(name: string): string {
  const m = css.match(new RegExp(`@keyframes ${name} \\{([\\s\\S]*?)\\n\\}`))
  if (!m) throw new Error(`no @keyframes ${name}`)
  return m[1]
}

describe('switch.css — the two choreographies (X2)', () => {
  it('keys both directions off html[data-edition-switch] and animates the root snapshots', () => {
    expect(EDITION_SWITCH_ATTR).toBe('data-edition-switch')
    expect(css).toContain("html[data-edition-switch='press']::view-transition-new(root)")
    expect(css).toContain("html[data-edition-switch='press']::view-transition-old(root)")
    expect(css).toContain("html[data-edition-switch='projector']::view-transition-old(root)")
    expect(css).toContain("html[data-edition-switch='projector']::view-transition-new(root)")
    expect(css).toMatch(/animation-duration:\s*700ms/)
    for (const name of ['ed-press-old', 'ed-press-new', 'ed-projector-old', 'ed-projector-new']) {
      expect(css, name).toContain(`@keyframes ${name}`)
    }
  })

  it('grows the press dot wave from the toggle (the origin vars the JS writes)', () => {
    expect(css).toContain(`var(${SWITCH_ORIGIN_X_VAR})`)
    expect(css).toContain(`var(${SWITCH_ORIGIN_Y_VAR})`)
    for (const prop of ['--ed-wipe', '--ed-dot', '--ed-front', '--ed-key']) {
      expect(css, prop).toContain(`@property ${prop}`)
    }
    const pressNew = keyframes('ed-press-new')
    expect(pressNew).toMatch(/--ed-wipe:\s*0px/)
    expect(pressNew).toMatch(/--ed-wipe:\s*170vmax/)
    expect(pressNew).toMatch(/--ed-dot:\s*9px/)
  })

  it('prints colour first, out of line — red / blue / yellow plates, then the black plate lands', () => {
    const pressNew = keyframes('ed-press-new')
    expect(pressNew).toContain('%23d7262d')
    expect(pressNew).toContain('%231e6fd6')
    expect(pressNew).toContain('%23f6c21c')
    expect(pressNew).toMatch(/translate:\s*2px -2px/)
    expect(pressNew).toMatch(/86%\s*\{[^}]*translate:\s*0 0/)
    expect(pressNew).toMatch(/100%\s*\{[^}]*filter:\s*none/)
  })

  it('drains, swells the dots to black from the left, then raises the key light', () => {
    const old = keyframes('ed-projector-old')
    expect(old).toMatch(/filter:\s*saturate\(0\)/)
    expect(old).toMatch(/--ed-dot:\s*0px/)
    expect(old).toMatch(/--ed-front:\s*100%/)
    const fresh = keyframes('ed-projector-new')
    expect(fresh).toMatch(/brightness\(0\.6\)/)
    expect(fresh).toMatch(/--ed-key:\s*0\.45/)
    expect(fresh).toMatch(/--ed-key:\s*1/)
  })

  it('collapses to a 200 ms crossfade under reduced motion, masks and filters off', () => {
    const reduced = css.slice(css.indexOf("html[data-motion='reduced'][data-edition-switch]"))
    expect(reduced).toMatch(/ed-xfade-out 200ms/)
    expect(reduced).toMatch(/ed-xfade-in 200ms/)
    expect(reduced).toMatch(/mask-image:\s*none/)
    expect(reduced).toMatch(/filter:\s*none/)
  })
})

describe('switchEdition() seeds the choreography (V3_SPEC §2.4)', () => {
  const g = globalThis as { document?: unknown; localStorage?: unknown }
  afterEach(() => {
    delete g.document
    delete g.localStorage
    useSignalStore.getState().setEdition(null)
  })

  function install(edition: 'screen' | 'print') {
    const attrs = new Map<string, string>([[EDITION_ATTR, edition]])
    const vars = new Map<string, string>()
    const seen: string[] = []
    const rootEl = {
      dataset: { get edition() {
        return attrs.get(EDITION_ATTR)
      } },
      style: {
        setProperty: (k: string, v: string) => vars.set(k, v),
        removeProperty: (k: string) => vars.delete(k),
      },
      getAttribute: (k: string) => attrs.get(k) ?? null,
      hasAttribute: (k: string) => attrs.has(k),
      setAttribute: (k: string, v: string) => {
        attrs.set(k, v)
        if (k === EDITION_SWITCH_ATTR) seen.push(v)
      },
      removeAttribute: (k: string) => attrs.delete(k),
    }
    let finish: () => void = () => {}
    const finished = new Promise<void>((r) => {
      finish = r
    })
    g.document = {
      documentElement: rootEl,
      querySelectorAll: () => [],
      startViewTransition: vi.fn((cb: () => void) => {
        cb()
        return { finished }
      }),
    }
    g.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} }
    return { attrs, vars, seen, finish: () => finish() }
  }

  it("writes 'press' for SCREEN → PRINT and 'projector' for PRINT → SCREEN, removed on finished", async () => {
    const a = install('screen')
    const p = switchEdition('print', { via: 'toggle' })
    expect(a.attrs.get(EDITION_SWITCH_ATTR)).toBe('press')
    expect(a.attrs.get(EDITION_ATTR)).toBe('print')
    a.finish()
    await p
    expect(a.attrs.has(EDITION_SWITCH_ATTR)).toBe(false)

    const b = install('print')
    const q = switchEdition('screen', { via: 'palette' })
    expect(b.attrs.get(EDITION_SWITCH_ATTR)).toBe('projector')
    b.finish()
    await q
    expect(b.seen).toEqual(['projector'])
  })

  it('seeds --switch-x / --switch-y from the pressed control (the dot wave origin)', async () => {
    const a = install('screen')
    const originEl = {
      getBoundingClientRect: () => ({ left: 1000, top: 20, width: 60, height: 26 }),
    } as unknown as Element
    const p = switchEdition('print', { originEl })
    expect(a.vars.get(SWITCH_ORIGIN_X_VAR)).toBe('1030px')
    expect(a.vars.get(SWITCH_ORIGIN_Y_VAR)).toBe('33px')
    a.finish()
    await p
    const b = install('print')
    const q = switchEdition('screen')
    expect(b.vars.get(SWITCH_ORIGIN_X_VAR)).toBe('calc(100% - 72px)')
    b.finish()
    await q
  })
})

describe('the picker (V3_SPEC §2.5, X1)', () => {
  it('carries the approved copy, verbatim', () => {
    expect(PICKER_COPY.ask).toBe('Choose your edition')
    expect(PICKER_COPY.caption).toBe('Same story in both. Switch anytime from the top bar.')
    expect(PICKER_COPY.screen.body).toBe('A dark, cinematic cut.')
    expect(PICKER_COPY.screen.cta).toBe('Enter the feature')
    expect(PICKER_COPY.print.body).toBe('An inked, four-color comic.')
    expect(PICKER_COPY.print.cta).toBe('Open the issue')
  })

  it('hands a PRINT choice to the intro through signal:intro-start (the gate listens to the same name)', () => {
    expect(INTRO_START_EVENT).toBe('signal:intro-start')
    expect(INTRO_START_EVENT).toBe(INTRO_GATE_START_EVENT)
    const gate = readFileSync(path.join(root, 'components/intro/IntroGate.client.tsx'), 'utf8')
    expect(gate).toContain('INTRO_START_EVENT')
  })

  it('locks the toggle with the padlock while a switch is in flight', () => {
    expect(css).toContain('.ed-toggle[data-switching]::after')
    expect(css).toMatch(/\.ed-toggle\[data-switching\] > button \{[^}]*pointer-events:\s*none/)
  })

  it('the toggle seeds the wave from the pressed pill and leaves no inline origin behind', () => {
    const toggle = readFileSync(path.join(root, 'components/edition/EditionToggle.client.tsx'), 'utf8')
    expect(toggle).toMatch(/switchEdition\(option, \{ originEl, via: 'toggle' \}\)/)
    expect(toggle).toContain('removeProperty(SWITCH_ORIGIN_X_VAR)')
    expect(toggle).toContain('removeProperty(SWITCH_ORIGIN_Y_VAR)')
  })

  it('the picker surface releases the page once, in choose(), never again from its cleanup', () => {
    const surface = readFileSync(
      path.join(root, 'components/edition/EditionPickerSurface.client.tsx'),
      'utf8'
    )
    expect(surface).toMatch(/return \(\) => \{\s*if \(chosen\.current\) return/)
    expect(surface).toMatch(/applyEdition\(edition, 'picker'\)/)
    expect(surface).toMatch(/removeAttribute\(PICK_ATTR\)/)
  })

  it('covers the first paint while eligible, sits at the picker z and fades on leave', () => {
    expect(picker).toContain("html[data-pick='1'] body::before")
    expect(picker).toMatch(/z-index:\s*var\(--z-picker, 90\)/)
    expect(picker).toContain(".pk[data-leaving='screen']")
    expect(picker).toContain(".pk[data-leaving='print']")
    // the two torn edges are the frame's 76-point polygons (vertical + the phone's horizontal)
    expect(picker.match(/clip-path: polygon\(/g)?.length).toBeGreaterThanOrEqual(4)
    // no edition token leaks: the picker is the same in both editions
    expect(picker).not.toMatch(/var\(--text-primary\)|var\(--accent-signal\)|var\(--bg-page\)/)
  })
})

/**
 * V3_SPEC §2.5 / §7 — the picker's SHELL: the face as server HTML so a
 * first visit paints the whole picker at first paint with no JavaScript,
 * replaced in place by the hydrated surface (components/edition/
 * PickerShell.tsx, PickerFace.tsx, picker.shared.ts).
 */
describe('the picker shell paints from HTML + CSS and the surface replaces it in place', () => {
  const read = (rel: string) => readFileSync(path.join(root, rel), 'utf8')
  const hooks = /\buse(State|Effect|LayoutEffect|Ref|Callback|Memo|Id)\s*\(/

  it('the home page mounts the shell right before the gate', () => {
    const page = read('app/page.tsx')
    expect(page).toContain('<PickerShell />')
    expect(page.indexOf('<PickerShell />')).toBeLessThan(page.indexOf('<EditionPicker />'))
  })

  it('the face, the shell and the shared module are server-safe: no hooks, no client directive', () => {
    for (const rel of [
      'components/edition/PickerFace.tsx',
      'components/edition/PickerShell.tsx',
      'components/edition/picker.shared.ts',
    ]) {
      const src = read(rel)
      expect(src, rel).not.toMatch(/^'use client'/m)
      expect(src, rel).not.toMatch(hooks)
    }
    expect(read('components/edition/picker.shared.ts')).not.toMatch(/from 'react'/)
  })

  it('renders the complete face as static markup: two buttons, gated backgrounds, namespaced ids, no <img>', async () => {
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { default: PickerShell } = await import('@/components/edition/PickerShell')
    const { createElement } = await import('react')
    const html = renderToStaticMarkup(createElement(PickerShell))
    expect(html).toContain('data-pk-shell')
    expect(html).toContain('role="dialog"')
    expect(html.match(/<button /g)?.length).toBe(2)
    // Each half is named by what a visitor sees (WCAG 2.5.3, label in name): no
    // aria-label overrides it, and its decorative words are aria-hidden.
    const buttons = [...html.matchAll(/<button [^>]*>[\s\S]*?<\/button>/g)].map((m) => m[0])
    expect(buttons).toHaveLength(2)
    for (const b of buttons) expect(b.slice(0, b.indexOf('>'))).not.toContain('aria-label')
    expect(nameFromContent(buttons[0])).toBe('SCREEN: A dark, cinematic cut. Enter the feature')
    expect(nameFromContent(buttons[1])).toBe('PRINT: An inked, four-color comic. Open the issue')
    expect(html).toContain(PICKER_COPY.caption)
    // the portraits are CSS backgrounds (fetched only under html[data-pick='1']), never <img>
    expect(html).not.toContain('<img')
    expect(html).toContain('--pk-src:url(/photo/portrait-41.webp)')
    expect(html).toContain('--pk-src-sm:url(/photo/portrait-41-660.webp)')
    expect(html).toContain('--pk-src:url(/photo/portrait-paper.webp)')
    // every SVG id is the shell's own namespace, so a url(#…) never crosses into the surface
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1])
    expect(ids.length).toBeGreaterThan(10)
    expect(ids.every((id) => id.startsWith('pks-'))).toBe(true)
    expect(html).not.toMatch(/url\(#pk-/)
    // lean: it rides every page (face + its inline script)
    expect(Buffer.byteLength(html, 'utf8')).toBeLessThan(12_500)
  })

  it('the surface draws the same face under its own ids and mirrors the phone encode rule', () => {
    const surface = read('components/edition/EditionPickerSurface.client.tsx')
    expect(surface).toMatch(/<PickerFace\s+variant="surface"\s+ids="pk"/)
    expect(surface).toContain('window.matchMedia(PICKER_PHONE_QUERY)')
    expect(surface).toContain("html.setAttribute(PICKER_LIVE_ATTR, '1')")
    expect(surface).toContain("root.setAttribute('data-live', '1')")
    expect(read('components/edition/PickerShell.tsx')).toMatch(/<PickerFace variant="shell" ids="pks" \/>/)
  })

  it('picker.css shows the shell only while eligible, hides it once the surface is live, and gates its images', () => {
    expect(picker).toMatch(/\.pk-shell \{\s*display: none;/)
    expect(picker).toMatch(/html\[data-pick='1'\] \.pk-shell \{\s*display: block;/)
    expect(picker).toMatch(/html\[data-picker-live='1'\] \.pk-shell \{\s*display: none;/)
    expect(picker).toMatch(/\.pk-live:not\(\[data-live\]\) \{\s*visibility: hidden;/)
    expect(picker).toMatch(/html\[data-pick='1'\] \.pk-shell \.pk-img \{\s*background-image: var\(--pk-src\);/)
    expect(picker).toMatch(/html\[data-pick='1'\] \.pk-shell \.pk-img \{\s*background-image: var\(--pk-src-sm\);/)
    // no fixed SVG id in the stylesheet: the clips come from the copy's own defs
    expect(picker).not.toMatch(/url\(#pk/)
    // the programmatic initial focus draws its ring after the swap frame: transparent under
    // data-quiet, coloured (eased) once it is lifted — never no ring at all
    expect(picker).toMatch(/\.pk-half:focus-visible \{\s*outline: 2px solid transparent;[^}]*transition: outline-color/)
    expect(picker).toMatch(/\.pk:not\(\[data-quiet\]\) \.pk-half:focus-visible \{\s*outline-color: var\(--pk-champ\)/)
    // the page under the picker is locked from the first paint, by CSS
    expect(picker).toMatch(/html\[data-pick='1'\] body \{\s*overflow: hidden;/)
  })

  it('the shell is live to the hand and the keyboard before hydration (its inline script)', async () => {
    const shared = await import('@/components/edition/picker.shared')
    const js = shared.PICKER_SHELL_SCRIPT_RESOLVED
    expect(js).not.toContain('@')
    expect(() => new Function(js)).not.toThrow()
    expect(Buffer.byteLength(js, 'utf8')).toBeLessThanOrEqual(1400)
    // never the pre-paint script's reduced-motion query: scripts/check-prepaint.mjs
    // identifies that script by its storage key AND that query
    expect(js).not.toContain('prefers-reduced-motion')
    expect(js).toContain(`'${shared.PICKER_QUEUED_ATTR}'`)
    expect(js).toContain(`'${shared.PICKER_QUEUED_CLASS}'`)
    expect(js).toContain(`'${shared.PICKER_LIVE_ATTR}'`)
    expect(js).toContain("=='Tab'")
    expect(js).toContain('fonts.forEach')
    expect(shared.PICKER_QUEUED_ATTR).toBe('data-pick-queued')
    // the shell renders it right after its markup
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { default: PickerShell } = await import('@/components/edition/PickerShell')
    const { createElement } = await import('react')
    const html = renderToStaticMarkup(createElement(PickerShell))
    expect(html.endsWith(`<script>${js}</script>`)).toBe(true)
    expect(html.indexOf('data-pk-shell')).toBeLessThan(html.indexOf('<script>'))
    // the surface honours the queue the moment it is live, before any focus
    const surface = read('components/edition/EditionPickerSurface.client.tsx')
    expect(surface).toContain('html.getAttribute(PICKER_QUEUED_ATTR)')
    expect(surface).toContain('html.removeAttribute(PICKER_QUEUED_ATTR)')
    expect(surface).toMatch(/chooseRef\.current\(queued\)\s*return/)
    // the pressed look and the hover parity for the shell
    expect(picker).toMatch(/\.pk-half\.is-queued \.pk-cta-s/)
    expect(picker).toMatch(/\.pk-half\.is-queued \.pk-cta-p/)
    const hoverRules = picker.match(/\.pk\[data-hover='(screen|print)'\][^{,]*/g) ?? []
    expect(hoverRules.length).toBeGreaterThanOrEqual(8)
    for (const rule of hoverRules) {
      const half = rule.includes("'screen'") ? 's' : 'p'
      const target = rule.replace(/\.pk\[data-hover='(screen|print)'\]/, '').trim()
      expect(picker, rule).toContain(`.pk-shell:has(.pk-half-${half}:hover) ${target}`)
    }
    // no plain :hover rule survives without the data-hover / shell twin
    expect(picker.split('\n').filter((l) => l.includes(':hover') && !l.includes(':has('))).toEqual([])
  })

  it('keeps the page to one <h1>: the question is a paragraph inside the labelled dialog', async () => {
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { default: PickerShell } = await import('@/components/edition/PickerShell')
    const { createElement } = await import('react')
    const html = renderToStaticMarkup(createElement(PickerShell))
    expect(html).not.toContain('<h1')
    expect(html).toContain('<p class="pk-ask">')
    // read as one question, the seal's gap a real space
    const ask = html.match(/<p class="pk-ask">[\s\S]*?<\/p>/)?.[0] ?? ''
    expect(nameFromContent(ask)).toBe('Choose your edition')
    expect(html).toContain(`aria-label="${PICKER_COPY.ask}"`)
  })

  it('a tap on the shell is never lost: queued for the surface, applied by the shell if the surface never comes', async () => {
    const shared = await import('@/components/edition/picker.shared')
    const run = (opts: { motion: 'full' | 'reduced'; live?: boolean }) => {
      const attrs = new Map<string, string>([
        ['data-pick', '1'],
        ['data-edition', 'screen'],
        ['data-motion', opts.motion],
      ])
      if (opts.live) attrs.set(shared.PICKER_LIVE_ATTR, '1')
      const html = {
        getAttribute: (n: string) => attrs.get(n) ?? null,
        setAttribute: (n: string, v: string) => void attrs.set(n, String(v)),
        removeAttribute: (n: string) => void attrs.delete(n),
        hasAttribute: (n: string) => attrs.has(n),
      }
      const half = (cls: string) => {
        const classes = new Set(['pk-half', cls])
        const el = {
          classList: {
            contains: (c: string) => classes.has(c),
            toggle: (c: string, on: boolean) => void (on ? classes.add(c) : classes.delete(c)),
          },
          closest: () => el,
          focus: () => {},
          click: () => {},
        }
        return el
      }
      const halves = [half('pk-half-s'), half('pk-half-p')]
      let onClick: (e: { target: unknown }) => void = () => {}
      const shell = {
        querySelectorAll: () => halves,
        addEventListener: (_t: string, fn: typeof onClick) => void (onClick = fn),
      }
      const doc = {
        documentElement: html,
        querySelector: () => shell,
        addEventListener: () => {},
        activeElement: null,
        fonts: { forEach: () => {} },
      }
      const store = new Map<string, string>()
      const events: string[] = []
      new Function('document', 'localStorage', 'dispatchEvent', 'CustomEvent', shared.PICKER_SHELL_SCRIPT_RESOLVED)(
        doc,
        { setItem: (k: string, v: string) => void store.set(k, v) },
        (e: { type: string }) => void events.push(e.type),
        class {
          constructor(public type: string) {}
        },
      )
      return { attrs, store, events, tap: (i: 0 | 1) => onClick({ target: halves[i] }), halves }
    }
    vi.useFakeTimers()
    try {
      // queued, pressed look, and nothing else until the fallback
      const a = run({ motion: 'full' })
      a.tap(1)
      expect(a.attrs.get(shared.PICKER_QUEUED_ATTR)).toBe('print')
      expect(a.halves[1].classList.contains(shared.PICKER_QUEUED_CLASS)).toBe(true)
      vi.advanceTimersByTime(shared.PICKER_FALLBACK_MS - 1)
      expect(a.attrs.get('data-pick')).toBe('1')
      // the surface never came: the shell applies the choice itself
      vi.advanceTimersByTime(1)
      expect(a.attrs.has('data-pick')).toBe(false)
      expect(a.attrs.has(shared.PICKER_QUEUED_ATTR)).toBe(false)
      expect(a.attrs.get('data-edition')).toBe('print')
      expect(a.store.get('signal.edition')).toBe('print')
      expect(a.attrs.get('data-intro')).toBe('1')
      expect(a.events).toEqual([INTRO_GATE_START_EVENT])
      // reduced motion: PRINT without the intro; SCREEN never raises it
      const b = run({ motion: 'reduced' })
      b.tap(1)
      vi.advanceTimersByTime(shared.PICKER_FALLBACK_MS)
      expect(b.attrs.get('data-edition')).toBe('print')
      expect(b.attrs.has('data-intro')).toBe(false)
      expect(b.events).toEqual([])
      const c = run({ motion: 'full' })
      c.tap(0)
      vi.advanceTimersByTime(shared.PICKER_FALLBACK_MS)
      expect(c.attrs.get('data-edition')).toBe('screen')
      expect(c.attrs.has('data-intro')).toBe(false)
      // the surface chunk already failed (the gate set data-picker-failed): applied at once
      const e = run({ motion: 'full' })
      e.attrs.set(shared.PICKER_FAILED_ATTR, '1')
      e.tap(0)
      vi.advanceTimersByTime(0)
      expect(e.attrs.has('data-pick')).toBe(false)
      expect(e.attrs.get('data-edition')).toBe('screen')
      // the surface went live in time: the shell's fallback stands down
      const d = run({ motion: 'full' })
      d.tap(1)
      d.attrs.set(shared.PICKER_LIVE_ATTR, '1')
      vi.advanceTimersByTime(shared.PICKER_FALLBACK_MS)
      expect(d.attrs.get('data-pick')).toBe('1')
      expect(d.store.size).toBe(0)
    } finally {
      vi.useRealTimers()
    }
    // and the surface steps aside when the fallback already ended the picker
    const surface = read('components/edition/EditionPickerSurface.client.tsx')
    expect(surface).toMatch(/if \(html\.getAttribute\(PICK_ATTR\) !== '1'\) \{\s*onDoneRef\.current\(\)/)
  })

  it('the shared module owns the copy and the encodes', async () => {
    const shared = await import('@/components/edition/picker.shared')
    expect(shared.PICKER_COPY).toBe(PICKER_COPY)
    expect(shared.PICKER_LIVE_ATTR).toBe('data-picker-live')
    expect(shared.PICKER_PHONE_QUERY).toBe('(max-width: 767.98px)')
    expect(shared.pickerPortraitSources(false)).toEqual({
      screen: '/photo/portrait-41.webp',
      print: '/photo/portrait-paper.webp',
    })
    expect(shared.pickerPortraitSources(true)).toEqual({
      screen: '/photo/portrait-41-660.webp',
      print: '/photo/portrait-paper-660.webp',
    })
  })
})

describe('SCREEN-only islands come back after a switch through PRINT', () => {
  it('the hero field observes whichever wrapper is current, not the first one', () => {
    const src = readFileSync(path.join(root, 'components/hero/GlyphField/index.tsx'), 'utf8')
    // PRINT renders nothing, so SCREEN brings a NEW wrapper node back: a
    // callback ref keeps the visibility observer on it (an effect keyed on
    // a ref read once at mount kept watching the removed node, and the
    // field stayed the static drawing until a reload).
    expect(src).toContain('ref={setWrapper}')
    expect(src).toMatch(/observer\.observe\(node\)[\s\S]*?\}, \[wrapper\]\)/)
    expect(src).not.toContain('wrapperRef')
  })
})
