/**
 * /cv — the Recruiter Cut (spec §4.10).
 * Dense, zero-motion, print-perfect, deep-linkable dossier.
 * MUST stay pure RSC + CSS: zero client JS — do not import any client
 * component here (no next/link either; plain <a> is deliberate).
 * All facts come verbatim from @/lib/data/*.
 */

import type { Metadata } from 'next'
import { profile } from '@/lib/data/profile'
import { skillGroups } from '@/lib/data/skills'
import { projects } from '@/lib/data/projects'
import { commits } from '@/lib/data/experience'

export const metadata: Metadata = {
  title: 'CV',
  description: `${profile.name} — ${profile.role}. ${profile.location}. Incoming SDE @ AWS (Jan 2027). MS CS @ Northeastern, IEEE-published.`,
  alternates: { canonical: '/cv' },
}

/**
 * Print stylesheet (spec §4.10): black on white, no chrome, underlines off,
 * URLs printed after link text, fits 1–2 pages. The literal black/white here
 * is sanctioned by the spec for print only; screen styles use tokens.
 */
const printCss = `
@media print {
  html, body { background: #fff !important; }
  body::before, body::after { display: none !important; }
  .skip-link { display: none !important; }
  .cv-root { max-width: 100% !important; padding: 0 !important; }
  .cv-root, .cv-root * { color: #000 !important; border-color: #bbb !important; }
  .cv-root a { text-decoration: none !important; }
  .cv-root a[data-print-url]::after {
    content: ' (' attr(href) ')';
    font-size: 0.75em;
    word-break: break-all;
  }
  .cv-noprint { display: none !important; }
  /* §2.3: the photo prints — grayscale on the paper dossier. */
  .cv-photo { filter: grayscale(1); }
  .cv-root section { break-inside: avoid; }
  .cv-root { font-size: 13px; }
}
`

const scholarlyJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ScholarlyArticle',
  name: profile.publication.title,
  author: { '@type': 'Person', name: profile.name },
  publisher: profile.publication.venue,
  ...(profile.publication.doi ? { identifier: profile.publication.doi } : {}),
  ...(profile.publication.paperUrl ? { url: profile.publication.paperUrl } : {}),
}

