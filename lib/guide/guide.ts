/**
 * V3_SPEC §2.6 — the guide's pure module (C5): the eight items with their
 * visitor-language copy per edition, on top of lib/guide/core.ts (ids,
 * storage round-trip, "next untried", coach bookkeeping — re-exported here
 * so tests and lazy surfaces have ONE import site). No DOM, no React, no
 * store. Unit-tested in tests/guide.test.ts.
 *
 * Who imports what (§7 budget): the always-mounted chip imports ONLY
 * lib/guide/core.ts; this module (the strings) rides the lazy surface, the
 * coach mark and the palette chunk, and is imported on demand by the chip
 * for the aria-live "tried" announcement.
 *
 * Copy law: every string here is visitor language (BRIEF-R2 §1) — no file
 * names, no command syntax, no numbers that are build evidence. The two
 * labels that differ per edition (items 1 and 2) are intentional: item 2
 * names the OTHER edition, and it must stay equal to
 * SWITCH_EDITION_LABELS in lib/commands/registry.ts (asserted in the test).
 *
 * Mouse or touch (lib/utils/input.ts): a line that names a key or a hover
 * has a `…Touch` wording for touch screens (no keys, no hover — and on a
 * phone the palette opens only from this guide). The surface and the coach
 * mark render both; CSS shows one.
 */

import type { Edition } from '@/lib/edition/prepaint'
import type { InputKind } from '@/lib/utils/input'
import {
  GUIDE_COMPLETE_LABEL,
  GUIDE_SECTION,
  isComplete,
  progressLabel,
  type GuideId,
} from './core'
import type { SectionAnchor } from '@/lib/commands/sections'

export * from './core'

export const GUIDE_TRY_LABEL = 'Try it'
export const GUIDE_THIS_PAGE_LABEL = 'This page'
export const GUIDE_TRIED_LABEL = 'Tried'
export const GUIDE_UNTRIED_LABEL = 'Not tried yet'
export const GUIDE_NEXT_LABEL = "You're here"
/** PRINT's coach bubble kicker (X3 B1). */
export const GUIDE_COACH_KICKER = 'Try this'
export const GUIDE_DISMISS_LABEL = 'Dismiss the hint'
/** Footer link: SCREEN "More in ⌘K" (the keycap is rendered), PRINT "More under Jump". */
export const GUIDE_MORE_LABEL: Record<Edition, string> = {
  screen: 'More in',
  print: 'More under Jump',
}
/**
 * The footer on a touch screen: no keycap, and no "Jump" (the chip is hidden
 * on touch). PRINT uses it beside the compact bar too, which has no Jump chip.
 */
export const GUIDE_MORE_TOUCH_LABEL = 'More things to try'
/** The palette's Next row prefix: "Try: Light up the toolkit". */
export const GUIDE_PALETTE_PREFIX = 'Try: '

export interface GuideItem {
  id: GuideId
  /** The section the feature lives in; null for chrome features (palette, toggle). */
  section: SectionAnchor | null
  /** Row label per edition. */
  label: Record<Edition, string>
  /** One-line "how" under the label. */
  how: Record<Edition, string>
  /** The "how" on a touch screen, where `how` names a key or a hover (else `how` serves both). */
  howTouch?: Partial<Record<Edition, string>>
  /** Where the feature is, for the palette's Next row (section name / chapter). */
  where: Record<Edition, string>
  /** The coach mark's line beside the control; null = no coach mark (per edition: null = that edition draws its own, in the frame). */
  coach: Record<Edition, string | null> | null
  /** The coach line on a touch screen, where `coach` names a hover (else `coach` serves both). */
  coachTouch?: Partial<Record<Edition, string>>
}

const both = (s: string): Record<Edition, string> => ({ screen: s, print: s })

