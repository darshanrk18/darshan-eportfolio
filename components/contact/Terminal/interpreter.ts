/**
 * Terminal interpreter (spec §5.3 / §4.8) — hand-rolled, zero deps.
 * Pure command → output mapping so it is unit-testable: the UI supplies a
 * CommandCtx (shared registry action layer) and a TerminalIO sink.
 * Registry-backed commands ('email', 'cv', 'open resume', project slugs,
 * 'sudo hire darshan') resolve through lib/commands/registry findByAlias;
 * everything else here is a terminal-only builtin.
 */

import {
  getCurrentEdition,
  isSourceModeOn,
  otherEdition,
  type CommandCtx,
} from '@/lib/commands/context'
import { findByAlias, getCommand, type Command } from '@/lib/commands/registry'
import { profile } from '@/lib/data/profile'
import { PHOTO_ASCII } from '@/lib/data/photoAscii'
import { projectSlugs, isProjectSlug } from '@/lib/data/projects'
import { skillGroups } from '@/lib/data/skills'
import { commits } from '@/lib/data/experience'
import { useSignalStore } from '@/lib/state/store'

export type TermTone = 'default' | 'secondary' | 'error' | 'magenta' | 'signal'

export interface TermLine {
  text: string
  tone?: TermTone
  /** Rendered aria-hidden inside the role="log" region (ASCII art rows, §2.2). */
  ariaHidden?: boolean
  /** Visually-hidden sentence the log announces instead of the art (§2.2). */
  srOnly?: boolean
  /** `label` inside `text` renders as a real link running ctx.scrollTo(anchor). */
  link?: { label: string; anchor: string }
}

/** Side-effect sink implemented by the Terminal UI. */
export interface TerminalIO {
  print(lines: readonly TermLine[]): void
  clear(): void
  startSnake(opts?: { autopilot?: boolean }): void
  exit(): void
}

/** The 2-line window banner (§4.8) — also server-rendered in Contact.tsx. */
export const BANNER = "Darshan Konnur — type 'help'"

const line = (text: string, tone?: TermTone): TermLine => (tone ? { text, tone } : { text })

/**
 * v3 §2.6 item 8 — "Ask the console who I am" completes when the terminal
 * runs `whoami` in any form. The guide island listens on window; no import
 * needed. DOM-guarded (this module runs in node tests).
 */
export const GUIDE_TRIED_EVENT = 'signal:guide-tried'
function guideTried(id: string): void {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return
  window.dispatchEvent(new CustomEvent(GUIDE_TRIED_EVENT, { detail: { id } }))
}

/** v2 §11.1 — reduced-motion check for the `demo` refusal (DOM-guarded). */
function motionReducedNow(): boolean {
  return typeof document !== 'undefined' && document.documentElement.dataset.motion === 'reduced'
}

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
    line('  edition screen|print  switch edition (no arg reports)'),
    line('  motion off|on      disable or enable animation'),
    line('  view source        annotate this page for 6s'),
    line('fun', 'secondary'),
    line('  sudo hire darshan  draft the offer email'),
    line('  snake              play snake — arrows/wasd move, q quits'),
    line('  snake --autopilot  watch A* drive the snake'),
    line('  whoami --face      render the ASCII portrait'),
    line('  deploy             build the system — see skills.json'),
    line('  demo               run the demo — any key takes over'),
    line('  arcade             open the hidden /arcade'),
    line('  crt on|off         phosphor mode'),
    line('session', 'secondary'),
    line('  clear · history · exit'),
  ]
}

/** One-sentence announcement standing in for the 32 aria-hidden art rows (§2.2). */
export const FACE_ALT = 'ASCII portrait of Darshan Konnur'

/**
 * v2 §2.2/§11.1 `whoami --face` (alias `cat darshan.jpg`): the 32 ASCII rows
 * (secondary, final 3 in signal, all aria-hidden) and one sr-only alt
 * sentence. v3 drops v2's trailing "render complete … ./about.md" line: the
 * S6/P6 frames show only the portrait and the readout, and the clutter law
 * keeps pipeline words and file names off the page even here.
 */
