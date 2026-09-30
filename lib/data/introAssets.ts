/**
 * v3 §2.7 — the PRINT intro's assets AND copy (Phase B wrote the photo
 * manifest; C6 added every visible string, so the intro component holds no
 * prose of its own — content law: everything a visitor reads comes from
 * lib/data, and the §1.9 corrections are applied HERE, once).
 *
 * Photo plates: the six real-photo plates of the montage
 * (design-workshop/intro-FINAL.html p1..p6, the crimson duotones), shipped
 * as files under public/intro/ (≤ 760 px on the long side, WebP q80, never
 * base64) by scripts/prepare-intro-photos.py. Order = the montage's own
 * (p1..p6); `title` / `subtitle` are the plate's `.cap` / `.pcap` copy
 * verbatim, `no` its panel number. `alt` mirrors lib/data/photos.ts (the
 * same pictures). schneider_office / schneider_exora are the CROPPED frames
 * (V3_SPEC §5).
 *
 * Copy (INTRO_COPY): the drawn panels' genre labels (ORIGIN STORY, TTY,
 * MEANWHILE…, FWIP!, PUSH! — texture, not claims), the three post cards
 * with their REAL headlines and NO impression / reaction / comment counts,
 * the § NOTES page with the real IEEE title (profile.publication.title),
 * no test / pod / throughput numbers, no file names, no developer note
 * (§1.9), and the lockup strings ('Software engineer', 'Scroll to enter').
 *
 * Load this only from the intro chunk (next/dynamic); it is never part of
 * the first-load bundle or images.
 */

import { profile } from './profile'
import { getProject } from './projects'

export type IntroPlate = 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6'

export type IntroPhotoKey =
  | 'schneider_office'
  | 'schneider_exora'
  | 'badge'
  | 'desk'
  | 'door'
  | 'neu_quad'

export interface IntroAsset {
  key: IntroPhotoKey
  /** Montage plate id in intro-FINAL.html (`data-a`). */
  plate: IntroPlate
  /** Public URL, e.g. '/intro/badge.webp'. */
  src: string
  width: number
  height: number
  alt: string
  /** The plate's headline (`.cap`), e.g. 'FIRST CREW'. */
  title: string
  /** The plate's under-line (`.pcap`), e.g. 'GETs to Analysts'. */
  subtitle: string
  /** The part of `subtitle` the plate sets in red (its `<b>`), when any. */
  strong?: string
  /** Panel number printed on the plate. */
  no: string
}

const asset = (
  key: IntroPhotoKey,
  plate: IntroPlate,
  width: number,
  height: number,
  alt: string,
  title: string,
  subtitle: string,
  no: string,
  strong?: string,
): IntroAsset => ({
  key,
  plate,
  src: `/intro/${key}.webp`,
  width,
  height,
  alt,
  title,
  subtitle,
  strong,
  no,
})

/** Montage order (Bengaluru beat → Boston beat), as the intro cuts them. */
export const INTRO_ASSETS: readonly IntroAsset[] = [
  asset(
    'schneider_office',
    'p1',
    497,
    760,
    'The team at Schneider Electric, Bengaluru',
    'FIRST CREW',
    'GETs to Analysts',
    '008',
    'GETs',
  ),
  asset(
    'schneider_exora',
    'p2',
    515,
    760,
    'The team on the EXORA campus, Bengaluru',
    'CAMPUS',
    'the team · EXORA campus',
    '009',
    'EXORA',
  ),
  asset(
    'badge',
    'p3',
    511,
    760,
    "Darshan's AWS badge, held up in the Amazon lobby on day one",
    'DAY ONE',
    'aws badge · amazon lobby',
    '010',
    'aws',
  ),
  asset(
    'desk',
    'p4',
    633,
    760,
    'The Seaport, seen from the desk at AWS',
    'THE VIEW',
    'seaport · from the desk',
    '011',
  ),
  asset(
    'door',
    'p5',
    749,
    760,
    'The Amazon door in Boston',
    'ACCESS',
    'amazon · the glass door',
    '012',
  ),
  asset(
    'neu_quad',
    'p6',
    608,
    760,
    'Darshan at Krentzman Quadrangle, Northeastern University',
    'KRENTZMAN QUAD',
    'boston. round two.',
    '017',
    'boston.',
  ),
]

export function getIntroAsset(key: IntroPhotoKey): IntroAsset {
  const found = INTRO_ASSETS.find((a) => a.key === key)
  if (!found) throw new Error(`intro asset missing: ${key}`)
  return found
}

/** The plate for a montage id ('p1'..'p6'). */
export function getIntroPlate(plate: IntroPlate): IntroAsset {
  const found = INTRO_ASSETS.find((a) => a.plate === plate)
  if (!found) throw new Error(`intro plate missing: ${plate}`)
  return found
}

