/**
 * V3_SPEC §8 — tests/guide.test.ts (C5)
 * The guide's pure core: the eight ids in chapter order, the per-edition
 * copy (item 2 = the switch command's label), markTried idempotence, the
 * next-untried order, the storage round-trip, coach marks once per session,
 * the store slice, and the "Try it" runner's hand-offs against fakes.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  COACH_MIN_WIDTH,
  COACH_SESSION_KEY,
  GUIDE_CHIP_LABEL,
  GUIDE_COMPLETE_LABEL,
  GUIDE_IDS,
  GUIDE_ITEMS,
  GUIDE_MORE_LABEL,
  GUIDE_MORE_TOUCH_LABEL,
  GUIDE_SECTION,
  GUIDE_STORAGE_KEY,
  GUIDE_TOTAL,
  GUIDE_TRIED_EVENT,
  GUIDE_TRY_LABEL,
  chipAriaLabel,
  coachCandidate,
  guideCoach,
  guideHow,
  guideLabel,
  isComplete,
  isGuideId,
  markCoachShown,
  markTried,
  nextUntried,
  parseIds,
  progressLabel,
  readCoachShown,
  readTried,
  triedAnnouncement,
  triedCount,
  untriedIds,
  writeTried,
  type GuideId,
  type StorageLike,
} from '@/lib/guide/guide'
import {
  BLAME_ON_EVENT,
  COACH_ANCHORS,
  CONSOLE_COMMAND,
  ISLAND_SELECTOR,
  MAXIMIZE_PROJECT_EVENT,
  PORTRAIT_REVEAL_EVENT,
  TERMINAL_RUN_EVENT,
  findCoachAnchor,
  runGuideAction,
  waitForIsland,
} from '@/lib/guide/actions'
import { COACH_GAP, placeBeside } from '@/lib/guide/place'
import { SECTION_ANCHORS } from '@/lib/commands/sections'
import { SIGNAL_EVENTS, type CommandCtx } from '@/lib/commands/context'
import { SWITCH_EDITION_LABELS } from '@/lib/commands/registry'
import { useSignalStore } from '@/lib/state/store'
import { PALETTE_KEY, paletteKeyFor } from '@/lib/utils/input'

function fakeStorage(init: Record<string, string> = {}, opts: { throws?: boolean } = {}) {
  const map = new Map(Object.entries(init))
  const guard = () => {
    if (opts.throws) throw new Error('blocked')
  }
  const storage: StorageLike & { map: Map<string, string> } = {
    map,
    getItem: (k) => {
      guard()
      return map.has(k) ? (map.get(k) as string) : null
    },
    setItem: (k, v) => {
      guard()
      map.set(k, v)
    },
  }
  return storage
}

/** Clutter law (BRIEF-R2 §1): no file names, command syntax or build numbers in copy. */
const BANNED =
  /\.(md|json|ts|tsx|log|sh|webp|svg)\b|--[a-z]|\$ |\bnpm\b|\bgit\b|\bkb\b|\bfps\b|\bsha\b|ascii|halftone(?! dots)/i

