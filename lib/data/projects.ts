/**
 * SIGNAL content data — projects (CONTENT_FINAL 2026-09-23, order as listed;
 * slugs stable). Copy is verbatim; optional fields (repoUrl, paperUrl, doi,
 * demoUrl, award, live) render only when filled.
 *
 * v3 (V3_SPEC §3 Work, director call (b)): every string the S4 / P4 frames
 * introduced is DATA here, never a component literal — `short` (SCREEN
 * poster line), `coverLine` (PRINT cover line), `bill` (SCREEN poster chips,
 * a deliberate subset of `stack`), `coverStack` (PRINT cover chips; the
 * cover adds "+N" for the rest), `metrics` + `metricsNote` (structured
 * result numbers so the case file never regexes prose), `buildShort` (the
 * approved plain-English build line — the long `build` stays for /cv), and
 * `games` (the tabs of a project that hosts several demos). `windowTitle`
 * is KEPT for the v2 machinery but is never rendered at rest (clutter law:
 * it is command-line furniture). Section copy lives in `workCopy`.
 */

import { profile } from './profile'

export const projectSlugs = [
  'ticket-forge',
  'trackfolio',
  'triplay-ai',
  'expense-share',
  'calendar-java',
  'box-archive',
  'ieee-mip-optimizer',
] as const

export type ProjectSlug = (typeof projectSlugs)[number]

/** Explorer-tree directory a project lives under (§4.6). */
export type ProjectDir = 'projects' | 'research'

/** A demo tab inside a project window (TRIPLAY_AI hosts three). */
export type ProjectGameId = 'connect-four' | 'snake' | 'rps'

export interface ProjectGame {
  id: ProjectGameId
  /** Tab label, visitor language. */
  label: string
  /** PRINT window-title suffix ("CONNECT FOUR — you vs. the engine"). */
  tagline: string
}

export interface ProjectMetric {
  /** The number, e.g. '91%'. */
  value: string
  /** What it measures, e.g. 'optimal move selection'. */
  label: string
  /** Where, e.g. 'Connect Four'. */
  sub?: string
}

export interface Project {
  slug: ProjectSlug
  /** Display name, e.g. 'Ticket-Forge'. */
  name: string
  dir: ProjectDir
  /** Year label, e.g. '2026'. */
  year: string
  oneLiner: string
  /** One short line for the SCREEN poster rack (≤ 48 chars). */
  short: string
  /** One short line for the PRINT back-issue cover. */
  coverLine: string
  /** Case-file columns (§4.6), verbatim copy. */
  problem: string
  build: string
  /** Approved plain-English build line for the case file (falls back to `build`). */
  buildShort?: string
  result: string
  /** Structured result numbers for the case file (falls back to `result`). */
  metrics?: readonly ProjectMetric[]
  /** Footnote under the metrics, e.g. 'Across 100+ simulations.' */
  metricsNote?: string
  /** Stack chips; empty array ⇒ the chips row is hidden. */
  stack: readonly string[]
  /** SCREEN poster chips — a deliberate ≤ 4-item subset (logo + name). */
  bill: readonly string[]
  /** PRINT cover chips — ≤ 3 items; the cover shows "+N" for the rest of `stack`. */
  coverStack: readonly string[]
  /** Demo tabs when the window hosts more than one demo. */
  games?: readonly ProjectGame[]
  /** Optional links — render only when set. */
  repoUrl?: string
  paperUrl?: string
  doi?: string
  /** External demo link — video walkthrough or live deployment. */
  demoUrl?: string
  /** Award badge text, rendered verbatim (e.g. '3rd Place — Google MLOps Project Expo'). */
  award?: string
  /** True ⇒ the project is live in production (LIVE badge). */
  live?: boolean
  /** v2 project-window title-bar text. KEPT in data, NEVER rendered at rest (v3 clutter law). */
  windowTitle: string
}

