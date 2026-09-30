/**
 * SIGNAL content data — skills (CONTENT_FINAL 2026-09-23; resume groups are
 * authoritative). v3 (V3_SPEC §3 Skills, director call (c)): the seven trays
 * of the S3/P3 frames (Frontend · Backend · Data · Monitoring · Testing ·
 * DevOps · Cloud) plus the Languages row are the taxonomy in BOTH editions.
 *
 * Content law: the `usedIn` lines below are the ONLY usage claims that may
 * render (inspector rows, the "Where I've used them" map, the skills-per-job
 * panel, the PRINT text highlights). A skill with an empty `usedIn` shows the
 * core-stack line. Every `blurb` is a plain-English "what it is" — no claim
 * about the owner beyond CONTENT_FINAL's verified map. No kubectl syntax
 * anywhere: `kind` / `blurb` / `note` are visitor sentences.
 *
 * Usage places (`USAGE_PLACES`) are the jobs / projects / coursework the
 * verified map names; a `SkillUsage.place` points at one, and the visitor
 * name, short name, year and deep-link come from the place — read from
 * lib/data/experience (jobs) and lib/data/projects (projects), never from a
 * hand-written row. `usageRows()` derives the seven-row usage map from that.
 */

import { getCommit, type CommitId } from './experience'
import { getProject, type ProjectSlug } from './projects'

/* ------------------------------------------------------------------------- */
/* Trays                                                                     */
/* ------------------------------------------------------------------------- */

/** The seven trays of the system diagram (S3 §2 F1a / P3 §3 C1). */
export type SkillClusterId =
  'frontend' | 'backend' | 'data' | 'monitoring' | 'testing' | 'devops' | 'cloud'

/** Trays + the Languages row: every place a skill can sit in the diagram. */
export type SkillTrayId = SkillClusterId | 'languages'

/* ------------------------------------------------------------------------- */
/* Usage places                                                              */
/* ------------------------------------------------------------------------- */

export type UsagePlaceId =
  // experience (the lib/data/experience entry ids)
  | 'aws-intern'
  | 'schneider'
  | 'neu-ta'
  // projects (the lib/data/projects slugs)
  | 'ticket-forge'
  | 'trackfolio'
  | 'triplay-ai'
  | 'expense-share'
  | 'calendar-java'
  | 'box-archive'
  | 'ieee-mip-optimizer'
  // coursework
  | 'cs6650'

export interface UsagePlace {
  id: UsagePlaceId
  /** Visitor-facing name: 'Amazon Web Services'. */
  name: string
  /** Short form for tabs and tight rows: 'AWS'. */
  short: string
  /** Year label as the frames print it: '2026' or '2021 – 2023'. */
  year: string
  /**
   * The name the PRINT strip / close-up prints (P3 frame: 'AWS' in the
   * tight job column, 'Schneider Electric' where it fits). Defaults to `name`.
   */
  printName: string
  /** The PRINT job meta, abbreviated as the frame prints it: 'SDE intern · 2026', '2021–23'. Defaults to `year`. */
  printMeta: string
  kind: 'experience' | 'project' | 'coursework'
  /** Deep-link target when the place is a project. */
  projectSlug?: ProjectSlug
  /** The experience entry when the place is a job. */
  commitId?: Extract<CommitId, 'aws-intern' | 'schneider' | 'neu-ta'>
}

const projectYear = (slug: ProjectSlug): string => getProject(slug)?.year ?? ''

/**
 * A job place reads its name / short name / years from the experience entry.
 * `printName` is the P3 frame's column form (the short name where the full
 * one would wrap); the PRINT meta is derived: short role · compressed years.
 */
const jobPlace = (
  id: Extract<CommitId, 'aws-intern' | 'schneider' | 'neu-ta'>,
  opts: { printName?: 'short' | 'full' } = {}
): UsagePlace => {
  const c = getCommit(id)
  if (!c) throw new Error(`skills: unknown experience entry ${id}`)
  const yearsShort = c.yearsShort ?? c.years
  return {
    id,
    name: c.company,
    short: c.companyShort,
    year: c.years,
    printName: opts.printName === 'short' ? c.companyShort : c.company,
    printMeta: c.roleShort ? `${c.roleShort} · ${yearsShort}` : yearsShort,
    kind: 'experience',
    commitId: id,
  }
}

