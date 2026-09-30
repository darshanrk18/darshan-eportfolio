/**
 * /cv — the résumé page, design A "The editorial spread" (design round
 * design-workshop/cv, owner call "A but my current resume").
 *
 * A two-column spread on screen: an identity rail (name, status, the ID
 * card with the photo, contact and the one primary action, then Technical
 * Skills and Education, then a running-head card that sticks) beside the
 * story (Experience, Projects, Publication), where every date and place sits
 * in one left margin. On paper it becomes a two-page CV in ONE paper skin
 * for both editions (styles/v3/cv.css, @media print).
 *
 * DOM order is reading (and Tab) order: header, the jump row (below 1100
 * px only), story, reference, running head (1100 px and up only), footer.
 * The grid places the rail's parts; nothing is reordered for the eye alone.
 *
 * MUST stay pure RSC + CSS: zero client JS — no 'use client' import, no
 * next/dynamic, no next/link (plain <a> is deliberate), no next/image (the
 * photo is a CSS background so only the edition in force is fetched).
 * Text comes verbatim from the owner's résumé (lib/data/resume.ts — a
 * server-only module this page alone imports) plus lib/data/profile and
 * lib/data/publication. No phone number and no grade figure on this page.
 */

import type { Metadata } from 'next'
import { Fragment } from 'react'
import { preload } from 'react-dom'
import { profile } from '@/lib/data/profile'
import { publicationRecord } from '@/lib/data/publication'
import {
  printAddress,
  projectLinks,
  resumeContact,
  resumeEducation,
  resumeExperience,
  resumeProjects,
  resumeSections,
  resumeSkills,
  richSegments,
  type RichText,
} from '@/lib/data/resume'
import { shareMeta } from '@/lib/utils/share'

import '@/styles/v3/cv.css'

const cvDescription = `${profile.name} — ${profile.role}. ${profile.location}. Incoming SDE @ AWS (Jan 2027). MS CS @ Northeastern, IEEE-published.`

export const metadata: Metadata = {
  title: 'CV',
  description: cvDescription,
  alternates: { canonical: '/cv' },
  ...shareMeta('/cv', `CV — ${profile.displayName}`, cvDescription),
}

const scholarlyJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ScholarlyArticle',
  name: profile.publication.title,
  author: publicationRecord.authors.map((name) => ({ '@type': 'Person', name })),
  datePublished: String(publicationRecord.year),
  isPartOf: publicationRecord.booktitle,
  publisher: { '@type': 'Organization', name: profile.publication.venue },
  ...(profile.publication.doi ? { identifier: profile.publication.doi } : {}),
  ...(profile.publication.paperUrl ? { url: profile.publication.paperUrl } : {}),
}

/** The faces paper uses (cv.css @media print), warmed on screen. */
const PAPER_FACES = ['s4', 's5', 's6', 's7', 'm4', 'm5', 'm6'] as const

/** The story's order, then the rail's (the running head lists them all). */
const TOC = ['experience', 'projects', 'publication', 'skills', 'education'] as const

/* Digits need no wrapper: SCREEN's body stack puts Tenor Sans figures in
   front of Marcellus (--font-screen-body, app/globals.css). */

/** The SCREEN digits face (the @font-face src in app/globals.css). */
const DIGITS_FACE = '/fonts/tenor-sans-digits.woff2'

/** A résumé line with its bold runs (the metrics) in <b>. */
function Rich({ text }: { text: RichText }) {
  return (
    <>{richSegments(text).map((seg, i) => (seg.bold ? <b key={i}>{seg.text}</b> : seg.text))}</>
  )
}

/** A date range that never breaks inside ('Jan 2025 – Dec 2026 (Expected)'). */
function DateRange({ text }: { text: string }) {
  return <span className="cv-date">{text}</span>
}

/**
 * A skill item that never breaks inside ('Apache Kafka'). An item that is
 * itself a list ('AWS (Lambda, S3, …)') may break only after its commas.
 */
function SkillItem({ text }: { text: string }) {
  const parts = text.split(/(?<=,) /)
  if (parts.length === 1) return <li>{text}</li>
  return (
    <li className="is-list">
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 ? ' ' : null}
          <span>{part}</span>
        </Fragment>
      ))}
    </li>
  )
}

/** The section links: the running head (desktop) and the jump row (below 1100 px). */
function SectionLinks() {
  return (
    <ul>
      {TOC.map((id) => (
        <li key={id}>
          <a href={`#${id}`}>{resumeSections[id]}</a>
        </li>
      ))}
    </ul>
  )
}

