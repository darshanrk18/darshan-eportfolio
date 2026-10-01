/**
 * The ⌘K palette's ranking (components/palette/paletteRank.ts) over the real
 * registry. The dialog renders rankRows() in order with cmdk's filtering off,
 * so the first row here is the row Enter runs — however the query got into
 * the input (typed, or pasted over another query: js-links
 * links-palette-rank-after-paste, where 'github' → paste 'build' left Build
 * info fourth under cmdk's own sort).
 */

import { describe, expect, it } from 'vitest'
import { GROUP_ORDER, commandsForSurface, type Command } from '@/lib/commands/registry'
import {
  paletteFilter,
  paletteQuery,
  rankRows,
  type RankedRow,
} from '@/components/palette/paletteRank'

/* The dialog's "Results" rows (without the store-driven Next rows): every
   palette command in group order, then the skills page entry. Keywords as
   PaletteDialog builds them. */
const palette = commandsForSurface('palette')
const itemRow = (cmd: Command): RankedRow => ({
  value: cmd.id,
  keywords: [cmd.title, ...(cmd.aliases ?? []), ...cmd.keywords],
})
const results: RankedRow[] = [
  ...GROUP_ORDER.flatMap((group) => palette.filter((c) => c.group === group)).map(itemRow),
  { value: 'skills-menu', keywords: ['skills', 'skill', 'toolchain'] },
]
const skillRows = palette.filter((c) => c.group === 'skill').map(itemRow)
const first = (rows: RankedRow[], search: string) => rankRows(rows, search)[0]?.value

describe('palette ranking', () => {
  it('puts the literal best match first', () => {
    expect(first(results, 'build')).toBe('build-info')
    expect(first(results, 'choose')).toBe('choose-edition')
    expect(first(results, 'arcade')).toBe('go-arcade')
    expect(first(results, 'email')).toBe('copy-email')
    expect(first(results, 'github')).not.toBe('deploy-all')
  })

  it("ranks Build info above 'Light up the toolkit' for 'build' (the pasted-query case)", () => {
    const ids = rankRows(results, 'build').map((r) => r.value)
    expect(ids.indexOf('build-info')).toBe(0)
    expect(ids.indexOf('deploy-all')).toBeGreaterThan(0)
  })

  it('depends on the query alone, never on the one before it', () => {
    const fresh = rankRows(results, 'build').map((r) => r.value)
    rankRows(results, 'github')
    expect(rankRows(results, 'build').map((r) => r.value)).toEqual(fresh)
    // a query with stray spaces ranks as the trimmed query
    expect(rankRows(results, '  build ').map((r) => r.value)).toEqual(fresh)
  })

  it('breaks equal scores by list order, so typed and pasted queries agree', () => {
    const score = (id: string, q: string) => {
      const row = results.find((r) => r.value === id)!
      return paletteFilter(row.value, q, [...row.keywords])
    }
    // 'contact' — Go to Contact and Copy email both carry the word
    expect(score('go-contact', 'contact')).toBeGreaterThan(0)
    expect(score('copy-email', 'contact')).toBeGreaterThan(0)
    const ids = rankRows(results, 'contact').map((r) => r.value)
    expect(ids[0]).toBe('go-contact')
    expect(ids.indexOf('go-contact')).toBeLessThan(ids.indexOf('copy-email'))
  })

  it('returns only matching rows, highest score first, ties in input order', () => {
    for (const q of ['build', 'contact', 'resume', 'docker', 'play', 'edition', 'x']) {
      const ranked = rankRows(results, q)
      const scores = ranked.map((r) => paletteFilter(r.value, q, [...r.keywords]))
      expect(
        scores.every((s) => s > 0),
        q
      ).toBe(true)
      for (let i = 1; i < ranked.length; i++) {
        expect(scores[i - 1] >= scores[i], q).toBe(true)
        if (scores[i - 1] === scores[i]) {
          expect(results.indexOf(ranked[i - 1]) < results.indexOf(ranked[i]), q).toBe(true)
        }
      }
      const matching = results.filter((r) => paletteFilter(r.value, q, [...r.keywords]) > 0)
      expect(ranked.length, q).toBe(matching.length)
    }
    expect(rankRows(results, 'zzqqxxjj')).toEqual([])
  })

  it('shows every row, in order, for an empty query', () => {
    expect(rankRows(results, '')).toEqual(results)
    expect(rankRows(skillRows, 'skills > ')).toEqual(skillRows)
  })

  it('scores the skills page by the text after `skills >`', () => {
    expect(paletteQuery('skills > dock')).toBe('dock')
    expect(paletteQuery('Skills>  k8s ')).toBe('k8s')
    expect(paletteQuery('docker')).toBe('docker')
    expect(first(skillRows, 'skills > dock')).toBe('skill-docker')
    expect(first(skillRows, 'dock')).toBe('skill-docker')
  })
})
