/**
 * V3_SPEC §8 — tests/edition.test.ts
 * The edition foundation: pre-paint script ⇄ resolvePrepaint parity across
 * every input combination, the storage/attribute constants, and the
 * getCurrentEdition / applyEdition / switchEdition fallbacks against a fake
 * document (vitest runs in node; no jsdom).
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  EDITION_ATTR,
  EDITION_STORAGE_KEY,
  INTRO_ATTR,
  INTRO_SESSION_KEY,
  PICK_ATTR,
  PREPAINT_SCRIPT,
  resolvePrepaint,
  type Edition,
} from '@/lib/edition/prepaint'
import {
  EDITION_SWITCH_ATTR,
  EDITION_THEME_COLOR,
  SWITCH_ORIGIN_X_VAR,
  SWITCH_ORIGIN_Y_VAR,
  applyEdition,
  getCurrentEdition,
  otherEdition,
  requestEditionPick,
  switchEdition,
  createCommandCtx,
} from '@/lib/commands/context'
import { MOTION_STORAGE_KEY } from '@/lib/motion/useReducedMotion'
import { useSignalStore } from '@/lib/state/store'

/* ------------------------------------------------------------------ fakes */

/** A minimal <html> element: attributes and dataset kept in sync. */
function makeRoot() {
  const attrs = new Map<string, string>()
  const dataset: Record<string, string | undefined> = {}
  const camel = (name: string) =>
    name.replace(/^data-/, '').replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase())
  const styleVars = new Map<string, string>()
  return {
    dataset,
    style: {
      setProperty: (name: string, value: string) => {
        styleVars.set(name, value)
      },
      removeProperty: (name: string) => {
        styleVars.delete(name)
      },
      getPropertyValue: (name: string) => styleVars.get(name) ?? '',
    },
    getAttribute: (name: string) => attrs.get(name) ?? null,
    hasAttribute: (name: string) => attrs.has(name),
    setAttribute: (name: string, value: string) => {
      attrs.set(name, String(value))
      if (name.startsWith('data-')) dataset[camel(name)] = String(value)
    },
    removeAttribute: (name: string) => {
      attrs.delete(name)
      if (name.startsWith('data-')) delete dataset[camel(name)]
    },
    attrs,
  }
}

function makeStorage(init: Record<string, string> = {}, opts: { throws?: boolean } = {}) {
  const map = new Map(Object.entries(init))
  const guard = () => {
    if (opts.throws) throw new Error('storage blocked')
  }
  return {
    getItem: (k: string) => {
      guard()
      return map.has(k) ? (map.get(k) as string) : null
    },
    setItem: (k: string, v: string) => {
      guard()
      map.set(k, String(v))
    },
    removeItem: (k: string) => {
      guard()
      map.delete(k)
    },
    map,
  }
}

type Meta = { content: string; setAttribute: (n: string, v: string) => void }
function makeMeta(): Meta {
  const meta: Meta = {
    content: '#050607',
    setAttribute(_n, v) {
      meta.content = v
    },
  }
  return meta
}

/** Run the pre-paint script against fakes; returns the resulting root. */
function runPrepaint(input: {
  local?: ReturnType<typeof makeStorage>
  session?: ReturnType<typeof makeStorage>
  systemReduced?: boolean
}) {
  const root = makeRoot()
  const doc = { documentElement: root }
  const local = input.local ?? makeStorage()
  const session = input.session ?? makeStorage()
  const matchMedia = (q: string) => ({ matches: q.includes('reduce') ? !!input.systemReduced : false })
  // The script references document / localStorage / sessionStorage /
  // matchMedia as free globals — bind them as parameters of the same names.
  new Function('document', 'localStorage', 'sessionStorage', 'matchMedia', PREPAINT_SCRIPT)(
    doc,
    local,
    session,
    matchMedia
  )
  return root
}

const g = globalThis as {
  document?: unknown
  localStorage?: unknown
}

afterEach(() => {
  delete g.document
  delete g.localStorage
  useSignalStore.getState().setEdition(null)
})

/* ---------------------------------------------------------------- prepaint */

