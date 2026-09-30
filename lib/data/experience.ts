/**
 * Content data — experience (CONTENT_FINAL 2026-09-23, newest first).
 * Exactly these entries exist; do not add roles.
 * AWS internship = exactly its three bullets + the allowed outcome line —
 * never team names, mentors, compensation, or internal system details.
 *
 * v3 (director call (b)): every entry carries STRUCTURED fields — company,
 * companyShort, role, roleShort, location, period, periodShort, years — plus
 * the PRINT-only forms the P5 frame approved (`printBullets`, `printOutcome`,
 * `printCompany`, `printRoleLines`). The v2 fields stay
 * (`message`, `meta`, `hash`, `lane`, `kind`): /cv, the terminal and the
 * seeded-hash test still read them. NEVER render `hash`, `message`, `lane`
 * or the year rail on the page (clutter law); `showBranch` says whether an
 * edition draws the neu-branch node at all (neither frame does).
 * `hash` is deterministic: first 7 hex chars of SHA-1 of the message string
 * ('0000000' for the future/HEAD marker — it has no commit yet).
 */

import { shortHash7 } from '@/lib/utils/seeded'
import { profile } from './profile'

export type CommitKind = 'commit' | 'branch' | 'tag' | 'future'
export type CommitLane = 'main' | 'feat/ms-cs'
export type CommitId =
  'aws-future' | 'aws-intern' | 'neu-ta' | 'neu-branch' | 'schneider' | 'ieee-tag'

export interface CommitEntry {
  /** Stable key for anchors/tests. */
  id: CommitId
  kind: CommitKind
  lane: CommitLane
  /** Conventional-commit style message — v2 data, never rendered in v3. */
  message: string
  /** Meta line, e.g. 'Feb 2021 – Nov 2023 · Digital Workplace Engineer · Schneider Electric'. */
  meta: string
  /** git-style short hash — shortHash7(message); never rendered in v3. */
  hash: string
  /** Employer / school / venue as the visitor reads it. */
  company: string
  /** Short form for tabs and chips ('AWS', 'Khoury', 'Schneider'). */
  companyShort: string
  /** Role line (empty for the tag node). */
  role: string
  /** Short role for tight rows and the NEXT marker ('SDE', 'SDE intern'). */
  roleShort?: string
  /** PRINT-only role lines when the P5 frame splits the role (falls back to `role`). */
  printRoleLines?: readonly string[]
  /** PRINT-only employer wording when the P5 frame extends it (falls back to `company`). */
  printCompany?: string
  location: string
  /** Full period, e.g. 'Jun 2026 – Aug 2026'. */
  period: string
  /** Compressed period the frames print: 'Jun – Aug 2026', 'Feb 2021 – Nov 2023'. */
  periodShort: string
  /** Year label for usage rows: '2026', '2021 – 2023'. */
  years: string
  /** Compressed year span the PRINT usage strip prints ('2021–23'); falls back to `years`. */
  yearsShort?: string
  /** Bullets (SCREEN and /cv). Empty = no panel. */
  bullets: readonly string[]
  /** PRINT-only bullet wording approved in the P5 frame; falls back to `bullets`. */
  printBullets?: readonly string[]
  /** Allowed closing line rendered after the bullets in both editions (AWS: the offer). */
  outcome?: string
  /** PRINT-only OUTCOME box text (Khoury: the 300+ line); falls back to `outcome`. */
  printOutcome?: string
  /** Award tag/badge on the entry (Schneider: 'SURGE Award') — render verbatim. */
  award?: string
  /** Optional link (IEEE tag node when paperUrl is set). */
  paperUrl?: string
}

const awsFutureMsg = 'next: SDE @ Amazon Web Services'
const awsInternMsg = 'feat(aws): build serverless evidence capture for cloud security'
const neuTaMsg = 'feat(neu): graduate TA — CS5010 Programming Design Paradigm'
const neuBranchMsg = 'feat(neu): begin MS in Computer Science — Northeastern University, Boston'
const schneiderMsg = 'feat(schneider): ship digital workplace apps to 10k+ users'
const ieeeTagMsg = 'tag: v1.0 — IEEE published'