describe('the eight (V3_SPEC §2.6)', () => {
  it('are the eight ids in chapter order, once each', () => {
    expect(GUIDE_IDS).toEqual([
      'go-anywhere',
      'other-edition',
      'reveal-portrait',
      'light-toolkit',
      'play-c4',
      'open-project',
      'skills-per-job',
      'ask-console',
    ])
    expect(GUIDE_TOTAL).toBe(8)
    expect(GUIDE_ITEMS.map((i) => i.id)).toEqual([...GUIDE_IDS])
    expect(new Set(GUIDE_IDS).size).toBe(8)
    for (const id of GUIDE_IDS) expect(isGuideId(id)).toBe(true)
    expect(isGuideId('toggle-theme')).toBe(false)
    expect(isGuideId(42)).toBe(false)
  })

  it('carries the visitor-language labels of the frame in both editions', () => {
    expect(guideLabel('go-anywhere', 'screen')).toBe('Go anywhere')
    expect(guideLabel('go-anywhere', 'print')).toBe('Jump to any page')
    expect(guideLabel('reveal-portrait', 'screen')).toBe('Reveal the portrait')
    expect(guideLabel('light-toolkit', 'print')).toBe('Light up the toolkit')
    expect(guideLabel('play-c4', 'screen')).toBe('Play Connect Four')
    expect(guideLabel('open-project', 'screen')).toBe('Open a project full size')
    expect(guideLabel('skills-per-job', 'screen')).toBe('See which skills each job used')
    expect(guideLabel('ask-console', 'print')).toBe('Ask the console who I am')
    expect(GUIDE_CHIP_LABEL).toBe('8 things to try')
    expect(GUIDE_COMPLETE_LABEL).toBe("You've tried everything")
  })

  it('item 2 names the OTHER edition, exactly like the switch-edition command', () => {
    expect(guideLabel('other-edition', 'screen')).toBe(SWITCH_EDITION_LABELS.screen)
    expect(guideLabel('other-edition', 'print')).toBe(SWITCH_EDITION_LABELS.print)
  })

  it('maps each feature to its section; the two chrome items have none and no coach mark', () => {
    for (const item of GUIDE_ITEMS) {
      expect(item.section).toBe(GUIDE_SECTION[item.id])
      if (item.section === null) {
        expect(item.coach).toBeNull()
      } else {
        expect(SECTION_ANCHORS).toContain(item.section)
        /* Work: the window's own status line is the page's coach (S4 F2d / P4). */
        if (item.id === 'play-c4') expect(item.coach).toBeNull()
        else expect(item.coach).not.toBeNull()
      }
    }
    expect(GUIDE_SECTION['light-toolkit']).toBe('#skills')
    expect(GUIDE_SECTION['play-c4']).toBe('#projects')
    expect(GUIDE_SECTION['open-project']).toBe('#projects')
    expect(GUIDE_SECTION['skills-per-job']).toBe('#experience')
    expect(GUIDE_SECTION['ask-console']).toBe('#contact')
    expect(guideCoach('light-toolkit', 'screen')).toBe(
      'Start here, then tap any skill to see where I used it.'
    )
    expect(guideCoach('go-anywhere', 'screen')).toBeNull()
  })

  it('narrates the disc colour per edition (director call d)', () => {
    expect(guideHow('play-c4', 'screen')).toContain("You're ivory")
    expect(guideHow('play-c4', 'print')).toContain("You're yellow")
  })

  it('never shows a file name, command syntax or build evidence (clutter law)', () => {
    for (const item of GUIDE_ITEMS) {
      for (const edition of ['screen', 'print'] as const) {
        expect(item.label[edition]).not.toMatch(BANNED)
        expect(item.how[edition]).not.toMatch(BANNED)
        expect(guideHow(item.id, edition, 'touch')).not.toMatch(BANNED)
        expect(item.where[edition]).not.toMatch(BANNED)
        if (item.coach?.[edition]) expect(item.coach[edition]).not.toMatch(BANNED)
        expect(guideCoach(item.id, edition, 'touch') ?? '').not.toMatch(BANNED)
      }
    }
    expect(GUIDE_MORE_TOUCH_LABEL).not.toMatch(BANNED)
  })
})

/**
 * Mouse or touch (lib/utils/input.ts): on a touch screen there is no key to
 * press, nothing to hover and no ⌘K / Jump chip in the bar, so every line
 * the guide shows there says what a tap does. The mouse wording is the
 * frames' approved copy, unchanged.
 */