export const projects: readonly Project[] = [
  {
    slug: 'ticket-forge',
    name: 'Ticket-Forge',
    dir: 'projects',
    year: '2026',
    oneLiner: 'AI-powered ticket-assignment system that ranks engineers for incoming DevOps tickets.',
    short: 'Ranks engineers for incoming DevOps tickets.',
    coverLine: 'Ranks engineers for each DevOps ticket.',
    problem: 'Manual ticket triage wastes engineering time and ignores workload and experience signals.',
    build:
      'Recommendation engine ranking engineers via ticket context, engineer profiles, historical assignments, workload and recent-experience signals; pgvector similarity search, confidence scoring, explainability and cold-start handling; full MLOps loop (MLflow registry, DVC, Airflow, model CI/CD and monitoring) on GCP with Terraform, Docker and GitHub Actions.',
    result: "3rd place at Northeastern's MLOps Project Expo, presented at Google's Cambridge, MA office.",
    stack: [
      'Python',
      'FastAPI',
      'PostgreSQL',
      'pgvector',
      'MLflow',
      'Airflow',
      'Terraform',
      'Docker',
      'GitHub Actions',
    ],
    bill: ['Python', 'pgvector', 'Terraform', 'Docker'],
    coverStack: ['Python', 'FastAPI', 'PostgreSQL'],
    repoUrl: 'https://github.com/darshanrk18/ticket-forge',
    demoUrl: 'https://www.youtube.com/watch?v=vs2jPlST66A',
    award: '3rd Place — Google MLOps Project Expo',
    windowTitle: 'ticket-forge — darshan@portfolio',
  },
  {
    slug: 'trackfolio',
    name: 'Trackfolio',
    dir: 'projects',
    year: '2026',
    oneLiner:
      'The operating system for your job search — version-controlled resumes and an application pipeline that never forgets what you sent.',
    short: 'The operating system for your job search.',
    coverLine: 'Versioned resumes, tracked applications.',
    problem: 'Job searches sprawl across resume versions and applications with no source of truth.',
    build:
      'Version-controlled resume management with branching for tailored versions, immutable submission snapshots, JD-vs-resume analysis and follow-up tracking; Next.js 16 + React 19, tRPC + TanStack Query, Drizzle ORM on Neon Postgres, Auth.js (GitHub/Google/magic links), Vercel Blob, Upstash Redis rate limiting, CI with CodeQL + Dependabot.',
    result: 'Live in production on Vercel.',
    stack: ['TypeScript', 'Next.js', 'React', 'tRPC', 'PostgreSQL', 'Drizzle', 'Redis'],
    bill: ['TypeScript', 'Next.js', 'PostgreSQL', 'Redis'],
    coverStack: ['Next.js', 'React', 'TypeScript'],
    repoUrl: 'https://github.com/darshanrk18/Trackfolio',
    demoUrl: 'https://trackfolio-bay.vercel.app',
    live: true,
    windowTitle: 'trackfolio — darshan@portfolio',
  },
  {
    slug: 'triplay-ai',
    name: 'TRIPLAY_AI',
    dir: 'projects',
    year: '2025',
    oneLiner: 'An AI game suite: three classic games, three search techniques.',
    short: 'Three classic games, three search techniques.',
    coverLine: 'Search and computer vision you can play.',
    problem: 'Make adversarial search, pathfinding, and computer vision playable, not theoretical.',
    build:
      'Connect Four driven by Minimax with alpha-beta pruning; Snake driven by A*; Rock-Paper-Scissors driven by real-time hand-gesture recognition with OpenCV + MediaPipe.',
    buildShort:
      'Connect Four is played by a Minimax engine, Snake finds its food with A*, and Rock-Paper-Scissors reads your hand in real time with OpenCV and MediaPipe.',
    result:
      'A playable suite demonstrating three families of AI — 91% optimal move selection (Connect Four) and 88% food-acquisition efficiency (Snake) across 100+ simulations. Play the Minimax engine right here.',
    metrics: [
      { value: '91%', label: 'optimal move selection', sub: 'Connect Four' },
      { value: '88%', label: 'food-acquisition efficiency', sub: 'Snake' },
    ],
    metricsNote: 'Across 100+ simulations.',
    stack: ['Python', 'OpenCV', 'MediaPipe', 'Minimax', 'A*'],
    bill: ['Python', 'OpenCV', 'MediaPipe', 'Minimax'],
    coverStack: ['Python', 'OpenCV', 'MediaPipe'],
    games: [
      { id: 'connect-four', label: 'Connect Four', tagline: 'you vs. the engine' },
      { id: 'snake', label: 'Snake', tagline: 'it finds its own food' },
      { id: 'rps', label: 'Rock-Paper-Scissors', tagline: 'it reads a hand' },
    ],
    windowTitle: 'triplay-ai — darshan@portfolio',
  },
  {
    slug: 'expense-share',
    name: 'ExpenseShare',
    dir: 'projects',
    year: '2025',
    oneLiner: 'A full-stack SPA for tracking and splitting shared expenses.',
    short: 'Tracking and splitting shared expenses.',
    coverLine: 'Group expenses and who owes whom.',
    problem: 'Splitting group expenses fairly gets messy fast.',
    build:
      'A full-stack single-page application on normalized relational schemas; REST APIs for users, groups, expenses, settlements and balance tracking; stored procedures, triggers, ACID transactions, indexing and pagination.',
    result: 'A working end-to-end expense-sharing product.',
    stack: ['React', 'Node.js', 'Express.js', 'MySQL', 'REST APIs'],
    bill: ['React', 'Node.js', 'Express.js', 'MySQL'],
    coverStack: ['React', 'Node.js', 'MySQL'],
    windowTitle: 'expense-share — darshan@portfolio',
  },
  {
    slug: 'calendar-java',
    name: 'Calendar (Java)',
    dir: 'projects',
    year: '2025',
    oneLiner: 'A calendar application engineered around SOLID and design patterns.',
    short: 'Engineered around SOLID and design patterns.',
    coverLine: 'A Java calendar built on SOLID principles.',
    problem: 'Feature-heavy desktop apps rot without disciplined design.',
    build:
      'A Java calendar application structured around SOLID principles and classic design patterns.',
    result: 'A maintainable, extensible codebase — the architecture is the feature.',
    stack: ['Java', 'OOP', 'SOLID', 'Design Patterns'],
    bill: ['Java'],
    coverStack: ['Java', 'SOLID', 'Design Patterns'],
    windowTitle: 'calendar-java — darshan@portfolio',
  },
  {
    slug: 'box-archive',
    name: 'Box Archive',
    dir: 'projects',
    year: '2023',
    oneLiner: 'An enterprise document platform, containerized end to end.',
    short: 'Enterprise archive, taken to production.',
    coverLine: 'Proof of concept in days, then production.',
    problem: 'Enterprise document management needs secure access and repeatable deployment.',
    build:
      'OAuth-based authentication (PingID); services containerized with Docker and orchestrated on Kubernetes.',
    result:
      'Volunteered ownership, shipped a proof of concept in days, and took it to production.',
    stack: ['Docker', 'Kubernetes', 'OAuth'],
    bill: ['Docker', 'Kubernetes'],
    coverStack: ['Kubernetes', 'Docker', 'OAuth'],
    windowTitle: 'box-archive — darshan@portfolio',
  },
  {
    slug: 'ieee-mip-optimizer',
    name: 'Sample Allocation Optimizer',
    dir: 'research',
    year: '2021',
    oneLiner: 'IEEE-published: optimal medical sample allocation via Mixed Integer Programming.',
    short: 'Medical-sample allocation, published with IEEE.',
    coverLine: 'Mixed integer programming for medical testing. Published with IEEE.',
    problem: 'Allocating medical samples optimally is a hard constrained-optimization problem.',
    build: 'A Mixed Integer Programming model for optimal medical sample allocation.',
    result: 'Published by IEEE.',
    /* Python leads: CONTENT_FINAL's verified usedIn map names it for the optimizer (S4/P4 flag). */
    stack: ['Python', 'Mixed Integer Programming', 'Optimization', 'IEEE'],
    bill: ['Python', 'Mixed Integer Programming'],
    coverStack: ['Python'],
    paperUrl: profile.publication.paperUrl,
    doi: profile.publication.doi,
    windowTitle: 'ieee-mip-optimizer — darshan@portfolio',
  },
]

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug)
}

