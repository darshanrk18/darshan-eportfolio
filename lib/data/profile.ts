/**
 * SIGNAL content data — profile (CONTENT_FINAL 2026-09-23, owner-confirmed).
 * Nothing outside lib/data/* may appear as a factual claim on the site.
 * Positioning is "Incoming SDE @ AWS — Jan 2027" everywhere; grade-point
 * figures are excluded from the site entirely.
 */

/** Canonical site origin — used by metadataBase, sitemap, robots, JSON-LD. */
export const siteUrl: string =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://darshan-eportfolio.vercel.app'

export const profile = {
  name: 'Darshan Ravindra Konnur',
  displayName: 'Darshan Konnur',
  role: 'Software Engineer',
  heroTagline: '// software engineer — incoming SDE @ AWS — MS CS @ Northeastern',
  location: 'Boston, MA',
  /** Headline status — the one positioning line used sitewide. */
  status: 'Incoming SDE @ AWS · Jan 2027',
  email: 'konnur.d@northeastern.edu',
  githubUrl: 'https://github.com/darshanrk18',
  linkedinUrl: 'https://linkedin.com/in/darshankonnur',
  resumePdf: '/resume/darshan-konnur.pdf',
  /** Verified git remote of this site (navbar branch chip + footer view-source). */
  siteRepoUrl: 'https://github.com/darshanrk18/darshan-eportfolio',
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
    degree: 'MS, Computer Science',
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
    degree: 'BE, Computer Science',
    location: 'Bengaluru, India',
    period: 'Aug 2017 – Jul 2021',
  },
  publication: {
    venue: 'IEEE',
    // owner-verified exact published title:
    title: 'Allocation Optimization of Medical Samples For Distributed Testing',
    summary:
      'IEEE-published research applying Mixed Integer Programming to optimal medical sample allocation.',
    doi: undefined as string | undefined,
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
