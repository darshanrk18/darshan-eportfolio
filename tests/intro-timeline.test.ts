/**
 * V3_SPEC §8 — tests/intro-timeline.test.ts
 * The PRINT intro's clock (lib/intro/timeline.ts, pure): the beats sum to
 * ≤ 14 s with the rest and the hand-off, skip / fast-forward resolve to the
 * lockup, reduced motion yields an empty timeline; the hand-off's five
 * beats; and the §1.9 content corrections in lib/data/introAssets.ts.
 */

import { describe, expect, it } from 'vitest'
import {
  ART_IDS,
  CUT_CLEAR_MS,
  FAST_FORWARD_TARGET,
  HANDOFF_BEATS,
  HANDOFF_TOTAL_MS,
  INTRO_BUDGET_MS,
  LOCK_SETTLE_MS,
  MASK_STRIP,
  MONTAGE_CUTS,
  MONTAGE_DONE_MS,
  REST_IDLE_MS,
  RUSH_STRIP,
  beatAt,
  buildTimeline,
  fastForwardPlan,
  fastForwardTarget,
  fullRunMs,
  handoffBeat,
  scheduleEvents,
  totalMs,
} from '@/lib/intro/timeline'
import {
  INTRO_DONE_EVENT,
  INTRO_HANDOFF_ATTR,
  INTRO_NAME_TARGET_ATTR,
  INTRO_START_EVENT,
} from '@/lib/intro/events'
import { INTRO_ASSETS, INTRO_COPY } from '@/lib/data/introAssets'
import { INTRO_ATTR, INTRO_SESSION_KEY } from '@/lib/edition/prepaint'
import { SIGNAL_EVENTS } from '@/lib/commands/context'
import { profile } from '@/lib/data/profile'

/* --------------------------------------------------------------- montage */

describe('montage cuts (beat 0)', () => {
  it('is the source curve: 14 cuts, strictly decreasing holds summing to 2891 ms', () => {
    expect(MONTAGE_CUTS).toHaveLength(14)
    const holds = MONTAGE_CUTS.map((c) => c.hold)
    for (let i = 1; i < holds.length; i++) expect(holds[i]).toBeLessThan(holds[i - 1])
    expect(holds[0]).toBe(375)
    expect(holds.reduce((a, b) => a + b, 0)).toBe(2891)
  })

  it('only draws art from the bank, never the retired developer plate', () => {
    for (const cut of MONTAGE_CUTS) expect(ART_IDS).toContain(cut.art)
    for (const id of RUSH_STRIP) expect(ART_IDS).toContain(id)
    for (const id of MASK_STRIP) expect(ART_IDS).toContain(id)
    expect((ART_IDS as readonly string[]).includes('pdev')).toBe(false)
    expect((RUSH_STRIP as readonly string[]).includes('pdev')).toBe(false)
  })

  it('opens on the drawn close-up and cuts the six photo plates in order', () => {
    expect(MONTAGE_CUTS[0].art).toBe('a8')
    const plates = MONTAGE_CUTS.map((c) => c.art).filter((a) => a.startsWith('p'))
    expect(plates).toEqual(['p1', 'p2', 'p6', 'p3', 'p4', 'p5'])
    expect(INTRO_ASSETS.map((a) => a.plate)).toEqual(['p1', 'p2', 'p3', 'p4', 'p5', 'p6'])
  })
})

/* ----------------------------------------------------------------- beats */

describe('buildTimeline', () => {
  const beats = buildTimeline()

  it('is contiguous, starts at 0 and keeps the source beat order', () => {
    expect(beats[0].at).toBe(0)
    for (let i = 1; i < beats.length; i++) {
      expect(beats[i].at, beats[i].id).toBe(beats[i - 1].at + beats[i - 1].duration)
    }
    const kinds = beats.map((b) => b.kind)
    expect(kinds.slice(0, 14).every((k) => k === 'cut')).toBe(true)
    expect(kinds.slice(14)).toEqual(['rush', 'reveal', 'who', 'flood', 'lock', 'rest'])
  })

  it('fits the §2.7 budget: intro + rest + hand-off ≤ 14 s', () => {
    expect(INTRO_BUDGET_MS).toBe(14_000)
    expect(totalMs(beats)).toBeLessThanOrEqual(INTRO_BUDGET_MS)
    expect(fullRunMs(beats)).toBe(totalMs(beats) + HANDOFF_TOTAL_MS)
    expect(fullRunMs()).toBeLessThanOrEqual(INTRO_BUDGET_MS)
  })

  it('rests on the lockup for the X4 idle window before the hand-off', () => {
    const lock = beats.find((b) => b.kind === 'lock')
    const rest = beats.find((b) => b.kind === 'rest')
    expect(lock?.duration).toBe(LOCK_SETTLE_MS)
    expect(rest?.duration).toBe(REST_IDLE_MS)
    expect(REST_IDLE_MS).toBe(2500)
    expect(rest?.at).toBe((lock?.at ?? 0) + LOCK_SETTLE_MS)
  })

  it('is empty under reduced motion (the intro never runs)', () => {
    const none = buildTimeline({ reduced: true })
    expect(none).toEqual([])
    expect(totalMs(none)).toBe(0)
    expect(beatAt(none, 0)).toBeNull()
    expect(fastForwardTarget(none)).toBeNull()
    expect(fastForwardPlan(none, scheduleEvents(none), 0)).toEqual({ flush: [], resumeAt: 0 })
  })
})

