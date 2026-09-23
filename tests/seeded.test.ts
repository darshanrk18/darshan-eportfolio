import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { createSeededRandom, fnv1a, mulberry32, sha1Hex, shortHash7 } from '@/lib/utils/seeded'
import { commits } from '@/lib/data/experience'

describe('seeded utilities (spec §5.8/§4.7)', () => {
  it('sha1Hex matches node:crypto', () => {
    for (const s of ['', 'abc', 'SIGNAL — the portfolio that compiles ✓', 'x'.repeat(150)]) {
      expect(sha1Hex(s)).toBe(createHash('sha1').update(s, 'utf8').digest('hex'))
    }
  })

  it('shortHash7 is the first 7 hex chars', () => {
    expect(shortHash7('abc')).toBe(sha1Hex('abc').slice(0, 7))
    expect(shortHash7('abc')).toHaveLength(7)
  })

  it('commit hashes are sha1(message) — measured, not asserted', () => {
    for (const c of commits) {
      if (c.kind === 'future') {
        // The future/HEAD marker has no commit yet — the null hash by design.
        expect(c.hash).toBe('0000000')
        continue
      }
      expect(c.hash).toBe(createHash('sha1').update(c.message, 'utf8').digest('hex').slice(0, 7))
    }
  })

  it('fnv1a is deterministic and 32-bit', () => {
    expect(fnv1a('signal')).toBe(fnv1a('signal'))
    expect(fnv1a('signal')).not.toBe(fnv1a('Signal'))
    expect(fnv1a('')).toBe(0x811c9dc5)
  })

  it('mulberry32 yields a deterministic sequence in [0,1)', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    for (let i = 0; i < 100; i++) {
      const v = a()
      expect(v).toBe(b())
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('createSeededRandom("signal") is stable across calls', () => {
    const r1 = createSeededRandom('signal')
    const r2 = createSeededRandom('signal')
    expect([r1(), r1(), r1()]).toEqual([r2(), r2(), r2()])
  })
})
