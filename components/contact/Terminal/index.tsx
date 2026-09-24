'use client'

/**
 * The working terminal (spec §5.3 / §4.8) — zero deps, no xterm.
 * A <div role="log" aria-live="polite"> output + a real <input> whose native
 * caret is hidden and replaced by the styled block caret span. Renders the
 * static banner on the server (zero CLS); the interpreter chunk loads only
 * once the section is within 1.5 viewports. Streams output at 12ms/line
 * (instant under reduced motion). History, tab completion, playable snake,
 * konami easter egg. Esc / `exit` release focus.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCommandCtx } from '@/lib/commands/context'
import { useInViewOnce } from '@/lib/motion/useInViewOnce'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'
import { STREAM_MS_PER_LINE } from '@/lib/motion/tokens'
import { subscribeTicker } from '@/lib/motion/ticker'
import { trackTerminalCommand, trackTerminalOpened } from '@/lib/utils/analytics'
import type { TermLine, TermTone } from './interpreter'
import type { SnakeGame } from './Snake'
import type { AutopilotFrame, SegTone } from './autopilot'

type InterpreterModule = typeof import('./interpreter')

interface OutputLine extends TermLine {
  id: number
}

const BANNER_TEXT = "SIGNAL v1.0 — type 'help'"
const PROMPT = 'guest@darshan:~$'
const SNAKE_TICK_MS = 120

const TONE_CLASS: Record<TermTone, string> = {
  default: 'text-primary',
  secondary: 'text-secondary',
  error: 'text-error',
  magenta: 'text-magenta',
  signal: 'text-signal',
}

/** §11.1 autopilot board tints — open/closed/path as background spans. */
const SEG_CLASS: Record<SegTone, string> = {
  open: 'bg-electron-dim',
  closed: 'bg-tertiary/15',
  path: 'bg-signal-dim text-signal',
}

const KONAMI = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
]

const HINT_COMMANDS = ['help', 'whoami', 'sudo hire darshan']

