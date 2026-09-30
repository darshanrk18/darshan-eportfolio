import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { INTRO_ASSETS, INTRO_PLATE_MAX_PX } from '@/lib/data/introAssets'
import {
  LOGOS,
  getLogo,
  logoIdForName,
  logoIds,
  referencedLogoFiles,
  resolveLogo,
} from '@/lib/data/logos'
import { LOGO_NOTES } from '@/lib/data/logoNotes'
import { FILMSTRIP_ORDER, PHOTOS, photoKeys, photoSrc } from '@/lib/data/photos'
import { projects } from '@/lib/data/projects'
import { allSkillNodes, languages, skillGroups } from '@/lib/data/skills'

const PUBLIC = path.resolve(__dirname, '..', 'public')
const LOGO_DIR = path.join(PUBLIC, 'logos')

/** Pixel size from a WebP header (VP8 / VP8L / VP8X first chunk). */
function webpSize(file: string): { width: number; height: number } {
  const buf = readFileSync(file)
  expect(buf.toString('ascii', 0, 4)).toBe('RIFF')
  expect(buf.toString('ascii', 8, 12)).toBe('WEBP')
  const chunk = buf.toString('ascii', 12, 16)
  if (chunk === 'VP8X') {
    return {
      width: 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16)),
      height: 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16)),
    }
  }
  if (chunk === 'VP8 ') {
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff }
  }
  if (chunk === 'VP8L') {
    const b0 = buf[21]
    const b1 = buf[22]
    const b2 = buf[23]
    const b3 = buf[24]
    return {
      width: 1 + (((b1 & 0x3f) << 8) | b0),
      height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
    }
  }
  throw new Error(`unknown WebP chunk ${chunk} in ${file}`)
}

/** Project stack names that carry an official logo in the frames (S3/P3 usage map). */
const STACK_NAMES_WITH_LOGOS = [
  'Python',
  'FastAPI',
  'PostgreSQL',
  'pgvector',
  'Terraform',
  'Docker',
  'GitHub Actions',
  'TypeScript',
  'Next.js',
  'React',
  'Redis',
  'Node.js',
  'Express.js',
  'MySQL',
  'Java',
  'Kubernetes',
]

describe('logos (V3_SPEC §2.8, BRIEF-R2 §2)', () => {
  it('every diagram skill id resolves to a logo entry', () => {
    for (const node of allSkillNodes) {
      const entry = getLogo(node.id)
      expect(entry, node.id).toBeDefined()
      expect(entry?.label).toBe(node.label)
    }
  })

  it('every language id resolves to a logo entry', () => {
    for (const lang of languages) {
      const entry = getLogo(lang.id)
      expect(entry, lang.id).toBeDefined()
      expect(entry?.label).toBe(lang.label)
    }
  })

  it('every entry is a logo file pair or a declared text chip', () => {
    for (const id of logoIds) {
      const e = LOGOS[id]
      const hasFile = Boolean(e.color || e.mono)
      expect(hasFile || e.textChip, id).toBe(true)
      if (e.textChip) expect(LOGO_NOTES[id], `${id} chip needs a note`).toBeTruthy()
    }
  })

  it('every referenced file exists under public/logos', () => {
    const files = referencedLogoFiles()
    expect(files.length).toBeGreaterThan(60)
    for (const f of files) {
      expect(existsSync(path.join(LOGO_DIR, f)), f).toBe(true)
    }
  })

  it('public/logos/logos.json is the same index', () => {
    const json = JSON.parse(readFileSync(path.join(LOGO_DIR, 'logos.json'), 'utf8')) as Record<
      string,
      { label: string; color: string | null; mono: string | null }
    >
    for (const [id, row] of Object.entries(json)) {
      const entry = getLogo(id)
      expect(entry, id).toBeDefined()
      expect(entry?.label).toBe(row.label)
      if (id !== 'pgvector') {
        expect(entry?.color ?? undefined).toBe(row.color ?? undefined)
        expect(entry?.mono ?? undefined).toBe(row.mono ?? undefined)
      }
    }
  })

  it('encodes the four exceptions and the Java preference', () => {
    expect(LOGOS.mockito).toMatchObject({ textChip: true, chipText: 'M' })
    expect(LOGOS.mockito.color).toBeUndefined()
    expect(LOGOS.sql).toMatchObject({ textChip: true, chipText: 'SQL' })
    expect(LOGOS.cloudwatch.color).toBeUndefined()
    expect(LOGOS.cloudwatch.mono).toBe('logo-cloudwatch-mono.svg')
    expect(LOGOS.pgvector).toMatchObject({
      label: 'pgvector',
      color: 'logo-postgresql.svg',
      mono: 'logo-postgresql-mono.svg',
    })
    expect(LOGOS.java.preferColor).toBe(true)
  })

  it('resolveLogo applies the edition fallbacks', () => {
    expect(resolveLogo('react', true)).toEqual({
      kind: 'img',
      src: '/logos/logo-react-mono.svg',
      mono: true,
      label: 'React',
    })
    expect(resolveLogo('react')).toMatchObject({ src: '/logos/logo-react.svg', mono: false })
    // colour-only files still take the mono class (the CSS filter whitens them)
    expect(resolveLogo('azure', true)).toMatchObject({ src: '/logos/logo-azure.svg', mono: true })
    expect(resolveLogo('playwright', true)).toMatchObject({ src: '/logos/logo-playwright.svg' })
    // mono-only renders as ink in PRINT
    expect(resolveLogo('cloudwatch')).toMatchObject({ src: '/logos/logo-cloudwatch-mono.svg' })
    // Java prefers colour even in mono mode
    expect(resolveLogo('java', true)).toMatchObject({ src: '/logos/logo-java.svg', mono: true })
    expect(resolveLogo('mockito', true)).toEqual({ kind: 'chip', text: 'M', label: 'Mockito' })
    expect(resolveLogo('sql')).toEqual({ kind: 'chip', text: 'SQL', label: 'SQL' })
    expect(resolveLogo('not-a-skill')).toBeUndefined()
  })

  it('maps the frames’ project stack names and the resume groups to ids', () => {
    for (const name of STACK_NAMES_WITH_LOGOS) {
      expect(logoIdForName(name), name).toBeDefined()
    }
    const stackNames = new Set(projects.flatMap((p) => p.stack))
    for (const name of STACK_NAMES_WITH_LOGOS) expect(stackNames.has(name), name).toBe(true)
    // every resume group item either maps to a logo or is a plain phrase we know has none
    const noLogo = new Set(['REST APIs'])
    for (const group of skillGroups) {
      for (const item of group.items) {
        if (noLogo.has(item)) continue
        expect(logoIdForName(item), item).toBeDefined()
      }
    }
    expect(logoIdForName('Apache Kafka')).toBe('kafka')
    expect(logoIdForName('AWS CloudWatch')).toBe('cloudwatch')
    expect(logoIdForName('tRPC')).toBeUndefined()
  })
})

