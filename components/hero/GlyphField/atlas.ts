/**
 * Glyph atlas (spec §5.5): the 16-glyph set rendered once at runtime into a
 * single 256px canvas texture (JetBrains Mono via the --font-mono token), so
 * the whole field is ONE draw call with zero image assets.
 */

import * as THREE from 'three'

export const ATLAS_GLYPHS = [
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
  ';',
  '#',
  '$',
  '0',
  '1',
  '*',
] as const

export const ATLAS_GRID = 4
const ATLAS_SIZE = 256
const CELL = ATLAS_SIZE / ATLAS_GRID

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
