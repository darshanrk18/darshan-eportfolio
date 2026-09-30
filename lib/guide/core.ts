/**
 * V3_SPEC §2.6 — the guide's core (C5): ids, storage, progress and the
 * coach-mark bookkeeping, with NO visitor copy. This is the part the
 * always-mounted chip (components/guide/Guide.client.tsx) imports, so it
 * must stay tiny (§7: chip + gate + listeners ≈ 3.7 KB gz headroom).
 * lib/guide/guide.ts re-exports everything here and adds the eight items'
 * labels / how-lines / coach lines per edition — that module rides the lazy
 * surface, the coach mark and the palette chunk only.
 *
 * Pure: no DOM, no React, no store. Unit-tested in tests/guide.test.ts.
 *
 * Storage (§2.6): localStorage['signal.guide'] = JSON array of tried ids;
 * sessionStorage['signal.coach'] = JSON array of coach marks already shown
 * this session. Both readers tolerate garbage and blocked storage.
 */

import type { SectionAnchor } from '@/lib/commands/sections'

export type GuideId =
  | 'go-anywhere'
  | 'other-edition'
  | 'reveal-portrait'
  | 'light-toolkit'
  | 'play-c4'
  | 'open-project'
  | 'skills-per-job'
  | 'ask-console'

/** The eight, in chapter order (§2.6). */
export const GUIDE_IDS: readonly GuideId[] = [
  'go-anywhere',
  'other-edition',
  'reveal-portrait',
  'light-toolkit',
  'play-c4',
  'open-project',
  'skills-per-job',
  'ask-console',
]

export const GUIDE_TOTAL = GUIDE_IDS.length

/**
 * The section each feature lives in — null for the two chrome features
 * (the palette and the edition toggle), which never get a coach mark.
 */
export const GUIDE_SECTION: Record<GuideId, SectionAnchor | null> = {
  'go-anywhere': null,
  'other-edition': null,
  'reveal-portrait': '#about',
  'light-toolkit': '#skills',
  'play-c4': '#projects',
  'open-project': '#projects',
  'skills-per-job': '#experience',
  'ask-console': '#contact',
}

/** localStorage key — JSON array of tried ids. */
export const GUIDE_STORAGE_KEY = 'signal.guide'
/** sessionStorage key — JSON array of coach-mark ids shown this session. */
export const COACH_SESSION_KEY = 'signal.coach'
/**
 * Window event every area dispatches at its item's exact trigger:
 * `new CustomEvent('signal:guide-tried', { detail: { id } })`.
 */
export const GUIDE_TRIED_EVENT = 'signal:guide-tried'

/** Coach marks never show under this viewport width (the chip alone). */
export const COACH_MIN_WIDTH = 640
/** A coach mark appears after this much idle on its section (X3 motion note). */
export const COACH_IDLE_MS = 1200

export const GUIDE_CHIP_LABEL = '8 things to try'
export const GUIDE_COMPLETE_LABEL = "You've tried everything"

const ID_SET = new Set<string>(GUIDE_IDS)

export function isGuideId(value: unknown): value is GuideId {
  return typeof value === 'string' && ID_SET.has(value)
}

/* ------------------------------------------------------------------ storage */

/** The subset of Storage the guide touches (localStorage / sessionStorage / a fake). */
export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

/** Chapter-order, de-duplicated copy of an id list. */
export function sortIds(ids: readonly GuideId[]): GuideId[] {
  const set = new Set(ids)
  return GUIDE_IDS.filter((id) => set.has(id))
}

/** Parse a stored id list: tolerates garbage, drops unknown ids and duplicates, keeps chapter order. */
export function parseIds(raw: string | null | undefined): GuideId[] {
  if (!raw) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []
  const set = new Set<GuideId>()
  for (const v of parsed) if (isGuideId(v)) set.add(v)
  return GUIDE_IDS.filter((id) => set.has(id))
}

function readIds(storage: StorageLike | null | undefined, key: string): GuideId[] {
  if (!storage) return []
  try {
    return parseIds(storage.getItem(key))
  } catch {
    return []
  }
}

function writeIds(
  storage: StorageLike | null | undefined,
  key: string,
  ids: readonly GuideId[]
): boolean {
  if (!storage) return false
  try {
    storage.setItem(key, JSON.stringify(sortIds(ids)))
    return true
  } catch {
    return false
  }
}

