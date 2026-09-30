/**
 * Typed shared command registry (spec §5.1) — the ONE action layer.
 * Palette (§5.2), terminal (§5.3, surface 'terminal' + its own builtins),
 * navbar, and hash-anchor handling all consume this registry.
 *
 * v3 (V3_SPEC §2.1, §2.5, §2.7, §1.8): `toggle-theme` is gone; the edition
 * pack is `switch-edition`, `choose-edition`, `replay-intro` and the
 * `build-info` panel opener. C5 APPENDS the guide's rows here — never
 * rewrites.
 */

import {
  INTRO_SESSION_KEY,
  SIGNAL_EVENTS,
  getCurrentEdition,
  requestEditionPick,
  toggleSourceMode,
  type CommandCtx,
} from './context'
import { sectionTabs } from './sections'
import { profile } from '@/lib/data/profile'
import { projects, type ProjectSlug } from '@/lib/data/projects'
import { allSkillNodes } from '@/lib/data/skills'
import { useSignalStore } from '@/lib/state/store'
import { trackCvViewed, trackEvent } from '@/lib/utils/analytics'

/* Section constants live in ./sections (imported by the always-mounted
   chrome WITHOUT this module's command/data graph, §12.1); re-exported here
   so every lazy surface and test keeps its single import site. */
export { SECTION_ANCHORS, sectionTabs } from './sections'
export type { SectionAnchor } from './sections'

export type CommandGroup = 'navigate' | 'action' | 'project' | 'skill' | 'fun'
export type CommandSurface = 'palette' | 'terminal' | 'nav'

export interface Command {
  id: string
  /**
   * Palette row label. Read it at RENDER time (never cache it): a few
   * commands resolve it against live state — `switch-edition` reads the
   * edition in force so it says "Read it as a comic" in SCREEN and "See the
   * screen edition" in PRINT.
   */
  title: string
  aliases?: string[]
  keywords: string[]
  group: CommandGroup
  /** Keycap hint shown in the palette (e.g. '⌘K'). */
  kbd?: string
  run(ctx: CommandCtx): void | Promise<void>
  surfaces: Array<'palette' | 'terminal' | 'nav'>
}

/** v3 §2.6 item 2 / §3 — the switch row's label per edition in force. */
export const SWITCH_EDITION_LABELS = {
  screen: 'Read it as a comic',
  print: 'See the screen edition',
} as const

const navigateCommands: Command[] = sectionTabs.map(({ anchor, tab, name }) => ({
  id: `go-${anchor.slice(1)}`,
  /* Director call (a): the Work section is 'Work' in visitor copy. */
  title: `Go to ${anchor === '#projects' ? 'Work' : `${name.charAt(0)}${name.slice(1).toLowerCase()}`}`,
  aliases: [anchor.slice(1), tab],
  keywords: ['go', 'navigate', 'section', anchor.slice(1), tab],
  group: 'navigate' as const,
  surfaces: ['palette', 'nav'] as Array<'palette' | 'terminal' | 'nav'>,
  run(ctx: CommandCtx) {
    ctx.scrollTo(anchor)
  },
}))

const projectCommands: Command[] = projects.map((p) => ({
  id: `open-${p.slug}`,
  title: `Open ${p.name}`,
  aliases: [p.slug, p.name],
  keywords: ['project', 'open', p.slug, p.name, ...p.stack.map((s) => s.toLowerCase())],
  group: 'project' as const,
  surfaces: ['palette', 'terminal'] as Array<'palette' | 'terminal' | 'nav'>,
  run(ctx: CommandCtx) {
    ctx.openProject(p.slug)
  },
}))

const skillCommands: Command[] = allSkillNodes.map((node) => ({
  id: `skill-${node.id}`,
  title: `Skills › ${node.label}`,
  aliases: [node.id, node.label],
  keywords: ['skill', 'skills', node.id, node.label.toLowerCase(), node.cluster],
  group: 'skill' as const,
  surfaces: ['palette'] as Array<'palette' | 'terminal' | 'nav'>,
  run(ctx: CommandCtx) {
    ctx.focusSkill(node.id)
  },
}))