/** Dossier section: hairline-topped, mono eyebrow label, dense 24/48 rhythm. */
function CvSection({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-12 border-t border-hairline pt-6" aria-label={label}>
      <h2 className="type-label-xs text-secondary">{label}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

export default function CvPage() {
  const experience = commits.filter((c) => c.bullets.length > 0)
  const { education, educationPrior, publication } = profile

  return (
    <main
      id="main"
      className="cv-root container-site relative pb-16 pt-12"
      style={{ maxWidth: 720, zIndex: 'var(--z-content)' }}
    >
      <style dangerouslySetInnerHTML={{ __html: printCss }} />

      <header className="flex flex-wrap items-start justify-between gap-x-8 gap-y-6">
        <div>
          <h1 className="type-h2" style={{ fontWeight: 700 }}>
            {profile.name}
          </h1>
          <p className="type-body text-secondary mt-1">
            {profile.role} · {profile.location} · {profile.status}
          </p>
          <p className="type-body mt-3">
            <a className="underline" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>{' '}
            ·{' '}
            <a className="underline" href={profile.githubUrl} data-print-url>
              github
            </a>{' '}
            ·{' '}
            <a className="underline" href={profile.linkedinUrl} data-print-url>
              linkedin
            </a>{' '}
            ·{' '}
            <a className="underline" href={profile.resumePdf}>
              resume (PDF)
            </a>
          </p>
        </div>
        <div className="flex items-start gap-6">
          <a
            href={profile.resumePdf}
            download
            className="cv-noprint type-label-sm hairline rounded-btn px-4 py-3 text-secondary transition-colors hover:border-hairline-strong hover:text-primary"
          >
            Download resume (PDF)
          </a>
          {/* §2.3 recruiter recognition: 96px plain <img> (NOT next/image — /cv
              is contractually zero client JS), 0 radius, stays in print
              (grayscaled via printCss). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/photo/darshan-440.webp"
            alt="Darshan Konnur"
            width={96}
            height={96}
            loading="lazy"
            className="cv-photo hairline shrink-0"
          />
        </div>
      </header>

      <CvSection label="Experience">
        <div className="space-y-6">
          {experience.map((entry) => (
            <div key={entry.id}>
              <p className="type-body" style={{ fontWeight: 600 }}>
                {entry.id === 'neu-ta'
                  ? `${education.ta.title} — ${education.school}`
                  : entry.meta}
              </p>
              {entry.id === 'neu-ta' ? (
                <p className="type-body text-secondary mt-0.5">
                  {entry.meta} · {education.ta.course} · {education.ta.courseName}
                </p>
              ) : null}
              <ul className="type-body mt-2 list-disc space-y-1 pl-5">
                {entry.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              {entry.outcome ? (
                <p className="type-body mt-1" style={{ fontWeight: 600 }}>
                  {entry.outcome}
                </p>
              ) : null}
              {entry.award ? (
                <p className="type-code text-secondary mt-1">{entry.award}</p>
              ) : null}
            </div>
          ))}
        </div>
      </CvSection>

      <CvSection label="Projects">
        <div>
          {projects.map((p, i) => (
            <div
              key={p.slug}
              className={i === 0 ? 'py-3 pt-0' : 'border-t border-hairline py-3'}
            >
              <p className="type-body">
                <strong>{p.name}</strong> ({p.year}) — {p.oneLiner}
              </p>
              {p.award ? <p className="type-code text-secondary mt-1">{p.award}</p> : null}
              <p className="type-code text-secondary mt-1">
                {p.stack.length > 0 ? <>{p.stack.join(' · ')} · </> : null}
                <a className="underline" href={`/work/${p.slug}`}>
                  case file
                </a>{' '}
                ·{' '}
                {p.paperUrl ? (
                  <a className="underline" href={p.paperUrl} data-print-url>
                    paper
                  </a>
                ) : (
                  <a className="underline" href={p.repoUrl ?? profile.githubUrl} data-print-url>
                    source
                  </a>
                )}
                {p.demoUrl ? (
                  <>
                    {' '}
                    ·{' '}
                    <a className="underline" href={p.demoUrl} data-print-url>
                      {p.live ? 'live' : 'demo'}
                    </a>
                  </>
                ) : null}
              </p>
            </div>
          ))}
        </div>
      </CvSection>

      <CvSection label="Skills">
        <ul className="type-body space-y-1.5">
          {skillGroups.map((g) => (
            <li key={g.label}>
              <span className="type-code text-secondary">{g.label}:</span>{' '}
              {g.items.join(', ')}
            </li>
          ))}
        </ul>
      </CvSection>

      <CvSection label="Education">
        <div className="space-y-4">
          <div>
            <p className="type-body" style={{ fontWeight: 600 }}>
              {education.school} — {education.degree}
            </p>
            <p className="type-body text-secondary mt-0.5">
              {education.location} · {education.period}
            </p>
            <p className="type-body mt-1">
              {education.ta.title} — {education.ta.course} · {education.ta.courseName} (
              {education.ta.students} students) · {education.ta.period}
            </p>
          </div>
          <div>
            <p className="type-body" style={{ fontWeight: 600 }}>
              {educationPrior.school} — {educationPrior.degree}
            </p>
            <p className="type-body text-secondary mt-0.5">
              {educationPrior.location} · {educationPrior.period}
            </p>
          </div>
        </div>
      </CvSection>

      <CvSection label="Publication">
        <p className="type-body">
          &ldquo;{publication.title}&rdquo; — {publication.venue}.
          {publication.doi ? <> DOI: {publication.doi}.</> : null}{' '}
          {publication.paperUrl ? (
            <a className="underline" href={publication.paperUrl} data-print-url>
              read paper
            </a>
          ) : null}
        </p>
        <p className="type-body text-secondary mt-1">{publication.summary}</p>
      </CvSection>

      <p className="cv-noprint type-body mt-12 border-t border-hairline pt-6">
        {/* Plain <a> on purpose: /cv is contractually ZERO client JS (spec §4.10);
            next/link would pull the client Link runtime into this route. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a className="underline" href="/">
          ← back to site
        </a>
      </p>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(scholarlyJsonLd) }}
      />
    </main>
  )
}
