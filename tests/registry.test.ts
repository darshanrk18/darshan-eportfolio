import { describe, expect, it } from 'vitest'
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
