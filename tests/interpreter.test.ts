import { describe, expect, it, vi } from 'vitest'
import {
  BANNER,
  complete,
  execute,
  helpLines,
  resumeLines,
  whoamiLines,
  type TermLine,
  type TerminalIO,
} from '@/components/contact/Terminal/interpreter'
import type { CommandCtx } from '@/lib/commands/context'
import { profile } from '@/lib/data/profile'
import { projectSlugs } from '@/lib/data/projects'

function makeCtx(): CommandCtx {
  return {
    scrollTo: vi.fn(),
    router: { push: vi.fn() },
    copy: vi.fn(async () => true),
    download: vi.fn(),
    setTheme: vi.fn(),
    setMotion: vi.fn(),
    focusSkill: vi.fn(),
    openProject: vi.fn(),
    track: vi.fn(),
  }
}

function makeIO(): TerminalIO & { lines: TermLine[]; cleared: boolean; snake: boolean; exited: boolean } {
  const io = {
    lines: [] as TermLine[],
    cleared: false,
    snake: false,
    exited: false,
    print(newLines: readonly TermLine[]) {
      io.lines.push(...newLines)
    },
    clear() {
      io.cleared = true
    },
    startSnake() {
      io.snake = true
    },
    exit() {
      io.exited = true
    },
  }
  return io
}

describe('terminal interpreter', () => {
  it('exports the banner', () => {
    expect(BANNER).toBe("SIGNAL v1.0 — type 'help'")
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

  it('theme and motion builtins call ctx', async () => {
    const ctx = makeCtx()
    const io = makeIO()
    await execute('theme dark', ctx, io)
    expect(ctx.setTheme).toHaveBeenCalledWith('dark')
    await execute('motion off', ctx, io)
    expect(ctx.setMotion).toHaveBeenCalledWith(true)
    await execute('motion on', ctx, io)
    expect(ctx.setMotion).toHaveBeenCalledWith(false)
    await execute('theme purple', ctx, io)
    expect(io.lines.some((l) => l.text === 'usage: theme dark|light')).toBe(true)
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
      'theme dark|light',
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
    expect(complete('theme d')).toEqual({ value: 'theme dark' })
    const ambiguous = complete('h')
    expect(ambiguous.options).toContain('help')
    expect(ambiguous.options).toContain('history')
    expect(complete('')).toEqual({})
  })
})