export const commits: readonly CommitEntry[] = [
  {
    // The DAG's top: HEAD -> future. Render distinctly (dashed/incoming), no bullets.
    id: 'aws-future',
    kind: 'future',
    lane: 'main',
    message: awsFutureMsg,
    meta: 'starts Jan 2027 · Software Development Engineer · Boston, MA',
    hash: '0000000',
    company: profile.incoming.company,
    companyShort: profile.incoming.companyShort,
    role: profile.incoming.role,
    roleShort: 'SDE',
    location: profile.incoming.location,
    period: profile.incoming.start,
    periodShort: profile.incoming.start,
    years: '2027',
    bullets: [],
  },
  {
    id: 'aws-intern',
    kind: 'commit',
    lane: 'main',
    message: awsInternMsg,
    meta: 'Jun 2026 – Aug 2026 · Software Development Engineer Intern · Amazon Web Services · Boston, MA',
    hash: shortHash7(awsInternMsg),
    company: 'Amazon Web Services',
    companyShort: 'AWS',
    role: 'Software Development Engineer Intern',
    roleShort: 'SDE intern',
    location: 'Boston, MA',
    period: 'Jun 2026 – Aug 2026',
    periodShort: 'Jun – Aug 2026',
    years: '2026',
    bullets: [
      'Designed and built a serverless prototype that automatically captures visual evidence for cloud security workflows using Java, Python, AWS Lambda, S3 and browser automation.',
      'Defined infrastructure as code with AWS CDK, IAM and Docker; hardened the service with input validation, timeout handling, fault-tolerant execution and observability.',
      'Built comprehensive automated validation spanning a Java evidence collector with 100% test coverage, Python Lambda unit tests and an end-to-end integration suite validating success and failure paths against a live AWS environment.',
    ],
    outcome: 'Returned with a full-time SDE offer.',
  },
  {
    id: 'neu-ta',
    kind: 'commit',
    lane: 'feat/ms-cs',
    message: neuTaMsg,
    meta: 'Sep 2025 – Dec 2025 · Graduate Teaching Assistant · Northeastern University, Khoury College',
    hash: shortHash7(neuTaMsg),
    company: 'Northeastern University',
    companyShort: 'Khoury',
    printCompany: 'Northeastern University, Khoury College',
    role: `${profile.education.ta.title}, Khoury College — ${profile.education.ta.course} ${profile.education.ta.courseName}`,
    roleShort: 'Graduate TA',
    printRoleLines: [
      profile.education.ta.title,
      `${profile.education.ta.course} ${profile.education.ta.courseName}`,
    ],
    location: 'Boston, MA',
    period: profile.education.ta.period,
    periodShort: 'Sep – Dec 2025',
    years: '2025',
    bullets: [
      'Mentored 300+ graduate students in labs and office hours on Java OOP, SOLID principles, UML, design patterns, debugging and unit testing with JUnit and JaCoCo.',
    ],
    // P5 frame (approved): the bullet and the 300+ split into two lines.
    printBullets: [
      'Ran labs and office hours on Java OOP, SOLID principles, UML, design patterns, debugging and unit testing with JUnit and JaCoCo.',
    ],
    printOutcome: `${profile.education.ta.students} graduate students mentored`,
  },
  {
    id: 'neu-branch',
    kind: 'branch',
    lane: 'feat/ms-cs',
    message: neuBranchMsg,
    meta: `${profile.education.period} · MS, Computer Science · Northeastern University`,
    hash: shortHash7(neuBranchMsg),
    company: profile.education.school,
    companyShort: 'Northeastern',
    role: 'MS in Computer Science',
    location: profile.education.location,
    period: profile.education.period,
    periodShort: profile.education.period,
    years: profile.education.msStartYear,
    bullets: [],
  },
  {
    id: 'schneider',
    kind: 'commit',
    lane: 'main',
    message: schneiderMsg,
    meta: 'Feb 2021 – Nov 2023 · Digital Workplace Engineer · Schneider Electric · Bengaluru, India',
    hash: shortHash7(schneiderMsg),
    company: 'Schneider Electric',
    companyShort: 'Schneider',
    role: 'Digital Workplace Engineer',
    location: 'Bengaluru, India',
    period: 'Feb 2021 – Nov 2023',
    periodShort: 'Feb 2021 – Nov 2023',
    years: '2021 – 2023',
    yearsShort: '2021–23',
    bullets: [
      'Built enterprise workflow applications with Python/Flask, React, Node.js and MySQL used by 10,000+ employees; cut API response times by 30% through SQL query optimization and caching.',
      'Automated Microsoft 365 administration and migration workflows with Python, PowerShell, Microsoft Graph API and Azure AD, reducing manual operational effort by 60%.',
      'Containerized backend services with Docker and Kubernetes, built CI/CD pipelines in Jenkins and GitHub Actions, and added Prometheus/Grafana monitoring.',
    ],
    award: 'SURGE Award',
  },
  {
    id: 'ieee-tag',
    kind: 'tag',
    lane: 'main',
    message: ieeeTagMsg,
    meta: profile.publication.title,
    hash: shortHash7(ieeeTagMsg),
    company: profile.publication.venue,
    companyShort: profile.publication.venue,
    role: 'Publication',
    location: '',
    period: '2021',
    periodShort: '2021',
    years: '2021',
    bullets: [],
    paperUrl: profile.publication.paperUrl,
  },
]

export function getCommit(id: CommitId): CommitEntry | undefined {
  return commits.find((c) => c.id === id)
}

/** The city alone ('Boston, MA' → 'Boston') — the PRINT narration captions. */
export function cityOf(location: string): string {
  return location.split(',')[0]?.trim() ?? location
}

/**
 * v3 S5 / P5 — the NEXT marker at the top of the career graph, derived from
 * the future entry (CONTENT_FINAL: `next: SDE @ Amazon Web Services — starts
 * Jan 2027 — Boston, MA`). `line` is the SCREEN row; PRINT lays the parts out
 * as the NEXT ISSUE box.
 */
export const nextMarker = (() => {
  const c = commits.find((x) => x.kind === 'future')!
  return {
    label: 'Next',
    line: `${c.roleShort ?? c.role} @ ${c.company} · ${c.period}`,
    company: c.company,
    role: c.role,
    location: c.location,
    start: c.period,
    ariaLabel: `Next: ${c.role} at ${c.company}, starting January 2027`,
  } as const
})()

/** The three jobs that carry bullets, newest first (the skills-per-job tabs). */
export const jobIds: readonly Extract<CommitId, 'aws-intern' | 'neu-ta' | 'schneider'>[] = [
  'aws-intern',
  'neu-ta',
  'schneider',
]

/**
 * v3 — whether an edition draws the `neu-branch` node on the career graph.
 * Neither approved frame does (S5 §9.3, P5 §9.5): the Education block
 * carries the MS in both editions. Kept as a flag so the data entry stays.
 */
export const showBranch: Record<'screen' | 'print', boolean> = { screen: false, print: false }

/**
 * Year-rail markers along the DAG — v2 data, NOT drawn in v3 (clutter law:
 * S5/P5 draw no year rail). Kept for the terminal / any v2 consumer.
 */
export const yearRail: readonly string[] = ['2027', '2026', '2025', '2021']
