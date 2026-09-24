/**
 * ASCII snake (spec §4.8) — 20×12 grid rendered as text into the terminal
 * output. Pure game logic; the Terminal UI drives ticks (via the shared
 * ticker) and key input. Zero deps.
 */

export type SnakeDir = 'up' | 'down' | 'left' | 'right'

export interface Cell {
  x: number
  y: number
}

const OPPOSITE: Record<SnakeDir, SnakeDir> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

const DELTA: Record<SnakeDir, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

export class SnakeGame {
  readonly width: number
  readonly height: number
  score = 0
  alive = true

  private snake: Cell[]
  private dir: SnakeDir = 'right'
  private nextDir: SnakeDir = 'right'
  private food: Cell

  constructor(width = 20, height = 12) {
    this.width = width
    this.height = height
    const midY = Math.floor(height / 2)
    this.snake = [
      { x: 4, y: midY },
      { x: 3, y: midY },
      { x: 2, y: midY },
    ]
    this.food = this.spawnFood()
  }

  /** Live snake cells, head first — read-only view (v2 §11.1 autopilot + tinting). */
  get cells(): readonly Cell[] {
    return this.snake
  }

  /** Current food cell — the autopilot's A* goal (v2 §11.1). */
  get foodCell(): Cell {
    return this.food
  }

  /** Queue a direction change; reversing into yourself is ignored. */
  setDirection(dir: SnakeDir): void {
    if (OPPOSITE[dir] === this.dir) return
    this.nextDir = dir
  }

  /** Advance one tick. No-op once dead. */
  step(): void {
    if (!this.alive) return
    this.dir = this.nextDir
    const head = this.snake[0]
    const d = DELTA[this.dir]
    const nx = head.x + d.x
    const ny = head.y + d.y

    const hitWall = nx < 0 || ny < 0 || nx >= this.width || ny >= this.height
    const hitSelf = this.snake.some((c, i) => i !== this.snake.length - 1 && c.x === nx && c.y === ny)
    if (hitWall || hitSelf) {
      this.alive = false
      return
    }

    this.snake.unshift({ x: nx, y: ny })
    if (nx === this.food.x && ny === this.food.y) {
      this.score += 1
      this.food = this.spawnFood()
    } else {
      this.snake.pop()
    }
  }

  /** Bordered ASCII frame, one string per row joined with newlines. */
  render(): string {
    const rows: string[] = []
    const border = `+${'-'.repeat(this.width)}+`
    rows.push(border)
    for (let y = 0; y < this.height; y++) {
      let row = '|'
      for (let x = 0; x < this.width; x++) {
        const head = this.snake[0]
        if (head.x === x && head.y === y) row += 'O'
        else if (this.snake.some((c) => c.x === x && c.y === y)) row += 'o'
        else if (this.food.x === x && this.food.y === y) row += '*'
        else row += ' '
      }
      rows.push(`${row}|`)
    }
    rows.push(border)
    rows.push(`score: ${this.score} — q to quit`)
    return rows.join('\n')
  }

  private spawnFood(): Cell {
    let cell: Cell
    do {
      cell = {
        x: Math.floor(Math.random() * this.width),
        y: Math.floor(Math.random() * this.height),
      }
    } while (this.snake.some((c) => c.x === cell.x && c.y === cell.y))
    return cell
  }
}

/** Map a KeyboardEvent.key to a snake direction (arrows + wasd), or null. */
export function keyToDir(key: string): SnakeDir | null {
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
