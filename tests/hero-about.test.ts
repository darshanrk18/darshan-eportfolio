/**
 * V3_SPEC §3 Hero / About, §5 laws — tests/hero-about.test.ts (C2)
 * The hero and About copy is data (director call b) and every string comes
 * from lib/data or the approved frame edits; the hero cards derive from the
 * projects / experience entries; the portrait island's guide contract
 * mirrors lib/guide; and the components never put a pipeline word
 * ("ascii", "glyph", "halftone", "render") in visible text or a11y names.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { about, plain } from '@/lib/data/about'
import { commits } from '@/lib/data/experience'
import { HERO_MINI_BOARD, hero, numberWord, projectsDeck, shortRole } from '@/lib/data/hero'
import { LOGOS } from '@/lib/data/logos'
import { FILMSTRIP_ORDER, PHOTOS, isPhotoKey } from '@/lib/data/photos'
import { profile } from '@/lib/data/profile'
import { projects } from '@/lib/data/projects'
import { GUIDE_IDS, GUIDE_TRIED_EVENT as GUIDE_EVENT } from '@/lib/guide/guide'
import { SECTION_ANCHORS } from '@/lib/commands/sections'
import {
  GUIDE_TRIED_EVENT,
  PORTRAIT_GUIDE_ID,
  PORTRAIT_REVEAL_EVENT,
} from '@/components/about/portrait'

const root = path.resolve(__dirname, '..')
const read = (rel: string) =>
  readFileSync(path.join(root, rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

/** Every quoted string literal and JSX text node in a source file. */
function visibleStrings(src: string): string[] {
  const out: string[] = []
  for (const m of src.matchAll(/'([^'\\\n]|\\.)*'|"([^"\\\n]|\\.)*"|`([^`\\]|\\.)*`/g)) out.push(m[0])
  for (const m of src.matchAll(/>([^<>{}]+)</g)) out.push(m[1] ?? '')
  return out
}

const BANNED = /\b(ascii|glyph|glyphs|halftone|render|rendered|pipeline|webp|svg)\b/i

describe('profile (hero copy)', () => {
  it('carries the round-3 eyebrow and lede, and no comment-line tagline', () => {
    expect(profile.eyebrow).toBe('Incoming SDE · AWS · January 2027')
    expect(profile.heroLede).toContain('Software engineer in Boston')
    expect(profile.heroLede).toContain(profile.heroLedeEmphasis)
    expect(profile.heroLede).toContain('prototype to production')
    expect('heroTagline' in profile).toBe(false)
    expect(profile.education.degree).toBe('MS in Computer Science')
    expect(profile.educationPrior.degree).toBe('BE in Computer Science')
  })
})

describe('hero data (S1 cards, P1 cover)', () => {
  it('derives the Work card from the Ticket-Forge entry', () => {
    const tf = projects.find((p) => p.slug === 'ticket-forge')
    expect(tf).toBeDefined()
    expect(hero.cards.work.title).toBe(tf?.name)
    expect(hero.cards.work.meta).toBe(tf?.award)
    expect(hero.cards.work.body).toBe(tf?.short)
  })

  it('derives the Experience rows from the structured experience entries', () => {
    const aws = commits.find((c) => c.id === 'aws-intern')
    const sch = commits.find((c) => c.id === 'schneider')
    expect(hero.cards.experience.rows.map((r) => r.name)).toEqual([aws?.company, sch?.company])
    expect(hero.cards.experience.rows[0]?.meta).toBe(`SDE Intern · ${aws?.periodShort}`)
    expect(hero.cards.experience.rows[1]?.meta).toBe(`${sch?.years} · ${sch?.award}`)
    expect(hero.cards.experience.rows.filter((r) => r.lit)).toHaveLength(1)
    expect(shortRole('Software Development Engineer Intern')).toBe('SDE Intern')
  })

  it('names six skills that all have a logo entry', () => {
    expect(hero.cards.skills.chips).toHaveLength(6)
    for (const id of hero.cards.skills.chips) expect(LOGOS[id]).toBeDefined()
    expect(hero.cards.play.slug).toBe('triplay-ai')
  })

  it('draws the mini board the frame shows: 7×6, four discs each', () => {
    expect(HERO_MINI_BOARD).toHaveLength(6)
    for (const row of HERO_MINI_BOARD) expect(row).toHaveLength(7)
    const cells = HERO_MINI_BOARD.join('')
    expect(cells.split('y').length - 1).toBe(4)
    expect(cells.split('e').length - 1).toBe(4)
    expect(cells).toMatch(/^[.ye]+$/)
  })

  it('links the contents to the five real anchors and derives the decks from data', () => {
    expect(hero.cover.toc.map((t) => t.anchor)).toEqual([...SECTION_ANCHORS])
    expect(hero.cover.toc.map((t) => t.page)).toEqual(['2', '3', '4', '5', '6'])
    expect(projectsDeck()).toBe(`${numberWord(projects.length)} projects, 2021–2026`)
    expect(numberWord(7)).toBe('Seven')
    expect(hero.cover.toc[3]?.deck).toBe('Schneider Electric, then AWS')
    expect(hero.cover.education).toBe('MS in Computer Science, Northeastern University')
    expect(hero.cover.educationDate).toBe(profile.education.expectedGrad)
    expect(hero.cover.caption).toBe('Boston, Massachusetts.')
    expect(hero.cover.statusBanner).toBe(profile.status)
  })

  it('quotes the balloon from CONTENT_FINAL About P3', () => {
    expect(plain(about.paragraphs.p3)).toContain(hero.cover.speech.replace(/\.$/, ''))
    expect(hero.cover.previews.map((p) => p.anchor)).toEqual(['#skills', '#projects', '#contact'])
    expect(hero.cover.previews[1]?.action).toEqual({ kind: 'run-project', slug: 'triplay-ai' })
  })
})