/** localStorage['signal.guide'] → tried ids (chapter order). */
export function readTried(storage: StorageLike | null | undefined): GuideId[] {
  return readIds(storage, GUIDE_STORAGE_KEY)
}

/** Persist the tried ids; false when storage is unavailable. */
export function writeTried(
  storage: StorageLike | null | undefined,
  tried: readonly GuideId[]
): boolean {
  return writeIds(storage, GUIDE_STORAGE_KEY, tried)
}

/* ------------------------------------------------------------------ progress */

/**
 * Add an id to the tried list. Idempotent: returns the SAME array when the
 * id is already tried, so store subscribers see no change.
 */
export function markTried(tried: readonly GuideId[], id: GuideId): readonly GuideId[] {
  if (tried.includes(id)) return tried
  return sortIds([...tried, id])
}

export function isTried(tried: readonly GuideId[], id: GuideId): boolean {
  return tried.includes(id)
}

/** Untried ids, chapter order. */
export function untriedIds(tried: readonly GuideId[]): GuideId[] {
  return GUIDE_IDS.filter((id) => !tried.includes(id))
}

/** The first untried item in chapter order, or null when all eight are tried. */
export function nextUntried(tried: readonly GuideId[]): GuideId | null {
  return untriedIds(tried)[0] ?? null
}

export function triedCount(tried: readonly GuideId[]): number {
  return sortIds(tried).length
}

export function isComplete(tried: readonly GuideId[]): boolean {
  return triedCount(tried) >= GUIDE_TOTAL
}

/** "n of 8 tried" — the surface's count (tabular). */
export function progressLabel(tried: readonly GuideId[]): string {
  return `${triedCount(tried)} of ${GUIDE_TOTAL} tried`
}

/** The chip's accessible name: "8 things to try, n tried. Open the guide". */
export function chipAriaLabel(tried: readonly GuideId[], open: boolean): string {
  return `${GUIDE_CHIP_LABEL}${chipNameSuffix(tried, open)}`
}

/**
 * What the chip adds, visually hidden, after its visible label: the chip's
 * accessible name is computed from its content (the label the visitor sees,
 * then this), never an aria-label that replaces the visible words
 * (WCAG 2.5.3, label in name). The visible "n/8" count is aria-hidden; this
 * says it in words.
 */
export function chipNameSuffix(tried: readonly GuideId[], open: boolean): string {
  return `, ${triedCount(tried)} tried. ${open ? 'Close' : 'Open'} the guide`
}

/* --------------------------------------------------------------- coach marks */

/** sessionStorage['signal.coach'] → ids already shown this session. */
export function readCoachShown(session: StorageLike | null | undefined): GuideId[] {
  return readIds(session, COACH_SESSION_KEY)
}

/** Remember that a coach mark was shown this session (idempotent). */
export function markCoachShown(
  session: StorageLike | null | undefined,
  shown: readonly GuideId[],
  id: GuideId
): readonly GuideId[] {
  const next = shown.includes(id) ? shown : sortIds([...shown, id])
  if (next !== shown) writeIds(session, COACH_SESSION_KEY, next)
  return next
}

export interface CoachInput {
  tried: readonly GuideId[]
  shown: readonly GuideId[]
  /** store.activeSection ('hero' / 'footer' / null never match a section). */
  activeSection: SectionAnchor | 'hero' | 'footer' | null
  /** The open guide surface suppresses coach marks (X3). */
  guideOpen?: boolean
  /** Below COACH_MIN_WIDTH the chip is the only guide. */
  viewportWidth?: number
}

/**
 * The ONE coach mark that may show now: the first untried item (chapter
 * order) whose section is the active one and whose mark has not been shown
 * this session — or null. Items without a section never get one, nor does
 * Connect Four: the Work page's coach is the window's own status line (S4
 * F2d / P4 "YOUR MOVE"), so a second callout would break "at most one".
 */
export const NO_COACH_IDS: readonly GuideId[] = ['play-c4']

export function coachCandidate(input: CoachInput): GuideId | null {
  if (input.guideOpen) return null
  if (input.viewportWidth !== undefined && input.viewportWidth < COACH_MIN_WIDTH) return null
  if (!input.activeSection || input.activeSection === 'hero' || input.activeSection === 'footer') {
    return null
  }
  for (const id of GUIDE_IDS) {
    if (GUIDE_SECTION[id] !== input.activeSection) continue
    if (NO_COACH_IDS.includes(id)) continue
    if (input.tried.includes(id) || input.shown.includes(id)) continue
    return id
  }
  return null
}