describe('mouse or touch wording', () => {
  /** A key, a hover, a click, or the keyboard-only chip's name. */
  const KEYBOARD_OR_HOVER =
    /⌘|\bctrl\b|\bpress\b|\bhover|\bclick|\bkeyboard|under jump|\bjump\b(?= control| chip)/i

  it('keeps the approved mouse wording (the default)', () => {
    expect(guideHow('go-anywhere', 'screen')).toBe('Press ⌘K to search every page and action.')
    expect(guideHow('go-anywhere', 'print', 'mouse')).toBe(
      'Press ⌘K to jump to any chapter or action.'
    )
    expect(guideHow('skills-per-job', 'screen')).toBe(
      'Switch it on, then hover a job to see the tools it used.'
    )
    expect(guideCoach('reveal-portrait', 'screen')).toBe(
      'Hover the portrait, or replay it, to watch it resolve.'
    )
    expect(guideCoach('skills-per-job', 'screen')).toBe('Switch this on, then hover a job.')
    expect(GUIDE_MORE_LABEL).toEqual({ screen: 'More in', print: 'More under Jump' })
  })

  it('never names a key or a hover on a touch screen, in either edition', () => {
    // the check bites: the mouse wordings it replaces all match it
    expect(guideHow('go-anywhere', 'screen')).toMatch(KEYBOARD_OR_HOVER)
    expect(guideHow('skills-per-job', 'screen')).toMatch(KEYBOARD_OR_HOVER)
    expect(guideCoach('reveal-portrait', 'screen')).toMatch(KEYBOARD_OR_HOVER)
    expect(GUIDE_MORE_LABEL.print).toMatch(KEYBOARD_OR_HOVER)
    for (const item of GUIDE_ITEMS) {
      for (const edition of ['screen', 'print'] as const) {
        expect(guideHow(item.id, edition, 'touch'), `${item.id} how`).not.toMatch(KEYBOARD_OR_HOVER)
        const coach = guideCoach(item.id, edition, 'touch')
        if (coach) expect(coach, `${item.id} coach`).not.toMatch(KEYBOARD_OR_HOVER)
      }
    }
    expect(GUIDE_MORE_TOUCH_LABEL).toBe('More things to try')
    expect(GUIDE_MORE_TOUCH_LABEL).not.toMatch(/jump|⌘|ctrl/i)
  })

  it("points a phone at the row's own button to open the palette", () => {
    expect(guideHow('go-anywhere', 'screen', 'touch')).toBe(
      `Tap ${GUIDE_TRY_LABEL} to search every page and action.`
    )
    expect(guideHow('go-anywhere', 'print', 'touch')).toBe(
      `Tap ${GUIDE_TRY_LABEL} to jump to any chapter or action.`
    )
    expect(guideHow('skills-per-job', 'screen', 'touch')).toBe(
      'Switch it on, then tap a job to see the tools it used.'
    )
    expect(guideCoach('reveal-portrait', 'screen', 'touch')).toBe(
      'Tap replay to watch the portrait resolve.'
    )
    expect(guideCoach('skills-per-job', 'screen', 'touch')).toBe('Switch this on, then tap a job.')
  })

  it('falls back to the one wording where nothing names a key or a hover', () => {
    expect(guideHow('play-c4', 'screen', 'touch')).toBe(guideHow('play-c4', 'screen'))
    expect(guideHow('skills-per-job', 'print', 'touch')).toBe(guideHow('skills-per-job', 'print'))
    expect(guideCoach('skills-per-job', 'print', 'touch')).toBe('Flip the switch, then pick a job.')
    // no coach mark stays no coach mark
    expect(guideCoach('go-anywhere', 'screen', 'touch')).toBeNull()
    expect(guideCoach('reveal-portrait', 'print', 'touch')).toBeNull()
    for (const item of GUIDE_ITEMS) {
      for (const edition of ['screen', 'print'] as const) {
        if (item.howTouch?.[edition]) expect(item.howTouch[edition]).not.toBe(item.how[edition])
        if (item.coachTouch?.[edition]) expect(item.coach?.[edition]).toBeTruthy()
      }
    }
  })

  it('names the keycap per platform, like the top bar (Ctrl K off Apple)', () => {
    expect(paletteKeyFor('MacIntel')).toBe('⌘K')
    expect(paletteKeyFor('iPhone')).toBe('⌘K')
    expect(paletteKeyFor('Win32')).toBe('Ctrl K')
    expect(paletteKeyFor('Linux x86_64')).toBe('Ctrl K')
    // the surface swaps the keycap inside the mouse wording: it is there once
    for (const edition of ['screen', 'print'] as const) {
      expect(guideHow('go-anywhere', edition).split(PALETTE_KEY)).toHaveLength(2)
    }
  })
})

describe('progress', () => {
  it('markTried is idempotent and keeps chapter order', () => {
    const a = markTried([], 'play-c4')
    expect(a).toEqual(['play-c4'])
    const b = markTried(a, 'play-c4')
    expect(b).toBe(a)
    const c = markTried(b, 'go-anywhere')
    expect(c).toEqual(['go-anywhere', 'play-c4'])
    expect(triedCount(c)).toBe(2)
  })

  it('nextUntried walks the chapter order and is null at 8/8', () => {
    expect(nextUntried([])).toBe('go-anywhere')
    expect(nextUntried(['go-anywhere'])).toBe('other-edition')
    expect(nextUntried(['go-anywhere', 'other-edition', 'light-toolkit'])).toBe('reveal-portrait')
    expect(untriedIds(['reveal-portrait'])).toEqual(
      GUIDE_IDS.filter((id) => id !== 'reveal-portrait')
    )
    let all: readonly GuideId[] = []
    for (const id of GUIDE_IDS) all = markTried(all, id)
    expect(isComplete(all)).toBe(true)
    expect(nextUntried(all)).toBeNull()
    expect(isComplete(all.slice(0, 7))).toBe(false)
  })

  it('labels the count and the chip name', () => {
    expect(progressLabel([])).toBe('0 of 8 tried')
    expect(progressLabel(['go-anywhere', 'play-c4', 'reveal-portrait'])).toBe('3 of 8 tried')
    expect(chipAriaLabel([], false)).toBe('8 things to try, 0 tried. Open the guide')
    expect(chipAriaLabel(['go-anywhere'], true)).toBe('8 things to try, 1 tried. Close the guide')
    expect(triedAnnouncement('play-c4', ['play-c4'], 'screen')).toBe(
      'Tried: Play Connect Four. 1 of 8 tried.'
    )
    let all: readonly GuideId[] = []
    for (const id of GUIDE_IDS) all = markTried(all, id)
    expect(triedAnnouncement('ask-console', all, 'print')).toContain(GUIDE_COMPLETE_LABEL)
  })
})

