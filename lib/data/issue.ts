/**
 * SIGNAL content data — the PRINT edition's issue furniture (v3 P1 cover,
 * P2–P6 chapter heads and folios). "Konnur Comics No. 1" is comic genre
 * furniture the clutter law allows (BRIEF-R2 §1); the chapter names and
 * decks are the approved PRINT copy from the round-2 frames. Facts stay in
 * profile / projects / experience — this file only names the chapters.
 *
 * Owners: the hero (C2) draws the cover; the section headers / footer (C1)
 * may read `chapters` and `folio` from here rather than re-typing them.
 */

import type { SectionAnchor } from '@/lib/commands/sections'
import { projects } from './projects'

export interface Chapter {
  anchor: SectionAnchor
  /** Roman numeral, e.g. 'I'. */
  numeral: string
  /** Chapter name, e.g. 'The Origin Story'. */
  title: string
  /** One line on what the chapter holds (the cover's contents). */
  deck: string
  /** Page number in the issue (the cover is page 1). */
  page: number
}

const NUMBER_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'] as const

/** "Seven projects, 2021–2026" — derived from the projects data, never typed. */
function projectsDeck(): string {
  const years = projects.map((p) => Number.parseInt(p.year, 10)).filter((y) => !Number.isNaN(y))
  const count = projects.length
  const word = NUMBER_WORDS[count] ?? String(count)
  const range = years.length ? `${Math.min(...years)}–${Math.max(...years)}` : ''
  return range ? `${word} projects, ${range}` : `${word} projects`
}

export const chapters: readonly Chapter[] = [
  { anchor: '#about', numeral: 'I', title: 'The Origin Story', deck: 'From Bengaluru to Boston', page: 2 },
  { anchor: '#skills', numeral: 'II', title: 'The Toolkit', deck: 'Every tool, and where he used it', page: 3 },
  { anchor: '#projects', numeral: 'III', title: 'Ticket-Forge & Co.', deck: projectsDeck(), page: 4 },
  { anchor: '#experience', numeral: 'IV', title: 'The Field Years', deck: 'Schneider Electric, then AWS', page: 5 },
  { anchor: '#contact', numeral: 'V', title: 'The Letters Page', deck: 'The inbox is open', page: 6 },
]

export function chapterFor(anchor: SectionAnchor): Chapter {
  return chapters.find((c) => c.anchor === anchor) ?? (chapters[0] as Chapter)
}

export const issue = {
  publisher: 'Konnur Comics',
  number: 'No. 1',
  price: '10¢',
  /** The imprint / folio line (allowed comic furniture). */
  folio: 'Konnur Comics · First printing · 2026',
  contentsTitle: 'In this issue',
  cover: {
    /** The narration caption at the top of the splash. */
    captionSuffix: '.',
    /** The one speech balloon — a clause of CONTENT_FINAL About P3. */
    speech: 'I like taking systems from prototype to production.',
    writeHim: 'Write him',
    resume: 'Resume',
    replayIntro: 'Replay the intro',
    /** The three sneak-preview cards (feature · chapter). */
    previews: [
      {
        anchor: '#skills' as SectionAnchor,
        title: ['Light up', 'the toolkit'],
        aria: 'Light up the toolkit, in The Toolkit',
      },
      {
        anchor: '#projects' as SectionAnchor,
        title: ['Play', 'Connect Four'],
        aria: 'Play Connect Four against the engine, in Ticket-Forge and Co.',
      },
      {
        anchor: '#contact' as SectionAnchor,
        title: ['Ask the', 'console', 'who I am'],
        aria: 'Ask the console who I am, in The Letters Page',
      },
    ],
    /** Card II's engine bubble and card III's prompt — genre art, not copy. */
    yourMove: 'Your move',
  },
} as const