/** A project / coursework place: the PRINT forms equal the SCREEN ones. */
const place = (p: Omit<UsagePlace, 'printName' | 'printMeta'>): UsagePlace => ({
  ...p,
  printName: p.name,
  printMeta: p.year,
})

export const USAGE_PLACES: Record<UsagePlaceId, UsagePlace> = {
  'aws-intern': jobPlace('aws-intern', { printName: 'short' }),
  schneider: jobPlace('schneider'),
  'neu-ta': jobPlace('neu-ta', { printName: 'short' }),
  'ticket-forge': place({
    id: 'ticket-forge',
    name: 'Ticket-Forge',
    short: 'Ticket-Forge',
    year: projectYear('ticket-forge'),
    kind: 'project',
    projectSlug: 'ticket-forge',
  }),
  trackfolio: place({
    id: 'trackfolio',
    name: 'Trackfolio',
    short: 'Trackfolio',
    year: projectYear('trackfolio'),
    kind: 'project',
    projectSlug: 'trackfolio',
  }),
  'triplay-ai': place({
    id: 'triplay-ai',
    name: 'TRIPLAY_AI',
    short: 'TRIPLAY_AI',
    year: projectYear('triplay-ai'),
    kind: 'project',
    projectSlug: 'triplay-ai',
  }),
  'expense-share': place({
    id: 'expense-share',
    name: 'ExpenseShare',
    short: 'ExpenseShare',
    year: projectYear('expense-share'),
    kind: 'project',
    projectSlug: 'expense-share',
  }),
  'calendar-java': place({
    id: 'calendar-java',
    name: 'Calendar (Java)',
    short: 'Calendar',
    year: projectYear('calendar-java'),
    kind: 'project',
    projectSlug: 'calendar-java',
  }),
  'box-archive': place({
    id: 'box-archive',
    name: 'Box Archive',
    short: 'Box Archive',
    year: projectYear('box-archive'),
    kind: 'project',
    projectSlug: 'box-archive',
  }),
  'ieee-mip-optimizer': place({
    id: 'ieee-mip-optimizer',
    name: 'IEEE paper',
    short: 'IEEE',
    year: projectYear('ieee-mip-optimizer'),
    kind: 'project',
    projectSlug: 'ieee-mip-optimizer',
  }),
  cs6650: place({
    id: 'cs6650',
    name: 'Distributed systems coursework',
    short: 'CS6650',
    year: '2025',
    kind: 'coursework',
  }),
}

export function getUsagePlace(id: string): UsagePlace | undefined {
  return Object.prototype.hasOwnProperty.call(USAGE_PLACES, id)
    ? USAGE_PLACES[id as UsagePlaceId]
    : undefined
}

/* ------------------------------------------------------------------------- */
/* Skills                                                                    */
/* ------------------------------------------------------------------------- */

export interface SkillUsage {
  /** Where it was used — a usage place id; the visitor name comes from it. */
  place: UsagePlaceId
  /** One verified, plain-English line for that place. Optional. */
  note?: string
}

export interface SkillNode {
  /** Stable kebab-case id — also the palette deep-link id (`skills > docker`). */
  id: string
  label: string
  cluster: SkillClusterId
  /** Plain-English kind line, e.g. 'Backend', 'Programming language'. */
  kind: string
  /** One sentence: what the tool is (PRINT close-up body). */
  blurb: string
  /** Verified usage lines. Empty ⇒ the inspector shows the core-stack line. */
  usedIn: readonly SkillUsage[]
}

/** A language is a skill that sits in the Languages row rather than a tray. */
export interface Language extends Omit<SkillNode, 'cluster'> {
  cluster: 'languages'
  /** v2 prose usage line — kept as data; no v3 surface renders it (usedIn is the source). */
  context?: string
}

export type Skill = SkillNode | Language

export interface SkillCluster {
  id: SkillClusterId
  /** Visitor label as the frames print it: 'Frontend', 'DevOps', … */
  label: string
  nodes: readonly SkillNode[]
}

/* Verified usage lines (CONTENT_FINAL "Verified usedIn map"). */
const schneider10k: SkillUsage = {
  place: 'schneider',
  note: 'Applications used by 10,000+ employees',
}
const schneider: SkillUsage = { place: 'schneider' }
const ticketForge: SkillUsage = { place: 'ticket-forge' }
const trackfolio: SkillUsage = { place: 'trackfolio' }
const expenseShare: SkillUsage = { place: 'expense-share' }