describe('storage round-trip', () => {
  it('reads and writes localStorage["signal.guide"] as a JSON array in chapter order', () => {
    expect(GUIDE_STORAGE_KEY).toBe('signal.guide')
    const local = fakeStorage()
    expect(readTried(local)).toEqual([])
    expect(writeTried(local, ['ask-console', 'go-anywhere'])).toBe(true)
    expect(JSON.parse(local.map.get(GUIDE_STORAGE_KEY) as string)).toEqual([
      'go-anywhere',
      'ask-console',
    ])
    expect(readTried(local)).toEqual(['go-anywhere', 'ask-console'])
  })

  it('tolerates garbage, unknown ids, duplicates and blocked storage', () => {
    expect(parseIds('not json')).toEqual([])
    expect(parseIds('{"a":1}')).toEqual([])
    expect(parseIds('["play-c4","nope",3,"play-c4","go-anywhere"]')).toEqual([
      'go-anywhere',
      'play-c4',
    ])
    expect(readTried(fakeStorage({ [GUIDE_STORAGE_KEY]: '[[' }))).toEqual([])
    expect(readTried(fakeStorage({}, { throws: true }))).toEqual([])
    expect(writeTried(fakeStorage({}, { throws: true }), ['play-c4'])).toBe(false)
    expect(readTried(null)).toEqual([])
    expect(writeTried(undefined, [])).toBe(false)
  })
})

describe('coach marks (one at a time, once per session)', () => {
  const base = { tried: [] as GuideId[], shown: [] as GuideId[] }

  it('picks the first untried item of the active section, never a chrome item', () => {
    expect(coachCandidate({ ...base, activeSection: '#skills' })).toBe('light-toolkit')
    /* Work: the window's own status line is the coach, so the guide skips to the next item there. */
    expect(coachCandidate({ ...base, activeSection: '#projects' })).toBe('open-project')
    expect(coachCandidate({ ...base, tried: ['play-c4'], activeSection: '#projects' })).toBe(
      'open-project'
    )
    expect(coachCandidate({ ...base, activeSection: '#about' })).toBe('reveal-portrait')
    expect(coachCandidate({ ...base, activeSection: 'hero' })).toBeNull()
    expect(coachCandidate({ ...base, activeSection: 'footer' })).toBeNull()
    expect(coachCandidate({ ...base, activeSection: null })).toBeNull()
  })

  it('is suppressed by the open guide, phone widths, tried items and marks shown this session', () => {
    expect(coachCandidate({ ...base, activeSection: '#skills', guideOpen: true })).toBeNull()
    expect(
      coachCandidate({ ...base, activeSection: '#skills', viewportWidth: COACH_MIN_WIDTH - 1 })
    ).toBeNull()
    expect(
      coachCandidate({ ...base, activeSection: '#skills', viewportWidth: COACH_MIN_WIDTH })
    ).toBe('light-toolkit')
    expect(
      coachCandidate({ ...base, tried: ['light-toolkit'], activeSection: '#skills' })
    ).toBeNull()
    expect(
      coachCandidate({ ...base, shown: ['light-toolkit'], activeSection: '#skills' })
    ).toBeNull()
  })

  it('remembers shown marks in sessionStorage["signal.coach"], idempotently', () => {
    expect(COACH_SESSION_KEY).toBe('signal.coach')
    const session = fakeStorage()
    expect(readCoachShown(session)).toEqual([])
    const shown = markCoachShown(session, [], 'light-toolkit')
    expect(shown).toEqual(['light-toolkit'])
    expect(readCoachShown(session)).toEqual(['light-toolkit'])
    expect(markCoachShown(session, shown, 'light-toolkit')).toBe(shown)
    expect(
      coachCandidate({ ...base, shown: readCoachShown(session), activeSection: '#skills' })
    ).toBeNull()
    expect(markCoachShown(fakeStorage({}, { throws: true }), [], 'play-c4')).toEqual(['play-c4'])
  })
})

