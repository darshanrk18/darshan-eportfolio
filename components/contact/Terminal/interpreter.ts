/**
 * Terminal interpreter (spec §5.3 / §4.8) — hand-rolled, zero deps.
 * Pure command → output mapping so it is unit-testable: the UI supplies a
 * CommandCtx (shared registry action layer) and a TerminalIO sink.
 * Registry-backed commands ('email', 'cv', 'open resume', project slugs,
 * 'sudo hire darshan') resolve through lib/commands/registry findByAlias;
 * everything else here is a terminal-only builtin.
 */

import type { CommandCtx } from '@/lib/commands/context'
import { findByAlias, getCommand, type Command } from '@/lib/commands/registry'
import { profile } from '@/lib/data/profile'
import { projectSlugs, isProjectSlug } from '@/lib/data/projects'
import { skillGroups } from '@/lib/data/skills'
import { commits } from '@/lib/data/experience'

export type TermTone = 'default' | 'secondary' | 'error' | 'magenta' | 'signal'

export interface TermLine {
  text: string
  tone?: TermTone
}

/** Side-effect sink implemented by the Terminal UI. */
export interface TerminalIO {
  print(lines: readonly TermLine[]): void
  clear(): void
  startSnake(): void
  exit(): void
}

/** The 2-line window banner (§4.8) — also server-rendered in Contact.tsx. */
export const BANNER = "SIGNAL v1.0 — type 'help'"

const line = (text: string, tone?: TermTone): TermLine => (tone ? { text, tone } : { text })

/* ------------------------------------------------------------------------- */
/* Output builders (all copy derives from lib/data/*)                         */
/* ------------------------------------------------------------------------- */

export function helpLines(): TermLine[] {
  return [
    line('navigate', 'secondary'),
    line('  cv                 open the recruiter cut at /cv'),
    line('  open <slug>        jump to a project window'),
    line('info', 'secondary'),
    line('  help               this list'),
    line('  whoami             who is this'),
    line('  ls projects        list project slugs'),
    line('  cat resume.txt     print a 12-line resume summary'),
    line('actions', 'secondary'),
    line(`  email              copy ${profile.email}`),
    line('  open resume        download the resume PDF'),
    line('  theme dark|light   switch theme'),
    line('  motion off|on      disable or enable animation'),
    line('fun', 'secondary'),
    line('  sudo hire darshan  draft the offer email'),
    line('  snake              play snake — arrows/wasd move, q quits'),
    line('session', 'secondary'),
    line('  clear · history · exit'),
  ]
}

export function whoamiLines(): TermLine[] {
  return [
    line(profile.name),
    line(profile.terminal.whoamiRole, 'secondary'),
    line(profile.location),
    line(profile.terminal.whoamiEducation, 'signal'),
  ]
}

export function lsProjectsLines(): TermLine[] {
  return projectSlugs.map((slug) => line(`${slug}/`))
}

/** Exactly 12 plain-text lines, generated from lib/data/* (§4.8). */
export function resumeLines(): TermLine[] {
  const { education, publication } = profile
  const awsMeta = commits.find((c) => c.id === 'aws-intern')?.meta ?? ''
  const schneiderMeta = commits.find((c) => c.id === 'schneider')?.meta ?? ''
  return [
    line(`${profile.name} — ${profile.role} · ${profile.status}`),
    line(`${profile.location} · ${profile.email}`),
    line(`${education.school} — ${education.degree} — ${education.period}`),
    line(awsMeta),
    line(schneiderMeta),
    line(`${publication.venue} — ${publication.title}`),
    ...skillGroups.map((g) => line(`${g.label}: ${g.items.join(', ')}`)),
  ]
}

function historyLines(history: readonly string[]): TermLine[] {
  if (history.length === 0) return [line('history is empty', 'secondary')]
  return history.map((h, i) => line(`  ${String(i + 1).padStart(3, ' ')}  ${h}`))
}

function notFound(token: string): TermLine {
  return line(`command not found: ${token} — try 'help'`, 'error')
}

/* ------------------------------------------------------------------------- */
/* Registry bridge                                                            */
/* ------------------------------------------------------------------------- */

async function runRegistry(cmd: Command, ctx: CommandCtx, io: TerminalIO): Promise<void> {
  if (cmd.id === 'copy-email') {
    await cmd.run(ctx)
    io.print([line(`copied ${profile.email} ✓`, 'signal')])
    return
  }
  if (cmd.id === 'download-resume') {
    io.print([line('downloading resume.pdf…')])
    await cmd.run(ctx)
    return
  }
  if (cmd.id === 'go-cv') {
    io.print([line('navigating to /cv…')])
    await cmd.run(ctx)
    return
  }
  if (cmd.id === 'sudo-hire-darshan') {
    io.print([line(profile.terminal.sudoHire, 'signal'), line(profile.email)])
    await cmd.run(ctx)
    return
  }
  if (cmd.id.startsWith('open-')) {
    io.print([line(`opening ${cmd.id.slice('open-'.length)}…`)])
    await cmd.run(ctx)
    return
  }
  await cmd.run(ctx)
}

