/**
 * v3 §2.7 — the PRINT intro's timeline, PURE (no DOM, no React).
 *
 * The beat order is the one HANDOFF.md §5 (Sep 25) records for the finished
 * intro — montage → rush → KONNUR letterform reveal → chrome flood → lockup —
 * ported number for number from design-workshop/intro-FINAL.html's `CUTS`,
 * `HOLDS` and `build()`; then the REST window the X4 hand-off (option A)
 * adds, and the hand-off's own five beats (PRINT · REGISTER · masthead ·
 * STAMP · LAND). components/intro/Intro.client.tsx is the runner: it turns
 * `scheduleEvents()` into class flips on its own DOM and never decides a
 * time itself. tests/intro-timeline.test.ts holds this file to the spec:
 * the whole thing (intro + rest + hand-off) is ≤ 14 s, skip / fast-forward
 * resolve to the lockup, reduced motion yields an empty timeline.
 *
 * All times are milliseconds from the intro's first frame.
 */

/* ------------------------------------------------------------------ art */

/** Montage transition grammar (intro-FINAL.html: cut / page-flip / slide / whip-pan). */
export type MontageFx = 'cut' | 'flip' | 'slide' | 'whip'

/**
 * The art bank ids: a1–a13 the drawn comic panels, p1–p6 the real-photo
 * plates (lib/data/introAssets.ts), c1–c3 the post dispatch cards. The
 * source's reserved `pdev` stand-in (the developer-note plate) is dropped
 * per V3_SPEC §1.9.
 */
export type ArtId =
  | 'a1'
  | 'a2'
  | 'a3'
  | 'a4'
  | 'a5'
  | 'a6'
  | 'a7'
  | 'a8'
  | 'a9'
  | 'a10'
  | 'a11'
  | 'a12'
  | 'a13'
  | 'p1'
  | 'p2'
  | 'p3'
  | 'p4'
  | 'p5'
  | 'p6'
  | 'c1'
  | 'c2'
  | 'c3'

export const ART_IDS: readonly ArtId[] = [
  'a1',
  'a2',
  'a3',
  'a4',
  'a5',
  'a6',
  'a7',
  'a8',
  'a9',
  'a10',
  'a11',
  'a12',
  'a13',
  'p1',
  'p2',
  'p3',
  'p4',
  'p5',
  'p6',
  'c1',
  'c2',
  'c3',
]

export interface MontageCut {
  art: ArtId
  fx: MontageFx
  /** Camera drift: scale from → to, translate from → to (CSS lengths). */
  s0: number
  s1: number
  x0: string
  y0: string
  x1: string
  y1: string
  /** Slide-in origin for the `slide` fx (`--sx`). */
  sx?: string
  /** How long this cut holds before the next one (the source's HOLDS). */
  hold: number
}

/**
 * BEAT 0 — the montage: 14 cuts, drawn origin → Schneider photos early →
 * the quad arrival (p6) → Boston pages late → post cards → abstract speed
 * pages. Holds are a strictly decreasing curve (375 ms opener, ratio ≈ .9)
 * that sums to 2891 ms — the source's "Beat 0 window: 2886–2900 ms".
 */
export const MONTAGE_CUTS: readonly MontageCut[] = [
  { art: 'a8', fx: 'cut', s0: 2.75, s1: 3.0, x0: '0%', y0: '4%', x1: '1%', y1: '1%', hold: 375 },
  { art: 'a1', fx: 'flip', s0: 1.06, s1: 1.15, x0: '0%', y0: '1%', x1: '-1%', y1: '-1%', hold: 338 },
  { art: 'p1', fx: 'slide', s0: 1.1, s1: 1.18, x0: '0%', y0: '2%', x1: '-1%', y1: '-1%', sx: '106%', hold: 304 },
  { art: 'a2', fx: 'flip', s0: 1.06, s1: 1.14, x0: '1%', y0: '0%', x1: '-1%', y1: '-1%', hold: 273 },
  { art: 'p2', fx: 'whip', s0: 1.08, s1: 1.18, x0: '-1%', y0: '1%', x1: '1%', y1: '-1%', hold: 246 },
  { art: 'p6', fx: 'flip', s0: 1.09, s1: 1.19, x0: '0%', y0: '2%', x1: '0%', y1: '-1%', hold: 221 },
  { art: 'a5', fx: 'slide', s0: 1.06, s1: 1.14, x0: '0%', y0: '-2%', x1: '0%', y1: '1%', sx: '-106%', hold: 199 },
  { art: 'p3', fx: 'flip', s0: 1.1, s1: 1.22, x0: '0%', y0: '-2%', x1: '0%', y1: '2%', hold: 179 },
  { art: 'p4', fx: 'whip', s0: 1.28, s1: 1.42, x0: '1%', y0: '1%', x1: '-1%', y1: '-2%', hold: 161 },
  { art: 'p5', fx: 'slide', s0: 1.1, s1: 1.2, x0: '0%', y0: '0%', x1: '-1%', y1: '1%', sx: '106%', hold: 145 },
  { art: 'c1', fx: 'flip', s0: 1.03, s1: 1.08, x0: '0%', y0: '1%', x1: '0%', y1: '-1%', hold: 131 },
  { art: 'c2', fx: 'whip', s0: 1.03, s1: 1.08, x0: '0%', y0: '-1%', x1: '0%', y1: '1%', hold: 118 },
  { art: 'a10', fx: 'whip', s0: 1.16, s1: 1.3, x0: '0%', y0: '0%', x1: '0%', y1: '0%', hold: 106 },
  { art: 'a12', fx: 'cut', s0: 1.25, s1: 1.45, x0: '0%', y0: '0%', x1: '0%', y1: '0%', hold: 95 },
]

