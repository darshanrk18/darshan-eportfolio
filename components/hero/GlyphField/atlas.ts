/**
 * Glyph atlas (spec §5.5, v2 §4.2a): the 64-glyph set rendered once at runtime
 * into a single 512px canvas texture (the edition's mono face via the --font-mono
 * token) — 8×8 grid, 64px cells (crisp at the 44px font), so the whole field
 * is still ONE draw call with zero image assets.
 *
 * v2 layout: the first FIELD_GLYPH_COUNT entries are the v1 code glyphs the
 * ambient field keeps sampling (the brand set); the letters exist for the
 * §4.2d keypress spawn, which maps any printable key to its glyph and falls
 * back to '*' when absent.
 */

import * as THREE from 'three'

export const ATLAS_GLYPHS = [
  // 12 code glyphs — the ambient field's sampling set (indices 0–11).
  '{',
  '}',
  '(',
  ')',
  '<',
  '>',
  '/',
  '=',
  'λ',
  ':',
  '$',
  '*',
  // a–z + A–Z — spawn-only (indices 12–63).
  ...'abcdefghijklmnopqrstuvwxyz',
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
] as const

/** The ambient field only samples the code-glyph prefix (v1 aesthetic). */
export const FIELD_GLYPH_COUNT = 12

export const ATLAS_GRID = 8
const ATLAS_SIZE = 512
const CELL = ATLAS_SIZE / ATLAS_GRID

/** §4.2d: printable char → atlas index; '*' when absent; -1 for whitespace. */
export function glyphIndexOf(char: string): number {
  if (char.trim() === '') return -1 // a space has no drawable glyph — skip
  const idx = (ATLAS_GLYPHS as readonly string[]).indexOf(char)
  return idx >= 0 ? idx : (ATLAS_GLYPHS as readonly string[]).indexOf('*')
}

function monoFamily(): string {
  try {
    const family = getComputedStyle(document.documentElement)
      .getPropertyValue('--font-mono')
      .trim()
    return family || 'monospace'
  } catch {
    return 'monospace'
  }
}

/**
 * Build the atlas texture. Client-only; returns null when a 2D context is
 * unavailable (the caller falls back to the static constellation).
 */
export function createGlyphAtlasTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = ATLAS_SIZE
  canvas.height = ATLAS_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.clearRect(0, 0, ATLAS_SIZE, ATLAS_SIZE)
  ctx.fillStyle = '#ffffff' // tinted per-instance in the shader
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `44px ${monoFamily()}`

  for (let i = 0; i < ATLAS_GLYPHS.length; i++) {
    const col = i % ATLAS_GRID
    const row = Math.floor(i / ATLAS_GRID)
    ctx.fillText(ATLAS_GLYPHS[i] as string, col * CELL + CELL / 2, row * CELL + CELL / 2)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.needsUpdate = true
  return texture
}
