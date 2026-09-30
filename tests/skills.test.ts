/**
 * v3 C3 — the skills data (director call (c)): the seven trays + Languages,
 * the verified usage map (CONTENT_FINAL), the derived usage rows, and the
 * diagram geometry (no tray overflows its box in either edition's plan).
 */

import { describe, expect, it } from 'vitest'
import { SKILLS_COPY } from '@/components/skills/copy'
import { GUIDE_TRIED_EVENT as C3_GUIDE_TRIED_EVENT } from '@/components/skills/guide'
import { BLAME_ON_EVENT as C3_BLAME_ON_EVENT } from '@/components/experience/events'
import { XP_COPY } from '@/components/experience/copy'
import { BLAME_ON_EVENT, ISLAND_SELECTOR } from '@/lib/guide/actions'
import { GUIDE_TRIED_EVENT } from '@/lib/guide/core'
import {
  LIGHT_ORDER,
  PRINT_DIAGRAM_H,
  PRINT_DIAGRAM_W,
  TRAY_RECTS,
  TRAY_RECTS_PRINT,
  DIAGRAM_H,
  DIAGRAM_W,
  WIRES,
  WIRES_PRINT,
  printTrayCapacity,
  stickerTilt,
  trayCapacity,
} from '@/components/skills/layout'
import {
  USAGE_MAP_PLACES,
  USAGE_PLACES,
  allSkillNodes,
  allSkills,
  getSkill,
  getSkillNode,
  getUsagePlace,
  languages,
  skillClusters,
  skillsUsedAt,
  usageRows,
} from '@/lib/data/skills'

const ids = (list: readonly { id: string }[]) => list.map((s) => s.id)

describe('skills taxonomy (director call (c))', () => {
  it('has the seven trays in flow order and the eight languages', () => {
    expect(skillClusters.map((c) => c.id)).toEqual([
      'frontend',
      'backend',
      'data',
      'monitoring',
      'testing',
      'devops',
      'cloud',
    ])
    expect(skillClusters.map((c) => c.label)).toEqual([
      'Frontend',
      'Backend',
      'Data',
      'Monitoring',
      'Testing',
      'DevOps',
      'Cloud',
    ])
    expect(ids(languages)).toEqual([
      'python',
      'java',
      'go',
      'javascript',
      'typescript',
      'c',
      'cpp',
      'sql',
    ])
    expect(allSkillNodes).toHaveLength(33)
    expect(allSkills).toHaveLength(41)
  })

  it('carries the resume-only nodes as data', () => {
    expect(getSkillNode('git')?.cluster).toBe('devops')
    expect(getSkillNode('linux')?.cluster).toBe('devops')
    expect(getSkillNode('rest-apis')?.cluster).toBe('backend')
    expect(getSkillNode('aws')?.cluster).toBe('cloud')
    expect(getSkillNode('docker')?.cluster).toBe('devops')
  })

  it('every skill has plain-English kind and blurb copy (no command syntax)', () => {
    for (const s of allSkills) {
      expect(s.kind, s.id).toBeTruthy()
      expect(s.blurb, s.id).toMatch(/[.!]$/)
      expect(s.kind).not.toMatch(/[:$]/)
      expect(s.blurb).not.toMatch(/kubectl|\$ |ascii|halftone/i)
      for (const u of s.usedIn) {
        expect(getUsagePlace(u.place), `${s.id} → ${u.place}`).toBeDefined()
        if (u.note) expect(u.note).not.toMatch(/[:$]{1}\s*$/)
      }
    }
  })
})

describe('verified usage map (CONTENT_FINAL)', () => {
  it('matches the verified map, place by place', () => {
    expect(ids(skillsUsedAt('aws-intern'))).toEqual([
      'python',
      'java',
      'junit',
      'playwright',
      'docker',
      'aws',
    ])
    expect(ids(skillsUsedAt('schneider'))).toEqual([
      'python',
      'react',
      'nodejs',
      'flask',
      'mysql',
      'docker',
      'kubernetes',
      'jenkins',
      'prometheus',
      'grafana',
    ])
    expect(ids(skillsUsedAt('ticket-forge'))).toEqual([
      'python',
      'fastapi',
      'postgresql',
      'pgvector',
      'docker',
      'terraform',
      'github-actions',
      'gcp',
    ])
    expect(ids(skillsUsedAt('trackfolio'))).toEqual(['typescript', 'react', 'nextjs', 'redis'])
    expect(ids(skillsUsedAt('triplay-ai'))).toEqual(['python'])
    expect(ids(skillsUsedAt('expense-share'))).toEqual(['react', 'express', 'mysql'])
    expect(ids(skillsUsedAt('box-archive'))).toEqual([])
    expect(ids(skillsUsedAt('neu-ta'))).toEqual(['java'])
    expect(ids(skillsUsedAt('calendar-java'))).toEqual(['java'])
    expect(ids(skillsUsedAt('ieee-mip-optimizer'))).toEqual(['python'])
    expect(ids(skillsUsedAt('cs6650'))).toEqual(['go'])
  })

  it('never claims what the map does not verify', () => {
    expect(getSkill('github-actions')?.usedIn.map((u) => u.place)).toEqual(['ticket-forge'])
    expect(getSkill('redis')?.usedIn.map((u) => u.place)).toEqual(['trackfolio'])
    expect(getSkill('cloudwatch')?.usedIn).toEqual([])
    expect(getSkill('junit')?.usedIn.map((u) => u.place)).toEqual(['aws-intern'])
    expect(getSkill('docker')?.usedIn.map((u) => u.place)).toEqual([
      'aws-intern',
      'schneider',
      'ticket-forge',
    ])
  })

  it('derives the seven usage rows from data, jobs first', () => {
    const rows = usageRows()
    expect(rows.map((r) => r.place.id)).toEqual([...USAGE_MAP_PLACES])
    expect(rows.map((r) => r.place.name)).toEqual([
      'Amazon Web Services',
      'Schneider Electric',
      'Ticket-Forge',
      'Trackfolio',
      'TRIPLAY_AI',
      'ExpenseShare',
      'Box Archive',
    ])
    expect(rows.map((r) => r.place.year)).toEqual([
      '2026',
      '2021 – 2023',
      '2026',
      '2026',
      '2025',
      '2025',
      '2023',
    ])
    expect(rows[rows.length - 1].skills).toEqual([])
    expect(USAGE_PLACES['aws-intern'].commitId).toBe('aws-intern')
    expect(USAGE_PLACES['ticket-forge'].projectSlug).toBe('ticket-forge')
  })

  it("Python's inspector rows are the approved five, with years", () => {
    const python = getSkill('python')!
    expect(python.kind).toBe('Programming language')
    expect(python.blurb).toBe('Used from web services to published research.')
    expect(
      python.usedIn.map((u) => [getUsagePlace(u.place)!.name, getUsagePlace(u.place)!.year, u.note])
    ).toEqual([
      ['Amazon Web Services', '2026', 'Lambda functions and their unit tests'],
      ['Schneider Electric', '2021 – 2023', 'Flask apps used by 10,000+ employees'],
      ['Ticket-Forge', '2026', 'Ranks engineers for incoming tickets'],
      ['TRIPLAY_AI', '2025', 'Game agents for Connect Four and Snake'],
      ['IEEE paper', '2021', 'Allocating medical samples for testing'],
    ])
  })
})