describe('beatAt', () => {
  const beats = buildTimeline()
  const rush = beats.find((b) => b.kind === 'rush')!
  const lock = beats.find((b) => b.kind === 'lock')!

  it('returns the beat owning the screen at t, null outside the run', () => {
    expect(beatAt(beats, -1)).toBeNull()
    expect(beatAt(beats, 0)?.id).toBe('cut-a8')
    expect(beatAt(beats, 374)?.id).toBe('cut-a8')
    expect(beatAt(beats, 375)?.id).toBe('cut-a1')
    expect(beatAt(beats, rush.at)?.kind).toBe('rush')
    expect(beatAt(beats, rush.at - 1)?.kind).toBe('cut')
    expect(beatAt(beats, lock.at)?.kind).toBe('lock')
    expect(beatAt(beats, totalMs(beats) - 1)?.kind).toBe('rest')
    expect(beatAt(beats, totalMs(beats))).toBeNull()
  })
})

/* ---------------------------------------------------- skip / fast-forward */

describe('skip and fast-forward', () => {
  const beats = buildTimeline()
  const events = scheduleEvents(beats)
  const lock = beats.find((b) => b.kind === 'lock')!

  it('always resolve to the lockup', () => {
    expect(FAST_FORWARD_TARGET).toBe('lock')
    expect(fastForwardTarget(beats)?.id).toBe('lock')
    expect(fastForwardTarget(beats)).toBe(lock)
  })

  it('flush everything pending up to and including the lockup, from the first frame', () => {
    const plan = fastForwardPlan(beats, events, 0)
    expect(plan.resumeAt).toBe(lock.at)
    expect(plan.flush.at(-1)?.type).toBe('lock')
    expect(plan.flush.every((e) => e.at > 0 && e.at <= lock.at)).toBe(true)
    const types = plan.flush.map((e) => e.type)
    for (const t of ['montage-done', 'reveal', 'who', 'flood', 'lock']) expect(types).toContain(t)
    expect(types).not.toContain('rest')
  })

  it('flush only what is still pending mid-run', () => {
    const flood = beats.find((b) => b.kind === 'flood')!
    const plan = fastForwardPlan(beats, events, flood.at + 100)
    expect(plan.flush.map((e) => e.type)).toEqual(['lock'])
    expect(plan.resumeAt).toBe(lock.at)
  })

  it('have nothing to flush once the lockup has started', () => {
    expect(fastForwardPlan(beats, events, lock.at)).toEqual({ flush: [], resumeAt: lock.at })
    expect(fastForwardPlan(beats, events, totalMs(beats))).toEqual({ flush: [], resumeAt: lock.at })
  })
})

/* ---------------------------------------------------------------- events */

describe('scheduleEvents', () => {
  const beats = buildTimeline()
  const events = scheduleEvents(beats)

  it('is sorted by time and expands the cuts into the runner queue', () => {
    for (let i = 1; i < events.length; i++) expect(events[i].at).toBeGreaterThanOrEqual(events[i - 1].at)
    expect(events.filter((e) => e.type === 'cut')).toHaveLength(14)
    const clears = events.filter((e) => e.type === 'cut-clear')
    expect(clears).toHaveLength(13)
    for (const clear of clears) {
      const cut = beats.find((b) => b.kind === 'cut' && b.cut === (clear.cut ?? 0) + 1)!
      expect(clear.at).toBe(cut.at + CUT_CLEAR_MS)
    }
    const rush = beats.find((b) => b.kind === 'rush')!
    expect(events.find((e) => e.type === 'montage-done')?.at).toBe(rush.at + MONTAGE_DONE_MS)
    expect(events.at(-1)?.type).toBe('rest')
    expect(scheduleEvents([])).toEqual([])
  })
})

/* -------------------------------------------------------------- hand-off */

