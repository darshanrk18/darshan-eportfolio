'use client'

/**
 * box-archive demo (spec §4.6): animated architecture diagram — an OAuth flow
 * (client → auth → token → resource api, packet dots) followed by a K8s
 * deployment strip where pod squares schedule and scale 2 → 5 on a load tick.
 * Loops on the shared ticker; reduced motion shows the final settled frame.
 */

import { useCallback, useState } from 'react'
import { useDemoTicker } from './useDemoTicker'

const LOOP_MS = 7200
const REDUCED_T = 6000 // settled frame: flow complete, 5 pods running

interface Box {
  x: number
  y: number
  label: string
}
const BOXES: Box[] = [
  { x: 24, y: 28, label: 'client' },
  { x: 188, y: 28, label: 'auth server' },
  { x: 352, y: 28, label: 'resource api' },
]
const BW = 104
const BH = 46

// [fromX, y, toX, y] lanes between box edges
const LANE_REQ: [number, number, number, number] = [24 + BW, 44, 188, 44] // client → auth
const LANE_TOK: [number, number, number, number] = [188, 58, 24 + BW, 58] // auth → client

interface Phase {
  start: number
  dur: number
}
const P_REQ: Phase = { start: 200, dur: 1100 }
const P_TOK: Phase = { start: 1500, dur: 1100 }
const P_API: Phase = { start: 2800, dur: 1100 }
const P_SCALE_START = 4100
const P_SCALE_STEP = 420

function phaseT(t: number, p: Phase): number | null {
  if (t < p.start || t > p.start + p.dur) return null
  return (t - p.start) / p.dur
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function Packet({
  lane,
  t,
  color,
}: {
  lane: [number, number, number, number]
  t: number
  color: string
}) {
  return (
    <circle
      cx={lerp(lane[0], lane[2], t)}
      cy={lerp(lane[1], lane[3], t)}
      r={4}
      fill={color}
    />
  )
}

export default function BoxArchViz() {
  const [t, setT] = useState(0)
  const onTick = useCallback((dtMs: number) => {
    setT((prev) => (prev + dtMs) % LOOP_MS)
  }, [])
  const { ref, reduced } = useDemoTicker(onTick)
  const now = reduced ? REDUCED_T : t

  const reqT = phaseT(now, P_REQ)
  const tokT = phaseT(now, P_TOK)
  const apiT = phaseT(now, P_API)
  // Pods 0–1 always running; 2–4 schedule in sequence, all reset at loop end.
  const podsRunning =
    2 +
    Math.max(
      0,
      Math.min(3, Math.floor((now - P_SCALE_START) / P_SCALE_STEP) + 1),
    ) *
      (now >= P_SCALE_START ? 1 : 0)
  const loadT = Math.max(0, Math.min(1, (now - (P_SCALE_START - 600)) / 600))

  return (
    <figure ref={ref} className="m-0 flex flex-col gap-2">
      <svg
        aria-hidden="true"
        viewBox="0 0 480 260"
        className="w-full rounded-card border border-hairline bg-panel"
      >
        {/* service boxes */}
        {BOXES.map((b) => (
          <g key={b.label}>
            <rect
              x={b.x}
              y={b.y}
              width={BW}
              height={BH}
              fill="var(--bg-raised)"
              stroke="var(--border-strong)"
              strokeWidth={1}
            />
            <text
              x={b.x + BW / 2}
              y={b.y + BH / 2 + 3}
              textAnchor="middle"
              fill="var(--text-primary)"
              fontSize="11"
              fontFamily="var(--font-mono), monospace"
            >
              {b.label}
            </text>
          </g>
        ))}

        {/* lanes */}
        <line x1={LANE_REQ[0]} y1={LANE_REQ[1]} x2={LANE_REQ[2]} y2={LANE_REQ[3]} stroke="var(--border-hairline)" />
        <line x1={LANE_TOK[0]} y1={LANE_TOK[1]} x2={LANE_TOK[2]} y2={LANE_TOK[3]} stroke="var(--border-hairline)" />
        <line x1={76} y1={74} x2={76} y2={112} stroke="var(--border-hairline)" />
        <line x1={76} y1={112} x2={404} y2={112} stroke="var(--border-hairline)" />
        <line x1={404} y1={112} x2={404} y2={74} stroke="var(--border-hairline)" />

        {/* flow step labels */}
        <text x={158} y={38} textAnchor="middle" fill="var(--text-secondary)" fontSize="9" fontFamily="var(--font-mono), monospace">
          1 authorize →
        </text>
        <text x={158} y={70} textAnchor="middle" fill="var(--text-secondary)" fontSize="9" fontFamily="var(--font-mono), monospace">
          ← 2 token
        </text>
        <text x={240} y={124} textAnchor="middle" fill="var(--text-secondary)" fontSize="9" fontFamily="var(--font-mono), monospace">
          3 request + bearer token →
        </text>

        {/* packets */}
        {reqT !== null && <Packet lane={LANE_REQ} t={reqT} color="var(--accent-electron)" />}
        {tokT !== null && <Packet lane={LANE_TOK} t={tokT} color="var(--accent-amber)" />}
        {apiT !== null && (
          <circle
            cx={apiT < 0.12 ? 76 : lerp(76, 404, Math.min(1, (apiT - 0.12) / 0.76))}
            cy={apiT < 0.12 ? lerp(74, 112, apiT / 0.12) : apiT > 0.88 ? lerp(112, 74, (apiT - 0.88) / 0.12) : 112}
            r={4}
            fill="var(--accent-signal)"
          />
        )}

        {/* K8s strip */}
        <line x1={24} y1={152} x2={456} y2={152} stroke="var(--border-hairline)" />
        <text x={24} y={172} fill="var(--text-secondary)" fontSize="10" fontFamily="var(--font-mono), monospace">
          k8s deployment — replicas 2 → 5
        </text>
        {/* load tick */}
        <rect x={370} y={162} width={60} height={6} fill="var(--bg-raised)" stroke="var(--border-hairline)" strokeWidth={0.5} />
        <rect x={370} y={162} width={60 * loadT} height={6} fill="var(--accent-amber)" opacity={0.8} />
        <text x={436} y={169} fill="var(--text-secondary)" fontSize="8" fontFamily="var(--font-mono), monospace">
          load
        </text>

        {Array.from({ length: 5 }, (_, i) => {
          const running = i < podsRunning
          const x = 24 + i * 62
          return (
            <g key={i}>
              <rect
                x={x}
                y={186}
                width={44}
                height={44}
                fill={running ? 'var(--accent-signal-dim)' : 'none'}
                stroke={running ? 'var(--accent-signal)' : 'var(--border-hairline)'}
                strokeWidth={1}
                strokeDasharray={running ? undefined : '3 3'}
              />
              <text
                x={x + 22}
                y={212}
                textAnchor="middle"
                fill={running ? 'var(--text-primary)' : 'var(--text-secondary)'}
                fontSize="9"
                fontFamily="var(--font-mono), monospace"
              >
                {running ? `pod-${i + 1}` : 'pending'}
              </text>
            </g>
          )
        })}
        <text x={24} y={250} fill="var(--text-secondary)" fontSize="9" fontFamily="var(--font-mono), monospace">
          {`${Math.min(5, podsRunning)}/5 running`}
        </text>
      </svg>
      <figcaption className="type-label-xs text-secondary">
        Illustration: a sign-in becomes an authorized request, then the service scales out
        under load
      </figcaption>
    </figure>
  )
}