export function faceLines(): TermLine[] {
  const last = PHOTO_ASCII.length - 3
  const rows: TermLine[] = PHOTO_ASCII.map((text, i) => ({
    text,
    tone: i >= last ? 'signal' : 'secondary',
    ariaHidden: true,
  }))
  return [...rows, { text: FACE_ALT, srOnly: true }]
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
      if (arg === '--face') {
        io.print(faceLines())
        guideTried('ask-console')
      } else if (arg === '') {
        io.print(whoamiLines())
        guideTried('ask-console')
      } else {
        io.print([line(`whoami: unrecognized option '${rest.join(' ')}' — try 'whoami --face'`, 'error')])
      }
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
      } else if (arg === 'darshan.jpg') {
        io.print(faceLines())
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
    case 'edition': {
      /* v3 §2.1 — the terminal skin of the edition switch. ctx.setEdition
         runs the §2.4 press/projector transition; we only narrate. */
      if (arg === 'screen' || arg === 'print') {
        const current = getCurrentEdition()
        if (current === arg) {
          io.print([line(`already reading the ${arg.toUpperCase()} edition`, 'secondary')])
        } else {
          io.print([line(`switching to the ${arg.toUpperCase()} edition…`)])
          await ctx.setEdition(arg, 'terminal')
        }
      } else if (arg === '') {
        const current = getCurrentEdition()
        io.print([
          line(
            `reading the ${current.toUpperCase()} edition — 'edition ${otherEdition(current)}' to switch`,
            'secondary',
          ),
        ])
      } else {
        io.print([line('usage: edition screen|print', 'secondary')])
      }
      return
    }
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
      io.startSnake({ autopilot: arg === '--autopilot' })
      return
    case 'deploy': {
      /* §11.1 — `deploy` / `deploy --all`: print, then the ONE action layer. */
      io.print([line('deploying — see skills.json ↑')])
      const deploy = getCommand('deploy-all')
      if (deploy) await deploy.run(ctx)
      return
    }
    case 'demo':
      /* §10.4 — reduced-motion refusal is printed by the invoking surface. */
      if (motionReducedNow()) {
        io.print([line('demo needs animation — motion is set to reduced', 'secondary')])
      } else {
        io.print([line('starting the demo — any key hands control back')])
        const demoCmd = getCommand('run-demo')
        if (demoCmd) await demoCmd.run(ctx)
      }
      return
    case 'arcade': {
      io.print([line('navigating to /arcade…')])
      const arcadeCmd = getCommand('go-arcade')
      if (arcadeCmd) await arcadeCmd.run(ctx)
      return
    }
    case 'view': {
      if (arg === 'source') {
        /* §7.2 — the source-mode command owns the toggle; we only narrate. */
        const wasOn = isSourceModeOn()
        io.print([
          line(
            wasOn
              ? 'source mode: off'
              : 'source mode: on — annotating this page for 6s',
          ),
        ])
        const sourceCmd = getCommand('source-mode')
        if (sourceCmd) await sourceCmd.run(ctx)
      } else {
        io.print([line("view: try 'view source'", 'error')])
      }
      return
    }
    case 'crt':
      /* §10.1 — the store flag is THE one CRT channel; the always-mounted
         palette island applies html[data-crt], persists, toasts, degausses. */
      if (arg === 'on') {
        useSignalStore.getState().setCrtEnabled(true)
        io.print([line('CRT MODE UNLOCKED — phosphor burn-in not covered by warranty', 'signal')])
      } else if (arg === 'off') {
        useSignalStore.getState().setCrtEnabled(false)
        io.print([line('crt off — flat glass restored', 'secondary')])
      } else {
        io.print([line('usage: crt on|off', 'secondary')])
      }
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
  'edition',
  'motion',
  'sudo',
  'snake',
  'deploy',
  'demo',
  'arcade',
  'crt',
  'view',
  'clear',
  'history',
  'exit',
  ...projectSlugs,
] as const

const ARG_CANDIDATES: Record<string, readonly string[]> = {
  open: ['resume', ...projectSlugs],
  cat: ['resume.txt', 'darshan.jpg'],
  whoami: ['--face'],
  snake: ['--autopilot'],
  crt: ['on', 'off'],
  view: ['source'],
  edition: ['screen', 'print'],
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