export default function Terminal() {
  const router = useRouter()
  const ctx = useMemo(() => createCommandCtx(router), [router])
  const reduced = usePrefersReducedMotion()
  const reducedRef = useRef(reduced)
  reducedRef.current = reduced

  // Lazy-load the interpreter once the terminal is within 1.5 viewports.
  const { ref: inViewRef, inView } = useInViewOnce<HTMLDivElement>({
    threshold: 0,
    rootMargin: '0px 0px 150% 0px',
  })
  const interpRef = useRef<InterpreterModule | null>(null)
  useEffect(() => {
    if (!inView || interpRef.current) return
    let cancelled = false
    void import('./interpreter').then((m) => {
      if (!cancelled) interpRef.current = m
    })
    return () => {
      cancelled = true
    }
  }, [inView])

  const [lines, setLines] = useState<OutputLine[]>([])
  const [value, setValue] = useState('')
  const [snakeFrame, setSnakeFrame] = useState<string | null>(null)
  const [autoFrame, setAutoFrame] = useState<AutopilotFrame | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const idRef = useRef(0)
  const queueRef = useRef<OutputLine[]>([])
  const timerRef = useRef<number | null>(null)
  const historyRef = useRef<string[]>([])
  const histIdxRef = useRef<number | null>(null)
  const draftRef = useRef('')
  const openedRef = useRef(false)
  const konamiRef = useRef(0)
  const snakeRef = useRef<{ game: SnakeGame; unsubscribe: () => void } | null>(null)

  /* ---------------------------------------------------------------- output */

  const flushOne = useCallback(() => {
    const next = queueRef.current.shift()
    if (next !== undefined) setLines((prev) => [...prev, next])
    if (queueRef.current.length > 0) {
      timerRef.current = window.setTimeout(flushOne, STREAM_MS_PER_LINE)
    } else {
      timerRef.current = null
    }
  }, [])

  const print = useCallback(
    (newLines: readonly TermLine[]) => {
      const stamped = newLines.map((l) => ({ ...l, id: idRef.current++ }))
      if (reducedRef.current) {
        setLines((prev) => [...prev, ...stamped])
        return
      }
      queueRef.current.push(...stamped)
      if (timerRef.current === null) {
        timerRef.current = window.setTimeout(flushOne, STREAM_MS_PER_LINE)
      }
    },
    [flushOne],
  )

  const clearOutput = useCallback(() => {
    queueRef.current = []
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setLines([])
  }, [])

  /* ----------------------------------------------------------------- snake */

  const stopSnake = useCallback(
    (reason: 'quit' | 'died') => {
      const active = snakeRef.current
      if (!active) return
      active.unsubscribe()
      snakeRef.current = null
      setSnakeFrame(null)
      setAutoFrame(null)
      print([
        {
          text:
            reason === 'died'
              ? `snake: game over — score ${active.game.score}`
              : `snake: quit — score ${active.game.score}`,
          tone: 'secondary',
        },
      ])
    },
    [print],
  )

  const startSnake = useCallback(
    (opts?: { autopilot?: boolean }) => {
      if (snakeRef.current) return
      const autopilot = opts?.autopilot === true
      void Promise.all([
        import('./Snake'),
        autopilot ? import('./autopilot') : Promise.resolve(null),
      ]).then(([{ SnakeGame }, auto]) => {
        if (snakeRef.current) return
        const pilot = auto ? new auto.SnakeAutopilot() : null
        let game = new SnakeGame(20, 12)
        const renderNow = () => {
          if (auto && pilot) setAutoFrame(auto.renderFrame(game, pilot))
          else setSnakeFrame(game.render())
        }
        renderNow()
        let acc = 0
        const unsubscribe = subscribeTicker((dtMs) => {
          acc += dtMs
          /* §11.1 — autopilot steps at 4fps under reduced motion. */
          const tickMs = pilot && reducedRef.current ? 250 : SNAKE_TICK_MS
          if (acc < tickMs) return
          acc = 0
          if (pilot) {
            const dir = pilot.next(game)
            if (dir) game.setDirection(dir)
          }
          game.step()
          if (!game.alive) {
            if (!pilot) {
              stopSnake('died')
              return
            }
            /* Autopilot loops — respawn until q (§11.1). */
            game = new SnakeGame(20, 12)
            pilot.reset()
            const active = snakeRef.current
            if (active) active.game = game
          }
          renderNow()
        })
        snakeRef.current = { game, unsubscribe }
        inputRef.current?.focus()
      })
    },
    [stopSnake],
  )

  useEffect(
    () => () => {
      snakeRef.current?.unsubscribe()
      snakeRef.current = null
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    },
    [],
  )

  /* --------------------------------------------------------------- execute */

  const releaseFocus = useCallback(() => {
    inputRef.current?.blur()
  }, [])

  const runCommand = useCallback(
    async (raw: string) => {
      const input = raw.trim()
      if (input === '') {
        print([{ text: `${PROMPT} `, tone: 'secondary' }])
        return
      }
      print([{ text: `${PROMPT} ${input}`, tone: 'secondary' }])
      historyRef.current.push(input)
      histIdxRef.current = null
      trackTerminalCommand(input.split(/\s+/)[0])
      const interp = interpRef.current ?? (interpRef.current = await import('./interpreter'))
      await interp.execute(input, ctx, { print, clear: clearOutput, startSnake, exit: releaseFocus }, historyRef.current)
    },
    [ctx, print, clearOutput, startSnake, releaseFocus],
  )

  /* ------------------------------------------------------------------ keys */

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Konami tracking (magenta easter egg).
      const expected = KONAMI[konamiRef.current]
      if (e.key === expected || e.key.toLowerCase() === expected) {
        konamiRef.current += 1
        if (konamiRef.current === KONAMI.length) {
          konamiRef.current = 0
          print([{ text: 'nice.', tone: 'magenta' }])
        }
      } else {
        konamiRef.current = e.key === KONAMI[0] ? 1 : 0
      }

      // Snake mode swallows movement keys + q.
      if (snakeRef.current) {
        if (e.key === 'q' || e.key === 'Q' || e.key === 'Escape') {
          e.preventDefault()
          stopSnake('quit')
          return
        }
        void import('./Snake').then(({ keyToDir }) => {
          const dir = keyToDir(e.key)
          if (dir) snakeRef.current?.game.setDirection(dir)
        })
        if (e.key.startsWith('Arrow')) e.preventDefault()
        return
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        const raw = value
        setValue('')
        void runCommand(raw)
        return
      }
      if (e.key === 'Escape') {
        releaseFocus()
        return
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        const interp = interpRef.current
        if (!interp) return
        const result = interp.complete(value)
        if (result.value !== undefined) {
          setValue(result.value)
        } else if (result.options && result.options.length > 0) {
          print([{ text: result.options.join('  '), tone: 'secondary' }])
        }
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        const history = historyRef.current
        if (history.length === 0) return
        if (histIdxRef.current === null) {
          draftRef.current = value
          histIdxRef.current = history.length - 1
        } else if (histIdxRef.current > 0) {
          histIdxRef.current -= 1
        }
        setValue(history[histIdxRef.current])
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const history = historyRef.current
        if (histIdxRef.current === null) return
        if (histIdxRef.current < history.length - 1) {
          histIdxRef.current += 1
          setValue(history[histIdxRef.current])
        } else {
          histIdxRef.current = null
          setValue(draftRef.current)
        }
        return
      }
    },
    [value, print, runCommand, releaseFocus, stopSnake],
  )

  const onFocus = useCallback(() => {
    if (!openedRef.current) {
      openedRef.current = true
      trackTerminalOpened()
    }
  }, [])

  const focusInput = useCallback(() => {
    inputRef.current?.focus()
  }, [])

  /* --------------------------------------------------------------- scroll */

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines, snakeFrame, autoFrame])

  /* §2.2 — a TermLine whose `link.label` renders as a real in-text link. */
  const renderLineText = useCallback(
    (l: OutputLine) => {
      if (!l.link) return l.text
      const idx = l.text.indexOf(l.link.label)
      if (idx === -1) return l.text
      const { label, anchor } = l.link
      return (
        <>
          {l.text.slice(0, idx)}
          <a
            href={anchor}
            className="text-signal underline decoration-dotted underline-offset-2"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              ctx.scrollTo(anchor)
            }}
          >
            {label}
          </a>
          {l.text.slice(idx + label.length)}
        </>
      )
    },
    [ctx],
  )

  /* --------------------------------------------------------------- render */

  return (
    <div ref={inViewRef} className="type-code p-4" onClick={focusInput}>
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label="Terminal output"
        className="max-h-96 overflow-y-auto overflow-x-auto"
      >
        <p className="text-secondary">{BANNER_TEXT}</p>
        {lines.map((l) => {
          if (l.srOnly) {
            return (
              <p key={l.id} className="sr-only">
                {l.text}
              </p>
            )
          }
          return (
            <p
              key={l.id}
              aria-hidden={l.ariaHidden || undefined}
              className={`${l.ariaHidden ? 'whitespace-pre' : 'whitespace-pre-wrap'} ${TONE_CLASS[l.tone ?? 'default']}`}
            >
              {l.ariaHidden && l.text === '' ? ' ' : renderLineText(l)}
            </p>
          )
        })}
        {snakeFrame !== null ? (
          <pre className="whitespace-pre text-primary" aria-label="Snake game board">
            {snakeFrame}
          </pre>
        ) : null}
        {autoFrame !== null ? (
          <pre className="whitespace-pre text-primary" aria-label="Snake autopilot board">
            {autoFrame.rows.map((row, i) => (
              <span key={i}>
                {row.map((seg, j) =>
                  seg.tone ? (
                    <span key={j} className={SEG_CLASS[seg.tone]}>
                      {seg.text}
                    </span>
                  ) : (
                    seg.text
                  ),
                )}
                {'\n'}
              </span>
            ))}
            <span className="text-secondary">{autoFrame.hud}</span>
          </pre>
        ) : null}
      </div>

      {/* Mobile hint chips (§4.8): tap to enter the command. */}
      <div className="mt-3 flex flex-wrap gap-2 md:hidden">
        {HINT_COMMANDS.map((cmd) => (
          <button
            key={cmd}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              void runCommand(cmd)
              focusInput()
            }}
            className="hairline rounded-chip type-label-sm px-2.5 py-1 text-secondary hover:border-hairline-strong"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Prompt row: real input with hidden native caret + styled block caret. */}
      <div className="relative mt-2 flex min-h-6 items-center focus-within:[outline:2px_solid_var(--accent-signal)] focus-within:[outline-offset:2px]">
        <span className="text-secondary" aria-hidden="true">
          {PROMPT}&nbsp;
        </span>
        <span className="whitespace-pre text-primary" aria-hidden="true">
          {value}
        </span>
        <span className="caret-block" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          aria-label="Terminal input — type 'help' for commands"
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
          className="absolute inset-0 h-full w-full cursor-text bg-transparent opacity-0"
        />
      </div>
    </div>
  )
}
