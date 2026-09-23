/**
 * SIGNAL content data — skills (CONTENT_FINAL 2026-09-23; resume groups are
 * authoritative). The `usedIn` lines below are the ONLY usage claims that may
 * render in the inspector; a node with an empty `usedIn` shows
 * `Context: core stack`.
 */

import type { ProjectSlug } from './projects'

export type SkillClusterId =
  | 'frontend'
  | 'api'
  | 'data'
  | 'infra'
  | 'observability'
  | 'testing'

export interface SkillUsage {
  /** Where it was used, e.g. 'Schneider Electric'. */
  where: string
  /** Verified qualifier, e.g. 'services for 10,000+ users'. Optional. */
  note?: string
  /** Set when the usage refers to one of the projects (deep-link). */
  projectSlug?: ProjectSlug
}

export interface SkillNode {
  /** Stable kebab-case id — also the palette deep-link id (`skills > docker`). */
  id: string
  label: string
  cluster: SkillClusterId
  /** 'Kind' line in the kubectl-style inspector, e.g. 'Infrastructure'. */
  kind: string
  /** Verified usage lines. Empty ⇒ inspector shows `Context: core stack`. */
  usedIn: readonly SkillUsage[]
}

export interface SkillCluster {
  id: SkillClusterId
  label: string
  /** Token-name of the cluster tint, e.g. 'electron' → var(--accent-electron). */
  accent: 'signal' | 'electron' | 'amber' | 'magenta'
  nodes: readonly SkillNode[]
}

const schneider10k: SkillUsage = {
  where: 'Schneider Electric',
  note: 'applications used by 10,000+ employees',
}
const schneider: SkillUsage = { where: 'Schneider Electric' }
const awsIntern: SkillUsage = { where: 'AWS internship' }
const ticketForge: SkillUsage = { where: 'Ticket-Forge', projectSlug: 'ticket-forge' }
const trackfolio: SkillUsage = { where: 'Trackfolio', projectSlug: 'trackfolio' }
const expenseShare: SkillUsage = { where: 'ExpenseShare', projectSlug: 'expense-share' }

/** §4.5 diagram clusters in flow order: frontend → api → data → testing, infra ring, observability pod. */
export const skillClusters: readonly SkillCluster[] = [
  {
    id: 'frontend',
    label: 'frontend',
    accent: 'electron',
    nodes: [
      {
        id: 'react',
        label: 'React',
        cluster: 'frontend',
        kind: 'Frontend',
        usedIn: [trackfolio, schneider10k, expenseShare],
      },
      { id: 'redux', label: 'Redux', cluster: 'frontend', kind: 'Frontend', usedIn: [] },
      { id: 'nextjs', label: 'Next.js', cluster: 'frontend', kind: 'Frontend', usedIn: [trackfolio] },
    ],
  },
  {
    id: 'api',
    label: 'backend',
    accent: 'signal',
    nodes: [
      { id: 'nodejs', label: 'Node.js', cluster: 'api', kind: 'Backend', usedIn: [schneider] },
      { id: 'express', label: 'Express.js', cluster: 'api', kind: 'Backend', usedIn: [expenseShare] },
      { id: 'fastapi', label: 'FastAPI', cluster: 'api', kind: 'Backend', usedIn: [ticketForge] },
      { id: 'flask', label: 'Flask', cluster: 'api', kind: 'Backend', usedIn: [schneider] },
      { id: 'django', label: 'Django', cluster: 'api', kind: 'Backend', usedIn: [] },
      { id: 'spring-boot', label: 'Spring Boot', cluster: 'api', kind: 'Backend', usedIn: [] },
      { id: 'kafka', label: 'Kafka', cluster: 'api', kind: 'Backend', usedIn: [] },
    ],
  },
  {
    id: 'data',
    label: 'data',
    accent: 'magenta',
    nodes: [
      {
        id: 'postgresql',
        label: 'PostgreSQL',
        cluster: 'data',
        kind: 'Data',
        usedIn: [ticketForge],
      },
      { id: 'mysql', label: 'MySQL', cluster: 'data', kind: 'Data', usedIn: [schneider, expenseShare] },
      { id: 'mongodb', label: 'MongoDB', cluster: 'data', kind: 'Data', usedIn: [] },
      {
        id: 'redis',
        label: 'Redis',
        cluster: 'data',
        kind: 'Data',
        usedIn: [{ where: 'Trackfolio', note: 'Upstash rate limiting', projectSlug: 'trackfolio' }],
      },
      {
        id: 'pgvector',
        label: 'pgvector',
        cluster: 'data',
        kind: 'Data',
        usedIn: [{ where: 'Ticket-Forge', note: 'similarity search', projectSlug: 'ticket-forge' }],
      },
    ],
  },
  {
    id: 'infra',
    label: 'infra',
    accent: 'amber',
    nodes: [
      {
        id: 'aws',
        label: 'AWS',
        cluster: 'infra',
        kind: 'Infrastructure',
        usedIn: [{ where: 'AWS internship', note: 'Lambda, S3, CDK, IAM' }],
      },
      { id: 'azure', label: 'Azure', cluster: 'infra', kind: 'Infrastructure', usedIn: [] },
      { id: 'gcp', label: 'GCP', cluster: 'infra', kind: 'Infrastructure', usedIn: [ticketForge] },
      {
        id: 'docker',
        label: 'Docker',
        cluster: 'infra',
        kind: 'Infrastructure',
        usedIn: [
          { where: 'Schneider Electric', note: 'containerized backend services' },
          awsIntern,
          ticketForge,
        ],
      },
      {
        id: 'kubernetes',
        label: 'Kubernetes',
        cluster: 'infra',
        kind: 'Infrastructure',
        usedIn: [{ where: 'Schneider Electric', note: 'containerized services' }],
      },
      {
        id: 'terraform',
        label: 'Terraform',
        cluster: 'infra',
        kind: 'Infrastructure',
        usedIn: [ticketForge],
      },
      { id: 'jenkins', label: 'Jenkins', cluster: 'infra', kind: 'Infrastructure', usedIn: [schneider] },
      {
        id: 'github-actions',
        label: 'GitHub Actions',
        cluster: 'infra',
        kind: 'Infrastructure',
        usedIn: [ticketForge],
      },
    ],
  },
  {
    id: 'observability',
    label: 'observability',
    accent: 'signal',
    nodes: [
      {
        id: 'prometheus',
        label: 'Prometheus',
        cluster: 'observability',
        kind: 'Observability',
        usedIn: [schneider],
      },
      {
        id: 'grafana',
        label: 'Grafana',
        cluster: 'observability',
        kind: 'Observability',
        usedIn: [schneider],
      },
      {
        id: 'cloudwatch',
        label: 'CloudWatch',
        cluster: 'observability',
        kind: 'Observability',
        usedIn: [],
      },
    ],
  },
  {
    id: 'testing',
    label: 'testing',
    accent: 'electron',
    nodes: [
      {
        id: 'junit',
        label: 'JUnit',
        cluster: 'testing',
        kind: 'Testing',
        usedIn: [{ where: 'AWS internship', note: '100% coverage on the evidence collector' }],
      },
      { id: 'mockito', label: 'Mockito', cluster: 'testing', kind: 'Testing', usedIn: [] },
      { id: 'pytest', label: 'PyTest', cluster: 'testing', kind: 'Testing', usedIn: [] },
      {
        id: 'playwright',
        label: 'Playwright',
        cluster: 'testing',
        kind: 'Testing',
        usedIn: [{ where: 'AWS internship', note: 'browser automation for evidence capture' }],
      },
    ],
  },
]