const allCommands: Command[] = [
  ...navigateCommands,
  {
    id: 'go-cv',
    title: 'Open the résumé page',
    aliases: ['cv', '/cv'],
    keywords: ['cv', 'resume', 'recruiter', 'dossier', 'print'],
    group: 'navigate',
    surfaces: ['palette', 'nav', 'terminal'],
    run(ctx) {
      trackCvViewed()
      ctx.router.push('/cv')
    },
  },
  {
    id: 'copy-email',
    title: 'Copy email',
    aliases: ['email', 'mail'],
    keywords: ['email', 'copy', 'contact', profile.email],
    group: 'action',
    surfaces: ['palette', 'terminal'],
    async run(ctx) {
      const ok = await ctx.copy(profile.email)
      if (ok) ctx.track('email_copied')
    },
  },
  {
    id: 'download-resume',
    title: 'Download resume',
    aliases: ['resume', 'resume.pdf', 'open resume'],
    keywords: ['resume', 'download', 'pdf', 'cv'],
    group: 'action',
    surfaces: ['palette', 'terminal', 'nav'],
    run(ctx) {
      ctx.download(profile.resumePdf, 'darshan-konnur.pdf')
      ctx.track('resume_downloaded')
    },
  },
  {
    /* v3 §2.1/§3 — the edition switch. `title` is a getter: the palette
       renders cmd.title on every open, so the row reads "Read it as a
       comic" in SCREEN and "See the screen edition" in PRINT without any
       palette-side logic. Runs the §2.4 press/projector transition through
       ctx.setEdition('toggle', 'palette'). The Navbar pill (EditionToggle)
       calls switchEdition directly with via 'toggle'. */
    id: 'switch-edition',
    get title() {
      return SWITCH_EDITION_LABELS[getCurrentEdition()]
    },
    aliases: [
      'edition',
      'switch edition',
      'comic',
      'screen edition',
      'print edition',
      SWITCH_EDITION_LABELS.screen,
      SWITCH_EDITION_LABELS.print,
    ],
    keywords: ['edition', 'switch', 'screen', 'print', 'comic', 'cinema', 'toggle', 'skin'],
    group: 'action',
    surfaces: ['palette', 'nav'],
    run(ctx) {
      return ctx.setEdition('toggle', 'palette')
    },
  },
  {
    /* v3 §2.5 — re-open the edition picker (X1). Sets html[data-pick='1'];
       the EditionPicker island (C5) watches the attribute and renders. */
    id: 'choose-edition',
    title: 'Choose your edition',
    aliases: ['choose edition', 'picker', 'pick edition'],
    keywords: ['choose', 'edition', 'picker', 'screen', 'print', 'comic', 'cinema'],
    group: 'action',
    surfaces: ['palette'],
    run() {
      requestEditionPick()
    },
  },
  {
    id: 'disable-animation',
    title: 'Disable animation',
    aliases: ['motion off', 'reduce motion'],
    keywords: ['motion', 'animation', 'reduce', 'disable', 'accessibility'],
    group: 'action',
    surfaces: ['palette'],
    run(ctx) {
      ctx.setMotion(true)
    },
  },
  {
    id: 'enable-animation',
    title: 'Enable animation',
    aliases: ['motion on'],
    keywords: ['motion', 'animation', 'enable'],
    group: 'action',
    surfaces: ['palette'],
    run(ctx) {
      ctx.setMotion(false)
    },
  },
  {
    /* v2 §0.3/§7.2 — retitled from 'View source' so it never collides with
       the `source-mode` annotation toggle below. Id/aliases/behavior kept. */
    id: 'view-source',
    title: 'Open repository ↗',
    aliases: ['source', 'repo', 'github'],
    keywords: ['source', 'repo', 'github', 'code', 'repository'],
    group: 'action',
    surfaces: ['palette'],
    run() {
      if (typeof window !== 'undefined') {
        window.open(profile.siteRepoUrl, '_blank', 'noopener,noreferrer')
      }
    },
  },
  {
    /* v2 §7.2 — sitewide view-source annotation mode. The toggle + 6s
       auto-revert live in context.setSourceMode (pure CSS layer keys off
       html[data-source-mode='1']); terminal `view source` (builtin) runs
       this same command, printing its own line. */
    id: 'source-mode',
    title: 'View source mode — annotate this page',
    aliases: ['source mode', 'annotate'],
    keywords: ['source', 'mode', 'annotate', 'components', 'islands', 'inspect', 'dev'],
    group: 'action',
    surfaces: ['palette'],
    run(ctx) {
      const on = toggleSourceMode()
      if (on) ctx.track('source_mode')
    },
  },
  ...projectCommands,
  ...skillCommands,
  {
    id: 'play-connect-four',
    title: 'Play Connect Four',
    aliases: ['connect four', 'c4', 'play'],
    keywords: ['play', 'game', 'connect', 'four', 'minimax', 'fun'],
    group: 'fun',
    surfaces: ['palette'],
    run(ctx) {
      ctx.openProject('triplay-ai')
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(SIGNAL_EVENTS.runProject, {
            detail: { slug: 'triplay-ai' as ProjectSlug },
          })
        )
      }
    },
  },
  {
    id: 'sudo-hire-darshan',
    title: 'sudo hire darshan',
    aliases: ['sudo hire darshan', 'hire'],
    keywords: ['sudo', 'hire', 'offer', 'fun'],
    group: 'fun',
    surfaces: ['palette', 'terminal'],
    run() {
      trackEvent('sudo_hire_darshan')
      if (typeof window !== 'undefined') {
        const mailto = `mailto:${profile.email}?subject=${encodeURIComponent('Offer — Software Engineer')}`
        window.setTimeout(() => {
          window.location.href = mailto
        }, 800)
      }
    },
  },
  {
    /* v2 §7.1 — `$ deploy --all`. Scrolls to Skills and fires the deployAll
       event; SystemDiagram.client (listener attached on mount) runs the
       cluster-wave sequence and fires GA `deploy_all` at sequence start so
       its own on-diagram button is counted too. */
    id: 'deploy-all',
    title: 'Light up the toolkit',
    aliases: ['deploy', 'deploy --all', 'deploy all'],
    keywords: ['deploy', 'build', 'system', 'skills', 'modules', 'healthy'],
    group: 'fun',
    surfaces: ['palette', 'terminal'],
    run(ctx) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(SIGNAL_EVENTS.deployAll))
      }
      ctx.scrollTo('#skills')
    },
  },
  {
    /* v2 §10.4 — the registry-driven tour, EXPLICIT invocation only (no
       auto-arm exists anywhere, §0.2.1). Dispatches SIGNAL_EVENTS.demo; the
       always-mounted listener handles the reduced-motion refusal and lazily
       imports lib/commands/demoRunner. */
    id: 'run-demo',
    title: 'Run the demo',
    aliases: ['demo', 'tour'],
    keywords: ['demo', 'tour', 'show', 'registry', 'autoplay'],
    group: 'fun',
    surfaces: ['palette', 'terminal'],
    run() {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(SIGNAL_EVENTS.demo))
      }
    },
  },
  {
    /* v2 §10.5 — /arcade is discoverable ONLY via terminal `arcade`, this
       command, and the 404 egg. If the arcade route is cut (§13 cut #1),
       remove this entry and its registry-test line with it. */
    id: 'go-arcade',
    title: 'Open the arcade',
    aliases: ['arcade', '/arcade'],
    keywords: ['arcade', 'games', 'snake', 'autopilot', 'connect', 'four', 'play'],
    group: 'fun',
    surfaces: ['palette', 'terminal'],
    run(ctx) {
      ctx.router.push('/arcade')
    },
  },
  {
    /* v2 §10.1 — CRT phosphor opt-in. State flows through the store flag
       ONLY: the always-mounted CommandPalette island subscribes, applies
       html[data-crt='1'], persists CRT_STORAGE_KEY, and plays the unlock
       toast + degauss on false→true. Terminal `crt on|off` and the konami
       ring buffer call the same setCrtEnabled. */
    id: 'crt-mode',
    title: 'Enable CRT mode',
    aliases: ['crt', 'phosphor'],
    keywords: ['crt', 'phosphor', 'scanlines', 'retro', 'tube', 'mode'],
    group: 'fun',
    surfaces: ['palette'],
    run() {
      useSignalStore.getState().setCrtEnabled(true)
    },
  },
  {
    /* v3 §1.8 — the ONLY door to build evidence (SHA, KB, fps, seen count).
       Flips store.buildInfoOpen; the C1 BuildInfo island is next/dynamic
       and mounts while the flag is true. */
    id: 'build-info',
    title: 'Build info',
    aliases: ['build', 'build info', 'about this build'],
    keywords: ['build', 'info', 'bundle', 'size', 'sha', 'commit', 'fps', 'version', 'evidence'],
    group: 'fun',
    surfaces: ['palette'],
    run() {
      useSignalStore.getState().setBuildInfoOpen(true)
    },
  },
  {
    /* v3 §2.7 — replay PRINT's boot. Only meaningful in PRINT, so it
       switches there first (press transition) when SCREEN is in force,
       clears the once-per-session flag and then dispatches
       SIGNAL_EVENTS.replayIntro for the intro host (C6). */
    id: 'replay-intro',
    title: 'Replay the intro (PRINT)',
    aliases: ['replay intro', 'replay the intro', 'intro'],
    keywords: ['replay', 'intro', 'boot', 'comic', 'print', 'cover', 'opening'],
    group: 'fun',
    surfaces: ['palette'],
    async run(ctx) {
      if (typeof window === 'undefined') return
      try {
        sessionStorage.removeItem(INTRO_SESSION_KEY)
      } catch {
        /* storage unavailable — the intro host re-checks eligibility itself */
      }
      if (getCurrentEdition() !== 'print') await ctx.setEdition('print', 'palette')
      window.dispatchEvent(new CustomEvent(SIGNAL_EVENTS.replayIntro))
    },
  },
]

