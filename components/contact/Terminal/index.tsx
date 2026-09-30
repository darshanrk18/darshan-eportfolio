'use client'

/**
 * The console (spec §5.3 / §4.8; v3 S6 "the console" / P6 "the comic
 * console") — zero deps, no xterm, ONE interpreter with two skins
 * (styles/v3/contact.css, `.ct-*`; V3_SPEC §1.11).
 *   Chrome bar   three steel dots + "Console" + the expand control (SCREEN);
 *                ink bar with the expand control (PRINT, the caption sits
 *                outside). Expand = full screen like the project window
 *                (fixed frame, backdrop, body scroll + Lenis lock, Esc
 *                restores, reserved-height placeholder, focus returned).
 *   Output       <div role="log" aria-live="polite"> streamed at 12 ms/line
 *                (instant under reduced motion). The `whoami --face` answer
 *                is drawn by FaceBlock per edition (director call (e)): its
 *                aria-hidden art rows arrive from the interpreter as one
 *                batch with the sr-only sentence, which is how the batch is
 *                recognised — the interpreter and its tests are untouched.
 *   Prompt       `guest@darshan:~$` in the prompt colour, a real <input>
 *                whose native caret is hidden behind the styled block caret.
 *   Rail         visitor-language suggestions (Terminal/suggestions.ts) that
 *                TYPE the real command at the prompt (~28 ms/char) and run
 *                it INSIDE the window; the last one run is the active row.
 *                Replaces v2's raw command chips.
 *   Self-typed   on first scroll-in, once per session, the prompt types
 *                `whoami --face` itself and prints the answer (both frames
 *                show it answered). It bypasses the command path, so it
 *                completes no guide item and leaves no history.
 *   Events       'signal:terminal-run' { command } runs a command as if
 *                typed (the guide's "Try it"); `T` focuses the input
 *                (aria-keyshortcuts) when nothing else is being typed.
 * History, tab completion, playable snake, konami easter egg, Esc / `exit`
 * release focus — all as v2. The interpreter chunk loads once the section
 * is within 1.5 viewports.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'
import EdText from '@/components/projects/EdText'
import { useEdition } from '@/components/projects/useEdition'
import { createCommandCtx } from '@/lib/commands/context'
import { getLenis } from '@/lib/motion/lenis'
import { useInViewOnce } from '@/lib/motion/useInViewOnce'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'
import { STREAM_MS_PER_LINE } from '@/lib/motion/tokens'
import { subscribeTicker } from '@/lib/motion/ticker'
import { useSignalStore } from '@/lib/state/store'
import { trackTerminalCommand, trackTerminalOpened } from '@/lib/utils/analytics'
import { contactCopy } from '../copy'
import FaceBlock from './FaceBlock'
import { groupFaceBatch, type FaceBatchEntry } from './faceBatch'
import {
  AUTO_COMMAND,
  AUTO_TYPE_MS,
  CONSOLE_SESSION_KEY,
  SUGGESTIONS,
  suggestionFor,
} from './suggestions'
import type { TermLine, TermTone } from './interpreter'
import type { SnakeGame } from './Snake'
import type { AutopilotFrame, SegTone } from './autopilot'

type InterpreterModule = typeof import('./interpreter')

interface OutputLine extends FaceBatchEntry {
  id: number
}

const PROMPT = 'guest@darshan:~$'
const SNAKE_TICK_MS = 120

/**
 * v3 §2.6 item 8 — the guide's "Try it" (and any palette row) runs a command
 * in the console by event: `window.dispatchEvent(new CustomEvent(
 * 'signal:terminal-run', { detail: { command } }))`. Dispatch after scrolling
 * to #contact; retry briefly until the island has mounted (director call m).
 */
export const TERMINAL_RUN_EVENT = 'signal:terminal-run'

const TONE_CLASS: Record<TermTone, string> = {
  default: 'ct-t-default',
  secondary: 'ct-t-secondary',
  error: 'ct-t-error',
  magenta: 'ct-t-magenta',
  signal: 'ct-t-signal',
}

