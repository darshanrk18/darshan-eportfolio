/**
 * Typed shared command registry (spec §5.1) — the ONE action layer.
 * Palette (§5.2), terminal (§5.3, surface 'terminal' + its own builtins),
 * navbar, and hash-anchor handling all consume this registry.
 */

import { SIGNAL_EVENTS, toggleSourceMode, type CommandCtx } from './context'
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
  title: string
  aliases?: string[]
  keywords: string[]
  group: CommandGroup
  /** Keycap hint shown in the palette (e.g. '⌘K'). */
  kbd?: string
  run(ctx: CommandCtx): void | Promise<void>
  surfaces: Array<'palette' | 'terminal' | 'nav'>
}

const navigateCommands: Command[] = sectionTabs.map(({ anchor, tab, name }) => ({
  id: `go-${anchor.slice(1)}`,
  title: `Go to ${name.charAt(0)}${name.slice(1).toLowerCase()}`,
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

export const commands: readonly Command[] = [
  ...navigateCommands,
  {
    id: 'go-cv',
    title: 'Open /cv — the recruiter cut',
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
    id: 'toggle-theme',
    title: 'Toggle theme',
    aliases: ['theme'],
    keywords: ['theme', 'dark', 'light', 'toggle'],
    group: 'action',
    surfaces: ['palette', 'nav'],
    run(ctx) {
      ctx.setTheme('toggle')
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
    title: 'Deploy the system',
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
]

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
