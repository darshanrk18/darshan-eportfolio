/**
 * The ⌘K palette's ranking (PaletteDialog.tsx) — pure, so tests can run it
 * against the real registry.
 *
 * Why the palette ranks its own rows: cmdk sorts the rows that are in the
 * DOM when the search changes, but a row the PREVIOUS query had filtered out
 * mounts only after that sort, in React order. Replacing one query with
 * another in a single input (select-all + paste) therefore left the best
 * match below other rows, and Enter ran the wrong command ('github' → paste
 * 'build' highlighted "Light up the toolkit", not Build info). The dialog
 * now renders exactly rankRows() in order with cmdk's filtering off
 * (shouldFilter={false}), and cmdk selects the first row, whatever the
 * previous query was.
 */

import { defaultFilter } from 'cmdk'

/** `skills > <query>` — the typed route into the nested skills page. */
export const SKILLS_PREFIX = /^skills\s*>\s*(.*)$/i

/** The query a search scores with: the `skills >` prefix stripped, trimmed. */
export function paletteQuery(search: string): string {
  return (SKILLS_PREFIX.exec(search)?.[1] ?? search).trim()
}

/**
 * Score one row: strip the `skills >` prefix so the remainder scores against
 * skill nodes; an empty query shows everything.
 *
 * Ranking: a literal hit always outranks a fuzzy one, so the row whose title
 * or keyword actually contains what was typed is the one Enter runs (typing
 * `choose` selects "Choose your edition", not a row that merely has those
 * letters scattered through its keywords). Ties fall back to cmdk's score.
 */
export function paletteFilter(value: string, search: string, keywords?: string[]): number {
  const q = paletteQuery(search)
  if (q === '') return 1
  const fuzzy = defaultFilter(value, q, keywords)
  const needle = q.toLowerCase()
  const hay = [value, ...(keywords ?? [])].map((s) => s.toLowerCase())
  const bonus = hay.some((s) => s === needle)
    ? 3
    : hay.some((s) => s.split(/\s+/).some((w) => w.startsWith(needle)))
      ? 2
      : hay.some((s) => s.includes(needle))
        ? 1
        : 0
  return bonus > 0 ? bonus + fuzzy : fuzzy
}

/** A palette row as the ranking sees it: its cmdk value and keywords. */
export interface RankedRow {
  value: string
  keywords: readonly string[]
}

/**
 * The rows a search shows, best match first: every row scoring above 0
 * (scored exactly as cmdk would — value and keywords trimmed), sorted by
 * score, equal scores kept in the order given (registry order), so a typed
 * and a pasted query always put the same row first ('contact': Go to
 * Contact before Copy email).
 */
export function rankRows<T extends RankedRow>(rows: readonly T[], search: string): T[] {
  return rows
    .map((row, index) => ({
      row,
      index,
      score: paletteFilter(
        row.value.trim(),
        search,
        row.keywords.map((k) => k.trim())
      ),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((r) => r.row)
}