describe('store slice (C5 append)', () => {
  afterEach(() => {
    useSignalStore.setState({ guideTried: [], guideOpen: false, overlayOpen: false })
  })

  it('starts fresh at 0 of 8 with "Go anywhere" next, closed, no overlay', () => {
    const s = useSignalStore.getState()
    expect(s.guideTried).toEqual([])
    expect(nextUntried(s.guideTried)).toBe('go-anywhere')
    expect(s.guideOpen).toBe(false)
    expect(s.overlayOpen).toBe(false)
  })

  it('markGuideTried is idempotent (same reference) and ordered', () => {
    const store = useSignalStore.getState()
    store.markGuideTried('play-c4')
    const once = useSignalStore.getState().guideTried
    store.markGuideTried('play-c4')
    expect(useSignalStore.getState().guideTried).toBe(once)
    store.markGuideTried('go-anywhere')
    expect(useSignalStore.getState().guideTried).toEqual(['go-anywhere', 'play-c4'])
    store.setGuideOpen(true)
    store.setOverlayOpen(true)
    expect(useSignalStore.getState().guideOpen).toBe(true)
    expect(useSignalStore.getState().overlayOpen).toBe(true)
  })
})

describe('"Try it" (lib/guide/actions)', () => {
  const g = globalThis as { window?: unknown; document?: unknown }
  const events: Array<{ type: string; detail: unknown }> = []

  function installDom(found: boolean) {
    const el = { id: 'x' }
    const listeners = new Map<string, Array<(e: Event) => void>>()
    g.window = {
      dispatchEvent: (e: Event) => {
        events.push({ type: e.type, detail: (e as CustomEvent).detail })
        listeners.get(e.type)?.forEach((fn) => fn(e))
        return true
      },
      addEventListener: (t: string, fn: (e: Event) => void) => {
        listeners.set(t, [...(listeners.get(t) ?? []), fn])
      },
      removeEventListener: () => {},
      setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
      scrollX: 0,
      scrollY: 0,
    }
    g.document = {
      documentElement: { dataset: {} },
      getElementById: () => null,
      querySelector: () => (found ? el : null),
      querySelectorAll: () => [],
    }
    return el
  }

  afterEach(() => {
    delete g.window
    delete g.document
    events.length = 0
    useSignalStore.setState({
      paletteOpen: false,
      maximizedProject: null,
      activeProject: 'ticket-forge',
    })
    vi.useRealTimers()
  })

  it('names the events the areas listen to', () => {
    expect(GUIDE_TRIED_EVENT).toBe('signal:guide-tried')
    expect(PORTRAIT_REVEAL_EVENT).toBe('signal:reveal-portrait')
    expect(MAXIMIZE_PROJECT_EVENT).toBe('signal:maximize-project')
    expect(BLAME_ON_EVENT).toBe('signal:blame-on')
    expect(TERMINAL_RUN_EVENT).toBe('signal:terminal-run')
    expect(CONSOLE_COMMAND).toBe('whoami --face')
    for (const id of GUIDE_IDS) {
      if (GUIDE_SECTION[id] !== null) expect(ISLAND_SELECTOR[id], id).toBeTruthy()
    }
  })

  it('waitForIsland resolves at once when the island is there and null after the timeout', async () => {
    const el = installDom(true)
    await expect(waitForIsland('x', 50)).resolves.toBe(el)
    installDom(false)
    await expect(waitForIsland('x', 120)).resolves.toBeNull()
  })

  it('go-anywhere opens the palette; other-edition toggles through the ctx', async () => {
    installDom(true)
    const setEdition = vi.fn(async () => {})
    const ctx = { setEdition, openProject: vi.fn() } as unknown as CommandCtx
    await runGuideAction('go-anywhere', ctx)
    expect(useSignalStore.getState().paletteOpen).toBe(true)
    await runGuideAction('other-edition', ctx)
    expect(setEdition).toHaveBeenCalledWith('toggle', 'palette')
  })

  it('scrolls, waits for the island, then dispatches the feature event', async () => {
    installDom(true)
    const ctx = { openProject: vi.fn(), setEdition: vi.fn() } as unknown as CommandCtx
    await runGuideAction('light-toolkit', ctx)
    expect(events.map((e) => e.type)).toContain(SIGNAL_EVENTS.deployAll)
    await runGuideAction('reveal-portrait', ctx)
    expect(events.map((e) => e.type)).toContain(PORTRAIT_REVEAL_EVENT)
    await runGuideAction('skills-per-job', ctx)
    expect(events.map((e) => e.type)).toContain(BLAME_ON_EVENT)
    await runGuideAction('ask-console', ctx)
    const run = events.find((e) => e.type === TERMINAL_RUN_EVENT)
    expect(run?.detail).toEqual({ command: CONSOLE_COMMAND })
  })

  it('play-c4 runs the game window; open-project asks the mounted window to maximize', async () => {
    installDom(true)
    const openProject = vi.fn()
    const ctx = { openProject, setEdition: vi.fn() } as unknown as CommandCtx
    await runGuideAction('play-c4', ctx)
    expect(openProject).toHaveBeenCalledWith('triplay-ai')
    const run = events.find((e) => e.type === SIGNAL_EVENTS.runProject)
    expect(run?.detail).toEqual({ slug: 'triplay-ai' })
    useSignalStore.getState().setActiveProject('trackfolio')
    await runGuideAction('open-project', ctx)
    expect(openProject).toHaveBeenLastCalledWith('trackfolio')
    const max = events.find((e) => e.type === MAXIMIZE_PROJECT_EVENT)
    expect(max?.detail).toEqual({ slug: 'trackfolio' })
    // the window owns the store write (and the completion) when it is there
    expect(useSignalStore.getState().maximizedProject).toBeNull()
  })

  it('open-project falls back to the store when no window mounts in time', async () => {
    vi.useFakeTimers()
    installDom(false)
    const ctx = { openProject: vi.fn(), setEdition: vi.fn() } as unknown as CommandCtx
    useSignalStore.getState().setActiveProject('expense-share')
    const done = runGuideAction('open-project', ctx)
    await vi.advanceTimersByTimeAsync(1700)
    await done
    expect(events.some((e) => e.type === MAXIMIZE_PROJECT_EVENT)).toBe(false)
    expect(useSignalStore.getState().maximizedProject).toBe('expense-share')
  })
})

