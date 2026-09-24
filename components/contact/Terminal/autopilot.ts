/**
 * v2 §11.1 `snake --autopilot` — the A* agent that drives the terminal snake.
 * Pure logic (unit-testable, zero DOM): planning wraps lib/ai/astar (already
 * unit-tested), caching the path and replanning only when it goes stale, so
 * the HUD's `a* replans: N` is an honest count of real searches. renderFrame
 * turns the game + the last search into tinted segments the Terminal renders
 * as background spans (open = electron, closed = tertiary, path = signal).
 * Ships only inside the lazy Snake chunk, loaded on `snake --autopilot`.
 */

import { astar, cellKey, type Point } from '@/lib/ai/astar'
import type { Cell, SnakeDir, SnakeGame } from './Snake'

/** Search-visualization tint for one run of characters; plain when absent. */
export type SegTone = 'open' | 'closed' | 'path'

export interface TintedSeg {
  text: string
  tone?: SegTone
}

export interface AutopilotFrame {
  /** Bordered board, one segment run list per row. */
  rows: readonly (readonly TintedSeg[])[]
  /** `a* replans: N · length: L · q quits` (tabular, real numbers). */
  hud: string
}

const DIRS: readonly Point[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]

function dirBetween(from: Cell, to: Point): SnakeDir | null {
  const dx = to[0] - from.x
  const dy = to[1] - from.y
  if (dx === 1 && dy === 0) return 'right'
  if (dx === -1 && dy === 0) return 'left'
  if (dx === 0 && dy === 1) return 'down'
  if (dx === 0 && dy === -1) return 'up'
  return null
}

export class SnakeAutopilot {
  /** Number of A* searches actually run — the HUD's N. */
  replans = 0

  private path: Point[] | null = null
  private idx = 0
  private open: Point[] = []
  private closed: Point[] = []
  private goal: Point | null = null

  /** Forget the cached plan (call on respawn). Keeps the replan count. */
  reset(): void {
    this.path = null
    this.idx = 0
    this.open = []
    this.closed = []
    this.goal = null
  }

  /** Open set from the most recent search (frontier — electron tint). */
  get searchOpen(): readonly Point[] {
    return this.open
  }

  /** Closed set from the most recent search (visited — tertiary tint). */
  get searchClosed(): readonly Point[] {
    return this.closed
  }

  /** The path currently being followed (signal tint), or null. */
  get plannedPath(): readonly Point[] | null {
    return this.path
  }

  /**
   * Direction for this tick. Replans with A* only when the cached path is
   * stale: no plan, food moved, path exhausted or desynced, or the next
   * cell is now inside the snake. Falls back to any safe neighbor when the
   * food is unreachable (survive until the board opens up).
   */
  next(game: SnakeGame): SnakeDir | null {
    const head = game.cells[0]
    const food = game.foodCell
    const body = new Set(game.cells.map((c) => cellKey(c.x, c.y)))

    if (this.isStale(head, food, body)) this.replan(game, body)

    if (this.path && this.idx + 1 < this.path.length) {
      this.idx += 1
      return dirBetween(head, this.path[this.idx])
    }

    for (const [dx, dy] of DIRS) {
      const nx = head.x + dx
      const ny = head.y + dy
      if (nx < 0 || ny < 0 || nx >= game.width || ny >= game.height) continue
      if (body.has(cellKey(nx, ny))) continue
      return dirBetween(head, [nx, ny])
    }
    return null
  }

  private isStale(head: Cell, food: Cell, body: ReadonlySet<number>): boolean {
    if (!this.path || !this.goal) return true
    if (this.goal[0] !== food.x || this.goal[1] !== food.y) return true
    if (this.idx + 1 >= this.path.length) return true
    const at = this.path[this.idx]
    if (at[0] !== head.x || at[1] !== head.y) return true
    const nextCell = this.path[this.idx + 1]
    return body.has(cellKey(nextCell[0], nextCell[1]))
  }

  private replan(game: SnakeGame, body: ReadonlySet<number>): void {
    const head = game.cells[0]
    const food = game.foodCell
    const headKey = cellKey(head.x, head.y)
    const result = astar({
      width: game.width,
      height: game.height,
      start: [head.x, head.y],
      goal: [food.x, food.y],
      blocked: (x, y) => {
        const k = cellKey(x, y)
        return k !== headKey && body.has(k)
      },
    })
    this.replans += 1
    this.path = result.path
    this.idx = 0
    this.open = result.open
    this.closed = result.closed
    this.goal = [food.x, food.y]
  }
}

/**
 * Bordered board frame with search tints. Precedence per cell:
 * snake > food > path > open > closed > empty. Adjacent same-tone characters
 * are merged into one segment so the Terminal renders few spans.
 */
export function renderFrame(game: SnakeGame, pilot: SnakeAutopilot): AutopilotFrame {
  const openSet = new Set(pilot.searchOpen.map(([x, y]) => cellKey(x, y)))
  const closedSet = new Set(pilot.searchClosed.map(([x, y]) => cellKey(x, y)))
  const pathSet = new Set((pilot.plannedPath ?? []).map(([x, y]) => cellKey(x, y)))
  const bodySet = new Set(game.cells.map((c) => cellKey(c.x, c.y)))
  const head = game.cells[0]
  const food = game.foodCell

  const border = `+${'-'.repeat(game.width)}+`
  const rows: TintedSeg[][] = [[{ text: border }]]

  for (let y = 0; y < game.height; y++) {
    const segs: TintedSeg[] = []
    let runText = '|'
    let runTone: SegTone | undefined
    const push = (ch: string, tone?: SegTone) => {
      if (tone === runTone) {
        runText += ch
        return
      }
      if (runText !== '') segs.push(runTone ? { text: runText, tone: runTone } : { text: runText })
      runText = ch
      runTone = tone
    }
    for (let x = 0; x < game.width; x++) {
      const k = cellKey(x, y)
      if (head.x === x && head.y === y) push('O')
      else if (bodySet.has(k)) push('o')
      else if (food.x === x && food.y === y) push('*')
      else if (pathSet.has(k)) push('·', 'path')
      else if (openSet.has(k)) push(' ', 'open')
      else if (closedSet.has(k)) push(' ', 'closed')
      else push(' ')
    }
    push('|')
    if (runText !== '') segs.push(runTone ? { text: runText, tone: runTone } : { text: runText })
    rows.push(segs)
  }

  rows.push([{ text: border }])
  return {
    rows,
    hud: `a* replans: ${pilot.replans} · length: ${game.cells.length} · q quits`,
  }
}
