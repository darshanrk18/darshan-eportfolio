/**
 * Content data — the hero (v3 S1 stage + chapter cards, P1 cover).
 * Every visitor-facing string here is either read from profile / projects /
 * experience / photos or is the approved round-2/3 frame copy for the hero
 * (S1-Hero.md §3 + §9, P1-Cover.md §3 + §9): the cards abbreviate, the
 * cover's contents page names the chapters — nothing invents a fact.
 * Director call (b): copy the frames introduced is DATA, never a literal
 * in a component. The Hero RSC and the hero islands read only this file.
 */

import type { SectionAnchor } from '@/lib/commands/sections'
import type { LogoId } from './logos'
import { commits, type CommitEntry } from './experience'
import { profile } from './profile'
import { projects, type Project, type ProjectSlug } from './projects'

function project(slug: ProjectSlug): Project {
  const p = projects.find((x) => x.slug === slug)
  if (!p) throw new Error(`hero: unknown project ${slug}`)
  return p
}

function commit(id: CommitEntry['id']): CommitEntry {
  const c = commits.find((x) => x.id === id)
  if (!c) throw new Error(`hero: unknown commit ${id}`)
  return c
}

/**
 * The S1 card abbreviates the role the way the frame does
 * ('Software Development Engineer Intern' → 'SDE Intern'); everything else
 * in the role line is kept as written.
 */
export function shortRole(role: string): string {
  return role.replace('Software Development Engineer', 'SDE')
}

/** 1–12 as words, for the cover's "Seven projects" deck line. */
const NUMBER_WORDS = [
  'Zero',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
] as const

export function numberWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n)
}

/** "Seven projects, 2021–2026" — derived from the project list, never typed. */
export function projectsDeck(list: readonly Project[] = projects): string {
  const years = list.map((p) => Number.parseInt(p.year, 10)).filter((y) => !Number.isNaN(y))
  const min = Math.min(...years)
  const max = Math.max(...years)
  return `${numberWord(list.length)} projects, ${min}–${max}`
}

export interface HeroCareerRow {
  id: CommitEntry['id']
  name: string
  meta: string
  /** The lit node (the most recent employer). */
  lit: boolean
}

export interface CoverTocItem {
  anchor: SectionAnchor
  /** Chapter name (PRINT). */
  title: string
  /** Comic furniture: the page number. */
  page: string
  /** One line on what the chapter holds. */
  deck: string
}

export type CoverPreviewAction =
  | { kind: 'deploy-all' }
  | { kind: 'run-project'; slug: ProjectSlug }
  | { kind: 'scroll' }

export interface CoverPreview {
  anchor: SectionAnchor
  /** Two/three-line Bangers title; CSS uppercases it. */
  title: string
  /** The chapter it lives in. */
  chapter: string
  /** Link accessible name. */
  aria: string
  action: CoverPreviewAction
  /** Card art: 'toolkit' | 'board' | 'console'. */
  art: 'toolkit' | 'board' | 'console'
}

const aws = commit('aws-intern')
const schneider = commit('schneider')
const ticketForge = project('ticket-forge')
const triplay = project('triplay-ai')

/**
 * The Play card's static mini board, rows top → bottom, 7 columns:
 * y = you (ivory in SCREEN, yellow in PRINT), e = the engine, . = empty.
 * S1 §5: r4 c4 you; r5 c3, c4 engine; r6 c2 you, c3 engine, c4 you,
 * c5 engine, c6 you (4 + 4).
 */
export const HERO_MINI_BOARD: readonly string[] = [
  '.......',
  '.......',
  '.......',
  '...y...',
  '..ee...',
  '.yeyey.',
]

