/**
 * T0 hero fallback (spec §4.3/§5.5): a deterministic server-rendered SVG
 * "constellation" of ~140 mono glyphs — seeded PRNG, seed "signal", so every
 * build renders the identical scatter. aria-hidden garnish; the hero text is
 * the content. Also the permanent fallback at tier T0 / no-WebGL / no-JS.
 */

import { createSeededRandom } from '@/lib/utils/seeded'

const GLYPHS = ['{', '}', '(', ')', '<', '>', '/', '=', 'λ', ':', ';', '#', '$', '0', '1', '*']
const COUNT = 140
const VIEW_W = 1200
const VIEW_H = 800

interface Glyph {
  x: number
  y: number
  size: number
  opacity: number
  char: string
  accent: boolean
}

function buildGlyphs(): Glyph[] {
  const rand = createSeededRandom('signal')
  const glyphs: Glyph[] = []
  for (let i = 0; i < COUNT; i++) {
    glyphs.push({
      x: Math.round(rand() * VIEW_W * 10) / 10,
      y: Math.round(rand() * VIEW_H * 10) / 10,
      size: Math.round((10 + rand() * 12) * 10) / 10,
      // 8–18% opacity per spec
      opacity: Math.round((0.08 + rand() * 0.1) * 1000) / 1000,
      char: GLYPHS[Math.floor(rand() * GLYPHS.length)] as string,
      accent: rand() < 0.5,
    })
  }
  return glyphs
}

const glyphs = buildGlyphs()

export default function StaticConstellation() {
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ zIndex: 'var(--z-canvas)' }}
      data-component="StaticConstellation"
    >
      {glyphs.map((g, i) => (
        <text
          key={i}
          x={g.x}
          y={g.y}
          fontSize={g.size}
          fill={g.accent ? 'var(--accent-signal)' : 'var(--accent-electron)'}
          opacity={g.opacity}
          fontFamily="var(--font-mono)"
        >
          {g.char}
        </text>
      ))}
    </svg>
  )
}
