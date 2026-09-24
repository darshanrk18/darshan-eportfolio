/**
 * /arcade snake — pure simulation (V2_SPEC §10.5). No DOM, no React: the
 * ArcadeSnake.client island drives ticks; tests/arcade-snake.test.ts drives
 * it headlessly. The A* autopilot replans ONLY when its cached path is
 * eaten, exhausted, or blocked — `replans` is a real count of A* runs.
 */

import { astar, cellKey, type Point } from '@/lib/ai/astar'

export const W = 28
export const H = 18

export type Dir = 'up' | 'down' | 'left' | 'right'

const DELTA: Record<Dir, Point> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
}

export const OPPOSITE: Record<Dir, Dir> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

/** Map a KeyboardEvent.key to a direction (arrows + wasd), or null. */
export function keyToDir(key: string): Dir | null {
  switch (key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      return 'up'
    case 'ArrowDown':
    case 's':
    case 'S':
      return 'down'
    case 'ArrowLeft':
    case 'a':
    case 'A':
      return 'left'
    case 'ArrowRight':
    case 'd':
    case 'D':
      return 'right'
    default:
      return null
  }
}

export interface Frame {
  snake: Point[]
  food: Point
  /** Remaining planned cells (head excluded) — autopilot only. */
  plan: Point[]
  open: Point[]
  closed: Point[]
  replans: number
}

export interface Sim {
  frame: Frame
  dir: Dir
  nextDir: Dir
  rng: () => number
}

function placeFood(rng: () => number, snake: Point[]): Point {
  const occupied = new Set(snake.map(([x, y]) => cellKey(x, y)))
  for (let attempts = 0; attempts < 800; attempts++) {
    const x = Math.floor(rng() * W)
    const y = Math.floor(rng() * H)
    if (!occupied.has(cellKey(x, y))) return [x, y]
  }
  return [0, 0]
}

export function createSim(rng: () => number): Sim {
  const sim = { rng, dir: 'right', nextDir: 'right' } as Sim
  sim.frame = respawn(sim)
  return sim
}

export function respawn(sim: Sim): Frame {
  const midY = Math.floor(H / 2)
  const snake: Point[] = [
    [4, midY],
    [3, midY],
    [2, midY],
  ]
  sim.dir = 'right'
  sim.nextDir = 'right'
  return {
    snake,
    food: placeFood(sim.rng, snake),
    plan: [],
    open: [],
    closed: [],
    replans: sim.frame?.replans ?? 0,
  }
}

/** Body cells that block a move this tick (the tail cell vacates, so it's open). */
function blockedSet(snake: Point[]): Set<number> {
  return new Set(snake.slice(0, -1).map(([x, y]) => cellKey(x, y)))
}

function advance(sim: Sim, next: Point): Frame {
  const { snake, food } = sim.frame
  const ate = next[0] === food[0] && next[1] === food[1]
  const nextSnake: Point[] = [next, ...snake]
  if (!ate) nextSnake.pop()
  return {
    ...sim.frame,
    snake: nextSnake,
    food: ate ? placeFood(sim.rng, nextSnake) : food,
    // A stale plan dies with the food it targeted.
    plan: ate ? [] : sim.frame.plan,
  }
}

export function stepAutopilot(sim: Sim): Frame {
  const { snake, food } = sim.frame
  const [head] = snake
  const blocked = blockedSet(snake)

  let { plan, open, closed, replans } = sim.frame
  const planNext = plan[0]
  const planInvalid =
    planNext === undefined || blocked.has(cellKey(planNext[0], planNext[1]))

  if (planInvalid) {
    const result = astar({
      width: W,
      height: H,
      start: head,
      goal: food,
      blocked: (x, y) => blocked.has(cellKey(x, y)),
    })
    replans += 1
    if (!result.path || result.path.length < 2) {
      // Boxed in — loop the demo (the terminal version respawns too).
      const fresh = respawn(sim)
      return { ...fresh, replans }
    }
    plan = result.path.slice(1)
    open = result.open
    closed = result.closed
  }

  const [next, ...rest] = plan
  sim.frame = { ...sim.frame, plan: rest, open, closed, replans }
  return advance(sim, next)
}

export function stepManual(sim: Sim): Frame {
  sim.dir = sim.nextDir
  const { snake } = sim.frame
  const [head] = snake
  const [dx, dy] = DELTA[sim.dir]
  const next: Point = [head[0] + dx, head[1] + dy]
  const hitWall = next[0] < 0 || next[1] < 0 || next[0] >= W || next[1] >= H
  const hitSelf = blockedSet(snake).has(cellKey(next[0], next[1]))
  if (hitWall || hitSelf) return respawn(sim)
  return advance(sim, next)
}
