/**
 * SIGNAL content data — experience DAG (CONTENT_FINAL 2026-09-23, newest first).
 * Exactly these entries exist; do not add roles.
 * AWS internship = exactly its three bullets + the allowed outcome line —
 * never team names, mentors, compensation, or internal system details.
 * `hash` is deterministic: first 7 hex chars of SHA-1 of the message string
 * ('0000000' for the future/HEAD marker — it has no commit yet).
 */

import { shortHash7 } from '@/lib/utils/seeded'
import { profile } from './profile'

export type CommitKind = 'commit' | 'branch' | 'tag' | 'future'
export type CommitLane = 'main' | 'feat/ms-cs'

export interface CommitEntry {
  /** Stable key for anchors/tests. */
  id: 'aws-future' | 'aws-intern' | 'neu-ta' | 'neu-branch' | 'schneider' | 'ieee-tag'
  kind: CommitKind
  lane: CommitLane
  /** Conventional-commit style message (monospace headline). */
  message: string
  /** Meta line, e.g. 'Feb 2021 – Nov 2023 · Digital Workplace Engineer · Schneider Electric'. */
  meta: string
  /** git-style short hash — shortHash7(message), computed at build. */
  hash: string
  /** Expandable diff panel lines (each rendered with a `+` gutter). Empty = no panel. */
  bullets: readonly string[]
  /** Allowed closing line rendered after the bullets (AWS: the offer outcome). */
  outcome?: string
  /** Award tag/badge on the entry (Schneider: 'SURGE Award') — render verbatim. */
  award?: string
  /** Big number beside the entry (TA: 300+ in amber), when present. */
  bigNumber?: { value: string; accent: 'signal' | 'electron' | 'amber' | 'magenta' }
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
    bullets: [],
  },
  {
    id: 'aws-intern',
    kind: 'commit',
    lane: 'main',
    message: awsInternMsg,
    meta: 'Jun 2026 – Aug 2026 · Software Development Engineer Intern · Amazon Web Services · Boston, MA',
    hash: shortHash7(awsInternMsg),
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
    bullets: [
      'Mentored 300+ graduate students in labs and office hours on Java OOP, SOLID principles, UML, design patterns, debugging and unit testing with JUnit and JaCoCo.',
    ],
    bigNumber: { value: '300+', accent: 'amber' },
  },
  {
    id: 'neu-branch',
    kind: 'branch',
    lane: 'feat/ms-cs',
    message: neuBranchMsg,
    meta: `${profile.education.period} · MS, Computer Science · Northeastern University`,
    hash: shortHash7(neuBranchMsg),
    bullets: [],
  },
  {
    id: 'schneider',
    kind: 'commit',
    lane: 'main',
    message: schneiderMsg,
    meta: 'Feb 2021 – Nov 2023 · Digital Workplace Engineer · Schneider Electric · Bengaluru, India',
    hash: shortHash7(schneiderMsg),
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
    bullets: [],
    paperUrl: profile.publication.paperUrl,
  },
]

/**
 * Year-rail markers along the DAG (§4.7) — top-to-bottom in page order
 * (newest first): 2027 (incoming) → 2026 (AWS) → 2025 (MS) → 2021–2023.
 */
export const yearRail: readonly string[] = ['2027', '2026', '2025', '2021']