/** Every command; the repo link only while the repo is public (profile.siteRepoPublic). */
export const commands: readonly Command[] = allCommands.filter(
  (c) => c.id !== 'view-source' || profile.siteRepoPublic
)

/** Resolve a command by exact id. */
export function getCommand(id: string): Command | undefined {
  return commands.find((c) => c.id === id)
}

/** Commands available on a surface, registry order preserved. */
export function commandsForSurface(surface: CommandSurface): readonly Command[] {
  return commands.filter((c) => c.surfaces.includes(surface))
}

/** Resolve by id, title, or alias (case-insensitive, trimmed). */
export function findByAlias(nameOrAlias: string): Command | undefined {
  const q = nameOrAlias.trim().toLowerCase()
  if (q === '') return undefined
  return commands.find(
    (c) =>
      c.id.toLowerCase() === q ||
      c.title.toLowerCase() === q ||
      (c.aliases ?? []).some((a) => a.toLowerCase() === q)
  )
}

/** Palette display order for groups (§5.2). */
export const GROUP_ORDER: readonly CommandGroup[] = [
  'navigate',
  'action',
  'project',
  'skill',
  'fun',
]

export const GROUP_LABELS: Record<CommandGroup, string> = {
  navigate: 'Navigate',
  action: 'Actions',
  project: 'Projects',
  skill: 'Skills',
  fun: 'Fun',
}