export const GUIDE_ITEMS: readonly GuideItem[] = [
  {
    id: 'go-anywhere',
    section: GUIDE_SECTION['go-anywhere'],
    label: { screen: 'Go anywhere', print: 'Jump to any page' },
    how: {
      screen: 'Press ⌘K to search every page and action.',
      print: 'Press ⌘K to jump to any chapter or action.',
    },
    /* No ⌘K chip on touch: the row's own button opens the palette. */
    howTouch: {
      screen: `Tap ${GUIDE_TRY_LABEL} to search every page and action.`,
      print: `Tap ${GUIDE_TRY_LABEL} to jump to any chapter or action.`,
    },
    where: { screen: 'Top bar', print: 'Masthead' },
    coach: null,
  },
  {
    id: 'other-edition',
    section: GUIDE_SECTION['other-edition'],
    /* Must equal SWITCH_EDITION_LABELS (registry) — asserted in the test. */
    label: { screen: 'Read it as a comic', print: 'See the screen edition' },
    how: {
      screen: 'The same story, inked as a comic. Your place on the page is kept.',
      print: 'The same story as a dark, cinematic cut. Your place on the page is kept.',
    },
    where: { screen: 'Top bar', print: 'Masthead' },
    coach: null,
  },
  {
    id: 'reveal-portrait',
    section: GUIDE_SECTION['reveal-portrait'],
    label: both('Reveal the portrait'),
    how: {
      screen: 'The portrait resolves from glyphs into the photograph.',
      print: 'The halftone dots dissolve into the photograph.',
    },
    where: { screen: 'About', print: 'Ch. I' },
    coach: {
      screen: 'Hover the portrait, or replay it, to watch it resolve.',
      /* P2 draws the panel's own "TRY: REVEAL THE PORTRAIT" tag — that is the page's coach. */
      print: null,
    },
    /* A touch never hovers the portrait; the replay control is the way in. */
    coachTouch: { screen: 'Tap replay to watch the portrait resolve.' },
  },
  {
    id: 'light-toolkit',
    section: GUIDE_SECTION['light-toolkit'],
    label: both('Light up the toolkit'),
    how: {
      screen: 'Every skill on the page switches on, one at a time.',
      print: 'The stickers ink in one by one. Stop on any to see the work behind it.',
    },
    where: { screen: 'Skills', print: 'Ch. II' },
    coach: {
      screen: 'Start here, then tap any skill to see where I used it.',
      print: 'The red button lights up the whole toolkit.',
    },
  },
  {
    id: 'play-c4',
    section: GUIDE_SECTION['play-c4'],
    label: both('Play Connect Four'),
    how: {
      screen: "Drop a disc against the engine. You're ivory.",
      print: "Drop a disc against the engine. You're yellow.",
    },
    where: { screen: 'Work', print: 'Ch. III' },
    /* The Work page's one coach mark is the window's own status line (S4
       F2d "You're ivory…" / P4 "YOUR MOVE" box, both role=note): a second
       callout beside the board would break "at most one visible" (X3). */
    coach: null,
  },
  {
    id: 'open-project',
    section: GUIDE_SECTION['open-project'],
    label: both('Open a project full size'),
    how: {
      screen: 'Any project window opens full size, demo and case file together.',
      print: 'Any project panel opens full size, demo and case file together.',
    },
    where: { screen: 'Work', print: 'Ch. III' },
    coach: {
      screen: 'Maximize the window to see the demo full size.',
      print: 'Open the panel full size to see the demo big.',
    },
  },
  {
    id: 'skills-per-job',
    section: GUIDE_SECTION['skills-per-job'],
    label: both('See which skills each job used'),
    how: {
      screen: 'Switch it on, then hover a job to see the tools it used.',
      print: 'Switch it on, then pick a job to see the stickers it used.',
    },
    howTouch: { screen: 'Switch it on, then tap a job to see the tools it used.' },
    where: { screen: 'Experience', print: 'Ch. IV' },
    coach: {
      screen: 'Switch this on, then hover a job.',
      print: 'Flip the switch, then pick a job.',
    },
    coachTouch: { screen: 'Switch this on, then tap a job.' },
  },
  {
    id: 'ask-console',
    section: GUIDE_SECTION['ask-console'],
    label: both('Ask the console who I am'),
    how: both('The console answers in its own words, portrait included.'),
    where: { screen: 'Contact', print: 'Ch. V' },
    coach: both('Ask the console who I am, right at the prompt.'),
  },
]

const ITEM_BY_ID: Record<GuideId, GuideItem> = Object.fromEntries(
  GUIDE_ITEMS.map((item) => [item.id, item])
) as Record<GuideId, GuideItem>

export function getGuideItem(id: GuideId): GuideItem {
  return ITEM_BY_ID[id]
}

export function guideLabel(id: GuideId, edition: Edition): string {
  return ITEM_BY_ID[id].label[edition]
}

export function guideHow(id: GuideId, edition: Edition, input: InputKind = 'mouse'): string {
  const item = ITEM_BY_ID[id]
  return (input === 'touch' && item.howTouch?.[edition]) || item.how[edition]
}

export function guideWhere(id: GuideId, edition: Edition): string {
  return ITEM_BY_ID[id].where[edition]
}

export function guideCoach(
  id: GuideId,
  edition: Edition,
  input: InputKind = 'mouse'
): string | null {
  const item = ITEM_BY_ID[id]
  const line = item.coach?.[edition] ?? null
  if (line === null) return null
  return (input === 'touch' && item.coachTouch?.[edition]) || line
}

/** The polite announcement when an item completes. */
export function triedAnnouncement(
  id: GuideId,
  tried: readonly GuideId[],
  edition: Edition
): string {
  const base = `${GUIDE_TRIED_LABEL}: ${guideLabel(id, edition)}. ${progressLabel(tried)}.`
  return isComplete(tried) ? `${base} ${GUIDE_COMPLETE_LABEL}.` : base
}