/** §11.1 autopilot board tints — open/closed/path as background spans. */
const SEG_CLASS: Record<SegTone, string> = {
  open: 'ct-seg-open',
  closed: 'ct-seg-closed',
  path: 'ct-seg-path',
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

function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

function ExpandIcon({ restore }: { restore: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path
        d={
          restore
            ? 'M11 4.5H7.5V1M7.5 4.5L11 1M1 7.5h3.5V11M4.5 7.5L1 11'
            : 'M7.5 1h3.5v3.5M11 1L7 5M4.5 11H1V7.5M1 11l4-4'
        }
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Terminal() {
  const router = useRouter()
  const ctx = useMemo(() => createCommandCtx(router), [router])
  const reduced = usePrefersReducedMotion()
  const reducedRef = useRef(reduced)
  reducedRef.current = reduced
  const edition = useEdition()

  // Lazy-load the interpreter once the console is within 1.5 viewports.
  const { ref: nearRef, inView: near } = useInViewOnce<HTMLDivElement>({
    threshold: 0,
    rootMargin: '0px 0px 150% 0px',
  })
  // The self-typed answer plays when the console itself is on screen.
  const { ref: seenRef, inView: seen } = useInViewOnce<HTMLDivElement>({
    threshold: 0.35,
    rootMargin: '0px',
  })
  const rootRef = useRef<HTMLDivElement | null>(null)
  const setRoot = useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node
      nearRef(node)
      seenRef(node)
    },
    [nearRef, seenRef],
  )

  const interpRef = useRef<InterpreterModule | null>(null)
  const interpPromise = useRef<Promise<InterpreterModule> | null>(null)
  const loadInterp = useCallback(() => {
    if (interpRef.current) return Promise.resolve(interpRef.current)
    if (!interpPromise.current) {
      interpPromise.current = import('./interpreter').then((m) => {
        interpRef.current = m
        return m
      })
    }
    return interpPromise.current
  }, [])
  useEffect(() => {
    if (near) void loadInterp()
  }, [near, loadInterp])

  const [lines, setLines] = useState<OutputLine[]>([])
  const [value, setValue] = useState('')
  const [snakeFrame, setSnakeFrame] = useState<string | null>(null)
  const [autoFrame, setAutoFrame] = useState<AutopilotFrame | null>(null)
  const [activeSug, setActiveSug] = useState<string | null>(null)
  const [maximized, setMaximized] = useState(false)
  const [slotHeight, setSlotHeight] = useState<number | null>(null)

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
  const usedRef = useRef(false)
  const autoRef = useRef<'idle' | 'running' | 'done'>('idle')

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
      // A batch with an sr-only sentence is the portrait: its aria-hidden
      // rows become ONE FaceBlock entry where the first row was; every other
      // line keeps its place (faceBatch.ts, interpreter contract §2.2).
      const stamped: OutputLine[] = groupFaceBatch(newLines).map((l) => ({ ...l, id: idRef.current++ }))
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
      usedRef.current = true
      if (input === '') {
        print([{ text: `${PROMPT} `, tone: 'secondary' }])
        return
      }
      print([{ text: `${PROMPT} ${input}`, tone: 'secondary' }])
      historyRef.current.push(input)
      histIdxRef.current = null
      setActiveSug(suggestionFor(input)?.id ?? null)
      trackTerminalCommand(input.split(/\s+/)[0])
      const interp = await loadInterp()
      await interp.execute(input, ctx, { print, clear: clearOutput, startSnake, exit: releaseFocus }, historyRef.current)
    },
    [ctx, print, clearOutput, startSnake, releaseFocus, loadInterp],
  )

  const focusInput = useCallback(() => {
    inputRef.current?.focus()
  }, [])

  /* A suggestion (or the guide's "Try it") TYPES its command at the prompt,
     ~28 ms per character, then runs it (S6 / P6 motion notes). Instant under
     reduced motion or while snake owns the keys; the visitor typing cancels. */
  const typingRef = useRef<number[]>([])
  const cancelTyping = useCallback(() => {
    for (const t of typingRef.current) window.clearTimeout(t)
    typingRef.current = []
  }, [])
  const typeThenRun = useCallback(
    (command: string) => {
      cancelTyping()
      if (reducedRef.current || snakeRef.current) {
        void runCommand(command)
        return
      }
      usedRef.current = true
      for (let i = 1; i <= command.length; i++) {
        typingRef.current.push(window.setTimeout(() => setValue(command.slice(0, i)), i * AUTO_TYPE_MS))
      }
      typingRef.current.push(
        window.setTimeout(() => {
          typingRef.current = []
          setValue('')
          void runCommand(command)
        }, (command.length + 4) * AUTO_TYPE_MS),
      )
    },
    [cancelTyping, runCommand],
  )
  useEffect(() => cancelTyping, [cancelTyping])

  /* ---------------------------------------------- the self-typed first answer */

  useEffect(() => {
    if (!seen || autoRef.current !== 'idle') return
    let already = false
    try {
      already = sessionStorage.getItem(CONSOLE_SESSION_KEY) === '1'
    } catch {
      /* storage unavailable — play it */
    }
    if (already || usedRef.current || snakeRef.current) {
      autoRef.current = 'done'
      return
    }
    autoRef.current = 'running'
    try {
      sessionStorage.setItem(CONSOLE_SESSION_KEY, '1')
    } catch {
      /* ignore */
    }
    let cancelled = false
    const timers: number[] = []
    void loadInterp().then((interp) => {
      if (cancelled || usedRef.current) return
      const finish = () => {
        if (cancelled || usedRef.current) return
        setValue('')
        print([{ text: `${PROMPT} ${AUTO_COMMAND}`, tone: 'secondary' }, ...interp.faceLines()])
        setActiveSug(suggestionFor(AUTO_COMMAND)?.id ?? null)
        autoRef.current = 'done'
      }
      if (reducedRef.current) {
        finish()
        return
      }
      for (let i = 1; i <= AUTO_COMMAND.length; i++) {
        timers.push(window.setTimeout(() => {
          if (!cancelled && !usedRef.current) setValue(AUTO_COMMAND.slice(0, i))
        }, i * AUTO_TYPE_MS))
      }
      timers.push(window.setTimeout(finish, (AUTO_COMMAND.length + 6) * AUTO_TYPE_MS))
    })
    return () => {
      cancelled = true
      for (const t of timers) window.clearTimeout(t)
    }
  }, [seen, loadInterp, print])

  /* ------------------------------------------------- events + the T shortcut */

  useEffect(() => {
    const onRun = (e: Event) => {
      const command = (e as CustomEvent<{ command?: string }>).detail?.command
      if (typeof command !== 'string' || command.trim() === '') return
      typeThenRun(command)
      focusInput()
    }
    window.addEventListener(TERMINAL_RUN_EVENT, onRun)
    return () => window.removeEventListener(TERMINAL_RUN_EVENT, onRun)
  }, [typeThenRun, focusInput])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 't' && e.key !== 'T') return
      if (e.altKey || e.ctrlKey || e.metaKey) return
      if (isTextEntry(e.target)) return
      const store = useSignalStore.getState()
      if (store.paletteOpen || store.demoRunning) return
      e.preventDefault()
      rootRef.current?.scrollIntoView({ block: 'nearest' })
      focusInput()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [focusInput])

  /* ------------------------------------------------------------- maximize */

  const expand = useCallback(() => {
    setSlotHeight(rootRef.current?.offsetHeight ?? null)
    setMaximized(true)
  }, [])
  const restore = useCallback(() => setMaximized(false), [])

  useEffect(() => {
    if (!maximized) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    getLenis()?.stop()
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (useSignalStore.getState().paletteOpen) return
      if (snakeRef.current) return
      setMaximized(false)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      getLenis()?.start()
      previouslyFocused?.focus?.()
    }
  }, [maximized])

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
        if (maximized) return // the document handler restores the console
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
    [value, print, runCommand, releaseFocus, stopSnake, maximized],
  )

  const onFocus = useCallback(() => {
    if (!openedRef.current) {
      openedRef.current = true
      trackTerminalOpened()
    }
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
            className="ct-link"
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

  const maxLabel = maximized
    ? { screen: contactCopy.screen.consoleRestore, print: contactCopy.print.consoleRestore }
    : { screen: contactCopy.screen.consoleMax, print: contactCopy.print.consoleMax }

  return (
    <div className="ct-console-outer" style={maximized && slotHeight !== null ? { height: slotHeight } : undefined}>
      {maximized ? <div className="pw-backdrop" aria-hidden="true" onClick={restore} /> : null}
      <div
        ref={setRoot}
        className={clsx('ct-console ed-panel', maximized && 'is-max')}
        data-component="Terminal"
        data-island="client"
        data-surface="panel"
        role={maximized ? 'dialog' : 'region'}
        aria-modal={maximized || undefined}
        aria-label={contactCopy.screen.consoleTitle}
        aria-keyshortcuts="t"
        onClick={focusInput}
      >
        <div className="ct-bar">
          <span className="ct-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="ct-bar-title">{contactCopy.screen.consoleTitle}</span>
          <button
            type="button"
            className="ct-max"
            onClick={(e) => {
              e.stopPropagation()
              if (maximized) restore()
              else expand()
            }}
          >
            <ExpandIcon restore={maximized} />
            <span className="sr-only">
              <EdText screen={maxLabel.screen} print={maxLabel.print} />
            </span>
          </button>
        </div>

        <div className="ct-body">
          <div className="ct-term ed-console-area">
            <div ref={scrollRef} role="log" aria-live="polite" aria-label="Console output" className="ct-log">
              {lines.map((l) => {
                if (l.face) {
                  return <FaceBlock key={l.id} rows={l.face} edition={edition} />
                }
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
                    className={clsx('ct-line', l.ariaHidden ? 'is-pre' : 'is-wrap', TONE_CLASS[l.tone ?? 'default'])}
                  >
                    {l.ariaHidden && l.text === '' ? ' ' : renderLineText(l)}
                  </p>
                )
              })}
              {snakeFrame !== null ? (
                <pre className="ct-pre" aria-label="Snake game board">
                  {snakeFrame}
                </pre>
              ) : null}
              {autoFrame !== null ? (
                <pre className="ct-pre" aria-label="Snake autopilot board">
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
                  <span className="ct-t-secondary">{autoFrame.hud}</span>
                </pre>
              ) : null}
            </div>

            {/* Prompt row: real input with hidden native caret + styled block caret. */}
            <div className="ct-prompt">
              <span className="ct-prompt-user" aria-hidden="true">
                guest@darshan
              </span>
              <span className="ct-prompt-sym" aria-hidden="true">
                :~$&nbsp;
              </span>
              <span className="ct-prompt-value" aria-hidden="true">
                {value}
              </span>
              <span className="caret-block ct-caret" aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => {
                  cancelTyping()
                  setValue(e.target.value)
                }}
                onKeyDown={onKeyDown}
                onFocus={onFocus}
                aria-label="Terminal input — type 'help' for commands"
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="send"
                className="ct-input"
              />
            </div>
          </div>

          {/* The suggestion rail — visitor language; the command is typed inside. */}
          <div className="ct-rail">
            <p className="ct-rail-label">
              <EdText screen={contactCopy.screen.railLabel} print={contactCopy.print.railLabel} />
            </p>
            <ul className="ct-sugs">
              {SUGGESTIONS.map((s) => (
                <li key={s.id} className={clsx(s.screenOnly && 'ed-screen-only')}>
                  <button
                    type="button"
                    className="ct-sug"
                    aria-pressed={activeSug === s.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      typeThenRun(s.command)
                      focusInput()
                    }}
                  >
                    <i className="ct-sug-dot" aria-hidden="true" />
                    <span>
                      <EdText screen={s.label.screen} print={s.label.print} />
                    </span>
                    <svg className="ct-sug-arrow" width="14" height="10" viewBox="0 0 14 10" aria-hidden="true">
                      <path d="M1 5h11M8.5 1.5L12 5l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.1" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