const node = (
  id: string,
  label: string,
  cluster: SkillClusterId,
  kind: string,
  blurb: string,
  usedIn: readonly SkillUsage[] = []
): SkillNode => ({ id, label, cluster, kind, blurb, usedIn })

/** The seven trays in flow order (frontend → backend → data → monitoring, then testing → devops → cloud). */
export const skillClusters: readonly SkillCluster[] = [
  {
    id: 'frontend',
    label: 'Frontend',
    nodes: [
      node(
        'react',
        'React',
        'frontend',
        'Frontend',
        'Builds interfaces out of small components that re-render only when their data changes.',
        [trackfolio, schneider10k, expenseShare]
      ),
      node(
        'redux',
        'Redux',
        'frontend',
        'Frontend',
        'Keeps an app’s state in one predictable store, so every screen agrees on the truth.'
      ),
      node(
        'nextjs',
        'Next.js',
        'frontend',
        'Frontend',
        'The React framework for production sites: routing, server rendering and builds in one.',
        [trackfolio]
      ),
    ],
  },
  {
    id: 'backend',
    label: 'Backend',
    nodes: [
      node(
        'nodejs',
        'Node.js',
        'backend',
        'Backend',
        'Runs JavaScript on the server, so one language covers the browser and the backend.',
        [schneider]
      ),
      node(
        'express',
        'Express.js',
        'backend',
        'Backend',
        'A small, unopinionated web framework for Node.js — routes, middleware, done.',
        [expenseShare]
      ),
      node(
        'fastapi',
        'FastAPI',
        'backend',
        'Backend',
        'A fast Python web framework with typed request models and automatic API docs.',
        [ticketForge]
      ),
      node(
        'flask',
        'Flask',
        'backend',
        'Backend',
        'A lightweight Python web framework — a few lines make a working web app.',
        [schneider10k]
      ),
      node(
        'django',
        'Django',
        'backend',
        'Backend',
        'Python’s batteries-included web framework: ORM, admin, auth and templating built in.'
      ),
      node(
        'spring-boot',
        'Spring Boot',
        'backend',
        'Backend',
        'Java’s production framework: opinionated defaults for services that run at scale.'
      ),
      node(
        'kafka',
        'Kafka',
        'backend',
        'Backend',
        'A distributed event log that moves streams of records between services reliably.'
      ),
      node(
        'rest-apis',
        'REST APIs',
        'backend',
        'Backend',
        'The plain HTTP contract between services: resources, verbs and status codes.'
      ),
    ],
  },
  {
    id: 'data',
    label: 'Data',
    nodes: [
      node(
        'postgresql',
        'PostgreSQL',
        'data',
        'Data',
        'The dependable open-source relational database, from transactions to JSON.',
        [ticketForge]
      ),
      node(
        'pgvector',
        'pgvector',
        'data',
        'Data',
        'Vector similarity search inside PostgreSQL — embeddings next to the rest of the data.',
        [{ place: 'ticket-forge', note: 'Similarity search over tickets and engineers' }]
      ),
      node(
        'mysql',
        'MySQL',
        'data',
        'Data',
        'The widely deployed relational database behind countless web applications.',
        [schneider, expenseShare]
      ),
      node(
        'mongodb',
        'MongoDB',
        'data',
        'Data',
        'A document database that stores flexible JSON-like records instead of rows.'
      ),
      node(
        'redis',
        'Redis',
        'data',
        'Data',
        'An in-memory data store for caches, queues, counters and rate limits.',
        [{ place: 'trackfolio', note: 'Rate limiting, via Upstash' }]
      ),
    ],
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    nodes: [
      node(
        'prometheus',
        'Prometheus',
        'monitoring',
        'Monitoring',
        'Collects metrics from services over time and alerts when they drift.',
        [schneider]
      ),
      node(
        'grafana',
        'Grafana',
        'monitoring',
        'Monitoring',
        'Turns metrics and logs into dashboards people actually look at.',
        [schneider]
      ),
      node(
        'cloudwatch',
        'CloudWatch',
        'monitoring',
        'Monitoring',
        'AWS’s built-in monitoring: logs, metrics and alarms for everything in the account.'
      ),
    ],
  },
  {
    id: 'testing',
    label: 'Testing',
    nodes: [
      node(
        'junit',
        'JUnit',
        'testing',
        'Testing',
        'The standard Java testing framework — every assertion, every run.',
        [{ place: 'aws-intern', note: '100% coverage on the evidence collector' }]
      ),
      node(
        'mockito',
        'Mockito',
        'testing',
        'Testing',
        'Mocks collaborators in Java tests so each unit is tested on its own.'
      ),
      node(
        'pytest',
        'PyTest',
        'testing',
        'Testing',
        'Python’s testing framework: plain functions, rich assertions, fixtures.'
      ),
      node(
        'playwright',
        'Playwright',
        'testing',
        'Testing',
        'Drives real browsers from code — end-to-end tests and automation.',
        [{ place: 'aws-intern', note: 'Browser automation for evidence capture' }]
      ),
    ],
  },
  {
    id: 'devops',
    label: 'DevOps',
    nodes: [
      node(
        'docker',
        'Docker',
        'devops',
        'DevOps',
        'Packs an app and everything it needs into one container, so it runs the same on a laptop as in the cloud.',
        [
          { place: 'aws-intern', note: 'Infrastructure as code, with AWS CDK and IAM' },
          { place: 'schneider', note: 'Containerized the backend services, run on Kubernetes' },
          { place: 'ticket-forge', note: 'The MLOps loop on GCP, with Terraform' },
        ]
      ),
      node(
        'kubernetes',
        'Kubernetes',
        'devops',
        'DevOps',
        'Runs containers across a cluster: scheduling, scaling and healing them automatically.',
        [{ place: 'schneider', note: 'Ran the containerized backend services' }]
      ),
      node(
        'terraform',
        'Terraform',
        'devops',
        'DevOps',
        'Describes cloud infrastructure as code, so environments are versioned and repeatable.',
        [ticketForge]
      ),
      node(
        'jenkins',
        'Jenkins',
        'devops',
        'DevOps',
        'The long-serving automation server for building, testing and shipping code.',
        [{ place: 'schneider', note: 'CI/CD pipelines for the backend services' }]
      ),
      node(
        'github-actions',
        'GitHub Actions',
        'devops',
        'DevOps',
        'CI/CD that lives next to the code: workflows run on every push and pull request.',
        [{ place: 'ticket-forge', note: 'Model CI/CD in the MLOps loop' }]
      ),
      node(
        'git',
        'Git',
        'devops',
        'DevOps',
        'Version control — the history of every change, branch and merge.'
      ),
      node(
        'linux',
        'Linux',
        'devops',
        'DevOps',
        'The operating system most servers run; the shell is where the work happens.'
      ),
    ],
  },
  {
    id: 'cloud',
    label: 'Cloud',
    nodes: [
      node(
        'aws',
        'AWS',
        'cloud',
        'Cloud',
        'Amazon’s cloud: compute, storage, identity and the services around them.',
        [{ place: 'aws-intern', note: 'Lambda, S3, CDK and IAM' }]
      ),
      node(
        'gcp',
        'GCP',
        'cloud',
        'Cloud',
        'Google’s cloud platform, from managed compute to the ML tooling around it.',
        [{ place: 'ticket-forge', note: 'Where the MLOps loop runs' }]
      ),
      node(
        'azure',
        'Azure',
        'cloud',
        'Cloud',
        'Microsoft’s cloud platform, including the identity services enterprises run on.'
      ),
    ],
  },
]

