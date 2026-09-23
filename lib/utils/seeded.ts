/**
 * Deterministic randomness + hashing (spec §5.8, §4.7).
 * Pure TypeScript, zero deps, safe in server, client, and worker bundles.
 */

/** 32-bit FNV-1a hash of a string. */
export function fnv1a(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

/** Mulberry32 PRNG — returns a function yielding floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Seeded PRNG from a string seed: mulberry32(fnv1a(seed)). Same seed ⇒ same sequence. */
export function createSeededRandom(seed: string): () => number {
  return mulberry32(fnv1a(seed))
}

/**
 * SHA-1 of a UTF-8 string as lowercase hex (pure TS; used for the
 * deterministic commit hashes in the experience DAG — NOT for security).
 */
export function sha1Hex(input: string): string {
  const data = new TextEncoder().encode(input)
  const ml = data.length
  const totalLen = Math.ceil((ml + 1 + 8) / 64) * 64
  const bytes = new Uint8Array(totalLen)
  bytes.set(data)
  bytes[ml] = 0x80
  const dv = new DataView(bytes.buffer)
  dv.setUint32(totalLen - 8, Math.floor((ml * 8) / 0x100000000))
  dv.setUint32(totalLen - 4, (ml * 8) >>> 0)

  let h0 = 0x67452301
  let h1 = 0xefcdab89
  let h2 = 0x98badcfe
  let h3 = 0x10325476
  let h4 = 0xc3d2e1f0
  const w = new Uint32Array(80)

  for (let i = 0; i < totalLen; i += 64) {
    for (let j = 0; j < 16; j++) w[j] = dv.getUint32(i + j * 4)
    for (let j = 16; j < 80; j++) {
      const n = w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16]
      w[j] = (n << 1) | (n >>> 31)
    }
    let a = h0
    let b = h1
    let c = h2
    let d = h3
    let e = h4
    for (let j = 0; j < 80; j++) {
      let f: number
      let k: number
      if (j < 20) {
        f = (b & c) | (~b & d)
        k = 0x5a827999
      } else if (j < 40) {
        f = b ^ c ^ d
        k = 0x6ed9eba1
      } else if (j < 60) {
        f = (b & c) | (b & d) | (c & d)
        k = 0x8f1bbcdc
      } else {
        f = b ^ c ^ d
        k = 0xca62c1d6
      }
      const t = ((((a << 5) | (a >>> 27)) >>> 0) + f + e + k + w[j]) >>> 0
      e = d
      d = c
      c = ((b << 30) | (b >>> 2)) >>> 0
      b = a
      a = t
    }
    h0 = (h0 + a) >>> 0
    h1 = (h1 + b) >>> 0
    h2 = (h2 + c) >>> 0
    h3 = (h3 + d) >>> 0
    h4 = (h4 + e) >>> 0
  }

  return [h0, h1, h2, h3, h4].map((x) => x.toString(16).padStart(8, '0')).join('')
}

/** First 7 hex chars of SHA-1 — the git-style short hash used by the DAG (§4.7). */
export function shortHash7(input: string): string {
  return sha1Hex(input).slice(0, 7)
}
