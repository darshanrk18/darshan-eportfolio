/**
 * Connect Four engine (spec §5.4).
 *
 * 7×6 bitboard (BigInt, one bit per cell + one sentinel row per column),
 * negamax + alpha-beta pruning, center-first move ordering. Pure and
 * deterministic — runs identically in the worker, on the main thread
 * (fallback) and in unit tests.
 */

export const COLS = 7
export const ROWS = 6

/** 0 = empty, 1 = human (magenta), 2 = engine (signal). */
export type Cell = 0 | 1 | 2
export type Player = 1 | 2
/** Board as the UI sees it: ROWS rows × COLS cols, row 0 = TOP. */
export type Board = Cell[][]

export interface EngineResult {
  /** Chosen column 0–6, or -1 when no legal move exists. */
  column: number
  /** Per-column negamax score; `-Infinity` marks a full (illegal) column. */
  scores: number[]
  /** Nodes visited during the search. */
  nodes: number
  /** Wall-clock search time in ms. */
  ms: number
}

export interface EngineRequest {
  board: Board
  player: Player
  depth: number
}

/* ----------------------------------------------------------------------------
   Bitboard plumbing. Bit index = col * (ROWS + 1) + row, row 0 = BOTTOM.
   The 7th bit of each column is a sentinel kept empty.
   -------------------------------------------------------------------------- */

const H1 = BigInt(ROWS + 1) // 7n — bits per column
const ONE = 1n

const BOTTOM_MASK: bigint[] = []
const COLUMN_MASK: bigint[] = []
const TOP_CELL_MASK: bigint[] = []
for (let c = 0; c < COLS; c++) {
  const base = BigInt(c) * H1
  BOTTOM_MASK.push(ONE << base)
  TOP_CELL_MASK.push(ONE << (base + BigInt(ROWS - 1)))
  let colMask = 0n
  for (let r = 0; r < ROWS; r++) colMask |= ONE << (base + BigInt(r))
  COLUMN_MASK.push(colMask)
}
const BOARD_MASK = COLUMN_MASK.reduce((a, b) => a | b, 0n)
const CENTER_MASK = COLUMN_MASK[3]

/** Center-first move ordering (§5.4). */
export const MOVE_ORDER = [3, 2, 4, 1, 5, 0, 6] as const

const WIN_SCORE = 1_000_000

function popcount(v: bigint): number {
  let n = 0
  let x = v
  while (x !== 0n) {
    x &= x - 1n
    n++
  }
  return n
}

/** True when `pos` (one player's stones) contains four in a row. */
function hasAlignment(pos: bigint): boolean {
  // vertical (shift 1), horizontal (7), diagonals (6, 8)
  for (const s of [1n, 7n, 6n, 8n]) {
    const m = pos & (pos >> s)
    if ((m & (m >> (2n * s))) !== 0n) return true
  }
  return false
}

/** Cells that would complete a four-in-a-row for `pos` (Pons-style). */
function winningCells(pos: bigint, mask: bigint): bigint {
  // vertical
  let r = (pos << 1n) & (pos << 2n) & (pos << 3n)
  for (const s of [7n, 6n, 8n]) {
    let p = (pos << s) & (pos << (2n * s))
    r |= p & (pos << (3n * s))
    r |= p & (pos >> s)
    p = (pos >> s) & (pos >> (2n * s))
    r |= p & (pos << s)
    r |= p & (pos >> (3n * s))
  }
  return r & (BOARD_MASK ^ mask)
}

function canPlayBits(mask: bigint, col: number): boolean {
  return (mask & TOP_CELL_MASK[col]) === 0n
}

/** mask after dropping in `col`; the new cell is `next ^ mask`. */
function playBits(mask: bigint, col: number): bigint {
  return mask | (mask + BOTTOM_MASK[col])
}

function isWinningDrop(pos: bigint, mask: bigint, col: number): boolean {
  const next = playBits(mask, col)
  return hasAlignment(pos | (next ^ mask))
}

/** Static evaluation from the current player's perspective. */
function evaluate(pos: bigint, mask: bigint): number {
  const opp = mask ^ pos
  const threats = popcount(winningCells(pos, mask)) - popcount(winningCells(opp, mask))
  const center = popcount(pos & CENTER_MASK) - popcount(opp & CENTER_MASK)
  return threats * 8 + center * 3
}

interface Counter {
  nodes: number
}

/**
 * Negamax with alpha-beta. `pos` = stones of the player to move; `mask` = all
 * stones. Returns a score from the mover's perspective; wins score higher the
 * sooner they occur (`WIN_SCORE + depth`).
 */
