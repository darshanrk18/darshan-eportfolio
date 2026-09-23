/**
 * SIGNAL content data — projects (CONTENT_FINAL 2026-09-23, order as listed;
 * slugs stable). Copy is verbatim; optional fields (repoUrl, paperUrl, doi,
 * demoUrl, award, live) render only when filled.
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

export interface Project {
  slug: ProjectSlug
  /** Display name, e.g. 'Ticket-Forge'. */
  name: string
  dir: ProjectDir
  /** Year label, e.g. '2026'. */
  year: string
  oneLiner: string
  /** Case-file columns (§4.6), verbatim copy. */
  problem: string
  build: string
  result: string
  /** Stack chips; empty array ⇒ the chips row is hidden. */
  stack: readonly string[]
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
  /** Project-window title-bar text, e.g. 'ticket-forge — darshan@portfolio'. */
  windowTitle: string
}

export const projects: readonly Project[] = [
  {
    slug: 'ticket-forge',
    name: 'Ticket-Forge',
    dir: 'projects',
    year: '2026',
    oneLiner: 'AI-powered ticket-assignment system that ranks engineers for incoming DevOps tickets.',
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
    problem: 'Job searches sprawl across resume versions and applications with no source of truth.',
    build:
      'Version-controlled resume management with branching for tailored versions, immutable submission snapshots, JD-vs-resume analysis and follow-up tracking; Next.js 16 + React 19, tRPC + TanStack Query, Drizzle ORM on Neon Postgres, Auth.js (GitHub/Google/magic links), Vercel Blob, Upstash Redis rate limiting, CI with CodeQL + Dependabot.',
    result: 'Live in production on Vercel.',
    stack: ['TypeScript', 'Next.js', 'React', 'tRPC', 'PostgreSQL', 'Drizzle', 'Redis'],
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
    problem: 'Make adversarial search, pathfinding, and computer vision playable, not theoretical.',
    build:
      'Connect Four driven by Minimax with alpha-beta pruning; Snake driven by A*; Rock-Paper-Scissors driven by real-time hand-gesture recognition with OpenCV + MediaPipe.',
    result:
      'A playable suite demonstrating three families of AI — 91% optimal move selection (Connect Four) and 88% food-acquisition efficiency (Snake) across 100+ simulations. Play the Minimax engine right here.',
    stack: ['Python', 'OpenCV', 'MediaPipe', 'Minimax', 'A*'],
    windowTitle: 'triplay-ai — darshan@portfolio',
  },
  {
    slug: 'expense-share',
    name: 'ExpenseShare',
    dir: 'projects',
    year: '2025',
    oneLiner: 'A full-stack SPA for tracking and splitting shared expenses.',
    problem: 'Splitting group expenses fairly gets messy fast.',
    build:
      'A full-stack single-page application on normalized relational schemas; REST APIs for users, groups, expenses, settlements and balance tracking; stored procedures, triggers, ACID transactions, indexing and pagination.',
    result: 'A working end-to-end expense-sharing product.',
    stack: ['React', 'Node.js', 'Express.js', 'MySQL', 'REST APIs'],
    windowTitle: 'expense-share — darshan@portfolio',
  },
  {
    slug: 'calendar-java',
    name: 'Calendar (Java)',
    dir: 'projects',
    year: '2025',
    oneLiner: 'A calendar application engineered around SOLID and design patterns.',
    problem: 'Feature-heavy desktop apps rot without disciplined design.',
    build:
      'A Java calendar application structured around SOLID principles and classic design patterns.',
    result: 'A maintainable, extensible codebase — the architecture is the feature.',
    stack: ['Java', 'OOP', 'SOLID', 'Design Patterns'],
    windowTitle: 'calendar-java — darshan@portfolio',
  },
  {
    slug: 'box-archive',
    name: 'Box Archive',
    dir: 'projects',
    year: '2023',
    oneLiner: 'An enterprise document platform, containerized end to end.',
    problem: 'Enterprise document management needs secure access and repeatable deployment.',
    build:
      'OAuth-based authentication (PingID); services containerized with Docker and orchestrated on Kubernetes.',
    result:
      'Volunteered ownership, shipped a proof of concept in days, and took it to production.',
    stack: ['Docker', 'Kubernetes', 'OAuth'],
    windowTitle: 'box-archive — darshan@portfolio',
  },
  {
    slug: 'ieee-mip-optimizer',
    name: 'Sample Allocation Optimizer',
    dir: 'research',
    year: '2021',
    oneLiner: 'IEEE-published: optimal medical sample allocation via Mixed Integer Programming.',
    problem: 'Allocating medical samples optimally is a hard constrained-optimization problem.',
    build: 'A Mixed Integer Programming model for optimal medical sample allocation.',
    result: 'Published by IEEE.',
    stack: ['Mixed Integer Programming', 'Optimization', 'IEEE'],
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
