/**
 * /work/[slug] — permalink case files (spec §4.11). Five prerendered RSC
 * pages: reduced nav (breadcrumb + back + /cv), the terminal-chrome project
 * window (generative-plate poster + ▶ run demo island + case file + links),
 * a next-project link, and SoftwareSourceCode JSON-LD. Deliberately thin.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProject, projectSlugs } from '@/lib/data/projects'
import { profile } from '@/lib/data/profile'
import WorkStage from '@/components/work/WorkStage'

export function generateStaticParams(): { slug: string }[] {
  return projectSlugs.map((slug) => ({ slug }))
}

export const dynamicParams = false

interface WorkPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: WorkPageProps): Promise<Metadata> {
  const { slug } = await params
  const project = getProject(slug)
  if (!project) return {}
  return {
    title: project.name,
    description: project.oneLiner,
    alternates: { canonical: `/work/${project.slug}` },
  }
}

const CASE_FILE = [
  { label: 'PROBLEM', key: 'problem' },
  { label: 'BUILD', key: 'build' },
  { label: 'RESULT', key: 'result' },
] as const

export default async function WorkPage({ params }: WorkPageProps) {
  const { slug } = await params
  const project = getProject(slug)
  if (!project) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: project.name,
    description: project.oneLiner,
    ...(project.stack.length > 0 ? { programmingLanguage: project.stack[0] } : {}),
    author: { '@type': 'Person', name: profile.name },
    url: `/work/${project.slug}`,
    ...(project.repoUrl ? { codeRepository: project.repoUrl } : {}),
  }

  const idx = projectSlugs.indexOf(project.slug)
  const next = getProject(projectSlugs[(idx + 1) % projectSlugs.length])

  return (
    <>
      {/* Reduced nav: breadcrumb + back to site + /cv (spec §4.11). */}
      <header
        className="border-b border-hairline"
        style={{ zIndex: 'var(--z-nav)', position: 'relative' }}
      >
        <nav
          aria-label="Primary"
          className="container-site flex h-12 items-center justify-between gap-4"
        >
          <span className="type-label-sm text-secondary">
            ~/darshan-konnur
            <span className="text-tertiary" aria-hidden="true">
              {' '}
              / work / {project.slug}
            </span>
          </span>
          <span className="type-label-sm flex items-center gap-5">
            <Link href="/" className="text-secondary transition-colors hover:text-primary">
              ← back to site
            </Link>
            {/* /cv is deliberately a plain <a>: it keeps the zero-JS route a
                full-document navigation (spec §4.10). */}
            <a href="/cv" className="text-secondary transition-colors hover:text-primary">
              cv ↗
            </a>
          </span>
        </nav>
      </header>

      <main
        id="main"
        className="container-site relative pb-24 pt-12"
        style={{ zIndex: 'var(--z-content)' }}
      >
        <p className="type-label-xs text-secondary">
          {project.dir}/{project.slug}/
        </p>
        <h1 className="type-h2 mt-2">{project.name}</h1>
        <p className="type-body-lg text-secondary mt-3" style={{ maxWidth: '65ch' }}>
          {project.oneLiner}
        </p>

        {/* The project window: terminal chrome, 0 radius (§4.6 anatomy). */}
        <div className="elev-window mt-10 bg-panel">
          <div className="flex h-10 items-center gap-3 border-b border-hairline px-4">
            <span className="flex gap-1.5" aria-hidden="true">
              <span className="h-2 w-2 rounded-full border border-hairline" />
              <span className="h-2 w-2 rounded-full border border-hairline" />
              <span className="h-2 w-2 rounded-full border border-hairline" />
            </span>
            <span className="type-label-sm text-secondary min-w-0 truncate">{project.windowTitle}</span>
            {project.award ? (
              <span className="type-label-xs rounded-chip bg-amber-dim text-amber min-w-0 truncate px-2 py-0.5">
                {project.award}
              </span>
            ) : null}
            {project.live ? (
              <span className="type-label-xs text-signal flex shrink-0 items-center gap-1.5">
                <span
                  className="bg-signal inline-block h-1.5 w-1.5 rounded-full"
                  style={{ animation: 'pulse-soft 2s ease-in-out infinite' }}
                  aria-hidden="true"
                />
                LIVE
              </span>
            ) : null}
          </div>

          <WorkStage slug={project.slug} name={project.name} />

          {/* Case file: three mono-labeled columns, stacking on small screens. */}
          <dl className="grid gap-6 p-6 md:grid-cols-3 md:gap-8">
            {CASE_FILE.map(({ label, key }) => (
              <div key={key}>
                <dt className="type-label-xs text-secondary">{label}</dt>
                <dd className="type-body mt-2" style={{ fontSize: 15 }}>
                  {project[key]}
                </dd>
              </div>
            ))}
          </dl>

          {/* Footer strip: stack chips + links (§4.6). */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-hairline p-4">
            {project.stack.length > 0 ? (
              <ul className="flex flex-wrap gap-2" aria-label="Stack">
                {project.stack.map((s) => (
                  <li
                    key={s}
                    className="type-label-sm hairline rounded-chip px-2.5 py-1 text-secondary"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            ) : null}
            <span className="type-label-sm flex flex-wrap gap-5">
              <a
                href={project.repoUrl ?? profile.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary transition-colors hover:text-primary"
              >
                [ view source ]
              </a>
              {project.demoUrl ? (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary transition-colors hover:text-primary"
                >
                  {project.live ? '[ open app ]' : '[ watch demo ]'}
                </a>
              ) : null}
              {project.paperUrl ? (
                <a
                  href={project.paperUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary transition-colors hover:text-primary"
                >
                  [ read paper ]
                </a>
              ) : null}
            </span>
          </div>
        </div>

        <p className="type-label-sm mt-10">
          <Link
            href={`/work/${next!.slug}`}
            className="text-secondary transition-colors hover:text-primary"
          >
            next project: {next!.name} →
          </Link>
        </p>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </main>
    </>
  )
}