/** BEAT 1 — the rush: the blurred strip that whips past (source order, `pdev` dropped). */
export const RUSH_STRIP: readonly ArtId[] = ['a9', 'p3', 'a2', 'a11', 'c3', 'a1', 'p1', 'a4', 'a12']

/** BEAT 2 — the strip seen through the KONNUR letterforms (the pull-back reveal). */
export const MASK_STRIP: readonly ArtId[] = [
  'a4',
  'a8',
  'a1',
  'a10',
  'a3',
  'a6',
  'a2',
  'a9',
  'a5',
  'a13',
  'a7',
  'a11',
  'a12',
]

/* ------------------------------------------------------------ constants */

/** A pan's `on`/`off` classes are cleared this long after the NEXT cut lands. */
export const CUT_CLEAR_MS = 700
/** The rush strip runs this long before the reveal. */
export const RUSH_MS = 1190
/** The montage is hidden this long after the rush starts (its last pose dims beneath). */
export const MONTAGE_DONE_MS = 190
/** reveal → the "DARSHAN" eyebrow. */
export const REVEAL_TO_WHO_MS = 1260
/** reveal → the chrome flood + light sweep + 3D landing. */
export const REVEAL_TO_FLOOD_MS = 1610
/** flood → the lockup (lands as landIn's rotateX settle completes). */
export const FLOOD_TO_LOCK_MS = 1200
/**
 * The lockup's own settle: shockwave, ember flurry, deep sweep, rule, role,
 * then the invitation (invIn ends at 1.2 s + .9 s). REST begins after it.
 */
export const LOCK_SETTLE_MS = 2200
/** X4 REST: the hand-off starts on the first scroll intent, or after this idle. */
export const REST_IDLE_MS = 2500
/** V3_SPEC §2.7 — the whole thing, intro + rest + hand-off, must fit in this. */
export const INTRO_BUDGET_MS = 14000

/* ---------------------------------------------------------------- beats */

export type IntroBeatKind = 'cut' | 'rush' | 'reveal' | 'who' | 'flood' | 'lock' | 'rest'

export interface IntroBeat {
  id: string
  kind: IntroBeatKind
  /** Start, ms from the first frame. */
  at: number
  /** How long the beat owns the screen before the next one starts. */
  duration: number
  /** For `cut` beats: the index into MONTAGE_CUTS. */
  cut?: number
}

/** Skip / fast-forward always resolve to this beat (the lockup). */
export const FAST_FORWARD_TARGET: IntroBeatKind = 'lock'

export interface BuildTimelineOptions {
  /** html[data-motion='reduced'] — the intro never runs; the timeline is empty. */
  reduced?: boolean
}

/**
 * The ordered beat list. Contiguous: each beat starts where the previous
 * one ends, so `totalMs()` is the last beat's end. Empty under reduced
 * motion (the gate never mounts the intro then; this keeps the contract
 * testable without a DOM).
 */
export function buildTimeline(options: BuildTimelineOptions = {}): IntroBeat[] {
  if (options.reduced) return []
  const beats: IntroBeat[] = []
  let t = 0
  MONTAGE_CUTS.forEach((cut, index) => {
    beats.push({ id: `cut-${cut.art}`, kind: 'cut', at: t, duration: cut.hold, cut: index })
    t += cut.hold
  })
  const rushAt = t
  beats.push({ id: 'rush', kind: 'rush', at: rushAt, duration: RUSH_MS })
  const revealAt = rushAt + RUSH_MS
  beats.push({ id: 'reveal', kind: 'reveal', at: revealAt, duration: REVEAL_TO_WHO_MS })
  beats.push({
    id: 'who',
    kind: 'who',
    at: revealAt + REVEAL_TO_WHO_MS,
    duration: REVEAL_TO_FLOOD_MS - REVEAL_TO_WHO_MS,
  })
  const floodAt = revealAt + REVEAL_TO_FLOOD_MS
  beats.push({ id: 'flood', kind: 'flood', at: floodAt, duration: FLOOD_TO_LOCK_MS })
  const lockAt = floodAt + FLOOD_TO_LOCK_MS
  beats.push({ id: 'lock', kind: 'lock', at: lockAt, duration: LOCK_SETTLE_MS })
  beats.push({ id: 'rest', kind: 'rest', at: lockAt + LOCK_SETTLE_MS, duration: REST_IDLE_MS })
  return beats
}