describe('hand-off (X4 option A)', () => {
  it('is the five beats at the §2.7 timings', () => {
    expect(HANDOFF_BEATS.map((b) => [b.id, b.at, b.duration])).toEqual([
      ['print', 0, 600],
      ['register', 600, 700],
      ['masthead', 600, 240],
      ['stamp', 1300, 180],
      ['land', 1480, 200],
    ])
    expect(HANDOFF_TOTAL_MS).toBe(1680)
    expect(handoffBeat('stamp').at).toBe(handoffBeat('register').at + handoffBeat('register').duration)
    expect(() => handoffBeat('nope' as never)).toThrow()
  })

  it('names the events and attributes the other islands wire to', () => {
    expect(INTRO_START_EVENT).toBe('signal:intro-start')
    expect(INTRO_DONE_EVENT).toBe('signal:intro-done')
    expect(SIGNAL_EVENTS.replayIntro).toBe('signal:replay-intro')
    expect(INTRO_HANDOFF_ATTR).toBe('data-intro-handoff')
    expect(INTRO_NAME_TARGET_ATTR).toBe('data-intro-name')
    expect(INTRO_ATTR).toBe('data-intro')
    expect(INTRO_SESSION_KEY).toBe('signal.intro')
  })
})

/* ------------------------------------------------------- content (§1.9) */

function flatten(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value)
  else if (Array.isArray(value)) value.forEach((v) => flatten(v, out))
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => flatten(v, out))
  return out
}

describe('intro copy (content + clutter law, §1.9)', () => {
  const all = flatten(INTRO_COPY)

  it('carries the real IEEE title, never the placeholder', () => {
    expect(INTRO_COPY.panels.a6.title).toBe(profile.publication.title)
    expect(INTRO_COPY.panels.a6.head).toBe(profile.publication.venue)
    expect(all.join('\n')).not.toMatch(/Signal Reconstruction/i)
  })

  it('keeps the post headlines and drops every count', () => {
    const text = (id: 'c1' | 'c2' | 'c3') =>
      INTRO_COPY.posts[id].text.map((r) => (typeof r === 'string' ? r : r.b)).join('')
    expect(text('c1')).toMatch(/joining .*Amazon Web Services.*Intern/)
    expect(text('c2')).toMatch(/12 weeks/)
    expect(text('c3')).toMatch(/3rd/)
    expect(text('c3')).toMatch(/Ticket-Forge/)
    for (const id of ['c1', 'c2', 'c3'] as const) {
      const card = INTRO_COPY.posts[id] as { meta?: string }
      expect(card.meta ?? '').not.toMatch(/\d/)
    }
    expect(all.join('\n')).not.toMatch(/impression|comments?\b|reposted|\b\d{2,3}\s*·\s*\d+/i)
  })

  it('has no build or test numbers, file names or the developer note', () => {
    const joined = all.join('\n')
    expect(joined).not.toMatch(/42 passing|312\s*ms|pod 9\/9|10k|msgs\/day|42\/42/i)
    expect(joined).not.toMatch(/\b[\w-]+\.(tsx?|jsx?|md|css|html|json|py|webp|svg)\b/i)
    expect(joined).not.toMatch(/BATTLESTATION|AWAITING OWNER|DEV ENV|tmux|draft v2|VOL\. 1/i)
    expect(joined).not.toMatch(/ascii|halftone/i)
  })

  it('keeps the montage texture and the lockup strings the director set', () => {
    expect(INTRO_COPY.panels.a2.cap).toBe('SCHNEIDER SHIFT')
    expect(INTRO_COPY.panels.a3.cap).toBe('TTY')
    expect(INTRO_COPY.panels.a4.cap).toBe('HISTORY')
    expect(INTRO_COPY.panels.a5.cap).toBe('EAST COAST')
    expect(INTRO_COPY.panels.a7.cap).toBe('MINIMAX')
    expect(INTRO_COPY.panels.a8.cap).toBe('CLOSE-UP')
    expect(INTRO_COPY.panels.a9.cap).toBe('MEANWHILE…')
    expect(INTRO_COPY.panels.a9.pow).toBe('FWIP!')
    expect(INTRO_COPY.panels.a10.pow).toBe('PUSH!')
    expect(INTRO_COPY.role).toBe('Software engineer')
    expect(INTRO_COPY.invite).toBe('Scroll to enter')
    expect(INTRO_COPY.skip).toBe('Skip')
    expect(INTRO_COPY.skipLabel).toContain(INTRO_COPY.skip)
    expect(`${INTRO_COPY.firstName} ${INTRO_COPY.surname}`).toBe(profile.displayName.toUpperCase())
  })
})