describe('about data (S2 / P2)', () => {
  it('renders the exact resume figures — never a shortened form', () => {
    const values = about.screen.facts.map((f) => f.value)
    expect(values).toEqual([profile.incoming.start, '10,000+', profile.education.ta.students])
    expect(values.join(' ')).not.toMatch(/10k/i)
    expect(about.screen.facts.map((f) => f.label)).toEqual([
      'My start date at AWS',
      'Schneider staff used my apps',
      'Students I mentored as a TA',
    ])
  })

  it('keeps CONTENT_FINAL verbatim for the PRINT panels', () => {
    const p1 = plain(about.paragraphs.p1)
    const p2 = plain(about.paragraphs.p2)
    const p3 = plain(about.paragraphs.p3)
    const { panels } = about.print
    expect(plain(panels.portrait.narration)).toBe(p1)
    expect(p2).toContain(plain(panels.seaport.narration))
    expect(p2).toContain(plain(panels.bengaluru.narration).replace(/…$/, ''))
    expect(p2).toContain(`${panels.exora.lead.replace(/^…/, '')} ${panels.exora.award.replace(/\.$/, '')}`)
    expect(p3).toContain(plain(panels.boston.narration).replace(/\.$/, ''))
    // The door panel opens the clause with a capital (an approved frame edit).
    const door = plain(panels.door.narration)
    expect(p3).toContain(door.charAt(0).toLowerCase() + door.slice(1))
    expect(panels.door.outcome).toEqual({ lead: 'Returned with', rest: 'a full-time SDE offer.' })
    expect(about.pullQuote).toBe(
      'I build software the way good code reads: clear, intentional, and built to last.',
    )
  })

  it('trims the SCREEN copy inside CONTENT_FINAL (nothing added)', () => {
    expect(about.screen.lede).toContain('joining Amazon Web Services as a Software Development Engineer')
    expect(about.screen.lede).not.toContain('January 2027')
    expect(about.screen.p1).not.toContain('10,000+')
    expect(about.screen.p2).not.toContain('300+')
    expect(about.screen.p2).toContain('published with IEEE')
  })

  it('covers the six photographs in the filmstrip legs, in order', () => {
    const keys = about.screen.legs.flatMap((l) => l.photos)
    expect(keys).toEqual([...FILMSTRIP_ORDER])
    for (const k of keys) expect(isPhotoKey(k)).toBe(true)
    expect(about.screen.legs.map((l) => l.city)).toEqual(['Bengaluru', 'Boston'])
    expect(about.screen.legs[1]?.years).toBe(`Since ${profile.education.msStartYear}`)
    for (const key of FILMSTRIP_ORDER) {
      expect(PHOTOS[key].caption.length).toBeGreaterThan(0)
      expect(PHOTOS[key].alt.length).toBeGreaterThan(0)
    }
  })

  it('uses visitor language for the reveal controls', () => {
    expect(about.screen.replayLabel).toBe('Replay the portrait')
    expect(about.print.panels.portrait.tryLabel).toBe('Reveal the portrait')
    expect(about.screen.replayLabel).not.toMatch(BANNED)
  })
})

describe('portrait ⇄ guide contract (§2.6 item 3)', () => {
  it('reports the guide id the guide lib defines, on the event it listens to', () => {
    expect(GUIDE_TRIED_EVENT).toBe(GUIDE_EVENT)
    expect(PORTRAIT_GUIDE_ID).toBe('reveal-portrait')
    expect(GUIDE_IDS).toContain(PORTRAIT_GUIDE_ID)
    expect(PORTRAIT_REVEAL_EVENT).toBe('signal:reveal-portrait')
  })
})

describe('clutter law sweep (visible strings and a11y names)', () => {
  const files = [
    'components/hero/Hero.tsx',
    'components/hero/parts.tsx',
    'components/hero/PalettePill.tsx',
    'components/hero/QuickRow.tsx',
    'components/hero/CopyEmailInline.tsx',
    'components/hero/ReplayIntro.client.tsx',
    'components/about/About.tsx',
    'components/about/Portrait.client.tsx',
    'components/about/Filmstrip.client.tsx',
    'components/about/PhotoViewer.client.tsx',
    'lib/data/hero.ts',
    'lib/data/about.ts',
  ]
  for (const file of files) {
    it(`${file} has no pipeline words in strings or JSX text`, () => {
      const src = read(file)
      const offenders = visibleStrings(src).filter((s) => {
        // Import specifiers, class names, ids, event names and data
        // attributes are not visitor-facing; file paths are excluded too.
        if (/^['"`]@\//.test(s) || /^['"`]\.\.?\//.test(s)) return false
        if (/^['"`][\w.:-]*['"`]$/.test(s)) return false
        if (/^['"`][\w -]*(ab|hero|pf|ed)-[\w -]*['"`]$/.test(s)) return false
        return BANNED.test(s)
      })
      expect(offenders).toEqual([])
    })
  }

  it('the About island never labels the reveal with a pipeline word', () => {
    const src = read('components/about/Portrait.client.tsx')
    for (const m of src.matchAll(/aria-label=\{?["'`]([^"'`]+)["'`]/g)) {
      expect(m[1]).not.toMatch(BANNED)
    }
  })
})