describe('the coach mark anchors beside the control it names', () => {
  const g = globalThis as { document?: unknown }
  afterEach(() => {
    delete g.document
  })

  /** A fake document: selector → element (visible unless `hidden`). */
  function installDom(map: Record<string, { hidden?: boolean }>, sectionIds: string[] = []) {
    const make = (sel: string) => {
      const spec = map[sel]
      if (!spec) return null
      return {
        sel,
        getBoundingClientRect: () =>
          spec.hidden ? { width: 0, height: 0 } : { width: 40, height: 20 },
      }
    }
    const section = { querySelector: (sel: string) => make(sel) }
    g.document = {
      getElementById: (id: string) => (sectionIds.includes(id) ? section : null),
      querySelector: (sel: string) => make(sel),
    }
  }

  it('names a control (not the whole section) for every section item, and none for the chrome items', () => {
    for (const id of GUIDE_IDS) {
      if (GUIDE_SECTION[id] === null) expect(COACH_ANCHORS[id]).toEqual([])
      else expect(COACH_ANCHORS[id].length, id).toBeGreaterThan(0)
    }
    expect(COACH_ANCHORS['open-project'][0]).toContain('.pw-btn-max')
    expect(COACH_ANCHORS['play-c4'][0]).toContain('.c4-board')
    expect(COACH_ANCHORS['reveal-portrait'][0]).toContain('.pf-replay')
    expect(COACH_ANCHORS['ask-console'][0]).toMatch(/input$/)
  })

  it("prefers the section's own data-guide-anchor, then the first VISIBLE fallback, else nothing", () => {
    installDom(
      {
        '[data-guide-anchor="light-toolkit"]': {},
        '#skills [data-component="SystemDiagram"]': {},
      },
      ['skills']
    )
    expect((findCoachAnchor('light-toolkit') as unknown as { sel: string }).sel).toBe(
      '[data-guide-anchor="light-toolkit"]'
    )
    // PRINT hides the replay control (display:none → an empty box): the panel wins
    installDom({ '#about .pf-replay': { hidden: true }, '#about [data-component="Portrait"]': {} })
    expect((findCoachAnchor('reveal-portrait') as unknown as { sel: string }).sel).toBe(
      '#about [data-component="Portrait"]'
    )
    installDom({ '#projects .c4-board': {} })
    expect((findCoachAnchor('play-c4') as unknown as { sel: string }).sel).toBe(
      '#projects .c4-board'
    )
    installDom({})
    expect(findCoachAnchor('open-project')).toBeNull()
    expect(findCoachAnchor('go-anywhere')).toBeNull()
  })
})