describe('photos (V3_SPEC §2.8)', () => {
  it('ships both grades of every photo at the declared size', () => {
    for (const key of photoKeys) {
      const p = PHOTOS[key]
      expect(p.alt.length, key).toBeGreaterThan(8)
      expect(p.caption.length, key).toBeGreaterThan(0)
      for (const file of [p.screen, p.print]) {
        const abs = path.join(PUBLIC, file)
        expect(existsSync(abs), file).toBe(true)
        expect(webpSize(abs), file).toEqual({ width: p.width, height: p.height })
        expect(p.height, file).toBeLessThanOrEqual(1200)
      }
    }
  })

  it('picks the grade per edition and orders the filmstrip Bengaluru → Boston', () => {
    expect(photoSrc('badge', 'screen')).toBe('/photo/badge-41.webp')
    expect(photoSrc('badge', 'print')).toBe('/photo/badge-paper.webp')
    expect(FILMSTRIP_ORDER).toEqual([
      'schneider_office',
      'schneider_exora',
      'neu_quad',
      'badge',
      'desk',
      'door',
    ])
    expect(new Set(FILMSTRIP_ORDER).size).toBe(6)
  })

  it('keeps each edition’s photo set under the §7 image budget', () => {
    for (const grade of ['screen', 'print'] as const) {
      const bytes = photoKeys.reduce(
        (sum, key) => sum + readFileSync(path.join(PUBLIC, PHOTOS[key][grade])).length,
        0
      )
      expect(bytes, grade).toBeLessThanOrEqual(900 * 1024)
    }
  })
})

describe('intro plates (V3_SPEC §2.7)', () => {
  it('ships the six montage plates as sized files, never base64', () => {
    expect(INTRO_ASSETS.map((a) => a.plate)).toEqual(['p1', 'p2', 'p3', 'p4', 'p5', 'p6'])
    for (const a of INTRO_ASSETS) {
      const abs = path.join(PUBLIC, a.src)
      expect(a.src.startsWith('/intro/'), a.key).toBe(true)
      expect(existsSync(abs), a.src).toBe(true)
      expect(webpSize(abs), a.src).toEqual({ width: a.width, height: a.height })
      expect(Math.max(a.width, a.height), a.src).toBeLessThanOrEqual(INTRO_PLATE_MAX_PX)
      expect(a.alt.length, a.key).toBeGreaterThan(8)
    }
  })
})
