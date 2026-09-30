/**
 * SIGNAL content data — the About section (v3 S2 / P2), CONTENT_FINAL
 * 2026-09-23. The About copy used to live inline in About.tsx and the
 * retired SourcePane; it is data now so both editions and /cv draw from one
 * place. Every string here is either CONTENT_FINAL verbatim or an approved
 * round-2/3 frame edit of it (design-workshop/v3/inventory/S2-About.md §9,
 * P2-About.md §3) — nothing may be added that is not in CONTENT_FINAL.
 *
 * Rich text: a paragraph is a list of segments; `{ em }` marks the phrases
 * CONTENT_FINAL sets in <em> (SCREEN: serif italic; PRINT: bold with the
 * yellow highlighter). `plain()` flattens one for /cv, SEO and tests.
 */

import { profile } from './profile'
import { commits } from './experience'
import { FILMSTRIP_ORDER, type PhotoKey } from './photos'

export type RichSegment = string | { em: string }
export type Rich = readonly RichSegment[]

/** Flatten a rich paragraph to plain text. */
export function plain(rich: Rich): string {
  return rich.map((s) => (typeof s === 'string' ? s : s.em)).join('')
}

/** One of the three facts under the SCREEN copy (each said once per screen). */
export interface AboutFact {
  /** The number, rendered exactly as written ('10,000+' — never '10k+'). */
  value: string
  /** Visitor-language label. */
  label: string
}

/** One leg of the S2 filmstrip: a city, its years, and its photographs. */
export interface FilmstripLeg {
  city: string
  years: string
  photos: readonly PhotoKey[]
}

/** The AWS outcome line, split for the P2 ink box ("RETURNED WITH / a full-time SDE offer."). */
const awsOutcome = commits.find((c) => c.id === 'aws-intern')?.outcome ?? ''
const outcomeLead = 'Returned with'

