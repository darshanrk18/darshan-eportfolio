/**
 * Pure text helpers for the Experience section (server-safe, unit-tested in
 * tests/experience.test.ts).
 *
 * markSkills(bullet, ids): splits a résumé bullet around the visible labels
 * of the skills blamed on it (./blame.ts), so the RSC can wrap each match in
 * `<mark data-skill="…">` — the highlight is driven by data (the label of a
 * verified skill), never by a word list in the component. Every occurrence
 * of a label is marked; longer labels win over shorter prefixes
 * ("Node.js" before "Node"), and matches respect word boundaries so "AWS"
 * does not fire inside "AWSome".
 *
 * figures(text): splits a string around digit runs ('300+', '10,000+',
 * '100%', 'CS5010' → '5010', 'S3' → '3') so SCREEN can set every figure in
 * Cinzel's lining numerals (S5 §3: Marcellus has no lining digits). PRINT
 * ignores the wrapper.
 */

import { getSkill } from '@/lib/data/skills'

export type MarkSegment = { text: string; skill?: string }

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Word boundary that also treats '/', '(' and ',' as boundaries and allows a trailing '.js'. */
function labelPattern(label: string): RegExp {
  return new RegExp(`(?<![A-Za-z0-9+#])${escapeRe(label)}(?![A-Za-z0-9])`, 'g')
}

export function markSkills(bullet: string, skillIds: readonly string[]): MarkSegment[] {
  const labels = skillIds
    .map((id) => ({ id, label: getSkill(id)?.label ?? '' }))
    .filter((l) => l.label.length > 0)
    .sort((a, b) => b.label.length - a.label.length)
  if (labels.length === 0) return [{ text: bullet }]

  /* Collect every match, longest labels first, dropping overlaps. */
  const hits: { start: number; end: number; id: string }[] = []
  for (const { id, label } of labels) {
    const re = labelPattern(label)
    for (const m of bullet.matchAll(re)) {
      const start = m.index ?? 0
      const end = start + label.length
      if (hits.some((h) => start < h.end && end > h.start)) continue
      hits.push({ start, end, id })
    }
  }
  hits.sort((a, b) => a.start - b.start)

  const out: MarkSegment[] = []
  let cursor = 0
  for (const h of hits) {
    if (h.start > cursor) out.push({ text: bullet.slice(cursor, h.start) })
    out.push({ text: bullet.slice(h.start, h.end), skill: h.id })
    cursor = h.end
  }
  if (cursor < bullet.length) out.push({ text: bullet.slice(cursor) })
  return out
}

export type FigureSegment = { text: string; figure: boolean }

const FIGURE_RE = /\d[\d,]*(?:\.\d+)?%?\+?/g

export function figures(text: string): FigureSegment[] {
  const out: FigureSegment[] = []
  let cursor = 0
  for (const m of text.matchAll(FIGURE_RE)) {
    const start = m.index ?? 0
    if (start > cursor) out.push({ text: text.slice(cursor, start), figure: false })
    out.push({ text: m[0], figure: true })
    cursor = start + m[0].length
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor), figure: false })
  return out
}