export const hero = {
  /* ---- shared ----------------------------------------------------------- */
  /** The h1, split so PRINT can stack the two words. */
  name: { first: 'Darshan', last: 'Konnur' },
  portraitAlt: profile.displayName,
  coverPortraitAlt: `${profile.displayName}, the cover hero, breaking out of the panel`,

  /* ---- SCREEN (S1) ------------------------------------------------------ */
  screen: {
    getInTouch: 'Get in touch',
    selectedWork: 'Selected work',
    nextLabel: 'Next: About',
    /** The ⌘K hint under the stage ("Press ⌘K to go anywhere"). */
    hintBefore: 'Press',
    hintAfter: 'to go anywhere',
  },
  cards: {
    work: {
      heading: 'Work',
      slug: ticketForge.slug,
      title: ticketForge.name,
      meta: ticketForge.award ?? '',
      body: ticketForge.short,
      link: 'Open the project',
    },
    skills: {
      heading: 'Skills',
      /** A hand-picked six from the languages row + the clusters (S1 §3 D). */
      chips: ['python', 'java', 'typescript', 'react', 'aws', 'docker'] as readonly LogoId[],
      link: 'Light up the toolkit',
    },
    experience: {
      heading: 'Experience',
      rows: [
        {
          id: aws.id,
          name: aws.company,
          meta: `${shortRole(aws.role)} · ${aws.periodShort}`,
          lit: true,
        },
        {
          id: schneider.id,
          name: schneider.company,
          meta: `${schneider.years} · ${schneider.award ?? ''}`,
          lit: false,
        },
      ] as readonly HeroCareerRow[],
      link: 'See which skills each job used',
    },
    play: {
      heading: 'Play',
      slug: triplay.slug,
      title: 'Connect Four',
      body: 'Against a Minimax engine.',
      link: 'Play a game',
    },
  },

  /* ---- PRINT (P1) — the cover ------------------------------------------ */
  cover: {
    /** Caption box, top-left of the splash. */
    caption: `${profile.locationLong}.`,
    roleBanner: profile.role,
    statusBanner: profile.status,
    education: `${profile.education.degree}, ${profile.education.school}`,
    educationDate: profile.education.expectedGrad,
    writeHim: 'Write him',
    resume: 'Resume',
    issueTitle: 'In this issue',
    toc: [
      { anchor: '#about', title: 'The Origin Story', page: '2', deck: 'From Bengaluru to Boston' },
      {
        anchor: '#skills',
        title: 'The Toolkit',
        page: '3',
        deck: 'Every tool, and where he used it',
      },
      { anchor: '#projects', title: 'Ticket-Forge & Co.', page: '4', deck: projectsDeck() },
      {
        anchor: '#experience',
        title: 'The Field Years',
        page: '5',
        deck: `${schneider.company}, then ${aws.companyShort}`,
      },
      { anchor: '#contact', title: 'The Letters Page', page: '6', deck: 'The inbox is open' },
    ] as readonly CoverTocItem[],
    /** A clause of CONTENT_FINAL About P3 — the one balloon on the cover. */
    speech: 'I like taking systems from prototype to production.',
    previews: [
      {
        anchor: '#skills',
        title: 'Light up the toolkit',
        chapter: 'The Toolkit',
        aria: 'Light up the toolkit, in The Toolkit',
        action: { kind: 'deploy-all' },
        art: 'toolkit',
      },
      {
        anchor: '#projects',
        title: 'Play Connect Four',
        chapter: 'Ticket-Forge & Co.',
        aria: 'Play Connect Four against the engine, in Ticket-Forge and Co.',
        action: { kind: 'run-project', slug: triplay.slug },
        art: 'board',
      },
      {
        anchor: '#contact',
        title: 'Ask the console who I am',
        chapter: 'The Letters Page',
        aria: 'Ask the console who I am, in The Letters Page',
        action: { kind: 'scroll' },
        art: 'console',
      },
    ] as readonly CoverPreview[],
    /** Sticker names on the toolkit preview art (P1 §3): now / off states are art. */
    toolkitStickers: [
      { id: 'react' as LogoId, state: '' },
      { id: 'nodejs' as LogoId, state: 'now' },
      { id: 'postgresql' as LogoId, state: 'off' },
    ],
    /** The engine's bubble on the board art (comic furniture). */
    yourMove: 'Your move',
    replayIntro: 'Replay the intro',
  },
} as const

export type Hero = typeof hero
