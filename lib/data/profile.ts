/**
 * Content data — profile (CONTENT_FINAL 2026-09-23, owner-confirmed).
 * Nothing outside lib/data/* may appear as a factual claim on the site.
 * Positioning is "Incoming SDE @ AWS — Jan 2027" everywhere; grade-point
 * figures are excluded from the site entirely.
 */

/** Canonical site origin — used by metadataBase, sitemap, robots, JSON-LD. */
export const siteUrl: string =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.darshankonnur.com'

export const profile = {
  name: 'Darshan Ravindra Konnur',
  displayName: 'Darshan Konnur',
  role: 'Software Engineer',
  /* v2's comment-line `heroTagline` is gone (clutter law: no command-line
     syntax at rest; nothing read it). The hero reads `eyebrow` + `heroLede`. */
  location: 'Boston, MA',
  /** The location written out — the PRINT cover's caption box (P1). */
  locationLong: 'Boston, Massachusetts',
  /** Headline status — the one positioning line used sitewide. */
  status: 'Incoming SDE @ AWS · Jan 2027',
  /**
   * v3 S1 kicker (the hero eyebrow with the live dot) — the long form of
   * `status`, approved in round 3. Everywhere else says "Jan 2027".
   */
  eyebrow: 'Incoming SDE · AWS · January 2027',
  /**
   * v3 S1 lede — condensed from CONTENT_FINAL About P1 + P3's last
   * sentence (approved). `heroLedeEmphasis` is the one word set in the
   * primary text colour (the frame's <b>Northeastern</b>).
   */
  heroLede:
    'Software engineer in Boston, finishing my MS in Computer Science at Northeastern. I like taking systems from prototype to production — and proving they work.',
  heroLedeEmphasis: 'Northeastern',
  email: 'konnur.d@northeastern.edu',
  githubUrl: 'https://github.com/darshanrk18',
  linkedinUrl: 'https://linkedin.com/in/darshankonnur',
  resumePdf: '/resume/darshan-konnur.pdf',
  /** Git remote of this site (palette "Open repository", Build info). */
  siteRepoUrl: 'https://github.com/darshanrk18/darshan-eportfolio',
  /**
   * The repo is public (Sep 30 2026), so the palette's "Open repository" row
   * and Build info's "Source on GitHub" link are shown. Set to false if it
   * ever goes private again — a visitor would get GitHub's 404.
   */
  siteRepoPublic: true,
  siteUrl,
  /**
   * Incoming full-time role (owner-confirmed). Render as FUTURE only —
   * never as current employment (JSON-LD: description only, no worksFor).
   */
  incoming: {
    company: 'Amazon Web Services',
    companyShort: 'AWS',
    role: 'Software Development Engineer',
    start: 'Jan 2027',
    location: 'Boston, MA',
  },
  education: {
    school: 'Northeastern University',
    degree: 'MS in Computer Science',
    location: 'Boston, MA',
    period: 'Jan 2025 – Dec 2026 (expected)',
    /** MS began Jan 2025 (owner-verified) — used by the experience DAG. */
    msStartYear: '2025',
    expectedGrad: 'Dec 2026',
    ta: {
      course: 'CS5010',
      courseName: 'Programming Design Paradigm',
      title: 'Graduate Teaching Assistant',
      /** Past role — render in PAST tense. */
      period: 'Sep 2025 – Dec 2025',
      students: '300+',
    },
  },
  educationPrior: {
    school: 'M. S. Ramaiah Institute of Technology',
    degree: 'BE in Computer Science',
    location: 'Bengaluru, India',
    period: 'Aug 2017 – Jul 2021',
  },
  publication: {
    venue: 'IEEE',
    // owner-verified exact published title:
    title: 'Allocation Optimization of Medical Samples For Distributed Testing',
    summary:
      'IEEE-published research applying Mixed Integer Programming to optimal medical sample allocation.',
    /* Authors, proceedings, year, pages: lib/data/publication.ts (server-only,
       so the client bundle that imports this file doesn't carry them). */
    doi: '10.1109/ICEECCOT52851.2021.9707992' as string | undefined,
    paperUrl: 'https://ieeexplore.ieee.org/document/9707992' as string | undefined,
  },
  /** Terminal copy (CONTENT_FINAL "Terminal / palette / SEO"). */
  terminal: {
    /** `whoami` lines 2 and 4 (line 1 = name, line 3 = location). */
    whoamiRole: 'software engineer — incoming SDE @ AWS (Jan 2027)',
    whoamiEducation: 'MS CS @ Northeastern, Dec 2026',
    /** `sudo hire darshan` response line (mailto follows). */
    sudoHire: 'Already hired — starts at AWS Jan 2027. But inbox is open:',
  },
} as const

export type Profile = typeof profile
