'use client'

/**
 * Playable Connect Four vs. the real Minimax engine (spec §4.6 / §5.4;
 * v3 S4 / P4 "the game window"). One DOM, two skins (styles/v3/work.css):
 * SCREEN draws flat matte discs — ivory (you) and warm steel (the engine) —
 * on machined-black wells, PRINT prints yellow / red ink discs on the blue
 * comic board. The disc colours are the `--ed-disc-you` / `--ed-disc-engine`
 * tokens; the colour WORDS in the copy follow the edition (c4Copy.ts).
 * - The engine runs in a Web Worker (synchronous main-thread fallback).
 * - Board = 7 column buttons (≥ 44 px targets) + number keys 1–7 while the
 *   board has focus; ONE aria-live narration line carries the game state.
 * - "Show thinking" (a real switch) lights per-column beams (SCREEN) /
 *   ink-hatched bars (PRINT) from the engine's column scores — no depth, no
 *   node counts, no search jargon anywhere (clutter law).
 * - The coach mark ("You're ivory. …") dismisses itself after the first
 *   drop; the first drop also completes the guide's `play-c4` item.
 * - `game` routes the window's tabs: 'snake' → AStarSnake, 'rps' → the
 *   hand-tracking replay with its plain-English camera line. `resetKey`
 *   lets the window's "New game" button reset the board.
 * - Reduced motion: instant (non-animated) disc placement; fully playable.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
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
import { workCopy, type ProjectGameId } from '@/lib/data/projects'
import { EASE_SWIFT, EASE_OUT_EXPO } from '@/lib/motion/tokens'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'
import { trackMinimaxGame } from '@/lib/utils/analytics'
import { useEdition } from '../useEdition'
import { coachLine, engineBubble, newGameLine, statusLabel, type C4Status } from './c4Copy'
import { islandUnavailable } from '@/lib/utils/island'

import '@/styles/v3/work.css'

const AStarSnake = dynamic(() => import('./AStarSnake').catch(islandUnavailable<typeof import('./AStarSnake')>), { ssr: false })
const RpsLandmarks = dynamic(() => import('./RpsLandmarks').catch(islandUnavailable<typeof import('./RpsLandmarks')>), { ssr: false })

const DEPTH = 6
const HUMAN: Player = 1
const ENGINE: Player = 2
const MIN_THINK_MS = 280

/** v3 §2.6 — the guide island listens for this on window (no import needed). */
export const GUIDE_TRIED_EVENT = 'signal:guide-tried'

function guideTried(id: string): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(GUIDE_TRIED_EVENT, { detail: { id } }))
}

export interface ConnectFourProps {
  /** Which TRIPLAY_AI demo the window's tab asked for. Default: the board. */
  game?: ProjectGameId
  /** Bump to start a new game (the window's "New game" button). */
  resetKey?: number
}

export default function ConnectFour({ game = 'connect-four', resetKey = 0 }: ConnectFourProps) {
  if (game === 'snake') {
    return (
      <div className="c4-alt">
        <AStarSnake />
      </div>
    )
  }
  if (game === 'rps') {
    return (
      <div className="c4-alt">
        <RpsLandmarks />
        <p className="c4-note">{workCopy.rps.permission}</p>
      </div>
    )
  }
  return <BoardGame resetKey={resetKey} />
}

/** Landing row for a column (lowest empty cell), or -1 when full. */
function landingRow(board: Board, col: number): number {
  for (let r = ROWS - 1; r >= 0; r--) if (board[r][col] === 0) return r
  return -1
}

interface LineGeom {
  x1: number
  y1: number
  x2: number
  y2: number
  w: number
  h: number
}

/**
 * The line through the winning four, measured from the rendered cells so it
 * lands on the discs in either edition (the two skins use different cell
 * pitches). Re-measured on resize.
 */
