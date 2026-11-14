/**
 * Content data — the résumé as /cv reads it (owner decision "A but my
 * current resume", Sep 30 2026; text synced to the owner's Nov 2026 .tex).
 * The text follows the owner's LaTeX résumé word for word, including the
 * three bench projects the .tex keeps commented out (TRIPLAY_AI, Calendar
 * Application, Box Archive).
 *
 * SERVER ONLY: app/cv/page.tsx is the one importer (tests/cv.test.ts
 * enforces it). Never import this from lib/data/projects.ts, profile.ts or
 * anything a client component reads — '/' carries a 178 KB gz first-load
 * budget and none of this text belongs in it.
 *
 * `**…**` marks the résumé's bold runs (the metrics); richSegments() splits
 * them for the page and plainText() drops the marks.
 *
 * One verified site fact the résumé leaves out is kept on purpose: the
 * AWS offer line (read from lib/data/experience.ts). The Surge award is on
 * the résumé itself since Nov 2026 (a Schneider bullet); the award tag next
 * to the company name stays as the design's visual signal for it.
 * Trackfolio is not on the résumé: its bullets are the site's own `build`
 * and `result` lines (lib/data/projects.ts).
 *
 * Never here: a phone number (the downloadable PDF keeps it; the web page
 * does not) or a grade figure.
 */

import { getCommit } from './experience'
import { getProject, type ProjectSlug } from './projects'
import { profile, siteUrl } from './profile'

/** Résumé text; `**…**` marks a bold run. */
export type RichText = string

export interface RichSegment {
  text: string
  bold: boolean
}

/** Splits `**bold**` runs out of a résumé line. Unbalanced marks stay literal. */
export function richSegments(text: RichText): RichSegment[] {
  const out: RichSegment[] = []
  const re = /\*\*(.+?)\*\*/g
  let cursor = 0
  for (const m of text.matchAll(re)) {
    const start = m.index ?? 0
    if (start > cursor) out.push({ text: text.slice(cursor, start), bold: false })
    out.push({ text: m[1], bold: true })
    cursor = start + m[0].length
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor), bold: false })
  return out
}

/** The line as a reader sees it, without the bold marks. */
export function plainText(text: RichText): string {
  return richSegments(text)
    .map((s) => s.text)
    .join('')
}

/* ------------------------------------------------------------------------- */
/* Sections                                                                  */
/* ------------------------------------------------------------------------- */

export type ResumeSectionId =
  | 'experience'
  | 'projects'
  | 'publication'
  | 'leadership'
  | 'skills'
  | 'education'

/** Section titles in the résumé's words (the ids are the page's deep links). */
export const resumeSections: Record<ResumeSectionId, string> = {
  experience: 'Experience',
  projects: 'Projects',
  publication: 'Publication',
  leadership: 'Leadership & Campus Involvement',
  skills: 'Technical Skills',
  education: 'Education',
}

/* ------------------------------------------------------------------------- */
/* Education                                                                 */
/* ------------------------------------------------------------------------- */

export interface ResumeSchool {
  school: string
  degree: string
  period: string
  location: string
}

export const resumeEducation: readonly ResumeSchool[] = [
  {
    school: 'Northeastern University',
    degree: 'Master of Science in Computer Science',
    period: 'Jan 2025 – Dec 2026',
    location: 'Boston, MA',
  },
  {
    school: 'M. S. Ramaiah Institute of Technology',
    degree: 'Bachelor of Engineering in Computer Science',
    period: 'Aug 2017 – Jul 2021',
    location: 'Bengaluru, India',
  },
]

/* ------------------------------------------------------------------------- */
/* Technical skills                                                          */
/* ------------------------------------------------------------------------- */

export interface ResumeSkillRow {
  label: string
  items: readonly string[]
}

