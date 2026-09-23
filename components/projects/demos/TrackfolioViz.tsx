'use client'

/**
 * trackfolio demo (CONTENT_FINAL "New demo/plate needs"): the resume
 * version graph. A main lane of resume versions grows commit by commit,
 * tailored branches fork per role family, and each submission freezes an
 * amber immutable-snapshot marker. Demo data only; loops on the shared
 * ticker; reduced motion shows the complete graph.
 */

import { useCallback, useState } from 'react'
import { useDemoTicker } from './useDemoTicker'

const LOOP_MS = 9000
const STEP_MS = 480
const GROW_MS = 360
const START = 300
const MONO = 'var(--font-jbmono), monospace'

const MAIN_Y = 120
const BRANCH_A_Y = 64
const BRANCH_B_Y = 176

interface NodeEl {
  x: number
  y: number
  at: number
  /** Immutable submission snapshot. */
  snapshot?: boolean
}

interface EdgeEl {
  d: string
  at: number
  branch?: boolean
}

const at = (step: number) => START + step * STEP_MS

/** Demo data — main-lane versions, two tailored branches, two snapshots. */
const NODES: NodeEl[] = [
  { x: 40, y: MAIN_Y, at: at(0) }, // v1
  { x: 96, y: MAIN_Y, at: at(1) }, // v2
  { x: 152, y: MAIN_Y, at: at(2) }, // v3
  { x: 150, y: BRANCH_A_Y, at: at(3) }, // feat/ml-roles
  { x: 206, y: BRANCH_A_Y, at: at(4) },
  { x: 262, y: BRANCH_A_Y, at: at(5), snapshot: true },
  { x: 206, y: BRANCH_B_Y, at: at(6) }, // feat/backend
  { x: 208, y: MAIN_Y, at: at(7) }, // v4
  { x: 262, y: BRANCH_B_Y, at: at(8), snapshot: true },
  { x: 264, y: MAIN_Y, at: at(9) }, // v5
  { x: 320, y: MAIN_Y, at: at(10) }, // v6 (HEAD)
]

const EDGES: EdgeEl[] = [
  { d: `M 40 ${MAIN_Y} L 96 ${MAIN_Y}`, at: at(1) },
  { d: `M 96 ${MAIN_Y} L 152 ${MAIN_Y}`, at: at(2) },
  { d: `M 96 ${MAIN_Y} C 123 ${MAIN_Y} 123 ${BRANCH_A_Y} 150 ${BRANCH_A_Y}`, at: at(3), branch: true },
  { d: `M 150 ${BRANCH_A_Y} L 206 ${BRANCH_A_Y}`, at: at(4), branch: true },
  { d: `M 206 ${BRANCH_A_Y} L 262 ${BRANCH_A_Y}`, at: at(5), branch: true },
  { d: `M 152 ${MAIN_Y} C 179 ${MAIN_Y} 179 ${BRANCH_B_Y} 206 ${BRANCH_B_Y}`, at: at(6), branch: true },
  { d: `M 152 ${MAIN_Y} L 208 ${MAIN_Y}`, at: at(7) },
  { d: `M 206 ${BRANCH_B_Y} L 262 ${BRANCH_B_Y}`, at: at(8), branch: true },
  { d: `M 208 ${MAIN_Y} L 264 ${MAIN_Y}`, at: at(9) },
  { d: `M 264 ${MAIN_Y} L 320 ${MAIN_Y}`, at: at(10) },
]

const DONE_AT = at(11)
const REDUCED_T = DONE_AT + GROW_MS // complete graph

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

export default function TrackfolioViz() {
  const [t, setT] = useState(0)
  const onTick = useCallback((dtMs: number) => {
    setT((prev) => (prev + dtMs) % LOOP_MS)
  }, [])
  const { ref, reduced } = useDemoTicker(onTick)
  const now = reduced ? REDUCED_T : t

  const p = (startAt: number) => clamp01((now - startAt) / GROW_MS)
  const done = now >= DONE_AT

  return (
    <figure ref={ref} className="m-0 flex flex-col gap-2">
      <svg
        aria-hidden="true"
        viewBox="0 0 400 240"
        className="rounded-card border-hairline bg-panel w-full border"
      >
        {/* lane labels */}
        <text x={16} y={BRANCH_A_Y - 14} fill="var(--text-secondary)" fontSize="9" fontFamily={MONO} opacity={p(at(3))}>
          feat/ml-roles
        </text>
        <text x={16} y={MAIN_Y - 14} fill="var(--text-secondary)" fontSize="9" fontFamily={MONO}>
          main
        </text>
        <text x={16} y={BRANCH_B_Y - 14} fill="var(--text-secondary)" fontSize="9" fontFamily={MONO} opacity={p(at(6))}>
          feat/backend
        </text>

        {/* edges draw in via pathLength dash trick */}
        {EDGES.map((e, i) => {
          const q = p(e.at)
          if (q <= 0) return null
          return (
            <path
              key={i}
              d={e.d}
              fill="none"
              stroke={e.branch ? 'var(--accent-electron)' : 'var(--border-strong)'}
              strokeWidth={1.25}
              opacity={e.branch ? 0.7 : 1}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - q}
            />
          )
        })}

        {/* version nodes + snapshot markers */}
        {NODES.map((n, i) => {
          const q = p(n.at)
          if (q <= 0) return null
          if (n.snapshot) {
            return (
              <g key={i} opacity={q}>
                <rect
                  x={n.x - 4}
                  y={n.y - 4}
                  width={8}
                  height={8}
                  fill="var(--bg-panel)"
                  stroke="var(--accent-amber)"
                  strokeWidth={1.25}
                />
                <rect
                  x={n.x - 7}
                  y={n.y - 7}
                  width={14}
                  height={14}
                  fill="none"
                  stroke="var(--accent-amber)"
                  strokeWidth={1}
                  opacity={0.3}
                />
                <text x={n.x} y={n.y - 12} textAnchor="middle" fill="var(--accent-amber)" fontSize="8" fontFamily={MONO}>
                  snapshot
                </text>
              </g>
            )
          }
          const isMain = n.y === MAIN_Y
          return (
            <circle
              key={i}
              cx={n.x}
              cy={n.y}
              r={3.5 * q}
              fill="var(--bg-panel)"
              stroke={isMain ? 'var(--accent-signal)' : 'var(--accent-electron)'}
              strokeWidth={1.25}
              opacity={isMain ? 1 : 0.85}
            />
          )
        })}

        {/* HEAD label on the newest main commit */}
        {p(at(10)) >= 1 ? (
          <text x={320} y={MAIN_Y + 18} textAnchor="middle" fill="var(--accent-signal)" fontSize="8" fontFamily={MONO}>
            HEAD
          </text>
        ) : null}

        <text
          x={200}
          y={232}
          textAnchor="middle"
          fill={done ? 'var(--accent-signal)' : 'var(--text-secondary)'}
          fontSize="10"
          fontFamily={MONO}
        >
          {done ? '2 submissions frozen as immutable snapshots ✓' : 'branching tailored versions…'}
        </text>
      </svg>
      <figcaption className="type-label-xs text-secondary">
        demo data — resume versions branch per role; each submission freezes an immutable
        snapshot
      </figcaption>
    </figure>
  )
}