function WinLine({ wrap, reduced }: { wrap: HTMLDivElement | null; reduced: boolean }) {
  const [geom, setGeom] = useState<LineGeom | null>(null)
  useLayoutEffect(() => {
    if (!wrap) return
    const measure = () => {
      const cells = wrap.querySelectorAll<HTMLElement>('.c4-cell[data-win]')
      if (cells.length < 2) return
      const box = wrap.getBoundingClientRect()
      const centre = (el: HTMLElement) => {
        const r = el.getBoundingClientRect()
        return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 }
      }
      const a = centre(cells[0])
      const b = centre(cells[cells.length - 1])
      setGeom({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, w: box.width, h: box.height })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [wrap])
  if (!geom) return null
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${geom.w} ${geom.h}`} className="c4-winline">
      <m.line
        x1={geom.x1}
        y1={geom.y1}
        x2={geom.x2}
        y2={geom.y2}
        strokeWidth={7}
        strokeLinecap="round"
        initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
      />
    </svg>
  )
}

function BoardGame({ resetKey }: { resetKey: number }) {
  const reduced = usePrefersReducedMotion()
  const edition = useEdition()

  const [board, setBoard] = useState<Board>(createBoard)
  const [status, setStatus] = useState<C4Status>('human')
  const [winLine, setWinLine] = useState<[number, number][] | null>(null)
  const [narration, setNarration] = useState(() => newGameLine('screen'))
  const [scores, setScores] = useState<number[] | null>(null)
  const [showThinking, setShowThinking] = useState(true)
  const [lastDrop, setLastDrop] = useState<{ row: number; col: number; by: Player } | null>(null)
  const [hoverCol, setHoverCol] = useState<number | null>(null)
  const [coachOpen, setCoachOpen] = useState(true)
  const [bubble, setBubble] = useState<{ head: string; beat: string } | null>(null)
  const [sfxKey, setSfxKey] = useState(0)

  const [wrapEl, setWrapEl] = useState<HTMLDivElement | null>(null)
  const boardRef = useRef(board)
  boardRef.current = board
  const statusRef = useRef(status)
  statusRef.current = status
  const editionRef = useRef(edition)
  editionRef.current = edition
  const movesRef = useRef(0)
  const workerRef = useRef<Worker | null>(null)
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestedAt = useRef(0)

  // The fresh-board line names the visitor's disc colour in the edition's word.
  useEffect(() => {
    if (movesRef.current === 0 && statusRef.current === 'human') setNarration(newGameLine(edition))
  }, [edition])

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
    // Did the engine take a cell that would have completed the visitor's four?
    const blocked = findWinLine(play(current, col, HUMAN), HUMAN) !== null
    const next = play(current, col, ENGINE)
    let row = -1
    for (let r = 0; r < ROWS; r++) if (next[r][col] === ENGINE) row = r
    setBoard(next)
    setLastDrop({ row, col, by: ENGINE })
    setSfxKey((k) => k + 1)

    const line = findWinLine(next, ENGINE)
    if (line) {
      setWinLine(line)
      setStatus('lost')
      setBubble(engineBubble(col, 'won'))
      setNarration(`Engine played column ${col + 1} and wins — four in a row.`)
      trackMinimaxGame('lost')
      return
    }
    if (legalMoves(next).length === 0) {
      setStatus('draw')
      setBubble(engineBubble(col, 'draw'))
      setNarration(`Engine played column ${col + 1}. Draw — the board is full.`)
      return
    }
    setStatus('human')
    setBubble(engineBubble(col, blocked ? 'blocked' : 'played'))
    setNarration((prev) => {
      const yours = prev.startsWith('You played') ? prev.split('.')[0] + '. ' : ''
      return `${yours}Engine played column ${col + 1}. Your turn.`
    })
  }, [])

  const applyRef = useRef(applyEngineResult)
  applyRef.current = applyEngineResult

  // Worker lifecycle — created with the demo, torn down on unmount. The URL
  // is relative to THIS file: keep ConnectFour.tsx where it is.
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
      // Main-thread fallback (no Worker support): still fast at this depth.
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
      setLastDrop({ row, col, by: HUMAN })
      setCoachOpen(false)
      setBubble(null)
      guideTried('play-c4')

      const line = findWinLine(next, HUMAN)
      if (line) {
        setWinLine(line)
        setStatus('won')
        setNarration(`You played column ${col + 1} and win — four in a row.`)
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
    setBubble(null)
    setNarration(newGameLine(editionRef.current))
  }, [])

  // The window's "New game" button bumps resetKey.
  const firstReset = useRef(true)
  useEffect(() => {
    if (firstReset.current) {
      firstReset.current = false
      return
    }
    reset()
  }, [resetKey, reset])

  // Number keys 1–7 drop a disc while the board (or its keys) has focus.
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key < '1' || e.key > '7' || e.altKey || e.ctrlKey || e.metaKey) return
      e.preventDefault()
      handleColumn(Number(e.key) - 1)
    },
    [handleColumn],
  )

  // Normalized thinking heights (0–1) from the engine's column scores.
  const finiteScores = scores?.filter((s) => Number.isFinite(s)) ?? []
  const minScore = finiteScores.length ? Math.min(...finiteScores) : 0
  const maxScore = finiteScores.length ? Math.max(...finiteScores) : 1
  const bestCol =
    scores && finiteScores.length ? scores.indexOf(Math.max(...finiteScores)) : -1
  const evalOf = (col: number): number => {
    const s = scores?.[col]
    const usable = typeof s === 'number' && Number.isFinite(s)
    if (!usable) return 0
    return maxScore !== minScore ? (s - minScore) / (maxScore - minScore) : 0.5
  }

  const gameOver = status === 'won' || status === 'lost' || status === 'draw'
  const ghostRow = status === 'human' && hoverCol !== null ? landingRow(board, hoverCol) : -1
  const discsPlayed = board.flat().filter((c) => c !== 0).length
  const boardLabel =
    discsPlayed === 0
      ? 'Connect Four board, empty — 7 columns, press one to drop your disc'
      : `Connect Four board, ${discsPlayed} discs played — 7 columns, press one to drop your disc`

  return (
    <LazyMotion features={domAnimation} strict>
      <div
        className="c4"
        data-status={status}
        data-thinking={showThinking || undefined}
        onKeyDown={onKeyDown}
      >
        {/* Status row: live dot + state word, and the Show thinking switch.
            "New game" here serves the board outside a project window
            (/arcade, /work); the window's own button is in its title bar. */}
        <div className="c4-status">
          <span className="c4-dot" aria-hidden="true" />
          <span className="c4-status-text">{statusLabel(status)}</span>
          <button type="button" className="c4-new" onClick={reset}>
            {workCopy.window.newGame}
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={showThinking}
            className="c4-switch"
            onClick={() => setShowThinking((v) => !v)}
          >
            <span className="c4-switch-label">{workCopy.window.showThinking}</span>
            <span className="c4-switch-track" aria-hidden="true">
              <span className="c4-switch-knob" />
            </span>
          </button>
        </div>

        <div className="c4-arena">
          <div className="c4-board-wrap" ref={setWrapEl} onPointerLeave={() => setHoverCol(null)}>
            {/* PRINT: the white speed lines above the engine's last landing. */}
            {lastDrop?.by === ENGINE ? (
              <svg
                key={`speed-${sfxKey}`}
                className="c4-speed"
                viewBox="0 0 60 100"
                aria-hidden="true"
                style={{ ['--col' as string]: lastDrop.col }}
              >
                <path
                  d="M12 10v26M12 46v36M48 4v30M48 44v40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            ) : null}
            {/* PRINT: the CLACK! burst re-pops on every engine landing. */}
            <span
              key={sfxKey}
              className="c4-sfx ed-sfx is-red"
              data-live={sfxKey > 0 ? '' : undefined}
              aria-hidden="true"
            >
              Clack!
            </span>

            {/* SCREEN: per-column beams — the engine's rating of each column. */}
            <div className="c4-beams" aria-hidden="true">
              {Array.from({ length: COLS }, (_, col) => (
                <span
                  key={col}
                  className="c4-beam"
                  data-best={col === bestCol || undefined}
                  data-hover={col === hoverCol && status === 'human' ? '' : undefined}
                  style={{ ['--eval' as string]: evalOf(col) }}
                />
              ))}
            </div>

            <div role="group" aria-label={boardLabel} className="c4-board">
              {Array.from({ length: COLS }, (_, col) => {
                const columnFull = !canPlay(board, col)
                const disabled = status !== 'human' || columnFull
                return (
                  <button
                    key={col}
                    type="button"
                    disabled={disabled}
                    aria-label={`Drop a disc in column ${col + 1}${columnFull ? ' (full)' : ''}`}
                    onClick={() => handleColumn(col)}
                    onPointerEnter={() => setHoverCol(col)}
                    onFocus={() => setHoverCol(col)}
                    className={clsx('c4-col', disabled && !gameOver && 'is-idle')}
                  >
                    {Array.from({ length: ROWS }, (_, row) => {
                      const cell = board[row][col]
                      const isLast =
                        lastDrop !== null && lastDrop.row === row && lastDrop.col === col
                      const onWinLine =
                        winLine?.some(([r, c]) => r === row && c === col) ?? false
                      const ghost = ghostRow === row && hoverCol === col && cell === 0
                      return (
                        <span
                          key={row}
                          className="c4-cell"
                          data-ghost={ghost ? '' : undefined}
                          data-win={onWinLine ? '' : undefined}
                        >
                          {cell !== 0 && (
                            <m.span
                              aria-hidden="true"
                              className="c4-disc"
                              data-p={cell}
                              initial={reduced || !isLast ? false : { y: `${-(row + 1) * 110}%` }}
                              animate={{ y: '0%' }}
                              transition={{ duration: 0.09 * (row + 1) + 0.12, ease: EASE_SWIFT }}
                            />
                          )}
                        </span>
                      )
                    })}
                  </button>
                )
              })}
            </div>

            {/* The line through the winning four (measured from the cells). */}
            {winLine ? <WinLine wrap={wrapEl} reduced={reduced} /> : null}
          </div>

          {/* PRINT: drop keys 1–7 (real buttons); SCREEN hides the row but
              the number keys still work while the board has focus. */}
          <div role="group" aria-label="Drop a disc: press 1 to 7" className="c4-keys">
            {Array.from({ length: COLS }, (_, col) => (
              <button
                key={col}
                type="button"
                className="c4-key"
                disabled={status !== 'human' || !canPlay(board, col)}
                data-last={lastDrop?.by === ENGINE && lastDrop.col === col ? '' : undefined}
                aria-label={`Drop in column ${col + 1}`}
                onClick={() => handleColumn(col)}
              >
                {col + 1}
              </button>
            ))}
          </div>

          {/* PRINT: the show-thinking bars (SCREEN uses the beams above). */}
          <div className="c4-evals" aria-hidden="true">
            {Array.from({ length: COLS }, (_, col) => (
              <span
                key={col}
                className="c4-bar"
                data-best={col === bestCol || undefined}
                style={{ ['--eval' as string]: evalOf(col) }}
              />
            ))}
          </div>

          {/* The one live region: the game state. PRINT draws it as the
              engine's speech balloon with a headline beat. */}
          <div className="c4-say" data-empty={bubble ? undefined : ''}>
            {bubble ? (
              <span className="c4-say-head ed-print-only" aria-hidden="true">
                <span className="c4-say-col">{bubble.head}</span>
                <span className="c4-say-beat">{bubble.beat}</span>
              </span>
            ) : null}
            <p aria-live="polite" role="status" className="c4-narration">
              {narration}
            </p>
          </div>

          {/* The page's one coach mark (dismisses after the first drop). */}
          {coachOpen ? (
            <div role="note" className="c4-coach ed-panel">
              <span className="c4-coach-head ed-print-only" aria-hidden="true">
                {workCopy.window.yourMove}
              </span>
              <span className="c4-coach-text">{coachLine(edition, status)}</span>
              <button
                type="button"
                className="c4-coach-x"
                aria-label={workCopy.window.dismissTip}
                onClick={() => setCoachOpen(false)}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                  <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </LazyMotion>
  )
}