export const about = {
  /** Section kicker (SCREEN eyebrow). */
  kicker: 'About',
  /** SCREEN title (S2). */
  title: 'Origin',

  /* ---- CONTENT_FINAL About copy, verbatim (the /cv + SEO source) -------- */
  paragraphs: {
    p1: [
      'I’m a software engineer in Boston, finishing my MS in Computer Science at Northeastern and joining ',
      { em: 'Amazon Web Services' },
      ' as a Software Development Engineer in January 2027.',
    ] as Rich,
    p2: [
      'Last summer at AWS I built a serverless system that captures visual evidence for cloud-security workflows — Java, Python, Lambda, and infrastructure as code, tested to ',
      { em: '100% coverage' },
      ' against a live AWS environment. Before grad school I spent three years at Schneider Electric shipping applications used by ',
      { em: '10,000+ employees' },
      ' and earning the SURGE Award.',
    ] as Rich,
    p3: [
      'My ticket-assignment system Ticket-Forge took ',
      { em: '3rd place at the Google MLOps Project Expo' },
      '; my research on medical-sample allocation is published with ',
      { em: 'IEEE' },
      '; and as a teaching assistant I mentored ',
      { em: '300+ graduate students' },
      ' in software design. I like taking systems from prototype to production — and proving they work.',
    ] as Rich,
  },
  /** The pull-quote (P2's closing panel; unchanged from CONTENT_FINAL). */
  pullQuote: 'I build software the way good code reads: clear, intentional, and built to last.',
  signature: 'Darshan',

  /* ---- SCREEN (S2): the frame's trimmed copy + the three facts ---------- */
  screen: {
    /** P1 minus the date (it is the first fact below) and the italic. */
    lede: 'I’m a software engineer in Boston, finishing my MS in Computer Science at Northeastern and joining Amazon Web Services as a Software Development Engineer.',
    /** P2 without the stack list and the 10,000+ (both are said elsewhere on the screen). */
    p1: 'Last summer at AWS I built a serverless system that captures visual evidence for cloud-security workflows. Before grad school I spent three years at Schneider Electric building enterprise workflow applications, and earned the SURGE Award.',
    /** P3 without the TA clause (the third fact). */
    p2: 'Ticket-Forge, my ticket-assignment system, took 3rd place at the Google MLOps Project Expo, and my research on medical-sample allocation is published with IEEE. I like taking systems from prototype to production — and proving they work.',
    facts: [
      { value: profile.incoming.start, label: 'My start date at AWS' },
      { value: '10,000+', label: 'Schneider staff used my apps' },
      { value: profile.education.ta.students, label: 'Students I mentored as a TA' },
    ] as readonly AboutFact[],
    portraitAlt: 'Darshan Konnur, smiling, in a checked blazer',
    replayLabel: 'Replay the portrait',
    filmstripLabel: 'Bengaluru to Boston, in six photographs',
    legs: [
      { city: 'Bengaluru', years: '2021 – 2023', photos: FILMSTRIP_ORDER.slice(0, 2) },
      { city: 'Boston', years: `Since ${profile.education.msStartYear}`, photos: FILMSTRIP_ORDER.slice(2) },
    ] as readonly FilmstripLeg[],
    /** The photo viewer's close control. */
    viewerClose: 'Close',
    nextLabel: 'Next: Skills',
  },

  /* ---- PRINT (P2): Ch. I — the eight comic panels ----------------------- */
  print: {
    chapter: { numeral: 'Ch. I', title: 'The Origin Story' },
    panels: {
      portrait: {
        label: 'Darshan Konnur, portrait',
        narration: [
          'I’m a software engineer in Boston, finishing my MS in Computer Science at Northeastern and joining ',
          { em: 'Amazon Web Services' },
          ' as a Software Development Engineer in January 2027.',
        ] as Rich,
        tryPrefix: 'Try:',
        tryLabel: 'Reveal the portrait',
      },
      bengaluru: {
        photo: 'schneider_office' as PhotoKey,
        narration: [
          'Before grad school I spent three years at Schneider Electric shipping applications used by ',
          { em: '10,000+ employees' },
          '…',
        ] as Rich,
        tag: 'Bengaluru',
      },
      exora: {
        photo: 'schneider_exora' as PhotoKey,
        lead: '…and earning the',
        award: 'SURGE Award.',
      },
      boston: {
        photo: 'neu_quad' as PhotoKey,
        corner: 'Later — January 2025.',
        narration: [
          'My ticket-assignment system Ticket-Forge took ',
          { em: '3rd place at the Google MLOps Project Expo' },
          '.',
        ] as Rich,
        tag: 'Boston',
      },
      dayOne: {
        photo: 'badge' as PhotoKey,
        burst: ['Day', 'One'] as readonly string[],
        tag: 'June 2026',
      },
      seaport: {
        photo: 'desk' as PhotoKey,
        label: 'The Seaport.',
        narration: [
          'Last summer at AWS I built a serverless system that captures visual evidence for cloud-security workflows — Java, Python, Lambda, and infrastructure as code, tested to ',
          { em: '100% coverage' },
          ' against a live AWS environment.',
        ] as Rich,
        /** Logo stickers: id from lib/data/logos + the visible name. */
        stickers: [
          { id: 'java', label: 'Java' },
          { id: 'python', label: 'Python' },
          { id: 'aws', label: 'AWS Lambda' },
        ] as readonly { id: string; label: string }[],
      },
      door: {
        photo: 'door' as PhotoKey,
        narration: [
          'As a teaching assistant I mentored ',
          { em: '300+ graduate students' },
          ' in software design. I like taking systems from prototype to production — and proving they work.',
        ] as Rich,
        outcome: {
          lead: outcomeLead,
          rest: awsOutcome.startsWith(outcomeLead)
            ? awsOutcome.slice(outcomeLead.length).trim()
            : awsOutcome,
        },
      },
      quote: { label: 'In his words' },
    },
    /** Footer link to Ch. II. */
    continued: 'Continued in Ch. II — The Toolkit',
    folioPage: 'Page 2',
  },
} as const

export type About = typeof about
