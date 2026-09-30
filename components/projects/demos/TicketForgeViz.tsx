'use client'

/**
 * ticket-forge demo (CONTENT_FINAL "New demo/plate needs"): candidate
 * ranking. Six engineer rows are scored against an incoming ticket —
 * confidence bars fill, rows settle into ranked order, the top pick is
 * assigned. Demo data only; loops on the shared ticker; reduced motion
 * shows the final ranked frame.
 */

import { useCallback, useState } from 'react'
import { useDemoTicker } from './useDemoTicker'

const LOOP_MS = 7500
const FILL_START = 400
const FILL_DUR = 1600
const SORT_START = 2400
const SORT_DUR = 1200
const ASSIGN_AT = 4000
const REDUCED_T = 5000 // ranked + assigned

interface Candidate {
  id: string
  /** Final confidence score in [0, 1]. */
  conf: number
}

/** Demo data — candidates in arrival (unranked) order. */
const CANDIDATES: Candidate[] = [
  { id: 'eng-07', conf: 0.63 },
  { id: 'eng-04', conf: 0.92 },
  { id: 'eng-09', conf: 0.48 },
  { id: 'eng-02', conf: 0.81 },
  { id: 'eng-05', conf: 0.31 },
  { id: 'eng-11', conf: 0.87 },
]

const RANKED = [...CANDIDATES].sort((a, b) => b.conf - a.conf)
const rankOf = (id: string) => RANKED.findIndex((c) => c.id === id)

const ROW_Y0 = 58
const ROW_H = 28
const BAR_X = 96
const BAR_W = 216
const MONO = 'var(--font-mono), monospace'

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

function easeInOut(p: number): number {
  return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2
}

export default function TicketForgeViz() {
  const [t, setT] = useState(0)
  const onTick = useCallback((dtMs: number) => {
    setT((prev) => (prev + dtMs) % LOOP_MS)
  }, [])
  const { ref, reduced } = useDemoTicker(onTick)
  const now = reduced ? REDUCED_T : t

  const fillP = clamp01((now - FILL_START) / FILL_DUR)
  const sortP = easeInOut(clamp01((now - SORT_START) / SORT_DUR))
  const assigned = now >= ASSIGN_AT

  return (
    <figure ref={ref} className="m-0 flex flex-col gap-2">
      <svg
        aria-hidden="true"
        viewBox="0 0 400 240"
        className="rounded-card border-hairline bg-panel w-full border"
      >
        <text x={16} y={26} fill="var(--text-secondary)" fontSize="10" fontFamily={MONO}>
          ticket #4821 — &quot;deploy pipeline failing on rollout&quot;
        </text>
        <line x1={16} y1={38} x2={384} y2={38} stroke="var(--border-hairline)" strokeWidth={1} />

        {CANDIDATES.map((c, i) => {
          const rank = rankOf(c.id)
          const y = ROW_Y0 + (i + (rank - i) * sortP) * ROW_H
          const conf = c.conf * fillP
          const topK = rank < 3 && sortP >= 1
          const isPick = rank === 0 && assigned
          const color = isPick
            ? 'var(--accent-signal)'
            : topK
              ? 'var(--accent-electron)'
              : 'var(--text-secondary)'
          return (
            <g key={c.id}>
              <text x={16} y={y + 4} fill={color} fontSize="10" fontFamily={MONO}>
                {c.id}
              </text>
              <rect
                x={BAR_X}
                y={y - 5}
                width={BAR_W}
                height={10}
                fill="none"
                stroke="var(--border-hairline)"
                strokeWidth={1}
              />
              <rect
                x={BAR_X + 1}
                y={y - 4}
                width={Math.max(0, (BAR_W - 2) * conf)}
                height={8}
                fill={color}
                opacity={isPick ? 0.85 : 0.45}
              />
              <text
                x={BAR_X + BAR_W + 10}
                y={y + 4}
                fill={color}
                fontSize="10"
                fontFamily={MONO}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {conf.toFixed(2)}
              </text>
              {isPick ? (
                <text
                  x={BAR_X + BAR_W + 44}
                  y={y + 4}
                  fill="var(--accent-signal)"
                  fontSize="10"
                  fontFamily={MONO}
                >
                  ✓
                </text>
              ) : null}
            </g>
          )
        })}

        <text
          x={200}
          y={232}
          textAnchor="middle"
          fill={assigned ? 'var(--accent-signal)' : 'var(--text-secondary)'}
          fontSize="10"
          fontFamily={MONO}
        >
          {assigned
            ? 'ranked — eng-04 assigned ✓'
            : sortP > 0
              ? 'ranking candidates…'
              : 'scoring candidates…'}
        </text>
      </svg>
      <figcaption className="type-label-xs text-secondary">
        Demo data: six engineers scored against an incoming ticket; the top-ranked one is
        assigned
      </figcaption>
    </figure>
  )
}