describe('pre-paint script (V3_SPEC §2.1)', () => {
  it('is built from the shared constants and stays within budget', () => {
    expect(EDITION_STORAGE_KEY).toBe('signal.edition')
    expect(INTRO_SESSION_KEY).toBe('signal.intro')
    expect(PICK_ATTR).toBe('data-pick')
    expect(EDITION_ATTR).toBe('data-edition')
    expect(INTRO_ATTR).toBe('data-intro')
    expect(PREPAINT_SCRIPT).toContain(`'${EDITION_STORAGE_KEY}'`)
    expect(PREPAINT_SCRIPT).toContain(`'${INTRO_SESSION_KEY}'`)
    expect(PREPAINT_SCRIPT).toContain(`'${MOTION_STORAGE_KEY}'`)
    expect(PREPAINT_SCRIPT).toContain(`'${PICK_ATTR}'`)
    expect(PREPAINT_SCRIPT).toContain(`'${INTRO_ATTR}'`)
    expect(PREPAINT_SCRIPT).not.toMatch(/data-theme|signal\.theme|data-boot|signal\.boot/)
    // "stays ≤ ~450 B" (§2.1) — 457 B as written; a jump past this needs a look.
    expect(Buffer.byteLength(PREPAINT_SCRIPT, 'utf8')).toBeLessThanOrEqual(460)
  })

  it('sets data-pick (and screen) when nothing valid is stored', () => {
    for (const stored of [null, 'garbage', 'dark', 'light', '']) {
      const local = makeStorage(stored === null ? {} : { [EDITION_STORAGE_KEY]: stored })
      const root = runPrepaint({ local })
      expect(root.getAttribute(EDITION_ATTR), String(stored)).toBe('screen')
      expect(root.getAttribute(PICK_ATTR), String(stored)).toBe('1')
      expect(root.getAttribute(INTRO_ATTR), String(stored)).toBeNull()
    }
  })

  it('never sets data-pick when an edition is stored', () => {
    for (const stored of ['screen', 'print'] as const) {
      const root = runPrepaint({ local: makeStorage({ [EDITION_STORAGE_KEY]: stored }) })
      expect(root.getAttribute(EDITION_ATTR)).toBe(stored)
      expect(root.getAttribute(PICK_ATTR)).toBeNull()
    }
  })

  it('sets data-intro only for stored print + no session flag + full motion', () => {
    const print = { [EDITION_STORAGE_KEY]: 'print' }
    expect(runPrepaint({ local: makeStorage(print) }).getAttribute(INTRO_ATTR)).toBe('1')
    // session flag present
    expect(
      runPrepaint({
        local: makeStorage(print),
        session: makeStorage({ [INTRO_SESSION_KEY]: '1' }),
      }).getAttribute(INTRO_ATTR)
    ).toBeNull()
    // stored reduced motion
    expect(
      runPrepaint({
        local: makeStorage({ ...print, [MOTION_STORAGE_KEY]: 'reduced' }),
      }).getAttribute(INTRO_ATTR)
    ).toBeNull()
    // system reduced motion (no stored override)
    expect(
      runPrepaint({ local: makeStorage(print), systemReduced: true }).getAttribute(INTRO_ATTR)
    ).toBeNull()
    // stored 'full' beats the system preference
    expect(
      runPrepaint({
        local: makeStorage({ ...print, [MOTION_STORAGE_KEY]: 'full' }),
        systemReduced: true,
      }).getAttribute(INTRO_ATTR)
    ).toBe('1')
    // stored screen never gets the intro
    expect(
      runPrepaint({ local: makeStorage({ [EDITION_STORAGE_KEY]: 'screen' }) }).getAttribute(
        INTRO_ATTR
      )
    ).toBeNull()
    // first visit (nothing stored) never gets the intro — the picker starts it
    expect(runPrepaint({}).getAttribute(INTRO_ATTR)).toBeNull()
  })

  it('resolves data-motion exactly like v2 (stored wins, else system)', () => {
    expect(runPrepaint({}).getAttribute('data-motion')).toBe('full')
    expect(runPrepaint({ systemReduced: true }).getAttribute('data-motion')).toBe('reduced')
    expect(
      runPrepaint({
        local: makeStorage({ [MOTION_STORAGE_KEY]: 'reduced' }),
      }).getAttribute('data-motion')
    ).toBe('reduced')
    expect(
      runPrepaint({
        local: makeStorage({ [MOTION_STORAGE_KEY]: 'full' }),
        systemReduced: true,
      }).getAttribute('data-motion')
    ).toBe('full')
  })

  it('falls back to screen + picker + full motion when storage throws', () => {
    const root = runPrepaint({ local: makeStorage({}, { throws: true }) })
    expect(root.getAttribute(EDITION_ATTR)).toBe('screen')
    expect(root.getAttribute(PICK_ATTR)).toBe('1')
    expect(root.getAttribute('data-motion')).toBe('full')
    expect(root.getAttribute(INTRO_ATTR)).toBeNull()
  })

  it('agrees with resolvePrepaint() on every input combination (parity)', () => {
    const editions = [null, 'screen', 'print', 'garbage']
    const motions = [null, 'reduced', 'full']
    for (const storedEdition of editions) {
      for (const storedMotion of motions) {
        for (const systemReduced of [false, true]) {
          for (const introSeen of [false, true]) {
            const local = makeStorage({
              ...(storedEdition === null ? {} : { [EDITION_STORAGE_KEY]: storedEdition }),
              ...(storedMotion === null ? {} : { [MOTION_STORAGE_KEY]: storedMotion }),
            })
            const session = makeStorage(introSeen ? { [INTRO_SESSION_KEY]: '1' } : {})
            const root = runPrepaint({ local, session, systemReduced })
            const expected = resolvePrepaint({
              storedEdition,
              storedMotion,
              systemReduced,
              introSeen,
            })
            const label = JSON.stringify({ storedEdition, storedMotion, systemReduced, introSeen })
            expect(root.getAttribute(EDITION_ATTR), label).toBe(expected.edition)
            expect(root.getAttribute(PICK_ATTR) === '1', label).toBe(expected.pick)
            expect(root.getAttribute('data-motion'), label).toBe(expected.motion)
            expect(root.getAttribute(INTRO_ATTR) === '1', label).toBe(expected.intro)
          }
        }
      }
    }
  })
})