/* ------------------------------------------------------------------------- */
/* Execute                                                                    */
/* ------------------------------------------------------------------------- */

/**
 * Execute one raw input line. The UI has already echoed the prompt line;
 * this only prints results. Returns after all synchronous effects are queued.
 */
export async function execute(
  raw: string,
  ctx: CommandCtx,
  io: TerminalIO,
  history: readonly string[] = [],
): Promise<void> {
  const input = raw.trim()
  if (input === '') return
  const [head = '', ...rest] = input.split(/\s+/)
  const cmd = head.toLowerCase()
  const arg = rest.join(' ').toLowerCase()

  switch (cmd) {
    case 'help':
      io.print(helpLines())
      return
    case 'whoami':
      io.print(whoamiLines())
      return
    case 'ls':
      if (arg === '' || arg === 'projects') {
        io.print(lsProjectsLines())
      } else {
        io.print([line(`ls: cannot access '${rest.join(' ')}' — try 'ls projects'`, 'error')])
      }
      return
    case 'cat':
      if (arg === 'resume.txt') {
        io.print(resumeLines())
      } else {
        io.print([line(`cat: ${rest.join(' ') || '(no file)'}: no such file`, 'error')])
      }
      return
    case 'open': {
      if (arg === 'resume') {
        const dl = findByAlias('open resume')
        if (dl) await runRegistry(dl, ctx, io)
        return
      }
      if (isProjectSlug(arg)) {
        const open = getCommand(`open-${arg}`)
        if (open) await runRegistry(open, ctx, io)
        return
      }
      io.print([line(`open: no such project: ${rest.join(' ') || '(none)'} — try 'ls projects'`, 'error')])
      return
    }
    case 'theme':
      if (arg === 'dark' || arg === 'light') {
        ctx.setTheme(arg)
        io.print([line(`theme set to ${arg}`)])
      } else {
        io.print([line('usage: theme dark|light', 'secondary')])
      }
      return
    case 'motion':
      if (arg === 'off') {
        ctx.setMotion(true)
        io.print([line('animation disabled — motion on to restore')])
      } else if (arg === 'on') {
        ctx.setMotion(false)
        io.print([line('animation enabled')])
      } else {
        io.print([line('usage: motion off|on', 'secondary')])
      }
      return
    case 'snake':
      io.startSnake()
      return
    case 'clear':
      io.clear()
      return
    case 'history':
      io.print(historyLines(history))
      return
    case 'exit':
      io.exit()
      return
    default:
      break
  }

  // Registry-backed resolution: 'email', 'cv', project slugs, 'sudo hire darshan', …
  const registryCmd = findByAlias(input)
  if (registryCmd && registryCmd.surfaces.includes('terminal')) {
    await runRegistry(registryCmd, ctx, io)
    return
  }

  io.print([notFound(head)])
}

/* ------------------------------------------------------------------------- */
/* Tab completion (commands + slugs, §5.3)                                    */
/* ------------------------------------------------------------------------- */

const TOP_LEVEL = [
  'help',
  'whoami',
  'ls',
  'open',
  'cat',
  'email',
  'cv',
  'theme',
  'motion',
  'sudo',
  'snake',
  'clear',
  'history',
  'exit',
  ...projectSlugs,
] as const

const ARG_CANDIDATES: Record<string, readonly string[]> = {
  open: ['resume', ...projectSlugs],
  cat: ['resume.txt'],
  theme: ['dark', 'light'],
  motion: ['off', 'on'],
  ls: ['projects'],
  sudo: ['hire darshan'],
}

export interface Completion {
  /** Full replacement input when exactly one candidate matches. */
  value?: string
  /** Candidate list when the prefix is ambiguous. */
  options?: readonly string[]
}

export function complete(raw: string): Completion {
  const input = raw.replace(/^\s+/, '')
  const spaceIdx = input.indexOf(' ')

  if (spaceIdx === -1) {
    const prefix = input.toLowerCase()
    if (prefix === '') return {}
    const matches = TOP_LEVEL.filter((c) => c.startsWith(prefix))
    if (matches.length === 1) {
      const m = matches[0]
      const takesArg = m in ARG_CANDIDATES
      return { value: takesArg ? `${m} ` : m }
    }
    if (matches.length > 1) return { options: matches }
    return {}
  }

  const head = input.slice(0, spaceIdx).toLowerCase()
  const argPrefix = input.slice(spaceIdx + 1).toLowerCase()
  const candidates = ARG_CANDIDATES[head]
  if (!candidates) return {}
  const matches = candidates.filter((c) => c.startsWith(argPrefix))
  if (matches.length === 1) return { value: `${head} ${matches[0]}` }
  if (matches.length > 1) return { options: matches }
  return {}
}