function negamax(
  pos: bigint,
  mask: bigint,
  depth: number,
  alpha: number,
  beta: number,
  counter: Counter,
): number {
  counter.nodes++
  if (mask === BOARD_MASK) return 0 // draw

  // Immediate win available?
  for (const col of MOVE_ORDER) {
    if (canPlayBits(mask, col) && isWinningDrop(pos, mask, col)) {
      return WIN_SCORE + depth
    }
  }

  if (depth <= 0) return evaluate(pos, mask)

  let a = alpha
  let best = -Infinity
  for (const col of MOVE_ORDER) {
    if (!canPlayBits(mask, col)) continue
    const nextMask = playBits(mask, col)
    const moved = nextMask ^ mask
    const oppPos = nextMask ^ (pos | moved) // opponent's stones after our move
    const score = -negamax(oppPos, nextMask, depth - 1, -beta, -a, counter)
    if (score > best) best = score
    if (best > a) a = best
    if (a >= beta) break
  }
  return best
}

/* ----------------------------------------------------------------------------
   UI-facing helpers (array board, row 0 = top).
   -------------------------------------------------------------------------- */

export function createBoard(): Board {
  return Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(0))
}

export function canPlay(board: Board, col: number): boolean {
  return col >= 0 && col < COLS && board[0][col] === 0
}

/** Row index (UI, 0 = top) where a disc dropped in `col` lands, or null. */
export function dropRow(board: Board, col: number): number | null {
  if (!canPlay(board, col)) return null
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === 0) return r
  }
  return null
}

/** Immutable drop. Throws on a full/invalid column — guard with canPlay. */
export function play(board: Board, col: number, player: Player): Board {
  const row = dropRow(board, col)
  if (row === null) throw new Error(`illegal move: column ${col} is full`)
  const next = board.map((r) => [...r] as Cell[])
  next[row][col] = player
  return next
}

export function legalMoves(board: Board): number[] {
  const moves: number[] = []
  for (const col of MOVE_ORDER) if (canPlay(board, col)) moves.push(col)
  return moves
}

export function isDraw(board: Board): boolean {
  return legalMoves(board).length === 0 && !findWinLine(board, 1) && !findWinLine(board, 2)
}

/**
 * The four [row, col] cells (UI coordinates) of a winning line for `player`,
 * or null. Checks all four directions.
 */
export function findWinLine(board: Board, player: Player): [number, number][] | null {
  const dirs: [number, number][] = [
    [0, 1], // horizontal
    [1, 0], // vertical
    [1, 1], // diagonal ↘
    [1, -1], // diagonal ↙
  ]
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] !== player) continue
      for (const [dr, dc] of dirs) {
        const line: [number, number][] = [[r, c]]
        for (let k = 1; k < 4; k++) {
          const rr = r + dr * k
          const cc = c + dc * k
          if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS || board[rr][cc] !== player) break
          line.push([rr, cc])
        }
        if (line.length === 4) return line
      }
    }
  }
  return null
}

function toBits(board: Board, player: Player): { pos: bigint; mask: bigint } {
  let pos = 0n
  let mask = 0n
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      const cell = board[ROWS - 1 - r][c] // UI row → bit row (0 = bottom)
      if (cell === 0) continue
      const bit = ONE << (BigInt(c) * H1 + BigInt(r))
      mask |= bit
      if (cell === player) pos |= bit
    }
  }
  return { pos, mask }
}

/**
 * Search entry point (§5.4): best column for `player` with per-column scores
 * for the `show thinking` bars. Depth 6 stays well inside the ~50ms budget.
 */
export function bestMove(board: Board, player: Player, depth = 6): EngineResult {
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now()
  const { pos, mask } = toBits(board, player)
  const counter: Counter = { nodes: 0 }
  const scores = new Array<number>(COLS).fill(-Infinity)

  let bestCol = -1
  let bestScore = -Infinity
  for (const col of MOVE_ORDER) {
    if (!canPlayBits(mask, col)) continue
    let score: number
    if (isWinningDrop(pos, mask, col)) {
      score = WIN_SCORE + depth
    } else {
      const nextMask = playBits(mask, col)
      const moved = nextMask ^ mask
      const oppPos = nextMask ^ (pos | moved)
      score = -negamax(oppPos, nextMask, depth - 1, -Infinity, Infinity, counter)
    }
    scores[col] = score
    if (score > bestScore) {
      bestScore = score
      bestCol = col
    }
  }

  const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now()
  return { column: bestCol, scores, nodes: counter.nodes, ms: t1 - t0 }
}