describe('the coach mark sits beside the control, never under the bar or off the page', () => {
  const size = { width: 256, height: 94 }
  const viewport = { width: 1280, height: 800, navHeight: 64 }

  it('goes below when there is room, aligned to the control', () => {
    const p = placeBeside({ top: 300, bottom: 336, left: 400, right: 600 }, size, viewport)
    expect(p).toEqual({ top: 336 + COACH_GAP, left: 400, side: 'below' })
  })

  it('goes above when the page ends under the control, using its own height', () => {
    const p = placeBeside({ top: 700, bottom: 756, left: 100, right: 300 }, size, viewport)
    expect(p).toEqual({ top: 700 - COACH_GAP - 94, left: 100, side: 'above' })
  })

  it('goes to the right of a tall control that leaves no room above or below', () => {
    // the PRINT portrait panel: from under the bar to the page's foot
    const p = placeBeside({ top: 80, bottom: 780, left: 64, right: 488 }, size, viewport)
    expect(p.side).toBe('right')
    expect(p.left).toBe(488 + COACH_GAP)
    // centred on the panel's side
    expect(p.top).toBe((80 + 780) / 2 - 94 / 2)
    // a panel scrolled mostly above the bar keeps the mark clear of the bar; one
    // running far past the page's foot keeps it inside the viewport
    const q = placeBeside({ top: -900, bottom: 780, left: 64, right: 488 }, size, viewport)
    expect(q.side).toBe('right')
    expect(q.top).toBe(64 + COACH_GAP)
    const r = placeBeside({ top: 60, bottom: 1600, left: 64, right: 488 }, size, viewport)
    expect(r.side).toBe('right')
    expect(r.top).toBe(800 - 94 - 12)
  })

  it('stays inside the viewport horizontally and falls back to below', () => {
    const p = placeBeside({ top: 300, bottom: 336, left: 1200, right: 1270 }, size, viewport)
    expect(p.left).toBe(1280 - 256 - 12)
    // nothing fits anywhere on a short phone-ish viewport: below wins, the page scrolls
    const q = placeBeside({ top: 60, bottom: 700, left: 12, right: 700 }, size, {
      width: 700,
      height: 720,
      navHeight: 56,
    })
    expect(q.side).toBe('below')
    expect(q.top).toBe(700 + COACH_GAP)
  })
})

/**
 * §7 — what rides the first-load bundle: the always-mounted files import
 * only lib/guide/core (never the copy or the actions) and reach their
 * surfaces, the runtime and the picker's surface through next/dynamic.
 */
