import { describe, expect, it } from 'vitest'
import {
  COLS,
  ROWS,
  type Board,
  type Cell,
  type Player,
  bestMove,
  canPlay,
  createBoard,
  dropRow,
  findWinLine,
  isDraw,
  legalMoves,
  play,
} from '@/lib/ai/connect4'

/** Build a board from 6 strings of 7 chars ('.', '1', '2'), row 0 = top. */
function board(rows: string[]): Board {
  expect(rows).toHaveLength(ROWS)
  return rows.map((row) =>
    row.split('').map((ch) => (ch === '.' ? 0 : (Number(ch) as Cell))),
  )
}

function playAll(cols: [number, Player][]): Board {
  let b = createBoard()
  for (const [col, player] of cols) b = play(b, col, player)
  return b
}

describe('win detection (4 directions)', () => {
  it('detects a horizontal win', () => {
    const b = board(['.......', '.......', '.......', '.......', '.......', '.1111..'])
    expect(findWinLine(b, 1)).toEqual([
      [5, 1],
      [5, 2],
      [5, 3],
      [5, 4],
    ])
    expect(findWinLine(b, 2)).toBeNull()
  })

  it('detects a vertical win', () => {
    const b = board(['.......', '.......', '..2....', '..2....', '..2....', '..2....'])
    expect(findWinLine(b, 2)).toEqual([
      [2, 2],
      [3, 2],
      [4, 2],
      [5, 2],
    ])
  })

  it('detects a ↘ diagonal win', () => {
    const b = board(['.......', '.......', '.1.....', '..1....', '...1...', '....1..'])
    expect(findWinLine(b, 1)).toEqual([
      [2, 1],
      [3, 2],
      [4, 3],
      [5, 4],
    ])
  })

  it('detects a ↙ diagonal win', () => {
    const b = board(['.......', '.......', '....2..', '...2...', '..2....', '.2.....'])
    expect(findWinLine(b, 2)).toEqual([
      [2, 4],
      [3, 3],
      [4, 2],
      [5, 1],
    ])
  })
})

describe('bestMove', () => {
  it('takes an immediate win', () => {
    // Engine (2) has three in a row on the bottom — must complete at column 4.
    const b = board(['.......', '.......', '.......', '.......', '.11....', '.222...'])
    const result = bestMove(b, 2, 6)
    expect(result.column).toBe(4)
    expect(result.scores[4]).toBeGreaterThan(100_000)
  })

  it('blocks an immediate loss', () => {
    // Human (1) threatens 1-2-3-4 on the bottom row; column 0 is already
    // taken, so column 4 is the single blocking square. Engine has no win.
    const b = board(['.......', '.......', '.......', '.......', '.......', '2111..2'])
    const result = bestMove(b, 2, 6)
    expect(result.column).toBe(4)
  })

  it('reports full columns as illegal with -Infinity scores', () => {
    let b = createBoard()
    for (let i = 0; i < ROWS; i++) b = play(b, 3, (i % 2 === 0 ? 1 : 2) as Player)
    expect(canPlay(b, 3)).toBe(false)
    expect(dropRow(b, 3)).toBeNull()
    expect(legalMoves(b)).not.toContain(3)
    const result = bestMove(b, 2, 4)
    expect(result.column).not.toBe(3)
    expect(result.scores[3]).toBe(-Infinity)
    expect(() => play(b, 3, 2)).toThrow()
  })

  it('returns column -1 and detects a draw on a full board', () => {
    // Alternating fill with column 3 inverted ⇒ no four-in-a-row anywhere.
    const full = board([
      '2221222',
      '1112111',
      '2221222',
      '1112111',
      '2221222',
      '1112111',
    ])
    expect(findWinLine(full, 1)).toBeNull()
    expect(findWinLine(full, 2)).toBeNull()
    expect(isDraw(full)).toBe(true)
    expect(legalMoves(full)).toHaveLength(0)
    const result = bestMove(full, 1, 6)
    expect(result.column).toBe(-1)
  })

  it('prefers the center opening and reports search stats', () => {
    const result = bestMove(createBoard(), 2, 6)
    expect(result.column).toBe(3)
    expect(result.nodes).toBeGreaterThan(0)
    expect(result.ms).toBeGreaterThanOrEqual(0)
    expect(result.scores).toHaveLength(COLS)
  })

  it('play() drops discs bottom-up and never mutates its input', () => {
    const b0 = createBoard()
    const b1 = playAll([
      [0, 1],
      [0, 2],
    ])
    expect(b0[5][0]).toBe(0)
    expect(b1[5][0]).toBe(1)
    expect(b1[4][0]).toBe(2)
  })
})
