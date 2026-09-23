'use client'

/**
 * a*-snake (spec §4.6): an A* agent auto-solving a snake grid on loop.
 * Open set tinted electron, closed set tertiary (decorative), path in signal.
 * Deterministic (seeded RNG), rides the shared ticker, pauses off-screen,
 * renders a frozen mid-solve frame under reduced motion.
 */

import { useCallback, useRef, useState } from 'react'
import { astar, cellKey, type Point } from '@/lib/ai/astar'
import { createSeededRandom } from '@/lib/utils/seeded'
import { useDemoTicker } from './useDemoTicker'

const W = 20
const H = 12
const CELL = 20
const STEP_MS = 95
const MAX_LEN = 26

interface Frame {
  snake: Point[]
  food: Point
  path: Point[] | null
  open: Point[]
  closed: Point[]
}

interface Sim {
  frame: Frame
  rng: () => number
}

function placeFood(rng: () => number, snake: Point[]): Point {
  const occupied = new Set(snake.map(([x, y]) => cellKey(x, y)))
  for (let attempts = 0; attempts < 500; attempts++) {
    const x = Math.floor(rng() * W)
    const y = Math.floor(rng() * H)
    if (!occupied.has(cellKey(x, y))) return [x, y]
  }
  return [0, 0]
}

function initialFrame(rng: () => number): Frame {
  const snake: Point[] = [
    [3, 6],
    [2, 6],
    [1, 6],
  ]
  return { snake, food: placeFood(rng, snake), path: null, open: [], closed: [] }
}

function stepSim(sim: Sim): Frame {
  const { snake, food } = sim.frame
  const [head] = snake
  // Body blocks the path; the tail cell vacates this tick, so allow it.
  const body = new Set(snake.slice(0, -1).map(([x, y]) => cellKey(x, y)))
  const result = astar({
    width: W,
    height: H,
    start: head,
    goal: food,
    blocked: (x, y) => body.has(cellKey(x, y)),
  })

  if (!result.path || result.path.length < 2 || snake.length >= MAX_LEN) {
    // Boxed in (or long enough) — loop the demo.
    return initialFrame(sim.rng)
  }

  const nextHead = result.path[1]
  const ate = nextHead[0] === food[0] && nextHead[1] === food[1]
  const nextSnake: Point[] = [nextHead, ...snake]
  if (!ate) nextSnake.pop()
  return {
    snake: nextSnake,
    food: ate ? placeFood(sim.rng, nextSnake) : food,
    path: result.path,
    open: result.open,
    closed: result.closed,
  }
}

export default function AStarSnake() {
  const simRef = useRef<Sim | null>(null)
  if (simRef.current === null) {
    const rng = createSeededRandom('a*-snake')
    simRef.current = { rng, frame: initialFrame(rng) }
  }
  const [frame, setFrame] = useState<Frame>(simRef.current.frame)
  const accumulator = useRef(0)
  const warmed = useRef(false)

  const onTick = useCallback((dtMs: number) => {
    const sim = simRef.current
    if (!sim) return
    accumulator.current += dtMs
    if (accumulator.current < STEP_MS) return
    accumulator.current = 0
    sim.frame = stepSim(sim)
    setFrame(sim.frame)
  }, [])

  const { ref, reduced } = useDemoTicker(onTick)

  // Reduced motion: advance deterministically to a representative mid-solve
  // frame once, then hold it (no animation).
  if (reduced && !warmed.current && simRef.current) {
    warmed.current = true
    const sim = simRef.current
    for (let i = 0; i < 48; i++) sim.frame = stepSim(sim)
    queueMicrotask(() => setFrame(sim.frame))
  }

  const { snake, food, path, open, closed } = frame
  const snakeKeys = new Set(snake.map(([x, y]) => cellKey(x, y)))

  return (
    <figure ref={ref} className="m-0 flex flex-col gap-2">
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${W * CELL} ${H * CELL}`}
        className="w-full rounded-card border border-hairline bg-panel"
      >
        {/* closed set — tertiary (decorative tint) */}
        {closed.map(([x, y]) =>
          snakeKeys.has(cellKey(x, y)) ? null : (
            <rect
              key={`c${cellKey(x, y)}`}
              x={x * CELL + 1}
              y={y * CELL + 1}
              width={CELL - 2}
              height={CELL - 2}
              fill="var(--text-tertiary)"
              opacity={0.18}
            />
          ),
        )}
        {/* open set — electron */}
        {open.map(([x, y]) =>
          snakeKeys.has(cellKey(x, y)) ? null : (
            <rect
              key={`o${cellKey(x, y)}`}
              x={x * CELL + 1}
              y={y * CELL + 1}
              width={CELL - 2}
              height={CELL - 2}
              fill="var(--accent-electron)"
              opacity={0.28}
            />
          ),
        )}
        {/* A* path — signal */}
        {path && path.length > 1 && (
          <polyline
            points={path.map(([x, y]) => `${x * CELL + CELL / 2},${y * CELL + CELL / 2}`).join(' ')}
            fill="none"
            stroke="var(--accent-signal)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.85}
          />
        )}
        {/* snake body */}
        {snake.map(([x, y], i) => (
          <rect
            key={`s${i}`}
            x={x * CELL + 2}
            y={y * CELL + 2}
            width={CELL - 4}
            height={CELL - 4}
            rx={3}
            fill={i === 0 ? 'var(--accent-electron)' : 'var(--text-secondary)'}
            opacity={i === 0 ? 1 : 0.7}
          />
        ))}
        {/* food */}
        <circle
          cx={food[0] * CELL + CELL / 2}
          cy={food[1] * CELL + CELL / 2}
          r={CELL / 3}
          fill="var(--accent-amber)"
        />
      </svg>
      <figcaption className="type-label-xs text-secondary">
        a* agent auto-solving snake — open set in blue, explored cells dimmed, chosen path in
        green, food in amber
      </figcaption>
    </figure>
  )
}
