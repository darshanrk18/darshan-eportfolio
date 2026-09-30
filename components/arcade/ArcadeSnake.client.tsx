'use client'

/**
 * /arcade snake — the terminal snake promoted to a big board with the A*
 * autopilot as its showcase (V2_SPEC §10.5; proves the TRIPLAY_AI claim at
 * legible scale). 28×18 cells, SVG-rendered like the a*-snake project demo.
 *
 * - `autopilot: on|off` mono toggle (44px target). ON by default — the
 *   autopilot IS the showcase, and touch visitors need no keyboard.
 * - Sim logic lives in ./arcadeSnakeSim (pure, unit-tested); the HUD's
 *   `a* replans: N` is a real count of A* invocations, not ticks. Open set
 *   tinted electron, closed set tertiary, chosen path signal.
 * - Manual play: focus the board, arrows/wasd. Death (or a boxed-in
 *   autopilot) respawns — the game loops like the terminal version.
 * - Reduced motion: steps at 4fps (user-invoked page; §10.5), tints are
 *   static per frame. Off-screen: unsubscribed from the shared ticker.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { cellKey, type Point } from '@/lib/ai/astar'
import { subscribeTicker } from '@/lib/motion/ticker'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'
import { createSeededRandom } from '@/lib/utils/seeded'
import {
  H,
  OPPOSITE,
  W,
  createSim,
  keyToDir,
  stepAutopilot,
  stepManual,
  type Frame,
  type Sim,
} from './arcadeSnakeSim'

const CELL = 20
const STEP_MS = 110
const STEP_MS_REDUCED = 250 // 4 steps/s (§10.5)

export default function ArcadeSnake() {
  const reduced = usePrefersReducedMotion()
  const [autopilot, setAutopilot] = useState(true)
  const autopilotRef = useRef(autopilot)
  autopilotRef.current = autopilot

  const simRef = useRef<Sim | null>(null)
  if (simRef.current === null) {
    simRef.current = createSim(createSeededRandom('arcade-snake'))
  }
  const [frame, setFrame] = useState<Frame>(simRef.current.frame)

  // Visibility-gated shared-ticker loop. Deliberately NOT useDemoTicker:
  // §10.5 keeps the (user-invoked) arcade stepping at 4fps under reduced
  // motion instead of freezing.
  const [node, setNode] = useState<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!node) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => setVisible(entries.some((e) => e.isIntersecting)),
      { threshold: 0.05 },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [node])

  const stepMs = reduced ? STEP_MS_REDUCED : STEP_MS
  useEffect(() => {
    if (!visible) return
    let acc = 0
    return subscribeTicker((dtMs) => {
      acc += dtMs
      if (acc < stepMs) return
      acc = 0
      const sim = simRef.current
      if (!sim) return
      sim.frame = autopilotRef.current ? stepAutopilot(sim) : stepManual(sim)
      setFrame(sim.frame)
    })
  }, [visible, stepMs])

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (autopilotRef.current) return
    const dir = keyToDir(e.key)
    if (!dir) return
    e.preventDefault()
    const sim = simRef.current
    if (sim && OPPOSITE[dir] !== sim.dir) sim.nextDir = dir
  }, [])

  const toggleAutopilot = useCallback(() => {
    setAutopilot((on) => {
      const sim = simRef.current
      if (sim) {
        // Entering manual: keep momentum, drop the plan + search tints.
        sim.frame = { ...sim.frame, plan: [], open: [], closed: [] }
        setFrame(sim.frame)
      }
      return !on
    })
  }, [])

  const { snake, food, plan, open, closed, replans } = frame
  const snakeKeys = new Set(snake.map(([x, y]) => cellKey(x, y)))
  const pathPoints: Point[] = autopilot && plan.length > 0 ? [snake[0], ...plan] : []

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={setNode}
        className="arcade-snake-surface"
        tabIndex={0}
        role="application"
        aria-label={
          autopilot
            ? 'Snake board — A* autopilot is driving'
            : 'Snake board — focused; steer with arrow keys or WASD'
        }
        onKeyDown={onKeyDown}
      >
        <svg
          aria-hidden="true"
          viewBox={`0 0 ${W * CELL} ${H * CELL}`}
          className="arcade-snake-board"
        >
          {/* closed set — explored cells, tertiary (decorative tint) */}
          {autopilot &&
            closed.map(([x, y]) =>
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
          {/* open set — frontier, electron */}
          {autopilot &&
            open.map(([x, y]) =>
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
          {/* chosen path — signal */}
          {pathPoints.length > 1 && (
            <polyline
              points={pathPoints
                .map(([x, y]) => `${x * CELL + CELL / 2},${y * CELL + CELL / 2}`)
                .join(' ')}
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
              fill={i === 0 ? 'var(--accent-signal)' : 'var(--text-secondary)'}
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
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="type-label-sm text-secondary" aria-live="off">
          Replans {replans} · Length {snake.length}
          {!autopilot && <span className="text-tertiary"> · Arrow keys or WASD</span>}
          {!autopilot && <span className="arcade-kbd-note text-amber"> · Keyboard needed</span>}
        </p>
        <button
          type="button"
          className="arcade-chip type-label-sm"
          aria-pressed={autopilot}
          onClick={toggleAutopilot}
        >
          Autopilot {autopilot ? 'on' : 'off'}
        </button>
      </div>
    </div>
  )
}
