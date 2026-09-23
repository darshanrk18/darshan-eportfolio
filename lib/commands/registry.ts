/**
 * Typed shared command registry (spec §5.1) — the ONE action layer.
 * Palette (§5.2), terminal (§5.3, surface 'terminal' + its own builtins),
 * navbar, and hash-anchor handling all consume this registry.
 */

import type { CommandCtx } from './context'
import { profile } from '@/lib/data/profile'
import { projects, type ProjectSlug } from '@/lib/data/projects'
import { allSkillNodes } from '@/lib/data/skills'
import { trackCvViewed, trackEvent } from '@/lib/utils/analytics'

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

/** The five section anchors, in page order. Every scrollTo target must be one. */
export const SECTION_ANCHORS = [
  '#about',
  '#skills',
  '#projects',
  '#experience',
  '#contact',
] as const

export type SectionAnchor = (typeof SECTION_ANCHORS)[number]

/** Nav-tab metadata (§4.2): filename-styled tabs ↔ anchors ↔ header rows. */
export const sectionTabs: readonly {
  anchor: SectionAnchor
  /** Nav tab label, e.g. 'about.md'. */
  tab: string
  /** Section header index, e.g. '01'. */
  index: string
  /** Section header name, e.g. 'ABOUT'. */
  name: string
}[] = [
  { anchor: '#about', tab: 'about.md', index: '01', name: 'ABOUT' },
  { anchor: '#skills', tab: 'skills.json', index: '02', name: 'SKILLS' },
  { anchor: '#projects', tab: 'projects/', index: '03', name: 'PROJECTS' },
  { anchor: '#experience', tab: 'experience.log', index: '04', name: 'EXPERIENCE' },
  { anchor: '#contact', tab: 'contact.sh', index: '05', name: 'CONTACT' },
]

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
    id: 'view-source',
    title: 'View source',
    aliases: ['source', 'repo', 'github'],
    keywords: ['source', 'repo', 'github', 'code'],
    group: 'action',
    surfaces: ['palette'],
    run() {
      if (typeof window !== 'undefined') {
        window.open(profile.siteRepoUrl, '_blank', 'noopener,noreferrer')
      }
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
          new CustomEvent('signal:run-project', { detail: { slug: 'triplay-ai' as ProjectSlug } }),
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
      (c.aliases ?? []).some((a) => a.toLowerCase() === q),
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
