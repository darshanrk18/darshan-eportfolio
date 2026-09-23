'use client'

/**
 * calendar-java demo (spec §4.6): UML-as-art. Class boxes draw in with
 * stroke-dash animation, edges annotate S-O-L-I-D letters, and MVC / Strategy /
 * Builder appear as generic pattern-glossary labels (no invented architecture
 * claims). One-shot draw on the shared ticker; reduced motion = fully drawn.
 */

import { useCallback, useRef, useState } from 'react'
import { useDemoTicker } from './useDemoTicker'

const DRAW_MS = 3600

interface ClassBox {
  x: number
  y: number
  label: string
}
const BW = 100
const BH = 52
const BOXES: ClassBox[] = [
  { x: 30, y: 36, label: 'Model' },
  { x: 180, y: 36, label: 'View' },
  { x: 105, y: 148, label: 'Controller' },
  { x: 330, y: 36, label: '«strategy»' },
  { x: 330, y: 148, label: '«builder»' },
]
const PERIM = (BW + BH) * 2

interface UmlEdge {
  from: number
  to: number
  letter: 'S' | 'O' | 'L' | 'I' | 'D'
}
const UML_EDGES: UmlEdge[] = [
  { from: 2, to: 0, letter: 'S' },
  { from: 2, to: 1, letter: 'O' },
  { from: 1, to: 0, letter: 'L' },
  { from: 3, to: 4, letter: 'I' },
  { from: 2, to: 3, letter: 'D' },
]

function center(b: ClassBox): [number, number] {
  return [b.x + BW / 2, b.y + BH / 2]
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

/** Progress of a sub-interval [start, start+span] of overall progress p. */
function seg(p: number, start: number, span: number): number {
  return clamp01((p - start) / span)
}

export default function UmlViz() {
  const [p, setP] = useState(0)
  const elapsed = useRef(0)

  const onTick = useCallback((dtMs: number) => {
    if (elapsed.current >= DRAW_MS) return // drawn — hold, no re-renders
    elapsed.current += dtMs
    setP(clamp01(elapsed.current / DRAW_MS))
  }, [])

  const { ref, reduced } = useDemoTicker(onTick)
  const progress = reduced ? 1 : p

  return (
    <figure ref={ref} className="m-0 flex flex-col gap-2">
      <svg
        aria-hidden="true"
        viewBox="0 0 460 250"
        className="w-full rounded-card border border-hairline bg-panel"
      >
        {/* class boxes draw in, staggered */}
        {BOXES.map((b, i) => {
          const local = seg(progress, i * 0.1, 0.28)
          if (local === 0) return null
          const inner = seg(progress, i * 0.1 + 0.18, 0.2)
          return (
            <g key={b.label}>
              <rect
                x={b.x}
                y={b.y}
                width={BW}
                height={BH}
                fill="var(--bg-raised)"
                stroke="var(--border-strong)"
                strokeWidth={1}
                strokeDasharray={PERIM}
                strokeDashoffset={PERIM * (1 - local)}
              />
              {inner > 0 && (
                <g opacity={inner}>
                  <line x1={b.x} y1={b.y + 20} x2={b.x + BW} y2={b.y + 20} stroke="var(--border-hairline)" />
                  <text
                    x={b.x + BW / 2}
                    y={b.y + 14}
                    textAnchor="middle"
                    fill="var(--text-primary)"
                    fontSize="10"
                    fontFamily="var(--font-jbmono), monospace"
                  >
                    {b.label}
                  </text>
                  {/* decorative member rows */}
                  <line x1={b.x + 8} y1={b.y + 30} x2={b.x + BW - 30} y2={b.y + 30} stroke="var(--border-hairline)" />
                  <line x1={b.x + 8} y1={b.y + 40} x2={b.x + BW - 16} y2={b.y + 40} stroke="var(--border-hairline)" />
                </g>
              )}
            </g>
          )
        })}

        {/* edges + SOLID letters */}
        {UML_EDGES.map((e, i) => {
          const local = seg(progress, 0.55 + i * 0.05, 0.2)
          if (local === 0) return null
          const [x1, y1] = center(BOXES[e.from])
          const [x2, y2] = center(BOXES[e.to])
          const mx = (x1 + x2) / 2
          const my = (y1 + y2) / 2
          const letterIn = seg(progress, 0.78 + i * 0.04, 0.15)
          return (
            <g key={e.letter}>
              <line
                x1={x1}
                y1={y1}
                x2={x1 + (x2 - x1) * local}
                y2={y1 + (y2 - y1) * local}
                stroke="var(--accent-electron)"
                strokeWidth={1}
                opacity={0.55}
              />
              {letterIn > 0 && (
                <g opacity={letterIn}>
                  <circle cx={mx} cy={my} r={9} fill="var(--bg-page)" stroke="var(--accent-signal)" strokeWidth={1} />
                  <text
                    x={mx}
                    y={my + 3.5}
                    textAnchor="middle"
                    fill="var(--accent-signal)"
                    fontSize="10"
                    fontFamily="var(--font-jbmono), monospace"
                  >
                    {e.letter}
                  </text>
                </g>
              )}
            </g>
          )
        })}

        {/* pattern glossary labels */}
        <g opacity={seg(progress, 0.9, 0.1)}>
          <text x={30} y={120} fill="var(--text-secondary)" fontSize="9" fontFamily="var(--font-jbmono), monospace">
            MVC
          </text>
          <text
            x={230}
            y={240}
            textAnchor="middle"
            fill="var(--text-secondary)"
            fontSize="9"
            fontFamily="var(--font-jbmono), monospace"
          >
            S·O·L·I·D — single responsibility · open/closed · liskov · interface segregation ·
            dependency inversion
          </text>
        </g>
      </svg>
      <figcaption className="type-label-xs text-secondary">
        uml pattern glossary drawing itself — mvc + strategy + builder class boxes, edges
        annotated with the five solid principles
      </figcaption>
    </figure>
  )
}
