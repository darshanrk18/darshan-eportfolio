/**
 * §4.7 education card — the quiet zone (`coursework.lock`). RSC, no ambient
 * motion, no entrance animation (pacing rule: deliberate rest after the
 * projects crescendo — do not add motion here). Degree block in mono small
 * caps leading with degree + dates (no grade figures — CONTENT_FINAL),
 * CS5010 TA row, prior BE Ramaiah line, and a BibTeX-ish citation with a
 * copy button (client child). All facts verbatim from @/lib/data/profile.
 */

import { profile } from '@/lib/data/profile'
import CopyCitation from './CopyCitation.client'

function buildCitation(): string {
  const { publication, name } = profile
  const lines = [
    '@inproceedings{konnur_ieee,',
    `  title  = {${publication.title}},`,
    `  author = {${name}},`,
    `  venue  = {${publication.venue}},`,
  ]
  if (publication.doi) lines.push(`  doi    = {${publication.doi}},`)
  if (publication.paperUrl) lines.push(`  url    = {${publication.paperUrl}},`)
  lines.push('}')
  return lines.join('\n')
}

export default function EducationCard() {
  const { education, educationPrior } = profile
  const citation = buildCitation()

  return (
    <div
      className="reg-marks hairline rounded-card bg-panel relative p-6 lg:p-8"
      data-component="EducationCard"
    >
      <p className="type-label-xs text-secondary">coursework.lock</p>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="type-code text-primary" style={{ fontVariantCaps: 'small-caps' }}>
          {education.school} — {education.degree} — {education.location}
        </p>
        <span className="type-code rounded-chip border-hairline bg-raised inline-flex items-center border px-2 py-0.5 text-secondary">
          {education.period}
        </span>
      </div>

      <p className="type-code text-secondary mt-3">
        {education.ta.course} · {education.ta.courseName} — {education.ta.title} ·{' '}
        {education.ta.period}
      </p>

      <p className="type-code text-secondary mt-3">
        {educationPrior.school} — {educationPrior.degree} — {educationPrior.location} ·{' '}
        {educationPrior.period}
      </p>

      <div className="border-hairline mt-6 border-t pt-4">
        <pre className="type-code text-secondary overflow-x-auto whitespace-pre-wrap">
          {citation}
        </pre>
        <CopyCitation citation={citation} />
      </div>
    </div>
  )
}