/** The résumé's five rows, in its order. */
export const resumeSkills: readonly ResumeSkillRow[] = [
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
    label: 'Cloud & DevOps',
    items: [
      'AWS (Lambda, S3, EC2, ECS, ECR, IAM, CDK)',
      'Azure',
      'GCP',
      'Docker',
      'Kubernetes',
      'Terraform',
      'Linux/Unix',
    ],
  },
  {
    label: 'Tools & Testing',
    items: [
      'Git',
      'Jenkins',
      'GitHub Actions',
      'JUnit',
      'Mockito',
      'PyTest',
      'Playwright',
      'AWS CloudWatch',
      'Prometheus',
      'Grafana',
    ],
  },
]

/* ------------------------------------------------------------------------- */
/* Experience                                                                */
/* ------------------------------------------------------------------------- */

export interface ResumeJob {
  id: 'aws-intern' | 'neu-ta' | 'schneider'
  company: string
  role: string
  /** Course the role is attached to, printed after the role: 'CS5010 Programming Design Paradigm'. */
  course?: string
  period: string
  location: string
  bullets: readonly RichText[]
  /** Verified closing line (AWS: the offer) — site fact, not on the résumé. */
  outcome?: string
  /** Award tag — site fact, not on the résumé. */
  award?: string
}

export const resumeExperience: readonly ResumeJob[] = [
  {
    id: 'aws-intern',
    company: 'Amazon Web Services (AWS)',
    role: 'Software Development Engineer Intern',
    period: 'Jun 2026 – Aug 2026',
    location: 'Boston, MA',
    bullets: [
      'Designed and built an end-to-end serverless prototype in Java and Python that automatically captures visual evidence for cloud security workflows, using AWS Lambda, S3 and browser automation.',
      'Defined the infrastructure as code with AWS CDK, IAM and Docker, and made the service fault tolerant through input validation, timeout handling and built-in observability.',
      'Achieved **100% test coverage** on the Java evidence collector, unit tested the Python Lambda, and built an end-to-end integration suite that validates success and failure paths against a live AWS environment.',
    ],
    outcome: getCommit('aws-intern')?.outcome,
  },
  {
    id: 'neu-ta',
    company: 'Khoury College of Computer Sciences, Northeastern University',
    role: 'Graduate Teaching Assistant',
    course: 'CS5010 Programming Design Paradigm',
    period: 'Sep 2025 – Dec 2025',
    location: 'Boston, MA',
    bullets: [
      'Mentored **300+ graduate students** in labs and office hours on Java OOP, SOLID principles, UML and design patterns, and reviewed their code and unit tests (JUnit, JaCoCo).',
    ],
  },
  {
    id: 'schneider',
    company: 'Schneider Electric',
    role: 'Digital Workplace Engineer',
    period: 'Feb 2021 – Nov 2023',
    location: 'Bengaluru, India',
    bullets: [
      'Designed and built internal workflow applications in Python/Flask, React, Node.js and MySQL used by **10,000+ employees**, and cut API response times by **30%** through SQL query optimization and caching.',
      'Automated Microsoft 365 administration and migration workflows with Python, PowerShell, Microsoft Graph API and Azure AD, cutting manual effort by **60%**.',
      'Containerized backend services with Docker and Kubernetes, built CI/CD pipelines in Jenkins and GitHub Actions, and added Prometheus/Grafana monitoring so releases stayed consistent and issues were quick to trace.',
      "Won the **Surge award**, Schneider Electric's highest employee recognition, for building the Box Archive document platform.",
    ],
    award: getCommit('schneider')?.award,
  },
]

/** The role line as the résumé prints it: 'Graduate Teaching Assistant, CS5010 Programming Design Paradigm'. */
export function roleLine(job: ResumeJob): string {
  return job.course ? `${job.role}, ${job.course}` : job.role
}

/* ------------------------------------------------------------------------- */
/* Projects                                                                  */
/* ------------------------------------------------------------------------- */

export type ResumeLinkKind = 'case' | 'source' | 'paper' | 'live' | 'demo'

export interface ResumeLink {
  kind: ResumeLinkKind
  /** Visible label: 'case file', 'source', 'paper', 'live', 'demo'. */
  label: string
  href: string
  /** The address as paper prints it: no protocol, no 'www.'. */
  print: string
}

