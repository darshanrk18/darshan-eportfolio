/**
 * v3 §2.8 — official logo index (Phase B).
 * Maps every skill id in lib/data/skills.ts (diagram nodes AND the languages
 * row) plus the social marks to the files under public/logos/ (copied 1:1
 * from the design workshop's logo set; public/logos/logos.json is the same
 * index as data). Law (BRIEF-R2 §2): official logos only, always next to a
 * visible name, never a drawn imitation. The four declared exceptions:
 *   - mockito    — no official logo → text chip in the same box ("M").
 *   - cloudwatch — mono file only (no colour art).
 *   - pgvector   — no logo → the PostgreSQL logo + the visible "pgvector" name.
 *   - sql        — no logo → text chip ("SQL").
 * Plus: java's mono file is the OpenJDK mark → prefer the colour logo even in
 * SCREEN (the `.ed-logo img.mono` filter whitens it).
 *
 * Rendering contract (components/skills/Logo.tsx): SCREEN shows `mono` files
 * whitened by the `.ed-logo img.mono` filter (styles/v3), colour only on the
 * active node; PRINT shows colour files on die-cut stickers. `resolveLogo`
 * encodes the fallbacks so callers never touch file names.
 */

/** Public URL prefix of the logo files (public/logos). */
export const LOGO_DIR = '/logos'

export interface LogoEntry {
  /** Visible name the logo sits next to — the skill label. */
  label: string
  /** Colour file under public/logos, e.g. 'logo-react.svg'. */
  color?: string
  /** Single-black-path mono file under public/logos, e.g. 'logo-react-mono.svg'. */
  mono?: string
  /** No official logo: render a text chip in the same box (see `chipText`). */
  textChip?: boolean
  /** Text inside the chip; defaults to `label`. */
  chipText?: string
  /** Use the colour file even when a mono is requested (java: mono = OpenJDK). */
  preferColor?: boolean
}

/** Every id that has a logo entry: skill nodes, languages, and the social marks. */
export type LogoId =
  // frontend
  | 'react'
  | 'redux'
  | 'nextjs'
  // backend
  | 'nodejs'
  | 'express'
  | 'fastapi'
  | 'flask'
  | 'django'
  | 'spring-boot'
  | 'kafka'
  | 'rest-apis'
  // data
  | 'postgresql'
  | 'mysql'
  | 'mongodb'
  | 'redis'
  | 'pgvector'
  // infra
  | 'aws'
  | 'azure'
  | 'gcp'
  | 'docker'
  | 'kubernetes'
  | 'terraform'
  | 'jenkins'
  | 'github-actions'
  // observability
  | 'prometheus'
  | 'grafana'
  | 'cloudwatch'
  // testing
  | 'junit'
  | 'mockito'
  | 'pytest'
  | 'playwright'
  // languages row
  | 'python'
  | 'java'
  | 'go'
  | 'javascript'
  | 'typescript'
  | 'c'
  | 'cpp'
  | 'sql'
  // resume DevOps extras + social marks
  | 'git'
  | 'linux'
  | 'github'
  | 'linkedin'

const pair = (label: string, id: string): LogoEntry => ({
  label,
  color: `logo-${id}.svg`,
  mono: `logo-${id}-mono.svg`,
})

export const LOGOS: Record<LogoId, LogoEntry> = {
  react: pair('React', 'react'),
  redux: pair('Redux', 'redux'),
  nextjs: pair('Next.js', 'nextjs'),
  nodejs: pair('Node.js', 'nodejs'),
  express: pair('Express.js', 'express'),
  fastapi: pair('FastAPI', 'fastapi'),
  flask: pair('Flask', 'flask'),
  django: pair('Django', 'django'),
  'spring-boot': pair('Spring Boot', 'spring-boot'),
  kafka: pair('Kafka', 'kafka'),
  'rest-apis': {
    label: 'REST APIs',
    textChip: true,
    chipText: 'API',
  },
  postgresql: pair('PostgreSQL', 'postgresql'),
  mysql: pair('MySQL', 'mysql'),
  mongodb: pair('MongoDB', 'mongodb'),
  redis: pair('Redis', 'redis'),
  pgvector: {
    label: 'pgvector',
    color: 'logo-postgresql.svg',
    mono: 'logo-postgresql-mono.svg',
  },
  aws: pair('AWS', 'aws'),
  azure: {
    label: 'Azure',
    color: 'logo-azure.svg',
  },
  gcp: pair('GCP', 'gcp'),
  docker: pair('Docker', 'docker'),
  kubernetes: pair('Kubernetes', 'kubernetes'),
  terraform: pair('Terraform', 'terraform'),
  jenkins: pair('Jenkins', 'jenkins'),
  'github-actions': pair('GitHub Actions', 'github-actions'),
  prometheus: pair('Prometheus', 'prometheus'),
  grafana: pair('Grafana', 'grafana'),
  cloudwatch: {
    label: 'CloudWatch',
    mono: 'logo-cloudwatch-mono.svg',
  },
  junit: pair('JUnit', 'junit'),
  mockito: {
    label: 'Mockito',
    textChip: true,
    chipText: 'M',
  },
  pytest: pair('PyTest', 'pytest'),
  playwright: {
    label: 'Playwright',
    color: 'logo-playwright.svg',
  },
  python: pair('Python', 'python'),
  java: {
    ...pair('Java', 'java'),
    preferColor: true,
  },
  go: pair('Go', 'go'),
  javascript: pair('JavaScript', 'javascript'),
  typescript: pair('TypeScript', 'typescript'),
  c: pair('C', 'c'),
  cpp: pair('C++', 'cpp'),
  sql: {
    label: 'SQL',
    textChip: true,
    chipText: 'SQL',
  },
  git: pair('Git', 'git'),
  linux: pair('Linux', 'linux'),
  github: pair('GitHub', 'github'),
  linkedin: {
    label: 'LinkedIn',
    color: 'logo-linkedin.svg',
  },
}