describe('diagram geometry (components/skills/layout)', () => {
  it('no tray overflows its box, in either plan', () => {
    for (const cluster of skillClusters) {
      expect(trayCapacity(cluster.id), `SCREEN ${cluster.id}`).toBeGreaterThanOrEqual(
        cluster.nodes.length
      )
      expect(printTrayCapacity(cluster.id), `PRINT ${cluster.id}`).toBeGreaterThanOrEqual(
        cluster.nodes.length
      )
    }
  })

  it('every tray sits inside its diagram', () => {
    for (const [id, r] of Object.entries(TRAY_RECTS)) {
      expect(r.x + r.w, `SCREEN ${id}`).toBeLessThanOrEqual(DIAGRAM_W)
      expect(r.y + r.h, `SCREEN ${id}`).toBeLessThanOrEqual(DIAGRAM_H)
    }
    for (const [id, r] of Object.entries(TRAY_RECTS_PRINT)) {
      expect(r.x + r.w, `PRINT ${id}`).toBeLessThanOrEqual(PRINT_DIAGRAM_W)
      expect(r.y + r.h, `PRINT ${id}`).toBeLessThanOrEqual(PRINT_DIAGRAM_H)
    }
  })

  it('wires join real trays; the light-up orders cover all eight trays once', () => {
    const trays = new Set([...skillClusters.map((c) => c.id), 'languages'])
    for (const w of [...WIRES, ...WIRES_PRINT]) {
      expect(trays.has(w.from), w.id).toBe(true)
      expect(trays.has(w.to), w.id).toBe(true)
      expect(w.from).not.toBe(w.to)
    }
    expect(WIRES).toHaveLength(6)
    expect(WIRES_PRINT).toHaveLength(10)
    for (const order of Object.values(LIGHT_ORDER)) {
      expect([...order].sort()).toEqual([...trays].sort())
    }
  })

  it('sticker tilts are deterministic and within ±1.6°', () => {
    for (const s of allSkills) {
      const t = stickerTilt(s.id)
      expect(t).toBe(stickerTilt(s.id))
      expect(Math.abs(t)).toBeLessThanOrEqual(1.6)
    }
    expect(new Set(allSkills.map((s) => stickerTilt(s.id))).size).toBeGreaterThan(5)
  })
})

describe('guide contract (V3_SPEC §2.6, director call (m))', () => {
  it('C3 fires the completion event the guide island listens for', () => {
    expect(C3_GUIDE_TRIED_EVENT).toBe(GUIDE_TRIED_EVENT)
  })

  it("the guide's blame-on event is the one the Experience island wrapper queues", () => {
    expect(C3_BLAME_ON_EVENT).toBe(BLAME_ON_EVENT)
  })

  it("the guide waits on the islands' data-component names", () => {
    expect(ISLAND_SELECTOR['light-toolkit']).toBe('#skills [data-component="SystemDiagram"]')
    expect(ISLAND_SELECTOR['skills-per-job']).toBe('#experience [data-component="SkillsPerJob"]')
  })
})

describe('clutter law (BRIEF-R2 §1) — the section copy is visitor language', () => {
  const banned = /\b(deploy|blame|kubectl|ascii|halftone|duotone|render|sha|fps|gz|kb)\b|\$ |\.(md|tsx?|css)\b|\bgit\b/i
  const strings = (obj: object): string[] =>
    Object.values(obj).flatMap((v) =>
      typeof v === 'string'
        ? [v]
        : typeof v === 'function'
          ? [String((v as (...a: unknown[]) => string)('Docker', ['Python', 'Docker']))]
          : Array.isArray(v)
            ? v.filter((x): x is string => typeof x === 'string')
            : typeof v === 'object' && v !== null
              ? strings(v)
              : []
    )

  it('Skills copy carries no pipeline words, command syntax or file names', () => {
    for (const s of strings(SKILLS_COPY)) expect(s, s).not.toMatch(banned)
  })

  it('Experience copy carries no git wording, hashes or command syntax', () => {
    for (const s of strings(XP_COPY)) expect(s, s).not.toMatch(banned)
    expect(XP_COPY.panelTitle).toBe('See which skills each job used')
  })
})