export const allSkillNodes: readonly SkillNode[] = skillClusters.flatMap((c) => c.nodes)

export function getSkillNode(id: string): SkillNode | undefined {
  return allSkillNodes.find((n) => n.id === id)
}

export function getSkillCluster(id: string): SkillCluster | undefined {
  return skillClusters.find((c) => c.id === id)
}

/* ------------------------------------------------------------------------- */
/* Languages row                                                             */
/* ------------------------------------------------------------------------- */

const lang = (
  id: string,
  label: string,
  blurb: string,
  usedIn: readonly SkillUsage[] = [],
  context?: string
): Language => ({
  id,
  label,
  cluster: 'languages',
  kind: 'Programming language',
  blurb,
  usedIn,
  context,
})

/** The Languages row — resume Languages group, in resume order. */
export const languages: readonly Language[] = [
  lang(
    'python',
    'Python',
    'Used from web services to published research.',
    [
      { place: 'aws-intern', note: 'Lambda functions and their unit tests' },
      { place: 'schneider', note: 'Flask apps used by 10,000+ employees' },
      { place: 'ticket-forge', note: 'Ranks engineers for incoming tickets' },
      { place: 'triplay-ai', note: 'Game agents for Connect Four and Snake' },
      { place: 'ieee-mip-optimizer', note: 'Allocating medical samples for testing' },
    ],
    'Schneider Electric · AWS internship · Ticket-Forge · TRIPLAY_AI · IEEE optimizer'
  ),
  lang(
    'java',
    'Java',
    'The language of the evidence collector, the classroom and the calendar app.',
    [
      { place: 'aws-intern', note: 'The evidence collector, tested to 100% coverage' },
      { place: 'neu-ta', note: 'Teaching object-oriented design and unit testing' },
      { place: 'calendar-java', note: 'A calendar app built around SOLID and design patterns' },
    ],
    'AWS internship · CS5010 TA · Calendar (Java)'
  ),
  lang(
    'go',
    'Go',
    'Small, fast and built for services that talk to each other.',
    [{ place: 'cs6650', note: 'A replicated key-value store, load-tested on AWS' }],
    'CS6650 distributed systems — replicated key-value store, AWS load tests'
  ),
  lang('javascript', 'JavaScript', 'The language of the browser, and of Node.js on the server.'),
  lang(
    'typescript',
    'TypeScript',
    'JavaScript with types — the language Trackfolio is written in.',
    [{ place: 'trackfolio', note: 'The whole app, front to back' }],
    'Trackfolio'
  ),
  lang('c', 'C', 'Close to the metal: memory, pointers and the systems everything else runs on.'),
  lang(
    'cpp',
    'C++',
    'C with classes, templates and the standard library — performance with structure.'
  ),
  lang(
    'sql',
    'SQL',
    'The language of relational data: queries, joins and the indexes that make them fast.'
  ),
]

