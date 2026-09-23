'use client'

/**
 * Playable Connect Four vs. the real Minimax engine (spec §4.6 / §5.4).
 * - You are magenta, the engine is signal; engine runs in a Web Worker
 *   (depth 6, alpha-beta) with a synchronous main-thread fallback.
 * - Board is real UI: 7 column buttons (≥44px touch targets) with an
 *   aria-live narration region; win draws a signal line through the four.
 * - `show thinking` renders per-column evaluation bars from the worker scores.
 * - Reduced motion: instant (non-animated) disc placement; fully playable.
 * - Below the board, two mini-tabs: `a*-snake` and `gesture-rps` (lazy).
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { LazyMotion, domAnimation, m } from 'motion/react'
import clsx from 'clsx'
import {
  COLS,
  ROWS,
  type Board,
  type EngineResult,
  type Player,
  bestMove,
  canPlay,
  createBoard,
  findWinLine,
  legalMoves,
  play,
} from '@/lib/ai/connect4'
import { EASE_SWIFT, EASE_OUT_EXPO } from '@/lib/motion/tokens'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'
import { trackMinimaxGame } from '@/lib/utils/analytics'

const AStarSnake = dynamic(() => import('./AStarSnake'), { ssr: false })
const RpsLandmarks = dynamic(() => import('./RpsLandmarks'), { ssr: false })

const DEPTH = 6
const HUMAN: Player = 1
const ENGINE: Player = 2
const MIN_THINK_MS = 280

type Status = 'human' | 'engine' | 'won' | 'lost' | 'draw'
type MiniTab = 'snake' | 'rps' | null

export default function ConnectFour() {
  const reduced = usePrefersReducedMotion()

  const [board, setBoard] = useState<Board>(createBoard)
  const [status, setStatus] = useState<Status>('human')
  const [winLine, setWinLine] = useState<[number, number][] | null>(null)
  const [narration, setNarration] = useState('New game. You are magenta — drop a disc to start.')
  const [scores, setScores] = useState<number[] | null>(null)
  const [showThinking, setShowThinking] = useState(false)
  const [lastDrop, setLastDrop] = useState<{ row: number; col: number } | null>(null)
  const [miniTab, setMiniTab] = useState<MiniTab>(null)

  const boardRef = useRef(board)
  boardRef.current = board
  const statusRef = useRef(status)
  statusRef.current = status
  const movesRef = useRef(0)
  const workerRef = useRef<Worker | null>(null)
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestedAt = useRef(0)

  const applyEngineResult = useCallback((result: EngineResult) => {
    if (statusRef.current !== 'engine') return
    const current = boardRef.current
    if (result.column < 0 || !canPlay(current, result.column)) {
      setStatus('draw')
      setNarration('Draw — no legal moves left.')
      return
    }
    setScores(result.scores)
    const col = result.column
    const next = play(current, col, ENGINE)
    let row = -1
    for (let r = 0; r < ROWS; r++) if (next[r][col] === ENGINE) row = r
    setBoard(next)
    setLastDrop({ row, col })

    const line = findWinLine(next, ENGINE)
    if (line) {
      setWinLine(line)
      setStatus('lost')
      setNarration(`Engine played column ${col + 1} and wins — four in a row.`)
      trackMinimaxGame('lost')
      return
    }
    if (legalMoves(next).length === 0) {
      setStatus('draw')
      setNarration(`Engine played column ${col + 1}. Draw — the board is full.`)
      return
    }
    setStatus('human')
    setNarration((prev) => {
      const yours = prev.startsWith('You played') ? prev.split('.')[0] + '. ' : ''
      return `${yours}Engine played column ${col + 1}. Your turn.`
    })
  }, [])

  const applyRef = useRef(applyEngineResult)
  applyRef.current = applyEngineResult

  // Worker lifecycle — created with the demo, torn down on unmount.
  useEffect(() => {
    let worker: Worker | null = null
    try {
      worker = new Worker(new URL('../../../lib/ai/workers/minimax.worker.ts', import.meta.url))
      worker.onmessage = (event: MessageEvent<EngineResult>) => {
        const wait = Math.max(0, MIN_THINK_MS - (performance.now() - requestedAt.current))
        pendingTimer.current = setTimeout(() => applyRef.current(event.data), wait)
      }
      worker.onerror = () => {
        worker?.terminate()
        workerRef.current = null
      }
      workerRef.current = worker
    } catch {
      workerRef.current = null
    }
    return () => {
      worker?.terminate()
      workerRef.current = null
      if (pendingTimer.current) clearTimeout(pendingTimer.current)
    }
  }, [])

  const requestEngineMove = useCallback((nextBoard: Board) => {
    requestedAt.current = performance.now()
    const worker = workerRef.current
    if (worker) {
      worker.postMessage({ board: nextBoard, player: ENGINE, depth: DEPTH })
    } else {
      // Main-thread fallback (no Worker support): still fast at depth 6.
      pendingTimer.current = setTimeout(
        () => applyRef.current(bestMove(nextBoard, ENGINE, DEPTH)),
        MIN_THINK_MS,
      )
    }
  }, [])

  const handleColumn = useCallback(
    (col: number) => {
      if (statusRef.current !== 'human') return
      const current = boardRef.current
      if (!canPlay(current, col)) return
      if (movesRef.current === 0) trackMinimaxGame('started')
      movesRef.current += 1

      const next = play(current, col, HUMAN)
      let row = -1
      for (let r = 0; r < ROWS; r++) if (next[r][col] === HUMAN) row = r
      setBoard(next)
      setLastDrop({ row, col })

      const line = findWinLine(next, HUMAN)
      if (line) {
        setWinLine(line)
        setStatus('won')
        setNarration(`You played column ${col + 1} and win — four in a row. ✓`)
        trackMinimaxGame('won')
        return
      }
      if (legalMoves(next).length === 0) {
        setStatus('draw')
        setNarration(`You played column ${col + 1}. Draw — the board is full.`)
        return
      }
      setStatus('engine')
      setNarration(`You played column ${col + 1}. Engine is thinking…`)
      requestEngineMove(next)
    },
    [requestEngineMove],
  )

  const reset = useCallback(() => {
    if (pendingTimer.current) clearTimeout(pendingTimer.current)
    movesRef.current = 0
    setBoard(createBoard())
    setStatus('human')
    setWinLine(null)
    setScores(null)
    setLastDrop(null)
    setNarration('New game. You are magenta — drop a disc to start.')
  }, [])

  // Normalized thinking-bar heights.
  const finiteScores = scores?.filter((s) => Number.isFinite(s)) ?? []
  const minScore = finiteScores.length ? Math.min(...finiteScores) : 0
  const maxScore = finiteScores.length ? Math.max(...finiteScores) : 1
  const bestCol =
    scores && finiteScores.length ? scores.indexOf(Math.max(...finiteScores)) : -1

  const gameOver = status === 'won' || status === 'lost' || status === 'draw'

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="flex flex-col items-center gap-4">
        <div className="flex w-full max-w-[430px] items-center justify-between gap-3">
          <p className="type-label-sm text-secondary">
            <span className="text-magenta">you</span>
            <span aria-hidden="true"> ● </span>vs<span aria-hidden="true"> ● </span>
            <span className="text-signal">engine</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-pressed={showThinking}
              onClick={() => setShowThinking((v) => !v)}
              className={clsx(
                'type-label-sm rounded-btn border px-3 py-2 transition-colors',
                showThinking
                  ? 'border-hairline-strong text-primary'
                  : 'border-hairline text-secondary hover:border-hairline-strong',
              )}
            >
              show thinking
            </button>
            <button
              type="button"
              onClick={reset}
              className="type-label-sm rounded-btn border border-hairline px-3 py-2 text-secondary transition-colors hover:border-hairline-strong hover:text-primary"
            >
              new game
            </button>
          </div>
        </div>

        {/* Board: 7 column buttons, each a ≥44px touch target. */}
        <div className="relative w-full max-w-[430px]">
          <div
            role="group"
            aria-label="Connect Four board — 7 columns, drop a disc by pressing a column"
            className="grid grid-cols-7 gap-1 rounded-card border border-hairline bg-panel p-2"
          >
            {Array.from({ length: COLS }, (_, col) => {
              const columnFull = !canPlay(board, col)
              const disabled = status !== 'human' || columnFull
              return (
                <button
                  key={col}
                  type="button"
                  disabled={disabled}
                  aria-label={`Drop disc in column ${col + 1}${columnFull ? ' (full)' : ''}`}
                  onClick={() => handleColumn(col)}
                  className={clsx(
                    'flex min-h-11 min-w-11 flex-col gap-1 rounded-btn p-0.5 transition-colors',
                    !disabled && 'hover:bg-raised focus-visible:bg-raised',
                    disabled && !gameOver && 'cursor-default',
                  )}
                >
                  {Array.from({ length: ROWS }, (_, row) => {
                    const cell = board[row][col]
                    const isLast = lastDrop !== null && lastDrop.row === row && lastDrop.col === col
                    const onWinLine = winLine?.some(([r, c]) => r === row && c === col) ?? false
                    return (
                      <span key={row} className="relative block aspect-square w-full">
                        <span
                          aria-hidden="true"
                          className="absolute inset-0 rounded-full border border-hairline bg-page"
                        />
                        {cell !== 0 && (
                          <m.span
                            aria-hidden="true"
                            initial={reduced || !isLast ? false : { y: `${-(row + 1) * 110}%` }}
                            animate={{ y: '0%' }}
                            transition={{ duration: 0.09 * (row + 1) + 0.12, ease: EASE_SWIFT }}
                            className={clsx(
                              'absolute inset-0 rounded-full',
                              cell === HUMAN ? 'bg-magenta' : 'bg-signal',
                              onWinLine && 'glow-signal',
                            )}
                          />
                        )}
                      </span>
                    )
                  })}
                </button>
              )
            })}
          </div>

          {/* Signal line through the winning four. */}
          {winLine && (
            <svg
              aria-hidden="true"
              viewBox={`0 0 ${COLS * 100} ${ROWS * 100}`}
              className="pointer-events-none absolute inset-2"
              preserveAspectRatio="none"
            >
              <m.line
                x1={winLine[0][1] * 100 + 50}
                y1={winLine[0][0] * 100 + 50}
                x2={winLine[3][1] * 100 + 50}
                y2={winLine[3][0] * 100 + 50}
                stroke="var(--accent-signal)"
                strokeWidth={14}
                strokeLinecap="round"
                initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
              />
            </svg>
          )}
        </div>

        {/* show-thinking eval bars (decorative; state is narrated below). */}
        {showThinking && (
          <div
            aria-hidden="true"
            className="grid w-full max-w-[430px] grid-cols-7 items-end gap-1 px-2"
          >
            {Array.from({ length: COLS }, (_, col) => {
              const s = scores?.[col]
              const usable = typeof s === 'number' && Number.isFinite(s)
              const t =
                usable && maxScore !== minScore ? (s - minScore) / (maxScore - minScore) : usable ? 0.5 : 0
              return (
                <div key={col} className="flex flex-col items-center gap-1">
                  <div
                    className={clsx(
                      'w-full rounded-btn transition-all',
                      col === bestCol ? 'bg-signal' : 'bg-electron-dim',
                    )}
                    style={{ height: `${4 + Math.round(t * 28)}px` }}
                  />
                  <span className="type-label-xs text-secondary">{col + 1}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Narration — the accessible game state. */}
        <p aria-live="polite" role="status" className="type-code min-h-5 text-center text-secondary">
          {narration}
        </p>

        <p className="type-label-xs text-center text-secondary">
          minimax · depth 6 · alpha–beta · runs in a web worker
        </p>

        {/* Mini-tabs: a*-snake / gesture-rps (spec §4.6, lazy). */}
        <div className="w-full max-w-[430px] border-t border-hairline pt-3">
          <div className="flex gap-2">
            {(
              [
                ['snake', 'a*-snake'],
                ['rps', 'gesture-rps'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={miniTab === id}
                onClick={() => setMiniTab((t) => (t === id ? null : id))}
                className={clsx(
                  'type-label-sm min-h-11 rounded-btn border px-3 transition-colors',
                  miniTab === id
                    ? 'border-hairline-strong bg-raised text-primary'
                    : 'border-hairline text-secondary hover:border-hairline-strong',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {miniTab === 'snake' && (
            <div className="pt-3">
              <AStarSnake />
            </div>
          )}
          {miniTab === 'rps' && (
            <div className="pt-3">
              <RpsLandmarks />
            </div>
          )}
        </div>
      </div>
    </LazyMotion>
  )
}