/* ----------------------------------------------------------- edition API */

describe('edition API (V3_SPEC §2.1 / §2.4)', () => {
  function installDom(edition?: Edition, opts: { vt?: boolean; local?: ReturnType<typeof makeStorage> } = {}) {
    const root = makeRoot()
    if (edition) root.setAttribute(EDITION_ATTR, edition)
    const meta = makeMeta()
    const doc: Record<string, unknown> = {
      documentElement: root,
      querySelectorAll: (sel: string) => (sel.includes('theme-color') ? [meta] : []),
    }
    if (opts.vt) {
      doc.startViewTransition = vi.fn((cb: () => void) => {
        cb()
        return { finished: Promise.resolve() }
      })
    }
    g.document = doc
    g.localStorage = opts.local ?? makeStorage()
    return { root, meta, doc }
  }

  it('getCurrentEdition() is screen on the server and reads the attribute in the DOM', () => {
    expect(getCurrentEdition()).toBe('screen')
    installDom('print')
    expect(getCurrentEdition()).toBe('print')
    installDom('screen')
    expect(getCurrentEdition()).toBe('screen')
    installDom()
    expect(getCurrentEdition()).toBe('screen')
    expect(otherEdition('screen')).toBe('print')
    expect(otherEdition('print')).toBe('screen')
  })

  it('applyEdition() sets the attribute, persists, mirrors the store and syncs theme-color', () => {
    const local = makeStorage()
    const { root, meta } = installDom('screen', { local })
    applyEdition('print', 'picker')
    expect(root.getAttribute(EDITION_ATTR)).toBe('print')
    expect(local.map.get(EDITION_STORAGE_KEY)).toBe('print')
    expect(useSignalStore.getState().edition).toBe('print')
    expect(meta.content).toBe(EDITION_THEME_COLOR.print)
    applyEdition('screen', 'toggle')
    expect(root.getAttribute(EDITION_ATTR)).toBe('screen')
    expect(local.map.get(EDITION_STORAGE_KEY)).toBe('screen')
    expect(meta.content).toBe(EDITION_THEME_COLOR.screen)
  })

  it('applyEdition() survives blocked storage (attribute still applies)', () => {
    const { root } = installDom('screen', { local: makeStorage({}, { throws: true }) })
    expect(() => applyEdition('print', 'terminal')).not.toThrow()
    expect(root.getAttribute(EDITION_ATTR)).toBe('print')
  })

  it('switchEdition() is a no-op on the server and when already in force', async () => {
    await expect(switchEdition('print')).resolves.toBeUndefined()
    const local = makeStorage()
    const { root } = installDom('print', { vt: true, local })
    await switchEdition('print')
    expect(local.map.has(EDITION_STORAGE_KEY)).toBe(false)
    expect(root.hasAttribute(EDITION_SWITCH_ATTR)).toBe(false)
  })

  it('switchEdition() applies instantly without startViewTransition', async () => {
    const local = makeStorage()
    const { root } = installDom('screen', { local })
    await switchEdition('print', { via: 'palette' })
    expect(root.getAttribute(EDITION_ATTR)).toBe('print')
    expect(local.map.get(EDITION_STORAGE_KEY)).toBe('print')
    expect(root.hasAttribute(EDITION_SWITCH_ATTR)).toBe(false)
  })

  it('switchEdition() runs the press / projector transition and clears the attribute on finished', async () => {
    const { root, doc } = installDom('screen', { vt: true })
    let attrDuring: string | null = null
    let xDuring = ''
    let yDuring = ''
    ;(doc.startViewTransition as ReturnType<typeof vi.fn>).mockImplementation((cb: () => void) => {
      attrDuring = root.getAttribute(EDITION_SWITCH_ATTR)
      xDuring = root.style.getPropertyValue(SWITCH_ORIGIN_X_VAR)
      yDuring = root.style.getPropertyValue(SWITCH_ORIGIN_Y_VAR)
      cb()
      return { finished: Promise.resolve() }
    })
    const origin = {
      getBoundingClientRect: () => ({ left: 1000, top: 10, width: 80, height: 28 }),
    } as unknown as Element
    await switchEdition('print', { originEl: origin })
    expect(attrDuring).toBe('press')
    // the dot-wave origin is seeded for the life of the transition (the pressed pill's centre) …
    expect(xDuring).toBe('1040px')
    expect(yDuring).toBe('24px')
    expect(root.getAttribute(EDITION_ATTR)).toBe('print')
    expect(root.hasAttribute(EDITION_SWITCH_ATTR)).toBe(false)
    // … and cleared with the attribute, so no inline style lingers on <html>.
    expect(root.style.getPropertyValue(SWITCH_ORIGIN_X_VAR)).toBe('')
    expect(root.style.getPropertyValue(SWITCH_ORIGIN_Y_VAR)).toBe('')

    await switchEdition('screen')
    expect(attrDuring).toBe('projector')
    expect(root.getAttribute(EDITION_ATTR)).toBe('screen')
    expect(root.hasAttribute(EDITION_SWITCH_ATTR)).toBe(false)
    // no origin → the corner fallback during the transition, cleared after it
    expect(xDuring).toBe('calc(100% - 72px)')
    expect(root.style.getPropertyValue(SWITCH_ORIGIN_X_VAR)).toBe('')
  })

  it('switchEdition() still settles the attribute when the transition is skipped', async () => {
    const { root, doc } = installDom('print', { vt: true })
    ;(doc.startViewTransition as ReturnType<typeof vi.fn>).mockImplementation((cb: () => void) => {
      cb()
      return { finished: Promise.reject(new Error('skipped')) }
    })
    await switchEdition('screen')
    expect(root.getAttribute(EDITION_ATTR)).toBe('screen')
    expect(root.hasAttribute(EDITION_SWITCH_ATTR)).toBe(false)
  })

  it('switchEdition() falls back to an instant switch when startViewTransition throws', async () => {
    const { root, doc } = installDom('screen', { vt: true })
    ;(doc.startViewTransition as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('not now')
    })
    await switchEdition('print')
    expect(root.getAttribute(EDITION_ATTR)).toBe('print')
    expect(root.hasAttribute(EDITION_SWITCH_ATTR)).toBe(false)
  })

  it('requestEditionPick() sets data-pick for the picker island', () => {
    const { root } = installDom('screen')
    requestEditionPick()
    expect(root.getAttribute(PICK_ATTR)).toBe('1')
  })

  it("ctx.setEdition('toggle') flips the edition through switchEdition", async () => {
    const { root } = installDom('screen', { vt: true })
    const ctx = createCommandCtx({ push: vi.fn() })
    await ctx.setEdition('toggle')
    expect(root.getAttribute(EDITION_ATTR)).toBe('print')
    await ctx.setEdition('toggle', 'terminal')
    expect(root.getAttribute(EDITION_ATTR)).toBe('screen')
    await ctx.setEdition('print')
    expect(root.getAttribute(EDITION_ATTR)).toBe('print')
  })
})
