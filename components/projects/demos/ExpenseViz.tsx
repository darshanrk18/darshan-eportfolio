'use client'

/**
 * expense-share demo (spec §4.6): debt-settling graph. 4 avatar nodes
 * (initials, no photos); the gross web of IOUs ticks down while the minimal
 * settlement transfers tick up — tabular numbers, caption `demo data`.
 * Loops on the shared ticker; reduced motion shows the settled frame.
 */

import { useCallback, useState } from 'react'
import { useDemoTicker } from './useDemoTicker'

const LOOP_MS = 6500
const SETTLE_START = 1100
const SETTLE_DUR = 2400
const REDUCED_T = 4500 // settled

type NodeId = 'A' | 'B' | 'C' | 'D'
const NODES: Record<NodeId, [number, number]> = {
  A: [200, 42],
  B: [344, 118],
  C: [200, 196],
  D: [56, 118],
}

interface Debt {
  from: NodeId
  to: NodeId
  amount: number
  /** perpendicular label offset */
  off: [number, number]
}

/** Demo data — gross IOUs before settling. */
const GROSS: Debt[] = [
  { from: 'A', to: 'B', amount: 30, off: [10, -8] },
  { from: 'B', to: 'C', amount: 45, off: [12, 8] },
  { from: 'C', to: 'A', amount: 25, off: [-14, 0] },
  { from: 'D', to: 'B', amount: 20, off: [0, -10] },
  { from: 'C', to: 'D', amount: 15, off: [-12, 8] },
]

/** Minimal settlement of the same ledger (nets: A −5, B +5, C +5, D −5). */
const SETTLED: Debt[] = [
  { from: 'A', to: 'B', amount: 5, off: [10, -8] },
  { from: 'D', to: 'C', amount: 5, off: [-8, 12] },
]

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

function Edge({ debt, amount, color, opacity }: { debt: Debt; amount: number; color: string; opacity: number }) {
  const [x1, y1] = NODES[debt.from]
  const [x2, y2] = NODES[debt.to]
  // Shorten so lines start/end at the node circles (r = 20).
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy)
  const ux = dx / len
  const uy = dy / len
  const ax = x1 + ux * 24
  const ay = y1 + uy * 24
  const bx = x2 - ux * 24
  const by = y2 - uy * 24
  const mx = (ax + bx) / 2 + debt.off[0]
  const my = (ay + by) / 2 + debt.off[1]
  return (
    <g opacity={opacity}>
      <line x1={ax} y1={ay} x2={bx} y2={by} stroke={color} strokeWidth={1.25} />
      {/* arrowhead */}
      <path
        d={`M ${bx} ${by} l ${-ux * 8 - uy * 4} ${-uy * 8 + ux * 4} l ${uy * 8} ${-ux * 8} z`}
        fill={color}
      />
      <text
        x={mx}
        y={my}
        textAnchor="middle"
        fill={color}
        fontSize="10"
        fontFamily="var(--font-mono), monospace"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        ${amount}
      </text>
    </g>
  )
}

export default function ExpenseViz() {
  const [t, setT] = useState(0)
  const onTick = useCallback((dtMs: number) => {
    setT((prev) => (prev + dtMs) % LOOP_MS)
  }, [])
  const { ref, reduced } = useDemoTicker(onTick)
  const now = reduced ? REDUCED_T : t

  const p = clamp01((now - SETTLE_START) / SETTLE_DUR)
  const settled = p >= 1

  return (
    <figure ref={ref} className="m-0 flex flex-col gap-2">
      <svg
        aria-hidden="true"
        viewBox="0 0 400 240"
        className="w-full rounded-card border border-hairline bg-panel"
      >
        {/* gross debts tick to zero */}
        {GROSS.map((d, i) => {
          const amount = Math.round(d.amount * (1 - p))
          if (amount <= 0) return null
          return (
            <Edge
              key={`g${i}`}
              debt={d}
              amount={amount}
              color="var(--text-secondary)"
              opacity={0.4 + 0.4 * (1 - p)}
            />
          )
        })}
        {/* settlement transfers tick up in signal */}
        {p > 0 &&
          SETTLED.map((d, i) => (
            <Edge
              key={`s${i}`}
              debt={d}
              amount={Math.round(d.amount * p)}
              color="var(--accent-signal)"
              opacity={0.35 + 0.65 * p}
            />
          ))}

        {/* avatar nodes — initials only */}
        {(Object.keys(NODES) as NodeId[]).map((id) => {
          const [x, y] = NODES[id]
          return (
            <g key={id}>
              <circle cx={x} cy={y} r={20} fill="var(--bg-raised)" stroke="var(--border-strong)" strokeWidth={1} />
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                fill="var(--text-primary)"
                fontSize="13"
                fontFamily="var(--font-mono), monospace"
              >
                {id}
              </text>
            </g>
          )
        })}

        <text
          x={200}
          y={232}
          textAnchor="middle"
          fill={settled ? 'var(--accent-signal)' : 'var(--text-secondary)'}
          fontSize="10"
          fontFamily="var(--font-mono), monospace"
        >
          {settled ? '5 IOUs settled with 2 transfers ✓' : 'simplifying debts…'}
        </text>
      </svg>
      <figcaption className="type-label-xs text-secondary">
        Demo data: five IOUs between four people settle with two transfers
      </figcaption>
    </figure>
  )
}
