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
    expect(PICKER_COPY.screen.aria).toBe('Screen: a dark, cinematic cut. Enter the feature.')
    expect(PICKER_COPY.print.aria).toBe('Print: an inked, four-color comic. Open the issue.')
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