export const allSkillNodes: readonly SkillNode[] = skillClusters.flatMap((c) => c.nodes)

export function getSkillNode(id: string): SkillNode | undefined {
  return allSkillNodes.find((n) => n.id === id)
}

export interface Language {
  id: string
  label: string
  /** Verified context line for the hover tooltip; omit = no tooltip claim. */
  context?: string
}

/** §4.5 languages row (editor-tab chips) — resume Languages group. */
export const languages: readonly Language[] = [
  {
    id: 'python',
    label: 'Python',
    context: 'Schneider Electric · AWS internship · Ticket-Forge · TRIPLAY_AI · IEEE optimizer',
  },
  { id: 'java', label: 'Java', context: 'AWS internship · CS5010 TA · Calendar (Java)' },
  {
    id: 'go',
    label: 'Go',
    context: 'CS6650 distributed systems — replicated key-value store, AWS load tests',
  },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript', context: 'Trackfolio' },
  { id: 'c', label: 'C' },
  { id: 'cpp', label: 'C++' },
  { id: 'sql', label: 'SQL' },
]

/** Resume skill groups (authoritative) — used by /cv and the resume summary. */
export const skillGroups: readonly { label: string; items: readonly string[] }[] = [
  {
    label: 'Languages',
    items: ['Python', 'Java', 'Go', 'JavaScript', 'TypeScript', 'C', 'C++', 'SQL'],
  },
  {
    label: 'Backend',
    items: [
      'Spring Boot',
      'FastAPI',
      'Flask',
      'Django',
      'Node.js',
      'Express.js',
      'REST APIs',
      'Apache Kafka',
    ],
  },
  {
    label: 'Frontend & Databases',
    items: ['React', 'Redux', 'Next.js', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'pgvector'],
  },
  {
    label: 'Cloud',
    items: ['AWS (Lambda, S3, EC2, ECS, ECR, IAM, CDK)', 'Azure', 'GCP'],
  },
  {
    label: 'DevOps',
    items: ['Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'GitHub Actions', 'Git', 'Linux/Unix'],
  },
  {
    label: 'Tools & Testing',
    items: ['JUnit', 'Mockito', 'PyTest', 'Playwright', 'AWS CloudWatch', 'Prometheus', 'Grafana'],
  },
]