/** Time and place for the margin; the hidden comma keeps them apart when read aloud. */
function When({ time, place }: { time: string; place?: string }) {
  return (
    <p className="cv-when">
      <DateRange text={time} />
      {place ? (
        <>
          <span className="cv-vh">, </span>
          <span className="pl">{place}</span>
        </>
      ) : null}
    </p>
  )
}

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M8 2v8m0 0-3.2-3.2M8 10l3.2-3.2M2.5 13.5h11" />
    </svg>
  )
}

export default function CvPage() {
  /* Digits are on the first screen here (100%, CS5010, the GitHub handle),
     so their face comes with the HTML. Found late (only once layout draws
     a digit), it swapped in after a deep link's scroll, rewrapped a line
     and left the section a line below the top. A preload hint, no JS. */
  preload(DIGITS_FACE, { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' })
  const { publication } = profile
  const { authors, booktitle, pages } = publicationRecord
  const [first, middle, last] = profile.name.split(' ')

  return (
    <>
      {/* SCREEN key light over the name (decorative; hidden in PRINT and on paper). */}
      <div className="cv-light" aria-hidden="true" />

      <main id="main" className="cv">
        {/* ============================ RAIL: identity ============================ */}
        <header className="cv-id">
          {/* Plain <a> on purpose: /cv is contractually ZERO client JS; next/link
              would pull the client Link runtime into this route. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className="cv-back" href="/">
            ← back to site
          </a>

          <h1 className="cv-name">
            <span className="n-big">{first}</span> <span className="n-mid">{middle}</span>{' '}
            <span className="n-big">{last}</span>
          </h1>

          <div className="cv-meta">
            <p className="cv-status">
              <span className="cv-dot" aria-hidden="true" />
              {profile.status}
            </p>
            <p className="cv-roleline">
              {profile.role} · {profile.location}
            </p>
          </div>

          <div className="cv-card cv-glass">
            {/* The photo is a CSS background keyed to the edition (cv.css), so
                only the grade on screen is ever downloaded. */}
            <div className="cv-photo" role="img" aria-label={profile.displayName} />
            <ul className="cv-contact" aria-label="Contact">
              {resumeContact.map((c) => (
                <li key={c.label} className={c.paperOnly ? 'cv-paper-only' : undefined}>
                  <span className="cv-k">{c.label}</span>
                  <a href={c.href}>{c.text}</a>
                </li>
              ))}
            </ul>
            <div className="cv-cta">
              <a className="cv-btn" href={profile.resumePdf} download>
                <DownloadIcon />
                Download résumé (PDF)
              </a>
            </div>
          </div>
        </header>

        {/* Below 1100 px: the section links as one row under the header. */}
        <nav className="cv-jump" aria-label="Sections">
          <SectionLinks />
        </nav>

        {/* ================================ STORY ================================ */}
        <div className="cv-story">
          <section id="experience" className="cv-sec" aria-labelledby="h-experience">
            <h2 className="cv-h2" id="h-experience">
              <span>{resumeSections.experience}</span>
            </h2>
            <ol className="cv-list">
              {resumeExperience.map((job) => (
                <li key={job.id} className="cv-entry cv-job">
                  <h3 className="cv-org">
                    {job.company}
                    {job.award ? (
                      <>
                        {' '}
                        <span className="tag is-award">{job.award}</span>
                      </>
                    ) : null}
                  </h3>
                  <When time={job.period} place={job.location} />
                  <p className="cv-role">
                    {job.role}
                    {job.course ? (
                      <>
                        <span className="cv-sep">, </span>
                        <span className="cv-course">{job.course}</span>
                      </>
                    ) : null}
                  </p>
                  <ul className="cv-bullets">
                    {job.bullets.map((b) => (
                      <li key={b}>
                        <Rich text={b} />
                      </li>
                    ))}
                  </ul>
                  {job.outcome ? (
                    <p className="cv-outcome">
                      <span>{job.outcome}</span>
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>

          <section id="projects" className="cv-sec" aria-labelledby="h-projects">
            <h2 className="cv-h2" id="h-projects">
              <span>{resumeSections.projects}</span>
            </h2>
            <ol className="cv-list">
              {resumeProjects.map((p) => (
                <li key={p.slug} className="cv-entry cv-proj">
                  <h3 className="cv-org">
                    {p.title}
                    {p.tag ? (
                      <>
                        {' '}
                        <span className={`tag is-${p.tag.kind}`}>
                          {p.tag.kind === 'live' ? (
                            <span className="cv-dot" aria-hidden="true" />
                          ) : null}
                          {p.tag.text}
                        </span>
                      </>
                    ) : null}
                  </h3>
                  <When time={p.year} />
                  <ul className="cv-stack" aria-label="Stack">
                    {p.stack.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                  <ul className="cv-bullets">
                    {p.bullets.map((b) => (
                      <li key={b}>
                        <Rich text={b} />
                      </li>
                    ))}
                  </ul>
                  <p className="cv-links">
                    {projectLinks(p.slug).map((l) => (
                      <a
                        key={l.kind}
                        className={`is-${l.kind}`}
                        href={l.href}
                        data-print={l.print}
                        aria-label={`${l.label}, ${p.title}`}
                      >
                        {l.label}
                      </a>
                    ))}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section id="publication" className="cv-sec" aria-labelledby="h-publication">
            <h2 className="cv-h2" id="h-publication">
              <span>{resumeSections.publication}</span>
            </h2>
            <div className="cv-list">
              <article className="cv-entry cv-pub">
                <h3 className="cv-org">{publication.title}</h3>
                <When time={String(publicationRecord.year)} place={publication.venue} />
                <p className="cv-cite">
                  {authors.map((a, i) => (
                    <span key={a}>
                      {a.endsWith('Konnur') ? <b>{a}</b> : a}
                      {i < authors.length - 1 ? ', ' : '. '}
                    </span>
                  ))}
                  {`${booktitle}, pp. ${pages.replace('--', '–')}.`}
                </p>
                {publication.doi ? <p className="cv-doi">DOI: {publication.doi}</p> : null}
                {publication.paperUrl ? (
                  <p className="cv-links">
                    <a
                      className="is-paper"
                      href={publication.paperUrl}
                      data-print={printAddress(publication.paperUrl)}
                    >
                      read paper
                    </a>
                  </p>
                ) : null}
              </article>
            </div>
          </section>
        </div>

        {/* ============================ RAIL: reference ============================ */}
        <div className="cv-ref">
          <section id="skills" className="cv-sec" aria-labelledby="h-skills">
            <h2 className="cv-h2s" id="h-skills">
              <span>{resumeSections.skills}</span>
            </h2>
            <ul className="cv-skills">
              {resumeSkills.map((row) => (
                <li key={row.label}>
                  <h3>{row.label}</h3>
                  <ul className="cv-items">
                    {row.items.map((item) => (
                      <SkillItem key={item} text={item} />
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>

          <section id="education" className="cv-sec" aria-labelledby="h-education">
            <h2 className="cv-h2s" id="h-education">
              <span>{resumeSections.education}</span>
            </h2>
            <ul className="cv-edu">
              {resumeEducation.map((e) => (
                <li key={e.school}>
                  <h3>{e.school}</h3>
                  <p className="deg">{e.degree}</p>
                  <p className="when">
                    {e.location}
                    {'\u00a0· '}
                    <DateRange text={e.period} />
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Running head (1100 px and up): sticks at the foot of the rail once the
            reference has scrolled by. Last in the DOM because it is last in the
            rail's reading order, so Tab goes ID card, story, then here. */}
        <nav className="cv-toc cv-glass" aria-label="Sections">
          <p className="cv-toc-name" aria-hidden="true">
            {profile.displayName}
          </p>
          <p className="cv-toc-status" aria-hidden="true">
            <span className="cv-dot" />
            {profile.status}
          </p>
          <SectionLinks />
          <div className="cv-toc-extra">
            <a href={profile.resumePdf} download>
              Download résumé (PDF)
            </a>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/">← back to site</a>
          </div>
        </nav>

        {/* Phones and tablets: the running head's two links, at the end. */}
        <footer className="cv-foot">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className="cv-back" href="/">
            ← back to site
          </a>
          <a className="cv-back" href={profile.resumePdf} download>
            Download résumé (PDF)
          </a>
        </footer>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(scholarlyJsonLd) }}
        />
      </main>

      {/* Loads every paper face (Archivo, Plex Mono) while the page is read,
          so a print from the SCREEN edition never waits on one. Invisible,
          never read. */}
      <span className="cv-warm" aria-hidden="true">
        {PAPER_FACES.map((f) => (
          <span key={f} className={f}>
            Aa1
          </span>
        ))}
      </span>
    </>
  )
}