describe('bundle hygiene (V3_SPEC §7)', () => {
  const root = path.resolve(__dirname, '..', 'components')
  const read = (rel: string) => readFileSync(path.join(root, rel), 'utf8')
  const staticImports = (src: string) =>
    [...src.matchAll(/^import[^'"]*['"]([^'"]+)['"]/gm)].map((m) => m[1])

  it('the guide chip imports only the core and loads the surface + runtime lazily', () => {
    const guide = read('guide/Guide.client.tsx')
    const imports = staticImports(guide)
    expect(imports).toContain('@/lib/guide/core')
    expect(imports).not.toContain('@/lib/guide/guide')
    expect(imports).not.toContain('@/lib/guide/actions')
    expect(imports).not.toContain('@/lib/commands/registry')
    expect(guide).toMatch(/dynamic\(\(\) => import\('\.\/GuideSurface\.client'\)/)
    expect(guide).toMatch(/dynamic\(\(\) => import\('\.\/GuideRuntime\.client'\)/)
    // the announcement copy is imported on demand, never statically
    expect(guide).toContain("import('@/lib/guide/guide')")
  })

  it('the runtime keeps the coach mark and the copy out of its own chunk until one is due', () => {
    const runtime = read('guide/GuideRuntime.client.tsx')
    const imports = staticImports(runtime)
    expect(imports).not.toContain('@/lib/guide/guide')
    expect(imports).not.toContain('@/lib/guide/actions')
    expect(runtime).toMatch(/dynamic\(\(\) => import\('\.\/GuideCoach\.client'\)/)
  })

  it('the picker gate renders nothing on the server and loads its surface lazily', () => {
    const gate = read('edition/EditionPicker.client.tsx')
    expect(gate).toMatch(/dynamic\(\(\) => import\('\.\/EditionPickerSurface\.client'\)/)
    expect(gate).toContain('if (!show) return null')
    expect(staticImports(gate)).not.toContain('@/lib/data/photos')
  })
})

/**
 * The cross-area contract, read from the OTHER areas' source (they keep
 * their own literals so no chunk imports the guide lib): every island the
 * actions target exists under the data-component name the selector uses,
 * every event the actions dispatch is a literal in its listener's file, and
 * the six section items are reported by their own islands.
 */
describe('sibling contracts (V3_SPEC §2.6 completion triggers)', () => {
  const root = path.resolve(__dirname, '..', 'components')
  function walk(dir: string, out: string[] = []): string[] {
    for (const name of readdirSync(dir)) {
      const p = path.join(dir, name)
      if (statSync(p).isDirectory()) walk(p, out)
      else if (/\.(ts|tsx)$/.test(name)) out.push(p)
    }
    return out
  }
  const files = walk(root)
  const source = new Map(files.map((f) => [path.relative(root, f), readFileSync(f, 'utf8')]))
  const all = [...source.values()].join('\n')
  const own = /^(guide|edition)\//

  it('every island selector names a data-component another area renders', () => {
    for (const [id, selector] of Object.entries(ISLAND_SELECTOR)) {
      const name = /data-component="([^"]+)"/.exec(selector)?.[1]
      expect(name, id).toBeTruthy()
      expect(all, `${id} → ${name}`).toContain(`data-component="${name}"`)
    }
    // the console action targets the prompt: a real <input> in the terminal
    expect(source.get('contact/Terminal/index.tsx')).toMatch(/<input/)
  })

  it('every coach anchor names markup another area renders', () => {
    const others = [...source.entries()]
      .filter(([f]) => !own.test(f))
      .map(([, s]) => s)
      .join('\n')
    for (const [id, selectors] of Object.entries(COACH_ANCHORS)) {
      for (const selector of selectors) {
        for (const [, name] of selector.matchAll(/data-component="([^"]+)"/g)) {
          expect(others, `${id} → ${name}`).toContain(`data-component="${name}"`)
        }
        for (const [, cls] of selector.matchAll(/\.([a-z0-9-]+)/g)) {
          expect(others, `${id} → .${cls}`).toMatch(new RegExp(`className=\\{?[^\\n]*\\b${cls}\\b`))
        }
        for (const [, role] of selector.matchAll(/\[role="([^"]+)"\]/g)) {
          expect(others, `${id} → role ${role}`).toContain(`role="${role}"`)
        }
      }
    }
    // the two controls that mark themselves for the coach
    expect(others).toContain('data-guide-anchor="light-toolkit"')
    expect(others).toContain('data-guide-anchor="skills-per-job"')
  })

  it('every event the actions dispatch is heard by the area that owns the feature', () => {
    const listeners: Array<[string, string]> = [
      [PORTRAIT_REVEAL_EVENT, 'about/'],
      [MAXIMIZE_PROJECT_EVENT, 'projects/'],
      [BLAME_ON_EVENT, 'experience/'],
      [TERMINAL_RUN_EVENT, 'contact/'],
    ]
    for (const [event, dir] of listeners) {
      const area = [...source.entries()]
        .filter(([f]) => f.startsWith(dir))
        .map(([, s]) => s)
        .join('\n')
      expect(area, `${dir} → ${event}`).toContain(`'${event}'`)
      expect(area, `${dir} listens for ${event}`).toMatch(/addEventListener\(/)
    }
  })

  it('the six section items are reported by their own islands; the two chrome items by the guide', () => {
    const others = [...source.entries()]
      .filter(([f]) => !own.test(f))
      .map(([, s]) => s)
      .join('\n')
    for (const id of GUIDE_IDS) {
      if (GUIDE_SECTION[id] === null) continue
      expect(others, id).toContain(`'${id}'`)
    }
    expect(others).toContain(`'${GUIDE_TRIED_EVENT}'`)
    // go-anywhere from the always-mounted chip (the palette opening),
    // other-edition from the runtime chunk (the attribute observer)
    expect(source.get('guide/Guide.client.tsx')).toContain("id: 'go-anywhere'")
    expect(source.get('guide/GuideRuntime.client.tsx')).toContain("id: 'other-edition'")
  })
})