export interface ResumeProject {
  /** The site's case-file slug (/work/<slug>). */
  slug: ProjectSlug
  /** The résumé's title (the site's name where the résumé has none). */
  title: string
  year: string
  stack: readonly string[]
  bullets: readonly RichText[]
  /** Award or Live tag next to the title. */
  tag?: { kind: 'award' | 'live'; text: string }
}

interface ProjectText {
  slug: ProjectSlug
  title?: string
  year: string
  stack?: readonly string[]
  bullets?: readonly RichText[]
  award?: string
}

/** Newest first. Missing title / stack / bullets come from lib/data/projects.ts. */
const PROJECT_TEXT: readonly ProjectText[] = [
  {
    slug: 'ticket-forge',
    title: 'Ticket-Forge',
    year: '2026',
    award: '3rd Place, Google – MLOps Project Expo',
    stack: [
      'Python',
      'FastAPI',
      'PostgreSQL',
      'pgvector',
      'Airflow',
      'MLflow',
      'Docker',
      'GitHub Actions',
    ],
    bullets: [
      'Built an ML-driven recommendation engine that matches software tickets to the best-fit engineers using ticket context, engineer profiles, assignment history, workload and recent experience, cutting down manual triage.',
      'Implemented pgvector similarity search with confidence scoring, explainability and cold-start recommendations, and ran ticket-replay and evaluation pipelines on Apache Airflow with MLflow experiment tracking.',
      'Presented alongside **28 other teams** at **Google’s Cambridge, MA office** during Northeastern’s MLOps Project Expo.',
    ],
  },
  // Not on the résumé: name, stack and both bullets (`build`, `result`) are the site's.
  { slug: 'trackfolio', year: '2026' },
  {
    slug: 'triplay-ai',
    title: 'TRIPLAY_AI',
    year: '2025',
    stack: ['Python', 'OpenCV', 'MediaPipe', 'NumPy', 'Pandas', 'Pygame'],
    bullets: [
      'Built an AI game suite with Connect Four (Minimax with Alpha-Beta pruning), Snake (A* pathfinding) and gesture-based Rock-Paper-Scissors using OpenCV and MediaPipe.',
      'Achieved **91% optimal move selection** in Connect Four and **88% food-acquisition efficiency** in Snake across **100+ simulations**, with on-screen overlays that explain each AI decision.',
    ],
  },
  {
    slug: 'expense-share',
    title: 'ExpenseShare',
    year: '2025',
    stack: ['React', 'Node.js', 'Express.js', 'MySQL', 'REST APIs'],
    bullets: [
      'Designed and built a full-stack expense-sharing platform with a normalized relational schema and REST APIs covering users, groups, expenses, settlements and balance tracking.',
      'Implemented stored procedures, triggers and ACID transactions to keep balances consistent, sped up queries with indexing and pagination, and shipped real-time updates backed by automated tests in CI.',
    ],
  },
  {
    slug: 'calendar-java',
    title: 'Calendar Application',
    year: '2025',
    stack: ['Java', 'Swing', 'MVC', 'Design Patterns'],
    bullets: [
      'Built a Java Swing desktop calendar using MVC, with recurring events, multiple calendars, time-zone handling and full event CRUD.',
      'Followed SOLID principles and used the Command, Adapter, Strategy and Visitor patterns to keep the code easy to extend as features were added.',
    ],
  },
  {
    slug: 'box-archive',
    title: 'Box Archive',
    year: '2023',
    stack: ['Python', 'Flask', 'MySQL', 'Docker', 'Kubernetes', 'OAuth'],
    bullets: [
      'Built a document management platform with Python/Flask and MySQL, using PingID OAuth to control access to shared files and folders.',
      'Containerized the application with Docker, deployed it on Kubernetes, and tuned MySQL stored procedures to improve response times by about **30%**.',
    ],
  },
  {
    slug: 'ieee-mip-optimizer',
    // The publisher's title, spelled as the Publication section spells it.
    title: profile.publication.title,
    year: '2021',
    stack: ['Python', 'Mixed Integer Programming', 'React'],
    bullets: [
      'Developed a Mixed Integer Programming model that minimizes distributed sample testing costs; **published in IEEE Xplore**.',
    ],
  },
]

