/**
 * A* grid pathfinding (spec §4.6 — a*-snake demo; pure + unit-tested).
 * 4-neighbor grid, Manhattan heuristic, deterministic tie-breaking.
 * Returns the path plus the visited (closed) and frontier (open) sets so the
 * demo can tint them (closed = tertiary, open = electron, path = signal).
 */

export type Point = [number, number] // [x, y]

export interface AStarOptions {
  width: number
  height: number
  start: Point
  goal: Point
  /** True when the cell is impassable. */
  blocked?: (x: number, y: number) => boolean
}

export interface AStarResult {
  /** Cells from start to goal inclusive, or null when unreachable. */
  path: Point[] | null
  /** Closed set, in expansion order (includes start). */
  closed: Point[]
  /** Cells still on the open list when the search ended. */
  open: Point[]
}

export function cellKey(x: number, y: number): number {
  return y * 4096 + x
}

function manhattan(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by)
}

const DIRS: Point[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]

export function astar(options: AStarOptions): AStarResult {
  const { width, height, start, goal, blocked } = options
  const isBlocked = blocked ?? (() => false)

  const [sx, sy] = start
  const [gx, gy] = goal

  const closed: Point[] = []
  const closedSet = new Set<number>()
  const cameFrom = new Map<number, number>()
  const gScore = new Map<number, number>()

  // Simple sorted-insert open list — grids here are tiny (≤ 20×12).
  interface OpenNode {
    x: number
    y: number
    g: number
    f: number
    order: number
  }
  const open: OpenNode[] = []
  const openSet = new Map<number, OpenNode>()
  let pushOrder = 0

  const push = (x: number, y: number, g: number) => {
    const node: OpenNode = { x, y, g, f: g + manhattan(x, y, gx, gy), order: pushOrder++ }
    open.push(node)
    openSet.set(cellKey(x, y), node)
    gScore.set(cellKey(x, y), g)
  }

  const popBest = (): OpenNode | undefined => {
    if (open.length === 0) return undefined
    let bestIdx = 0
    for (let i = 1; i < open.length; i++) {
      const a = open[i]
      const b = open[bestIdx]
      // Lower f wins; ties → higher g (closer to goal), then FIFO for determinism.
      if (a.f < b.f || (a.f === b.f && (a.g > b.g || (a.g === b.g && a.order < b.order)))) {
        bestIdx = i
      }
    }
    const [node] = open.splice(bestIdx, 1)
    openSet.delete(cellKey(node.x, node.y))
    return node
  }

  push(sx, sy, 0)

  while (open.length > 0) {
    const current = popBest()
    if (!current) break
    const ckey = cellKey(current.x, current.y)
    if (closedSet.has(ckey)) continue
    closedSet.add(ckey)
    closed.push([current.x, current.y])

    if (current.x === gx && current.y === gy) {
      // Reconstruct.
      const path: Point[] = []
      let key: number | undefined = ckey
      let px = current.x
      let py = current.y
      for (;;) {
        path.push([px, py])
        key = cameFrom.get(cellKey(px, py))
        if (key === undefined) break
        px = key % 4096
        py = Math.floor(key / 4096)
      }
      path.reverse()
      return { path, closed, open: [...openSet.values()].map((n) => [n.x, n.y]) }
    }

    for (const [dx, dy] of DIRS) {
      const nx = current.x + dx
      const ny = current.y + dy
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
      if (isBlocked(nx, ny)) continue
      const nkey = cellKey(nx, ny)
      if (closedSet.has(nkey)) continue
      const tentativeG = current.g + 1
      const knownG = gScore.get(nkey)
      if (knownG !== undefined && knownG <= tentativeG) continue
      cameFrom.set(nkey, ckey)
      push(nx, ny, tentativeG)
    }
  }

  return { path: null, closed, open: [...openSet.values()].map((n) => [n.x, n.y]) }
}
