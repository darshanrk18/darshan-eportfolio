'use client'

/**
 * gesture-rps (spec §4.6): a pre-baked SVG hand-landmark constellation cycling
 * rock → paper → scissors. 21 landmarks + skeleton edges (MediaPipe topology)
 * are generated procedurally from per-finger curl values — Mediapipe is NOT
 * shipped. Rides the shared ticker; static "paper" pose under reduced motion.
 */

import { useCallback, useRef, useState } from 'react'
import { useDemoTicker } from './useDemoTicker'

type Vec = [number, number]
/** Curl per finger [thumb, index, middle, ring, pinky]: 0 = extended, 1 = fist. */
type Curls = [number, number, number, number, number]

const POSES: { name: 'rock' | 'paper' | 'scissors'; curls: Curls }[] = [
  { name: 'rock', curls: [0.75, 1, 1, 1, 1] },
  { name: 'paper', curls: [0, 0, 0, 0, 0] },
  { name: 'scissors', curls: [0.75, 0, 0, 1, 1] },
]

const HOLD_MS = 1300
const MORPH_MS = 550

const DEG = Math.PI / 180
const WRIST: Vec = [100, 182]

interface FingerDef {
  base: Vec
  angle: number // degrees; -90 = straight up
  lengths: [number, number, number]
  bends: [number, number, number] // degrees added per joint at curl = 1
}

const FINGERS: FingerDef[] = [
  { base: [76, 160], angle: -135, lengths: [24, 20, 15], bends: [55, 70, 60] }, // thumb
  { base: [74, 118], angle: -100, lengths: [30, 22, 15], bends: [95, 100, 80] }, // index
  { base: [92, 110], angle: -93, lengths: [34, 25, 16], bends: [95, 100, 80] }, // middle
  { base: [110, 114], angle: -85, lengths: [30, 22, 15], bends: [95, 100, 80] }, // ring
  { base: [127, 122], angle: -75, lengths: [22, 17, 12], bends: [95, 100, 80] }, // pinky
]

/** MediaPipe hand skeleton edges over the 21 landmark indices. */
const EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
]

const TIPS = new Set([4, 8, 12, 16, 20])

function computeLandmarks(curls: Curls): Vec[] {
  const points: Vec[] = [WRIST]
  for (let f = 0; f < 5; f++) {
    const { base, angle, lengths, bends } = FINGERS[f]
    const curl = curls[f]
    let [x, y] = base
    let a = angle * DEG
    points.push([x, y]) // chain base (CMC for thumb, MCP for fingers)
    for (let s = 0; s < 3; s++) {
      a += curl * bends[s] * DEG
      x += Math.cos(a) * lengths[s]
      y += Math.sin(a) * lengths[s]
      points.push([x, y])
    }
  }
  return points
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (1 - t) * (1 - t) * 2
}

export default function RpsLandmarks() {
  const elapsed = useRef(0)
  const [state, setState] = useState<{ curls: Curls; label: string }>(() => ({
    curls: POSES[0].curls,
    label: POSES[0].name,
  }))

  const onTick = useCallback((dtMs: number) => {
    elapsed.current += dtMs
    const period = HOLD_MS + MORPH_MS
    const cycle = elapsed.current % (period * POSES.length)
    const idx = Math.floor(cycle / period)
    const within = cycle - idx * period
    const from = POSES[idx].curls
    const next = POSES[(idx + 1) % POSES.length]
    let curls: Curls
    if (within < HOLD_MS) {
      curls = from
    } else {
      const t = easeInOut((within - HOLD_MS) / MORPH_MS)
      curls = from.map((c, i) => c + (next.curls[i] - c) * t) as Curls
    }
    const label = within < HOLD_MS + MORPH_MS / 2 ? POSES[idx].name : next.name
    setState({ curls, label })
  }, [])

  const { ref, reduced } = useDemoTicker(onTick)

  const curls = reduced ? POSES[1].curls : state.curls
  const label = reduced ? POSES[1].name : state.label
  const landmarks = computeLandmarks(curls)

  return (
    <figure ref={ref} className="m-0 flex flex-col gap-2">
      <svg
        aria-hidden="true"
        viewBox="0 0 200 200"
        className="mx-auto w-full max-w-[280px] rounded-card border border-hairline bg-panel"
      >
        {EDGES.map(([a, b]) => (
          <line
            key={`${a}-${b}`}
            x1={landmarks[a][0]}
            y1={landmarks[a][1]}
            x2={landmarks[b][0]}
            y2={landmarks[b][1]}
            stroke="var(--text-secondary)"
            strokeWidth={1.5}
            opacity={0.45}
          />
        ))}
        {landmarks.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={TIPS.has(i) ? 3.5 : 2.5}
            fill={TIPS.has(i) ? 'var(--accent-signal)' : 'var(--accent-electron)'}
            opacity={TIPS.has(i) ? 1 : 0.8}
          />
        ))}
        <text
          x={100}
          y={196}
          textAnchor="middle"
          fill="var(--text-secondary)"
          fontSize="9"
          fontFamily="var(--font-jbmono), monospace"
        >
          {`> ${label}`}
        </text>
      </svg>
      <figcaption className="type-label-xs text-secondary">
        hand-landmark constellation cycling rock → paper → scissors — pre-baked keyframes, no
        camera, no mediapipe on the client
      </figcaption>
    </figure>
  )
}