export function getLanguage(id: string): Language | undefined {
  return languages.find((l) => l.id === id)
}

/** Every skill in the diagram: the 33 tray nodes + the 8 languages. */
export const allSkills: readonly Skill[] = [...allSkillNodes, ...languages]

/** Resolve a tray node OR a language by id. */
export function getSkill(id: string): Skill | undefined {
  return getSkillNode(id) ?? getLanguage(id)
}

/** The visitor label of a skill's tray ('DevOps', 'Languages'). */
export function skillTrayLabel(skill: Skill): string {
  return skill.cluster === 'languages' ? 'Languages' : (getSkillCluster(skill.cluster)?.label ?? '')
}

/** The one line an inspector shows when a skill has no verified usage. */
export const CORE_STACK_LINE = 'Part of the core stack — no single project to point at.'

/* ------------------------------------------------------------------------- */
/* Usage map — "Where I've used them" (S3 §3 G / P3 §3 D), derived           */
/* ------------------------------------------------------------------------- */

/** The rows of the usage map, in the frames' order (jobs, then projects). */
export const USAGE_MAP_PLACES: readonly UsagePlaceId[] = [
  'aws-intern',
  'schneider',
  'ticket-forge',
  'trackfolio',
  'triplay-ai',
  'expense-share',
  'box-archive',
]

/** Chip order inside a row: languages first, then the trays in flow order. */
export const USAGE_CHIP_ORDER: readonly SkillTrayId[] = [
  'languages',
  'frontend',
  'backend',
  'data',
  'testing',
  'devops',
  'cloud',
  'monitoring',
]

export interface UsageRow {
  place: UsagePlace
  /** Skills used there, ordered by USAGE_CHIP_ORDER then diagram order. Empty ⇒ core stack. */
  skills: readonly Skill[]
}

/** Every skill whose verified usage names this place, in chip order. */
export function skillsUsedAt(placeId: UsagePlaceId): readonly Skill[] {
  const byTray = new Map<SkillTrayId, Skill[]>()
  for (const skill of allSkills) {
    if (!skill.usedIn.some((u) => u.place === placeId)) continue
    const list = byTray.get(skill.cluster) ?? []
    list.push(skill)
    byTray.set(skill.cluster, list)
  }
  return USAGE_CHIP_ORDER.flatMap((tray) => byTray.get(tray) ?? [])
}

/** The seven usage-map rows, derived from `usedIn` — never hand-written. */
export function usageRows(): readonly UsageRow[] {
  return USAGE_MAP_PLACES.map((id) => ({ place: USAGE_PLACES[id], skills: skillsUsedAt(id) }))
}

/* ------------------------------------------------------------------------- */
/* Resume groups (authoritative) — /cv and the terminal's resume summary     */
/* ------------------------------------------------------------------------- */

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
