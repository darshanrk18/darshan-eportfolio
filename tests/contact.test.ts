/**
 * C4 — Contact contracts (V3_SPEC §3 Contact, §2.6 item 8, director call
 * (e)): every suggestion resolves in the interpreter, the console's guide
 * event fires on `whoami` in any form, the face ramp groups the art rows,
 * and the visible copy passes the clutter sweep.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { execute, GUIDE_TRIED_EVENT, type TermLine } from '@/components/contact/Terminal/interpreter'
import { AUTO_COMMAND, SUGGESTIONS, suggestionFor } from '@/components/contact/Terminal/suggestions'
import { rampRuns, splitAtDash } from '@/components/contact/Terminal/FaceBlock'
import { groupFaceBatch } from '@/components/contact/Terminal/faceBatch'
import { contactCopy, writeHref } from '@/components/contact/copy'
import { profile } from '@/lib/data/profile'
import type { CommandCtx } from '@/lib/commands/context'

const BANNED = /ascii|halftone|\.md\b|\.json\b|\.webp\b|\.sh\b|\.pdf\b|fps|\bgz\b|\bSHA\b|whoami|sudo|--face|--autopilot/i

function makeCtx(): CommandCtx {
  return {
    scrollTo: vi.fn(),
    router: { push: vi.fn() },
    copy: vi.fn(async () => true),
    download: vi.fn(),
    setEdition: vi.fn(async () => {}),
    setMotion: vi.fn(),
    focusSkill: vi.fn(),
    openProject: vi.fn(),
    track: vi.fn(),
  }
}

function makeIO() {
  const lines: TermLine[] = []
  let snakeOpts: { autopilot?: boolean } | undefined
  return {
    lines,
    get snakeOpts() {
      return snakeOpts
    },
    print: (l: readonly TermLine[]) => lines.push(...l),
    clear: () => lines.splice(0),
    startSnake: (o?: { autopilot?: boolean }) => {
      snakeOpts = o ?? {}
    },
    exit: vi.fn(),
  }
}

afterEach(() => {
  // @ts-expect-error — the tests fake a minimal window when they need one
  delete globalThis.window
})

describe('the suggestion rail', () => {
  it('every suggestion runs a real command without "command not found"', async () => {
    for (const s of SUGGESTIONS) {
      const io = makeIO()
      await execute(s.command, makeCtx(), io)
      const notFound = io.lines.some((l) => l.text.startsWith('command not found'))
      expect(notFound, s.command).toBe(false)
      expect(io.lines.length > 0 || io.snakeOpts !== undefined, s.command).toBe(true)
    }
  })

  it('labels are visitor language in both editions (no command syntax)', () => {
    for (const s of SUGGESTIONS) {
      expect(s.label.screen).not.toMatch(BANNED)
      expect(s.label.print).not.toMatch(BANNED)
    }
    expect(SUGGESTIONS.filter((s) => !s.screenOnly)).toHaveLength(3)
    expect(suggestionFor(AUTO_COMMAND)?.id).toBe('who')
    expect(suggestionFor('WHOAMI --FACE ')?.id).toBe('who')
  })

  it('"Try to hire me" keeps the sudoHire answer — never "open to work"', async () => {
    const io = makeIO()
    await execute('sudo hire darshan', makeCtx(), io)
    expect(io.lines[0].text).toBe(profile.terminal.sudoHire)
    expect(io.lines.map((l) => l.text).join(' ')).not.toMatch(/open to work/i)
  })
})

describe('the guide event on whoami (§2.6 item 8)', () => {
  it('dispatches signal:guide-tried { id: ask-console } for whoami and whoami --face', async () => {
    const dispatched: string[] = []
    // @ts-expect-error — minimal window fake
    globalThis.window = {
      dispatchEvent: (e: Event) => {
        dispatched.push((e as CustomEvent<{ id: string }>).detail.id)
        return true
      },
    }
    // @ts-expect-error — CustomEvent is a node global from 19+, kept explicit
    globalThis.CustomEvent ??= class extends Event {
      detail: unknown
      constructor(type: string, init?: { detail?: unknown }) {
        super(type)
        this.detail = init?.detail
      }
    }
    await execute('whoami', makeCtx(), makeIO())
    await execute('whoami --face', makeCtx(), makeIO())
    await execute('help', makeCtx(), makeIO())
    expect(GUIDE_TRIED_EVENT).toBe('signal:guide-tried')
    expect(dispatched).toEqual(['ask-console', 'ask-console'])
  })

  it('is silent when there is no window (node)', async () => {
    await expect(execute('whoami', makeCtx(), makeIO())).resolves.toBeUndefined()
  })
})

describe('the face batch keeps log order', () => {
  it('places the portrait where its first row was — after the echoed prompt', () => {
    const batch: TermLine[] = [
      { text: 'guest@darshan:~$ whoami --face', tone: 'secondary' },
      { text: '  ..::', ariaHidden: true, tone: 'secondary' },
      { text: '  ::##', ariaHidden: true, tone: 'signal' },
      { text: 'portrait', srOnly: true },
      { text: 'done', link: { label: 'done', anchor: '#about' } },
    ]
    const out = groupFaceBatch(batch)
    expect(out.map((l) => (l.face ? 'FACE' : l.text))).toEqual([
      'guest@darshan:~$ whoami --face',
      'FACE',
      'portrait',
      'done',
    ])
    expect(out[1].face).toEqual(['  ..::', '  ::##'])
  })

  it('passes an ordinary batch through untouched', () => {
    const batch: TermLine[] = [{ text: 'a' }, { text: 'b', ariaHidden: true }]
    expect(groupFaceBatch(batch)).toEqual(batch)
  })
})

describe('the face renderer helpers', () => {
  it('groups a row into ramp runs by glyph step', () => {
    expect(rampRuns('  ..:-=+*#%@')).toEqual([
      { step: 0, text: '  ' },
      { step: 1, text: '..' },
      { step: 2, text: ':' },
      { step: 3, text: '-' },
      { step: 4, text: '=' },
      { step: 5, text: '+' },
      { step: 6, text: '*' },
      { step: 7, text: '#' },
      { step: 8, text: '%' },
      { step: 9, text: '@' },
    ])
    expect(rampRuns('')).toEqual([])
  })

  it('wraps the role line at its em dash (one data string, two lines)', () => {
    expect(splitAtDash(profile.terminal.whoamiRole)).toEqual([
      'software engineer —',
      'incoming SDE @ AWS (Jan 2027)',
    ])
    expect(splitAtDash('no dash')).toEqual(['no dash'])
  })
})

describe('contact copy', () => {
  it('the primary mailto carries the chosen subject, encoded', () => {
    expect(writeHref()).toBe(`mailto:${profile.email}`)
    expect(writeHref('A role')).toBe(`mailto:${profile.email}?subject=A%20role`)
  })

  it('visible labels pass the clutter sweep (the console title is "Console")', () => {
    expect(contactCopy.screen.consoleTitle).toBe('Console')
    const strings: string[] = [
      ...contactCopy.screen.headline,
      contactCopy.screen.write,
      contactCopy.screen.railLabel,
      contactCopy.print.title,
      contactCopy.print.lede,
      contactCopy.print.write,
      contactCopy.print.railLabel,
      contactCopy.print.consoleCaption,
      contactCopy.print.colophonLine,
      contactCopy.print.toBeContinued,
      contactCopy.shared.resume,
      ...contactCopy.print.subjects.map((s) => s.label),
    ]
    for (const s of strings) expect(s).not.toMatch(BANNED)
    expect(contactCopy.shared.faceAlt.print).toBe(profile.displayName)
  })
})