export const logoIds = Object.keys(LOGOS) as readonly LogoId[]

export function isLogoId(id: string): id is LogoId {
  return Object.prototype.hasOwnProperty.call(LOGOS, id)
}

export function getLogo(id: string): LogoEntry | undefined {
  return isLogoId(id) ? LOGOS[id] : undefined
}

/**
 * Display-name → id, so project stack chips (`Project.stack`) and the resume
 * groups (`skillGroups`) can find their logo without a second table. Covers
 * every LOGOS label plus the resume spellings; names with no logo (tRPC,
 * Drizzle, MLflow, Airflow, OpenCV, …) resolve to undefined and render as
 * plain chips.
 */
const LABEL_ALIASES: Record<string, LogoId> = {
  'Apache Kafka': 'kafka',
  'AWS CloudWatch': 'cloudwatch',
  'Linux/Unix': 'linux',
  'AWS (Lambda, S3, EC2, ECS, ECR, IAM, CDK)': 'aws',
  'Amazon Web Services': 'aws',
  Postgres: 'postgresql',
  Node: 'nodejs',
  Express: 'express',
  Next: 'nextjs',
  K8s: 'kubernetes',
}

const LOGO_ID_BY_LABEL: ReadonlyMap<string, LogoId> = new Map<string, LogoId>([
  ...logoIds.map((id): [string, LogoId] => [LOGOS[id].label.toLowerCase(), id]),
  ...Object.entries(LABEL_ALIASES).map(([k, v]): [string, LogoId] => [k.toLowerCase(), v]),
])

/** Resolve a visible name ('GitHub Actions', 'Node.js', 'Apache Kafka') to its logo id. */
export function logoIdForName(name: string): LogoId | undefined {
  return LOGO_ID_BY_LABEL.get(name.trim().toLowerCase())
}

export type ResolvedLogo =
  | {
      kind: 'img'
      /** Public URL, e.g. '/logos/logo-react-mono.svg'. */
      src: string
      /** True ⇒ add the `mono` class so `.ed-logo img.mono` whitens it. */
      mono: boolean
      label: string
    }
  | { kind: 'chip'; text: string; label: string }

/**
 * Pick the file for an id under the edition's rule.
 * mono=true (SCREEN glass tiles): the mono file; falls back to the colour file
 * (still class `mono`, the CSS filter whitens colour art) when there is no
 * mono or the entry prefers colour (java). mono=false (PRINT stickers, active
 * node): the colour file; falls back to the mono file (cloudwatch) as ink.
 * Text-chip entries and unknown ids: chip / undefined.
 */
export function resolveLogo(id: string, mono = false): ResolvedLogo | undefined {
  const entry = getLogo(id)
  if (!entry) return undefined
  if (entry.textChip || (!entry.color && !entry.mono)) {
    return { kind: 'chip', text: entry.chipText ?? entry.label, label: entry.label }
  }
  const file = mono
    ? ((entry.preferColor ? entry.color : entry.mono) ?? entry.color ?? entry.mono)
    : (entry.color ?? entry.mono)
  return { kind: 'img', src: `${LOGO_DIR}/${file}`, mono, label: entry.label }
}

/** Every file name LOGOS references (tests: each must exist under public/logos). */
export function referencedLogoFiles(): readonly string[] {
  const files = new Set<string>()
  for (const id of logoIds) {
    const e = LOGOS[id]
    if (e.color) files.add(e.color)
    if (e.mono) files.add(e.mono)
  }
  return [...files].sort()
}
