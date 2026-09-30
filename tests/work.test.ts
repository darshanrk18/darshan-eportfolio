/**
 * C4 — Work data + copy contracts (V3_SPEC §3 Work, director calls (b),
 * (d)): the S4/P4 strings are DATA, the disc colour words follow the
 * edition, and nothing the clutter law bans reaches visible copy.
 */

import { describe, expect, it } from 'vitest'
import {
  coverMoreCount,
  numberWord,
  projects,
  projectSlugs,
  windowTabs,
  workCopy,
} from '@/lib/data/projects'
import {
  DISC_WORDS,
  coachLine,
  discWords,
  engineBubble,
  newGameLine,
  statusLabel,
} from '@/components/projects/demos/c4Copy'
import { caseLinks } from '@/components/projects/CaseFile'

const BANNED = /alpha[- ]beta|α-β|depth\s*\d|node count|\.md\b|\.json\b|\.webp\b|fps|\bgz\b|\bSHA\b/i

describe('projects data (S4 / P4 copy is data)', () => {
  it('every project carries the rack + cover strings and a deliberate chip subset', () => {
    for (const p of projects) {
      expect(p.short.length).toBeGreaterThan(0)
      expect(p.short.length).toBeLessThanOrEqual(56)
      expect(p.coverLine.length).toBeGreaterThan(0)
      expect(p.bill.length).toBeGreaterThan(0)
      expect(p.bill.length).toBeLessThanOrEqual(4)
      expect(p.coverStack.length).toBeGreaterThan(0)
      expect(p.coverStack.length).toBeLessThanOrEqual(3)
      for (const item of p.coverStack) expect(p.stack).toContain(item)
      expect(p.windowTitle).toMatch(/darshan@portfolio/)
    }
  })

  it('the "+N" on a cover counts the stack items its chips do not show', () => {
    const tf = projects.find((p) => p.slug === 'ticket-forge')!
    expect(coverMoreCount(tf)).toBe(tf.stack.length - 3)
    const cal = projects.find((p) => p.slug === 'calendar-java')!
    expect(coverMoreCount(cal)).toBe(1)
  })

  it('TRIPLAY_AI has structured metrics, the approved build line and three game tabs', () => {
    const tri = projects.find((p) => p.slug === 'triplay-ai')!
    expect(tri.metrics?.map((m) => m.value)).toEqual(['91%', '88%'])
    expect(tri.metricsNote).toBe('Across 100+ simulations.')
    expect(tri.buildShort).not.toMatch(BANNED)
    expect(windowTabs(tri).map((t) => t.label)).toEqual(['Connect Four', 'Snake', 'Rock-Paper-Scissors'])
  })

  it('other projects get one tab named after them', () => {
    const tf = projects.find((p) => p.slug === 'ticket-forge')!
    expect(windowTabs(tf)).toEqual([{ id: 'ticket-forge', label: 'Ticket-Forge' }])
  })

  it('the lede counts the projects in words', () => {
    expect(numberWord(projects.length)).toBe('Seven')
    expect(workCopy.screen.ledeCount).toBe('Seven projects.')
    expect(numberWord(12)).toBe('12')
  })

  it('the Optimizer cover and poster say IEEE (director call (g))', () => {
    const opt = projects.find((p) => p.slug === 'ieee-mip-optimizer')!
    expect(opt.coverLine).toMatch(/IEEE/)
    expect(opt.short).toMatch(/IEEE/)
  })

  it('visible Work copy passes the clutter sweep', () => {
    const strings = [
      ...Object.values(workCopy.screen),
      ...Object.values(workCopy.print),
      ...Object.values(workCopy.window).flatMap((v) => (typeof v === 'string' ? [v] : Object.values(v))),
      ...Object.values(workCopy.caseFile),
      workCopy.rps.permission,
      ...projects.flatMap((p) => [p.short, p.coverLine, p.oneLiner, p.problem, p.buildShort ?? '', p.metricsNote ?? '']),
    ]
    for (const s of strings) expect(s).not.toMatch(BANNED)
  })

  it('case-file links prefer the repo, then the demo, then the paper', () => {
    const tf = projects.find((p) => p.slug === 'ticket-forge')!
    expect(caseLinks(tf).map((l) => l.label)).toEqual([workCopy.caseFile.codeLink, workCopy.caseFile.demoLink])
    const tr = projects.find((p) => p.slug === 'trackfolio')!
    expect(caseLinks(tr).map((l) => l.label)).toEqual([workCopy.caseFile.codeLink, workCopy.caseFile.appLink])
    const opt = projects.find((p) => p.slug === 'ieee-mip-optimizer')!
    expect(caseLinks(opt).map((l) => l.label)).toEqual([workCopy.caseFile.paperLink])
    const tri = projects.find((p) => p.slug === 'triplay-ai')!
    expect(caseLinks(tri)).toEqual([])
  })

  it('slug order is the rack order (newest first)', () => {
    expect(projectSlugs[0]).toBe('ticket-forge')
    expect(projects.map((p) => p.slug)).toEqual([...projectSlugs])
  })
})

describe('Connect Four copy per edition (director call (d))', () => {
  it('names the disc colours per edition', () => {
    expect(DISC_WORDS.screen).toEqual({ you: 'ivory', engine: 'steel' })
    expect(DISC_WORDS.print).toEqual({ you: 'yellow', engine: 'red' })
    expect(discWords('print').you).toBe('yellow')
  })

  it("the coach mark says You're ivory / You're yellow", () => {
    expect(coachLine('screen', 'engine')).toBe("You're ivory. Engine's move, then yours.")
    expect(coachLine('print', 'human')).toBe("You're yellow. Click a column, or press its number.")
    expect(newGameLine('screen')).toContain("You're ivory")
    expect(newGameLine('print')).toContain("You're yellow")
  })

  it('status labels and the engine balloon are visitor language', () => {
    expect(statusLabel('engine')).toBe('Engine is thinking')
    expect(statusLabel('human')).toBe('Your move')
    expect(engineBubble(3, 'blocked')).toEqual({ head: 'Column 4.', beat: 'Blocked!' })
    for (const s of [statusLabel('won'), statusLabel('lost'), statusLabel('draw'), engineBubble(0, 'won').beat]) {
      expect(s).not.toMatch(BANNED)
    }
  })
})