/** 'https://www.github.com/x' → 'github.com/x'; '/work/x' → 'darshankonnur.com/work/x'. */
export function printAddress(href: string): string {
  const absolute = href.startsWith('/') ? `${siteUrl}${href}` : href
  return absolute.replace(/^[a-z]+:\/\//i, '').replace(/^www\./, '').replace(/\/$/, '')
}

function link(kind: ResumeLinkKind, label: string, href: string): ResumeLink {
  return { kind, label, href, print: printAddress(href) }
}

export const resumeProjects: readonly ResumeProject[] = PROJECT_TEXT.map((t) => {
  const site = getProject(t.slug)
  if (!site) throw new Error(`resume: no site project '${t.slug}'`)
  const tag: ResumeProject['tag'] = t.award
    ? { kind: 'award', text: t.award }
    : site.live
      ? { kind: 'live', text: 'Live' }
      : undefined
  return {
    slug: t.slug,
    title: t.title ?? site.name,
    year: t.year,
    stack: t.stack ?? site.stack,
    bullets: t.bullets ?? [site.build, site.result],
    ...(tag ? { tag } : {}),
  }
})

/**
 * A project's links, from the site data: the case file always; "source"
 * only where the repository is public (repoUrl set); "paper" for the IEEE
 * work; "live" or "demo" from demoUrl.
 */
export function projectLinks(slug: ProjectSlug): ResumeLink[] {
  const site = getProject(slug)
  if (!site) return []
  const out = [link('case', 'case file', `/work/${slug}`)]
  if (site.repoUrl) out.push(link('source', 'source', site.repoUrl))
  if (site.paperUrl) out.push(link('paper', 'paper', site.paperUrl))
  if (site.demoUrl) {
    out.push(site.live ? link('live', 'live', site.demoUrl) : link('demo', 'demo', site.demoUrl))
  }
  return out
}

/* ------------------------------------------------------------------------- */
/* Leadership & campus involvement                                           */
/* ------------------------------------------------------------------------- */

export interface ResumeLeadershipRole {
  /** 'Treasurer, AWS Builders at Northeastern'. */
  role: string
  /** The one-line description after the colon on the résumé. */
  line: string
  period: string
}

/** The résumé's Leadership & Campus Involvement rows (Nov 2026), in its order. */
export const resumeLeadership: readonly ResumeLeadershipRole[] = [
  {
    role: 'Treasurer, AWS Builders at Northeastern',
    line: 'Manage club finances and help organize AWS workshops',
    period: 'May 2026 – Present',
  },
  {
    role: 'Residential Security Office Proctor, Northeastern University',
    line: 'Monitor access and assist residents',
    period: 'Oct 2026 – Present',
  },
]

/* ------------------------------------------------------------------------- */
/* Contact                                                                   */
/* ------------------------------------------------------------------------- */

export interface ResumeContact {
  /** Small caption: 'Email', 'GitHub', 'LinkedIn', 'Web'. */
  label: string
  href: string
  /** The address as shown. */
  text: string
  /** Shown on paper only (the site's own address — a screen reader is already on it). */
  paperOnly?: boolean
}

/** Email, GitHub, LinkedIn — each shown as its address — plus the site on paper. No phone number. */
export const resumeContact: readonly ResumeContact[] = [
  { label: 'Email', href: `mailto:${profile.email}`, text: profile.email },
  { label: 'GitHub', href: profile.githubUrl, text: printAddress(profile.githubUrl) },
  { label: 'LinkedIn', href: profile.linkedinUrl, text: printAddress(profile.linkedinUrl) },
  { label: 'Web', href: siteUrl, text: printAddress(siteUrl), paperOnly: true },
]
