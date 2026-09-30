import { describe, expect, it, vi } from 'vitest'
import {
  BANNER,
  FACE_ALT,
  complete,
  execute,
  faceLines,
  helpLines,
  resumeLines,
  whoamiLines,
  type TermLine,
  type TerminalIO,
} from '@/components/contact/Terminal/interpreter'
import type { CommandCtx } from '@/lib/commands/context'
import { PHOTO_ASCII } from '@/lib/data/photoAscii'
import { profile } from '@/lib/data/profile'
import { projectSlugs } from '@/lib/data/projects'
import { useSignalStore } from '@/lib/state/store'

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

function makeIO(): TerminalIO & {
  lines: TermLine[]
  cleared: boolean
  snake: boolean
  snakeOpts: { autopilot?: boolean } | undefined
  exited: boolean
} {
  const io = {
    lines: [] as TermLine[],
    cleared: false,
    snake: false,
    snakeOpts: undefined as { autopilot?: boolean } | undefined,
    exited: false,
    print(newLines: readonly TermLine[]) {
      io.lines.push(...newLines)
    },
    clear() {
      io.cleared = true
    },
    startSnake(opts?: { autopilot?: boolean }) {
      io.snake = true
      io.snakeOpts = opts
    },
    exit() {
      io.exited = true
    },
  }
  return io
}