/** Long-side ceiling the plates are produced at (scripts/prepare-intro-photos.py). */
export const INTRO_PLATE_MAX_PX = 760

/* ------------------------------------------------------------------ copy */

/** A run of card text: plain, or emphasised (the card's red `<b>`). */
export type IntroTextRun = string | { b: string }

export interface IntroPostCard {
  /** Panel label ('DISPATCH' · 'WRAP' · 'EXPO!'). */
  cap: string
  /** Avatar initials. */
  avatar: string
  /** Poster name. */
  name: string
  /** Secondary line under the name (never a count). */
  meta?: string
  /** The headline, as runs. */
  text: readonly IntroTextRun[]
  /** Panel number. */
  no: string
  /** The card's tilt (CSS angle). */
  tilt: string
}

const [firstName, ...rest] = profile.displayName.split(' ')
const surname = rest.join(' ')
const ticketForge = getProject('ticket-forge')

/**
 * Every string the intro shows. The comic labels are the source's genre
 * texture (BRIEF-R2 §1 — labels in visitor language, no build evidence);
 * the facts come from profile / projects.
 */
export const INTRO_COPY = {
  /** The overlay's accessible name and the Skip control. */
  dialogLabel: 'Intro',
  skip: 'Skip',
  skipLabel: 'Skip the intro',

  /** The lockup: eyebrow (first name), the word (surname), role, invitation. */
  firstName: firstName.toUpperCase(),
  surname: surname.toUpperCase(),
  /** Director call: the lockup's role line reads exactly this. */
  role: 'Software engineer',
  /** X4 §9.2 — the hand-off affordance (new copy; the intro had none). */
  invite: 'Scroll to enter',
  /** Accessible name of the lockup. */
  lockupLabel: `${profile.displayName} — Software engineer`,

  /** The drawn panels (a1–a13). */
  panels: {
    a1: { cap: 'ORIGIN STORY', place: 'BENGALURU.', line: 'where the story\nboots up.', no: '001' },
    a2: { cap: 'SCHNEIDER SHIFT', pods: 'binding…', ledger: 'THROUGHPUT LEDGER', no: '002' },
    a3: {
      cap: 'TTY',
      lines: ['npm test', 'suite ▸ konnur-core', '✓ decode   ✓ replay', '✓ flip-engine'],
      pass: '✓ all passing',
      ship: 'ship it',
      status: 'all green · ship it',
      no: '003',
    },
    a4: { cap: 'HISTORY', cmd: 'git log --graph', main: 'main', branch: 'feature', stamp: 'MERGED', no: '004' },
    a5: { cap: 'EAST COAST', place: 'BOSTON.', line: 'round two:\ngrad school.', no: '005' },
    a6: {
      cap: '§ NOTES',
      head: profile.publication.venue,
      title: profile.publication.title,
      author: 'D. Konnur',
      fig: 'Fig. 1',
      no: '006',
    },
    a7: { cap: 'MINIMAX', move: 'minimax → drop col 4', tick: '✓', no: '007' },
    a8: { cap: 'CLOSE-UP', capBr: 'the engineer.' },
    a9: { cap: 'MEANWHILE…', pow: 'FWIP!' },
    a10: { pow: 'PUSH!' },
    a11: { pow: 'FASTER' },
    a13: { prompt: '> signal --boot', loading: 'loading ▓▓▓▓▓▓▓░░░' },
  },

  /** The post dispatch cards (c1–c3): real headlines, no counts (§1.9). */
  posts: {
    c1: {
      cap: 'DISPATCH',
      avatar: 'DK',
      name: profile.name,
      text: [
        'Grateful to share that I’ll be joining ',
        { b: `${profile.incoming.company} (${profile.incoming.companyShort})` },
        ' as a Software Development Engineer Intern in ',
        { b: 'Boston' },
        ' for Summer 2026',
      ],
      no: '013',
      tilt: '-1.6deg',
    },
    c2: {
      cap: 'WRAP',
      avatar: 'DK',
      name: profile.name,
      text: [
        'That’s a wrap on ',
        { b: '12 weeks' },
        ' as a Software Development Engineer Intern at ',
        { b: `${profile.incoming.company} (${profile.incoming.companyShort})` },
        ' in Boston.',
      ],
      no: '014',
      tilt: '1.3deg',
    },
    c3: {
      cap: 'EXPO!',
      avatar: 'TF',
      name: `${ticketForge?.name ?? 'Ticket-Forge'} · team post`,
      text: [{ b: ticketForge?.name ?? 'Ticket-Forge' }, ' placed ', { b: '3rd' }, ' at the Google MLOps Project Expo'],
      no: '015',
      tilt: '-1.1deg',
    },
  } satisfies Record<'c1' | 'c2' | 'c3', IntroPostCard>,
} as const

export type IntroCopy = typeof INTRO_COPY