/** End of the last beat (0 for an empty timeline). */
export function totalMs(beats: readonly IntroBeat[]): number {
  return beats.reduce((end, b) => Math.max(end, b.at + b.duration), 0)
}

/** The beat that owns the screen at `t` (null before 0 or once the list has ended). */
export function beatAt(beats: readonly IntroBeat[], t: number): IntroBeat | null {
  if (t < 0) return null
  let found: IntroBeat | null = null
  for (const beat of beats) {
    if (beat.at <= t && t < beat.at + beat.duration) found = beat
  }
  return found
}

/** The lockup beat — where every skip and fast-forward lands. */
export function fastForwardTarget(beats: readonly IntroBeat[]): IntroBeat | null {
  return beats.find((b) => b.kind === FAST_FORWARD_TARGET) ?? null
}

/* --------------------------------------------------------------- events */

/**
 * What the runner actually executes: beats expanded into the source's
 * `build()` queue — every cut also schedules the clear of the PREVIOUS pan
 * (`cut-clear`, +700 ms) and the rush schedules `montage-done` (+190 ms).
 */
export type IntroEventType =
  | 'cut'
  | 'cut-clear'
  | 'rush'
  | 'montage-done'
  | 'reveal'
  | 'who'
  | 'flood'
  | 'lock'
  | 'rest'

export interface IntroEvent {
  at: number
  type: IntroEventType
  /** MONTAGE_CUTS index for `cut` (the pan to show) and `cut-clear` (the pan to clear). */
  cut?: number
}

export function scheduleEvents(beats: readonly IntroBeat[]): IntroEvent[] {
  const events: IntroEvent[] = []
  for (const beat of beats) {
    switch (beat.kind) {
      case 'cut': {
        const index = beat.cut ?? 0
        events.push({ at: beat.at, type: 'cut', cut: index })
        if (index > 0) events.push({ at: beat.at + CUT_CLEAR_MS, type: 'cut-clear', cut: index - 1 })
        break
      }
      case 'rush':
        events.push({ at: beat.at, type: 'rush' })
        events.push({ at: beat.at + MONTAGE_DONE_MS, type: 'montage-done' })
        break
      default:
        events.push({ at: beat.at, type: beat.kind })
    }
  }
  /* stable sort by time — equal times keep the beat order */
  return events
    .map((event, order) => ({ event, order }))
    .sort((a, b) => a.event.at - b.event.at || a.order - b.order)
    .map((x) => x.event)
}

export interface FastForwardPlan {
  /** Pending events to apply at once, in order (everything up to and including the lockup). */
  flush: IntroEvent[]
  /** Where the clock resumes: the lockup's start. */
  resumeAt: number
}

/**
 * Skip / wheel / touch-move / keyboard at `elapsed` ms: which of the still
 * pending events snap to their end state, and where the clock continues so
 * the lockup's own settle still plays. Nothing to flush once the lockup has
 * started (the caller then moves on to the hand-off instead).
 */
export function fastForwardPlan(
  beats: readonly IntroBeat[],
  events: readonly IntroEvent[],
  elapsed: number,
): FastForwardPlan {
  const target = fastForwardTarget(beats)
  if (!target) return { flush: [], resumeAt: 0 }
  if (elapsed >= target.at) return { flush: [], resumeAt: target.at }
  return {
    flush: events.filter((e) => e.at > elapsed && e.at <= target.at),
    resumeAt: target.at,
  }
}

/* ------------------------------------------------------------- hand-off */

export type HandoffBeatId = 'print' | 'register' | 'masthead' | 'stamp' | 'land'

export interface HandoffBeat {
  id: HandoffBeatId
  /** ms from the hand-off's first frame. */
  at: number
  duration: number
}

/**
 * X4 option A, as the spec §2.7 times it: the halftone sweep prints the
 * crimson page to cream (600), the name glides into the cover's slot
 * (700, --ease-structural) while the masthead drops (240, concurrent), the
 * DK seal stamps (180; scale 1.4 → 1 + 6° settle + ink bleed, director
 * call (i)), the cover lands and the overlay leaves (200).
 */
export const HANDOFF_BEATS: readonly HandoffBeat[] = [
  { id: 'print', at: 0, duration: 600 },
  { id: 'register', at: 600, duration: 700 },
  { id: 'masthead', at: 600, duration: 240 },
  { id: 'stamp', at: 1300, duration: 180 },
  { id: 'land', at: 1480, duration: 200 },
]

export const HANDOFF_TOTAL_MS = HANDOFF_BEATS.reduce(
  (end, b) => Math.max(end, b.at + b.duration),
  0,
)

export function handoffBeat(id: HandoffBeatId): HandoffBeat {
  const beat = HANDOFF_BEATS.find((b) => b.id === id)
  if (!beat) throw new Error(`hand-off beat missing: ${id}`)
  return beat
}

/** Intro + rest + hand-off, the number the §2.7 "≤ 14 s" budget is checked against. */
export function fullRunMs(beats: readonly IntroBeat[] = buildTimeline()): number {
  return totalMs(beats) + HANDOFF_TOTAL_MS
}