describe('terminal interpreter', () => {
  it('exports the banner', () => {
    expect(BANNER).toBe("Darshan Konnur — type 'help'")
  })

  it('unknown command prints the error line in error tone', async () => {
    const io = makeIO()
    await execute('frobnicate now', makeCtx(), io)
    expect(io.lines).toHaveLength(1)
    expect(io.lines[0].text).toBe("command not found: frobnicate — try 'help'")
    expect(io.lines[0].tone).toBe('error')
  })

  it('whoami prints exactly 4 lines from profile data', async () => {
    const io = makeIO()
    await execute('whoami', makeCtx(), io)
    expect(io.lines).toHaveLength(4)
    expect(io.lines.map((l) => l.text)).toEqual([
      profile.name,
      profile.terminal.whoamiRole,
      profile.location,
      profile.terminal.whoamiEducation,
    ])
    expect(whoamiLines()).toHaveLength(4)
  })

  it('ls projects lists every project slug', async () => {
    const io = makeIO()
    await execute('ls projects', makeCtx(), io)
    expect(io.lines.map((l) => l.text)).toEqual(projectSlugs.map((s) => `${s}/`))
  })

  it('cat resume.txt streams exactly 12 lines of real data', async () => {
    const io = makeIO()
    await execute('cat resume.txt', makeCtx(), io)
    expect(io.lines).toHaveLength(12)
    expect(resumeLines()).toHaveLength(12)
    expect(io.lines[0].text).toContain(profile.name)
    expect(io.lines.some((l) => l.text.includes(profile.publication.title))).toBe(true)
  })

  it('email copies the address through the registry and confirms', async () => {
    const ctx = makeCtx()
    const io = makeIO()
    await execute('email', ctx, io)
    expect(ctx.copy).toHaveBeenCalledWith(profile.email)
    expect(io.lines[0].text).toBe(`copied ${profile.email} ✓`)
  })

  it('cv navigates to /cv through the registry', async () => {
    const ctx = makeCtx()
    const io = makeIO()
    await execute('cv', ctx, io)
    expect(ctx.router.push).toHaveBeenCalledWith('/cv')
  })

  it('open <slug> opens the project window', async () => {
    const ctx = makeCtx()
    const io = makeIO()
    await execute('open triplay-ai', ctx, io)
    expect(ctx.openProject).toHaveBeenCalledWith('triplay-ai')
    expect(io.lines[0].text).toBe('opening triplay-ai…')
  })

  it('open with a bad slug errors without touching ctx', async () => {
    const ctx = makeCtx()
    const io = makeIO()
    await execute('open nonsense', ctx, io)
    expect(ctx.openProject).not.toHaveBeenCalled()
    expect(io.lines[0].tone).toBe('error')
  })

  it('open resume downloads the PDF', async () => {
    const ctx = makeCtx()
    const io = makeIO()
    await execute('open resume', ctx, io)
    expect(ctx.download).toHaveBeenCalledWith(profile.resumePdf, 'darshan-konnur.pdf')
  })

  it('edition and motion builtins call ctx', async () => {
    const ctx = makeCtx()
    const io = makeIO()
    await execute('edition print', ctx, io)
    expect(ctx.setEdition).toHaveBeenCalledWith('print', 'terminal')
    expect(io.lines[0].text).toBe('switching to the PRINT edition…')
    await execute('motion off', ctx, io)
    expect(ctx.setMotion).toHaveBeenCalledWith(true)
    await execute('motion on', ctx, io)
    expect(ctx.setMotion).toHaveBeenCalledWith(false)
    await execute('edition purple', ctx, io)
    expect(io.lines.some((l) => l.text === 'usage: edition screen|print')).toBe(true)
  })

  it('edition <current> reports instead of switching', async () => {
    const ctx = makeCtx()
    const io = makeIO()
    await execute('edition screen', ctx, io)
    expect(ctx.setEdition).not.toHaveBeenCalled()
    expect(io.lines[0]).toEqual({ text: 'already reading the SCREEN edition', tone: 'secondary' })
  })

  it('sudo hire darshan answers already-hired and opens the inbox', async () => {
    const io = makeIO()
    await execute('sudo hire darshan', makeCtx(), io)
    expect(io.lines[0].text).toBe(profile.terminal.sudoHire)
    expect(io.lines[1].text).toBe(profile.email)
  })

  it('clear / snake / exit route to io', async () => {
    const ctx = makeCtx()
    const io = makeIO()
    await execute('clear', ctx, io)
    await execute('snake', ctx, io)
    await execute('exit', ctx, io)
    expect(io.cleared).toBe(true)
    expect(io.snake).toBe(true)
    expect(io.exited).toBe(true)
  })

  it('history prints the given history', async () => {
    const io = makeIO()
    await execute('history', makeCtx(), io, ['help', 'whoami'])
    expect(io.lines).toHaveLength(2)
    expect(io.lines[0].text).toContain('help')
  })

  /* ---------------------------------------------------------- v2 §11 pack */

  it('whoami --face streams 32 aria-hidden art rows, last 3 in signal', async () => {
    const io = makeIO()
    await execute('whoami --face', makeCtx(), io)
    expect(io.lines).toHaveLength(PHOTO_ASCII.length + 1) // 32 art + the sr-only alt (v3: no trailer)
    const art = io.lines.slice(0, PHOTO_ASCII.length)
    expect(art.map((l) => l.text)).toEqual([...PHOTO_ASCII])
    expect(art.every((l) => l.ariaHidden === true)).toBe(true)
    expect(art.slice(0, -3).every((l) => l.tone === 'secondary')).toBe(true)
    expect(art.slice(-3).every((l) => l.tone === 'signal')).toBe(true)
  })

  it('whoami --face announces one sr-only sentence and nothing after the portrait (v3)', async () => {
    const io = makeIO()
    await execute('whoami --face', makeCtx(), io)
    const alt = io.lines[PHOTO_ASCII.length]
    expect(alt).toEqual({ text: FACE_ALT, srOnly: true })
    // v3: no "render complete … ./about.md" trailer — the frames end on the readout.
    expect(faceLines()).toHaveLength(PHOTO_ASCII.length + 1)
    expect(faceLines().some((l) => /render|\.md\b|\d+px/.test(l.text))).toBe(false)
  })

  it('cat darshan.jpg is an exact alias for whoami --face', async () => {
    const a = makeIO()
    const b = makeIO()
    await execute('cat darshan.jpg', makeCtx(), a)
    await execute('whoami --face', makeCtx(), b)
    expect(a.lines).toEqual(b.lines)
  })

  it('whoami with an unknown option errors', async () => {
    const io = makeIO()
    await execute('whoami --hands', makeCtx(), io)
    expect(io.lines[0].tone).toBe('error')
    expect(io.lines[0].text).toContain('--face')
  })

  it('edition with no arg reports the edition in force and how to switch', async () => {
    const ctx = makeCtx()
    const io = makeIO()
    await execute('edition', ctx, io)
    expect(io.lines[0].text).toBe("reading the SCREEN edition — 'edition print' to switch")
    expect(io.lines[0].tone).toBe('secondary')
    expect(ctx.setEdition).not.toHaveBeenCalled()
    const g = globalThis as { document?: unknown }
    g.document = { documentElement: { dataset: { edition: 'print' } } }
    try {
      const io2 = makeIO()
      await execute('edition', makeCtx(), io2)
      expect(io2.lines[0].text).toBe("reading the PRINT edition — 'edition screen' to switch")
    } finally {
      delete g.document
    }
  })

  it('the theme builtin is gone (not aliased)', async () => {
    const io = makeIO()
    await execute('theme dark', makeCtx(), io)
    expect(io.lines[0].tone).toBe('error')
    expect(io.lines[0].text).toContain('command not found: theme')
    expect(complete('them')).toEqual({})
  })

  it('snake parses --autopilot into the startSnake options', async () => {
    const plain = makeIO()
    await execute('snake', makeCtx(), plain)
    expect(plain.snakeOpts).toEqual({ autopilot: false })
    const auto = makeIO()
    await execute('snake --autopilot', makeCtx(), auto)
    expect(auto.snakeOpts).toEqual({ autopilot: true })
  })

  it('deploy prints the bridge line and runs the deploy-all command', async () => {
    const ctx = makeCtx()
    const io = makeIO()
    await execute('deploy', ctx, io)
    expect(io.lines[0].text).toBe('deploying — see skills.json ↑')
    expect(ctx.scrollTo).toHaveBeenCalledWith('#skills')
    const io2 = makeIO()
    await execute('deploy --all', makeCtx(), io2)
    expect(io2.lines[0].text).toBe('deploying — see skills.json ↑')
  })

  it('demo prints the start line (motion not reduced)', async () => {
    const io = makeIO()
    await execute('demo', makeCtx(), io)
    expect(io.lines).toHaveLength(1)
    expect(io.lines[0].text).toBe('starting the demo — any key hands control back')
  })

  it('demo refuses under reduced motion', async () => {
    const g = globalThis as { document?: unknown }
    g.document = { documentElement: { dataset: { motion: 'reduced' } } }
    try {
      const io = makeIO()
      await execute('demo', makeCtx(), io)
      expect(io.lines[0].text).toBe('demo needs animation — motion is set to reduced')
      expect(io.lines[0].tone).toBe('secondary')
    } finally {
      delete g.document
    }
  })

  it('arcade prints and navigates to /arcade', async () => {
    const ctx = makeCtx()
    const io = makeIO()
    await execute('arcade', ctx, io)
    expect(io.lines[0].text).toBe('navigating to /arcade…')
    expect(ctx.router.push).toHaveBeenCalledWith('/arcade')
  })

  it('view source prints the annotation line and runs source-mode', async () => {
    const ctx = makeCtx()
    const io = makeIO()
    await execute('view source', ctx, io)
    expect(io.lines[0].text).toBe('source mode: on — annotating this page for 6s')
    expect(ctx.track).toHaveBeenCalledWith('source_mode')
    const bad = makeIO()
    await execute('view sauce', makeCtx(), bad)
    expect(bad.lines[0].tone).toBe('error')
  })

  it('crt on|off drives the store flag and prints the exact lines', async () => {
    const io = makeIO()
    try {
      await execute('crt on', makeCtx(), io)
      expect(useSignalStore.getState().crtEnabled).toBe(true)
      expect(io.lines[0]).toEqual({
        text: 'CRT MODE UNLOCKED — phosphor burn-in not covered by warranty',
        tone: 'signal',
      })
      await execute('crt off', makeCtx(), io)
      expect(useSignalStore.getState().crtEnabled).toBe(false)
      expect(io.lines[1]).toEqual({ text: 'crt off — flat glass restored', tone: 'secondary' })
      await execute('crt', makeCtx(), io)
      expect(io.lines[2].text).toBe('usage: crt on|off')
    } finally {
      useSignalStore.getState().setCrtEnabled(false)
    }
  })

  it('help lists every v2 command', () => {
    const text = helpLines()
      .map((l) => l.text)
      .join('\n')
    for (const cmd of [
      'snake --autopilot',
      'whoami --face',
      'deploy',
      'demo',
      'arcade',
      'crt on|off',
      'view source',
    ]) {
      expect(text).toContain(cmd)
    }
  })

  it('tab completion covers the v2 additions', () => {
    expect(complete('whoami -')).toEqual({ value: 'whoami --face' })
    expect(complete('cat d')).toEqual({ value: 'cat darshan.jpg' })
    expect(complete('snake -')).toEqual({ value: 'snake --autopilot' })
    expect(complete('view s')).toEqual({ value: 'view source' })
    expect(complete('crt on')).toEqual({ value: 'crt on' })
    const crt = complete('crt o')
    expect(crt.options).toEqual(['on', 'off'])
    const de = complete('de')
    expect(de.options).toContain('deploy')
    expect(de.options).toContain('demo')
    expect(complete('arc')).toEqual({ value: 'arcade' })
  })

  it('help lists every §4.8 command', () => {
    const text = helpLines()
      .map((l) => l.text)
      .join('\n')
    for (const cmd of [
      'help',
      'whoami',
      'ls projects',
      'open <slug>',
      'cat resume.txt',
      'open resume',
      'email',
      'cv',
      'edition screen|print',
      'motion off|on',
      'sudo hire darshan',
      'snake',
      'clear',
      'history',
      'exit',
    ]) {
      expect(text).toContain(cmd)
    }
  })

  it('tab completion resolves commands and slugs', () => {
    expect(complete('he')).toEqual({ value: 'help' })
    expect(complete('open tri')).toEqual({ value: 'open triplay-ai' })
    expect(complete('cat r')).toEqual({ value: 'cat resume.txt' })
    expect(complete('sudo h')).toEqual({ value: 'sudo hire darshan' })
    expect(complete('edition p')).toEqual({ value: 'edition print' })
    expect(complete('edition ')).toEqual({ options: ['screen', 'print'] })
    const ambiguous = complete('h')
    expect(ambiguous.options).toContain('help')
    expect(ambiguous.options).toContain('history')
    expect(complete('')).toEqual({})
  })
})
