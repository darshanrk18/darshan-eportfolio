/**
 * The IEEE citation text behind "Copy the citation" (v2 §4.7 EducationCard's
 * BibTeX-ish block, kept as a copy action in v3 — the frames draw no citation
 * block). Facts verbatim from @/lib/data/profile.
 */

import { profile } from '@/lib/data/profile'

export function buildCitation(): string {
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
