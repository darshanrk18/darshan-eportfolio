import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CommandCtx } from '@/lib/commands/context'
import { useSignalStore } from '@/lib/state/store'
import {
  SECTION_ANCHORS,
  commands,
  commandsForSurface,
  findByAlias,
  getCommand,
  sectionTabs,
} from '@/lib/commands/registry'
import { projectSlugs } from '@/lib/data/projects'
import { allSkillNodes } from '@/lib/data/skills'

describe('command registry (spec §5.1)', () => {
  it('has unique ids', () => {
    const ids = commands.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every command id resolves', () => {
    for (const c of commands) {
      expect(getCommand(c.id)).toBe(c)
    }
  })

  it('has a navigate command per section anchor, matching sectionTabs', () => {
    expect(sectionTabs.map((t) => t.anchor)).toEqual([...SECTION_ANCHORS])
    for (const anchor of SECTION_ANCHORS) {
      expect(getCommand(`go-${anchor.slice(1)}`)).toBeDefined()
    }
  })

  it('has an open-<slug> command per project (terminal `open <slug>` path)', () => {
    for (const slug of projectSlugs) {
      const cmd = getCommand(`open-${slug}`)
      expect(cmd).toBeDefined()
      expect(cmd?.surfaces).toContain('terminal')
      expect(findByAlias(slug)?.id).toBe(`open-${slug}`)
    }
  })

  it('has a skill-<id> palette command per diagram node', () => {
    for (const node of allSkillNodes) {
      expect(getCommand(`skill-${node.id}`)).toBeDefined()
    }
  })

  it('resolves the §4.8 terminal-facing aliases', () => {
    expect(findByAlias('email')?.id).toBe('copy-email')
    expect(findByAlias('cv')?.id).toBe('go-cv')
    expect(findByAlias('open resume')?.id).toBe('download-resume')
    expect(findByAlias('sudo hire darshan')?.id).toBe('sudo-hire-darshan')
    expect(findByAlias('nonexistent-xyz')).toBeUndefined()
  })

  it('filters surfaces correctly', () => {
    for (const surface of ['palette', 'terminal', 'nav'] as const) {
      const list = commandsForSurface(surface)
      expect(list.length).toBeGreaterThan(0)
      expect(list.every((c) => c.surfaces.includes(surface))).toBe(true)
    }
    // skills are palette-only
    expect(commandsForSurface('terminal').some((c) => c.group === 'skill')).toBe(false)
  })
})

describe('v2 command pack (V2_SPEC §7, §10, §11.2)', () => {
  it('every new v2 command id resolves', () => {
    for (const id of ['deploy-all', 'source-mode', 'run-demo', 'go-arcade', 'crt-mode']) {
      expect(getCommand(id), id).toBeDefined()
    }
  })

  it('carries the spec surface flags (§7.1, §7.2, §10.1, §10.4, §10.5)', () => {
    expect(getCommand('deploy-all')?.surfaces).toEqual(['palette', 'terminal'])
    expect(getCommand('run-demo')?.surfaces).toEqual(['palette', 'terminal'])
    expect(getCommand('go-arcade')?.surfaces).toEqual(['palette', 'terminal'])
    expect(getCommand('source-mode')?.surfaces).toEqual(['palette'])
    expect(getCommand('crt-mode')?.surfaces).toEqual(['palette'])
  })

  it('retitled view-source so the repo link and source-mode never collide (§0.3)', () => {
    expect(getCommand('view-source')?.title).toBe('Open repository ↗')
    expect(getCommand('source-mode')?.title).toBe('View source mode — annotate this page')
  })

  it('resolves the v2 terminal/palette-facing aliases (§11.2 bridges)', () => {
    expect(findByAlias('deploy')?.id).toBe('deploy-all')
    expect(findByAlias('deploy --all')?.id).toBe('deploy-all')
    expect(findByAlias('demo')?.id).toBe('run-demo')
    expect(findByAlias('arcade')?.id).toBe('go-arcade')
    expect(findByAlias('crt')?.id).toBe('crt-mode')
    expect(findByAlias('source mode')?.id).toBe('source-mode')
    // the old repo-opening aliases stay on view-source, uncollided
    expect(findByAlias('repo')?.id).toBe('view-source')
    expect(findByAlias('github')?.id).toBe('view-source')
  })

  it('every command id the §10.4 demo script drives resolves in the registry', () => {
    for (const id of ['open-ticket-forge', 'play-connect-four', 'skill-docker', 'go-contact']) {
      expect(getCommand(id), id).toBeDefined()
    }
  })
})

describe('v3 edition pack (V3_SPEC §2.1, §2.5, §2.7, §1.8, §8)', () => {
  const g = globalThis as { document?: unknown }
  afterEach(() => {
    delete g.document
  })

  it('every v3 command id resolves and toggle-theme is gone', () => {
    for (const id of ['switch-edition', 'choose-edition', 'build-info', 'replay-intro']) {
      expect(getCommand(id), id).toBeDefined()
    }
    expect(getCommand('toggle-theme')).toBeUndefined()
    expect(findByAlias('theme')).toBeUndefined()
    expect(findByAlias('toggle theme')).toBeUndefined()
  })

  it('carries the spec surface flags and groups', () => {
    expect(getCommand('switch-edition')?.surfaces).toEqual(['palette', 'nav'])
    expect(getCommand('switch-edition')?.group).toBe('action')
    expect(getCommand('choose-edition')?.surfaces).toEqual(['palette'])
    expect(getCommand('choose-edition')?.group).toBe('action')
    expect(getCommand('build-info')?.group).toBe('fun')
    expect(getCommand('replay-intro')?.group).toBe('fun')
  })

  it('switch-edition resolves its label at read time from the edition in force', () => {
    expect(getCommand('switch-edition')?.title).toBe('Read it as a comic')
    g.document = { documentElement: { dataset: { edition: 'print' } } }
    expect(getCommand('switch-edition')?.title).toBe('See the screen edition')
    g.document = { documentElement: { dataset: { edition: 'screen' } } }
    expect(getCommand('switch-edition')?.title).toBe('Read it as a comic')
  })

  it('titles are the visitor-language labels', () => {
    expect(getCommand('choose-edition')?.title).toBe('Choose your edition')
    expect(getCommand('build-info')?.title).toBe('Build info')
    expect(getCommand('replay-intro')?.title).toContain('Replay the intro')
  })

  it('resolves the edition aliases', () => {
    expect(findByAlias('edition')?.id).toBe('switch-edition')
    expect(findByAlias('comic')?.id).toBe('switch-edition')
    expect(findByAlias('read it as a comic')?.id).toBe('switch-edition')
    expect(findByAlias('choose edition')?.id).toBe('choose-edition')
    expect(findByAlias('build info')?.id).toBe('build-info')
    expect(findByAlias('replay intro')?.id).toBe('replay-intro')
  })

  it("switch-edition runs ctx.setEdition('toggle')", async () => {
    const setEdition = vi.fn(async () => {})
    const ctx = { setEdition } as unknown as CommandCtx
    await getCommand('switch-edition')?.run(ctx)
    expect(setEdition).toHaveBeenCalledWith('toggle', 'palette')
  })

  it('build-info opens the store panel flag', () => {
    try {
      getCommand('build-info')?.run({} as CommandCtx)
      expect(useSignalStore.getState().buildInfoOpen).toBe(true)
    } finally {
      useSignalStore.getState().setBuildInfoOpen(false)
    }
  })
})