export function isProjectSlug(value: string): value is ProjectSlug {
  return (projectSlugs as readonly string[]).includes(value)
}

/** Stack items a PRINT cover does not show as a chip — rendered as "+N". */
export function coverMoreCount(project: Project): number {
  return project.stack.filter((s) => !project.coverStack.includes(s)).length
}

/** The demo tabs of a window: a project's `games`, or one tab named after it. */
export function windowTabs(project: Project): readonly { id: string; label: string }[] {
  return project.games ?? [{ id: project.slug, label: project.name }]
}

const NUMBER_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']

/** 7 → 'Seven' (the S4 lede counts `projects.length`); ≥ 10 falls back to digits. */
export function numberWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n)
}

/**
 * Section and window copy for Work (S4 / P4 frames, visitor language only —
 * no command syntax, no file names, no pipeline words).
 */
export const workCopy = {
  screen: {
    kicker: 'Work',
    title: 'Selected work',
    /** "Seven projects. " — the count comes from projects.length. */
    ledeCount: `${numberWord(projects.length)} projects.`,
    ledeAction: 'Open one and it runs right here.',
    more: 'More projects',
  },
  print: {
    chapter: 'Ch. III',
    /** The chapter is named after the lead project. */
    title: `${projects[0].name} & Co.`,
    rackTitle: 'Back issues',
    rackLede: 'Newest first. Pull any issue to open it above.',
    nowOpen: 'Now open ↑',
  },
  window: {
    newGame: 'New game',
    maximize: { screen: 'Maximize', print: 'Play full size' },
    restore: 'Restore',
    run: 'Run the demo',
    stop: 'Stop the demo',
    collapse: 'Collapse the case file',
    expand: 'Show the case file',
    engineThinking: 'Engine is thinking',
    yourMove: 'Your move',
    showThinking: 'Show thinking',
    dismissTip: 'Dismiss tip',
  },
  caseFile: {
    problem: 'Problem',
    build: 'Build',
    result: 'Result',
    builtWith: 'Built with',
    /** Link labels — visitor language, the arrow is drawn separately. */
    profileLink: 'GitHub profile',
    codeLink: 'View the code',
    appLink: 'Open the app',
    demoLink: 'Watch the demo',
    paperLink: 'Read the paper',
    privateCode: "This one's code isn't public.",
    live: 'Live',
    previous: 'Previous',
    next: 'Next',
  },
  rps: {
    /** Plain-English line under the hand-tracking replay (director call (f)). */
    permission:
      'This is a replay of the hand tracking — nothing here opens your camera. The real app reads your hand through the webcam.',
  },
} as const
