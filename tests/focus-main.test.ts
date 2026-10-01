/**
 * lib/utils/focusMain — where focus lands when the edition picker or the
 * intro closes (chrome-375:F9: it used to fall to <body>). vitest runs in
 * node: a fake document with a fake <main>.
 */

import { afterEach, describe, expect, it } from 'vitest'
import { MAIN_LANDMARK_ID, focusMain } from '@/lib/utils/focusMain'

type Listener = () => void

function makeDom(opts: { tabindex?: string } = {}) {
  const attrs = new Map<string, string>()
  if (opts.tabindex !== undefined) attrs.set('tabindex', opts.tabindex)
  const mainListeners = new Map<string, Set<Listener>>()
  const docListeners = new Map<string, Set<Listener>>()
  const on = (map: Map<string, Set<Listener>>, type: string, fn: Listener) => {
    if (!map.has(type)) map.set(type, new Set())
    map.get(type)!.add(fn)
  }
  const fire = (map: Map<string, Set<Listener>>, type: string) => {
    for (const fn of [...(map.get(type) ?? [])]) fn()
  }
  const body = { tagName: 'BODY' }
  const focusCalls: unknown[] = []
  const doc = {
    body,
    activeElement: body as unknown,
    getElementById: (id: string) => (id === MAIN_LANDMARK_ID ? main : null),
    addEventListener: (type: string, fn: Listener) => on(docListeners, type, fn),
    removeEventListener: (type: string, fn: Listener) => docListeners.get(type)?.delete(fn),
  }
  const main = {
    tagName: 'MAIN',
    hasAttribute: (n: string) => attrs.has(n),
    getAttribute: (n: string) => attrs.get(n) ?? null,
    setAttribute: (n: string, v: string) => void attrs.set(n, v),
    removeAttribute: (n: string) => void attrs.delete(n),
    addEventListener: (type: string, fn: Listener) => on(mainListeners, type, fn),
    removeEventListener: (type: string, fn: Listener) => mainListeners.get(type)?.delete(fn),
    focus: (o: unknown) => {
      focusCalls.push(o)
      if (attrs.has('tabindex')) doc.activeElement = main
    },
  }
  ;(globalThis as { document?: unknown }).document = doc
  return {
    doc,
    main,
    focusCalls,
    /** focus moves to another element (Tab) */
    moveFocusAway: () => {
      doc.activeElement = { tagName: 'A' }
      fire(mainListeners, 'blur')
    },
    /** the window loses focus: main is blurred but stays document.activeElement */
    windowBlur: () => fire(mainListeners, 'blur'),
    pointerdown: () => fire(docListeners, 'pointerdown'),
    listenerCount: () =>
      [...mainListeners.values(), ...docListeners.values()].reduce((n, s) => n + s.size, 0),
  }
}

afterEach(() => {
  delete (globalThis as { document?: unknown }).document
})

describe('focusMain()', () => {
  it('is a no-op on the server and without a main landmark', () => {
    expect(() => focusMain()).not.toThrow()
    ;(globalThis as { document?: unknown }).document = { getElementById: () => null }
    expect(() => focusMain()).not.toThrow()
  })

  it('focuses #main without scrolling, making it focusable for that landing only', () => {
    const dom = makeDom()
    focusMain()
    expect(dom.doc.activeElement).toBe(dom.main)
    expect(dom.focusCalls).toEqual([{ preventScroll: true }])
    expect(dom.main.getAttribute('tabindex')).toBe('-1')
  })

  it('drops tabindex once focus moves on (Tab), and cleans up its listeners', () => {
    const dom = makeDom()
    focusMain()
    dom.moveFocusAway()
    expect(dom.main.hasAttribute('tabindex')).toBe(false)
    expect(dom.listenerCount()).toBe(0)
  })

  it('drops tabindex on the next pointer press, so a click inside main never focuses it', () => {
    const dom = makeDom()
    focusMain()
    dom.pointerdown()
    expect(dom.main.hasAttribute('tabindex')).toBe(false)
    expect(dom.listenerCount()).toBe(0)
  })

  it('keeps it through a window blur (main still holds focus)', () => {
    const dom = makeDom()
    focusMain()
    dom.windowBlur()
    expect(dom.main.getAttribute('tabindex')).toBe('-1')
    dom.moveFocusAway()
    expect(dom.main.hasAttribute('tabindex')).toBe(false)
  })

  it('leaves a tabindex it did not add alone', () => {
    const dom = makeDom({ tabindex: '-1' })
    focusMain()
    expect(dom.doc.activeElement).toBe(dom.main)
    dom.moveFocusAway()
    dom.pointerdown()
    expect(dom.main.getAttribute('tabindex')).toBe('-1')
    expect(dom.listenerCount()).toBe(0)
  })
})
