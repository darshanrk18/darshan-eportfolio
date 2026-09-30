/**
 * /work/[slug] — permalink case files (spec §4.11; v3 both editions). Seven
 * prerendered RSC pages: a reduced nav (the seal, "Back to the site", CV),
 * the project window in the Work skin (WorkStage: tabs + poster + "Run the
 * demo" island, with the server-rendered CaseFile as its second column), a
 * next-project link and SoftwareSourceCode JSON-LD. Deliberately thin: the
 * only client JS is WorkStage (+ the demo chunk on first run). The route
 * shares the layout's edition attribute, so both skins apply; no picker,
 * intro or Lenis here (§2.1). Nothing from the clutter list is drawn: no
 * breadcrumb path, no folder names, no `windowTitle`.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import CaseFile from '@/components/projects/CaseFile'
import DkSeal from '@/components/chrome/DkSeal'
import WorkStage from '@/components/work/WorkStage'
import { getProject, projectSlugs, workCopy } from '@/lib/data/projects'
import { profile } from '@/lib/data/profile'

import '@/styles/v3/work.css'

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
  const next = getProject(projectSlugs[(idx + 1) % projectSlugs.length])!

  return (
    <>
      {/* Reduced nav: the seal (home), back to the site, /cv (spec §4.11). */}
      <header className="wk-page-nav" style={{ zIndex: 'var(--z-nav)', position: 'relative' }}>
        <nav aria-label="Primary" className="container-site wk-page-nav-row">
          <Link href="/" className="wk-page-ident" aria-label={`${profile.displayName} — home`}>
            <DkSeal variant="mark" size={26} />
          </Link>
          <span className="wk-page-links">
            <Link href="/">Back to the site</Link>
            {/* /cv is deliberately a plain <a>: it keeps the zero-JS route a
                full-document navigation (spec §4.10). */}
            <a href="/cv">CV</a>
          </span>
        </nav>
      </header>

      <main
        id="main"
        className="container-site wk wk-page"
        style={{ zIndex: 'var(--z-content)', position: 'relative' }}
      >
        <p className="wk-kicker ed-label ed-screen-only" data-surface="kicker">
          <span className="wk-rule" aria-hidden="true" />
          {workCopy.screen.kicker}
        </p>
        <p className="wk-chapter wk-page-chapter ed-print-only">{workCopy.print.chapter}</p>

        <WorkStage slug={project.slug} name={project.name}>
          <CaseFile project={project} as="h1" />
        </WorkStage>

        <p className="wk-page-next">
          <Link href={`/work/${next.slug}`}>
            {workCopy.caseFile.next}: {next.name} →
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
