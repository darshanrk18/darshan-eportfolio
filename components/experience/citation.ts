/**
 * The IEEE citation text behind "Copy the citation" (v2 §4.7 EducationCard's
 * BibTeX-ish block, kept as a copy action in v3 — the frames draw no citation
 * block). Facts verbatim from @/lib/data/profile — every author, in the
 * publisher's order.
 */

import { profile } from '@/lib/data/profile'
import { publicationRecord } from '@/lib/data/publication'

export function buildCitation(): string {
  const { publication } = profile
  const { authors, booktitle, year, pages } = publicationRecord
  const lines = [
    '@inproceedings{jayalakshmi2021allocation,',
    `  title     = {${publication.title}},`,
    `  author    = {${authors.join(' and ')}},`,
    `  booktitle = {${booktitle}},`,
    `  year      = {${year}},`,
    `  pages     = {${pages}},`,
    `  publisher = {${publication.venue}},`,
  ]
  if (publication.doi) lines.push(`  doi       = {${publication.doi}},`)
  if (publication.paperUrl) lines.push(`  url       = {${publication.paperUrl}},`)
  lines.push('}')
  return lines.join('\n')
}
