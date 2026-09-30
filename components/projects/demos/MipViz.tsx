'use client'

/**
 * ieee-mip-optimizer demo (spec §4.6): MIP feasible region. A 2D polytope in
 * hairlines, constraint cuts slicing in, an objective line sweeping to the
 * optimum vertex (which pulses signal), and a mono cost readout ticking down
 * to convergence. Loops on the shared ticker; reduced motion = final frame.
 */

import { useCallback, useId, useState } from 'react'
import { useDemoTicker } from './useDemoTicker'

const LOOP_MS = 8200
const REDUCED_T = 6400

// Model space: u ∈ [0,10], v ∈ [0,8]  →  SVG plot area.
const X0 = 42
const Y0 = 228
const SX = 33
const SY = 24

function px(u: number): number {
  return X0 + u * SX
}
function py(v: number): number {
  return Y0 - v * SY
}

type Poly = [number, number][]

// Feasible region as each cut lands (precomputed vertices, u/v space).
const REGIONS: Poly[] = [
  [
    [0, 0], [10, 0], [10, 8], [0, 8],
  ],
  [
    [0, 0], [10, 0], [10, 4], [2, 8], [0, 8],
  ],
  [
    [0, 0], [8, 0], [4.667, 6.667], [2, 8], [0, 8],
  ],
  [
    [0, 0], [6, 0], [7.333, 1.333], [4.667, 6.667], [2, 8], [0, 8],
  ],
]

// Cut lines drawn across the plot (endpoints in u/v space) + labels.
const CUTS: { a: [number, number]; b: [number, number]; label: string }[] = [
  { a: [2, 8], b: [10, 4], label: 'x + 2y ≤ 18' },
  { a: [8, 0], b: [4, 8], label: '2x + y ≤ 16' },
  { a: [6, 0], b: [10, 4], label: 'x − y ≤ 6' },
]

// Objective: maximize z = 2x + 3y → optimum vertex (4.667, 6.667), z* = 29.33.
const OPT: [number, number] = [4.667, 6.667]
const Z_START = 44
const Z_OPT = 2 * OPT[0] + 3 * OPT[1] // 29.33

const T_BASE = 900
const T_CUT = 800 // per cut
const T_SWEEP_START = T_BASE + 3 * T_CUT // 3300
const T_SWEEP = 2600

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

function toPoints(poly: Poly): string {
  return poly.map(([u, v]) => `${px(u)},${py(v)}`).join(' ')
}

export default function MipViz() {
  const [t, setT] = useState(0)
  const onTick = useCallback((dtMs: number) => {
    setT((prev) => (prev + dtMs) % LOOP_MS)
  }, [])
  const { ref, reduced } = useDemoTicker(onTick)
  // The clip id must be unique per mount (the plot can be on screen twice).
  const clipId = `mip-plot-${useId().replace(/[^A-Za-z0-9_-]/g, "")}`
  const now = reduced ? REDUCED_T : t

  const baseIn = clamp01(now / T_BASE)
  const cutsLanded = Math.max(0, Math.min(3, Math.floor((now - T_BASE) / T_CUT) + (now >= T_BASE ? 1 : 0)))
  const region = REGIONS[cutsLanded]
  const sweepT = clamp01((now - T_SWEEP_START) / T_SWEEP)
  const z = Z_START + (Z_OPT - Z_START) * sweepT
  const converged = sweepT >= 1
  // Optimum pulse (reduced motion: steady highlight).
  const pulse = reduced ? 1 : converged ? 0.6 + 0.4 * Math.sin(now / 180) : 0

  // Objective line 2u + 3v = z, drawn long and clipped to the plot area.
  const u0 = z / 2 // point on line at v = 0
  const objA: [number, number] = [u0 - 12, 8]
  const objB: [number, number] = [u0 + 4.5, -3]

  return (
    <figure ref={ref} className="m-0 flex flex-col gap-2">
      <svg
        aria-hidden="true"
        viewBox="0 0 420 260"
        className="w-full rounded-card border border-hairline bg-panel"
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={px(0)} y={py(8)} width={10 * SX} height={8 * SY} />
          </clipPath>
        </defs>

        {/* axes */}
        <g opacity={baseIn}>
          <line x1={px(0)} y1={py(0)} x2={px(10) + 8} y2={py(0)} stroke="var(--border-strong)" />
          <line x1={px(0)} y1={py(0)} x2={px(0)} y2={py(8) - 8} stroke="var(--border-strong)" />
        </g>

        {/* feasible region — hairline polytope */}
        <polygon
          points={toPoints(region)}
          fill="var(--accent-electron-dim)"
          stroke="var(--border-strong)"
          strokeWidth={1}
          opacity={baseIn}
        />

        {/* constraint cuts slicing in */}
        {CUTS.map((cut, i) => {
          const local = clamp01((now - (T_BASE + i * T_CUT)) / T_CUT)
          if (local === 0) return null
          const [au, av] = cut.a
          const [bu, bv] = cut.b
          const ex = au + (bu - au) * local
          const ey = av + (bv - av) * local
          return (
            <g key={cut.label}>
              <line
                x1={px(au)}
                y1={py(av)}
                x2={px(ex)}
                y2={py(ey)}
                stroke="var(--accent-amber)"
                strokeWidth={1}
                strokeDasharray="4 3"
                opacity={0.8}
              />
              {local === 1 && (
                <text
                  x={px((au + bu) / 2) + 6}
                  y={py((av + bv) / 2) - 4}
                  fill="var(--text-secondary)"
                  fontSize="8"
                  fontFamily="var(--font-mono), monospace"
                >
                  {cut.label}
                </text>
              )}
            </g>
          )
        })}

        {/* objective line sweeping to the optimum */}
        {sweepT > 0 && (
          <g clipPath={`url(#${clipId})`}>
            <line
              x1={px(objA[0])}
              y1={py(objA[1])}
              x2={px(objB[0])}
              y2={py(objB[1])}
              stroke="var(--accent-signal)"
              strokeWidth={1.25}
              opacity={0.9}
            />
          </g>
        )}

        {/* optimum vertex pulses signal on convergence */}
        {(converged || reduced) && (
          <g>
            <circle
              cx={px(OPT[0])}
              cy={py(OPT[1])}
              r={9}
              fill="none"
              stroke="var(--accent-signal)"
              strokeWidth={1}
              opacity={0.5 * pulse}
            />
            <circle cx={px(OPT[0])} cy={py(OPT[1])} r={4} fill="var(--accent-signal)" opacity={pulse} />
          </g>
        )}

        {/* cost readout */}
        <text
          x={412}
          y={24}
          textAnchor="end"
          fill={converged ? 'var(--accent-signal)' : 'var(--text-primary)'}
          fontSize="12"
          fontFamily="var(--font-mono), monospace"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {`z = ${z.toFixed(1)}${converged ? ' ✓' : ''}`}
        </text>
        <text
          x={412}
          y={40}
          textAnchor="end"
          fill="var(--text-secondary)"
          fontSize="9"
          fontFamily="var(--font-mono), monospace"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {`cuts ${cutsLanded}/3`}
        </text>
      </svg>
      <figcaption className="type-label-xs text-secondary">
        Illustration: each constraint trims the feasible region until the objective lands on
        the best allocation
      </figcaption>
    </figure>
  )
}
