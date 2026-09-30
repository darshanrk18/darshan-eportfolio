'use client'

/**
 * The project window (spec §4.6, v2 §8; v3 S4 "the game window" / P4 "the
 * open issue"). One DOM, two skins (styles/v3/work.css + styles/v2/projects.css
 * for the mechanics):
 * - Title bar: three FUNCTIONAL lights (stop the demo · collapse the case file
 *   · maximize) in visitor language, the demo tabs (TRIPLAY_AI: Connect Four /
 *   Snake / Rock-Paper-Scissors; other projects: one tab named after them),
 *   PRINT's title suffix ("— you vs. the engine"), then New game (Connect
 *   Four only) and Maximize ("Play full size" in PRINT). `windowTitle` is
 *   never rendered (clutter law).
 * - Body: the demo pane (left) + the case file (right), stacked on phones.
 *   The demo mounts itself the first time the window scrolls into view
 *   ("Open one and it runs right here"); the generative plate stays beneath
 *   as the loading / stopped poster. Selection crossfades (200 ms) with the
 *   frame height reserved (zero CLS).
 * - Maximize opens a Motion layoutId FLIP lightbox (focus trap, body scroll
 *   + Lenis lock, Esc-restores-first precedence, reserved-height placeholder)
 *   and completes the guide's `open-project` item.
 * Listens for SIGNAL_EVENTS.openProject / runProject so palette and terminal
 * commands re-trigger the surface. `fixedSlug` pins the window to one
 * project for /work/[slug] reuse.
 */

import nextDynamic from 'next/dynamic'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentType } from 'react'
import { AnimatePresence, LazyMotion, domMax, m } from 'motion/react'
import clsx from 'clsx'
import { SIGNAL_EVENTS } from '@/lib/commands/context'
import {
  getProject,
  isProjectSlug,
  projectSlugs,
  windowTabs,
  workCopy,
  type ProjectGameId,
  type ProjectSlug,
} from '@/lib/data/projects'
import { getLenis } from '@/lib/motion/lenis'
import { EASE_STRUCTURAL, SPRING_UI } from '@/lib/motion/tokens'
import { useInViewOnce } from '@/lib/motion/useInViewOnce'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'
import { useSignalStore } from '@/lib/state/store'
import { trackEvent, trackProjectOpened, trackProjectRun } from '@/lib/utils/analytics'
import CaseFile from './CaseFile'
import EdText from './EdText'
import GenerativePlate from './GenerativePlate'
import { islandUnavailable } from '@/lib/utils/island'

import '@/styles/v3/work.css'

interface DemoProps {
  game?: ProjectGameId
  resetKey?: number
}

/**
 * Demo islands, one per project — code-split; a chunk loads only the first
 * time its project is run (§6.4). While loading (and under any failure to
 * mount) the generative-plate poster beneath stays visible.
 */
const DEMOS: Partial<Record<ProjectSlug, ComponentType<DemoProps>>> = {
  'ticket-forge': nextDynamic(() => import('./demos/TicketForgeViz').catch(islandUnavailable<typeof import('./demos/TicketForgeViz')>), {
    ssr: false,
    loading: () => null,
  }),
  trackfolio: nextDynamic(() => import('./demos/TrackfolioViz').catch(islandUnavailable<typeof import('./demos/TrackfolioViz')>), {
    ssr: false,
    loading: () => null,
  }),
  'triplay-ai': nextDynamic(() => import('./demos/ConnectFour').catch(islandUnavailable<typeof import('./demos/ConnectFour')>), {
    ssr: false,
    loading: () => null,
  }),
  'box-archive': nextDynamic(() => import('./demos/BoxArchViz').catch(islandUnavailable<typeof import('./demos/BoxArchViz')>), {
    ssr: false,
    loading: () => null,
  }),
  'expense-share': nextDynamic(() => import('./demos/ExpenseViz').catch(islandUnavailable<typeof import('./demos/ExpenseViz')>), {
    ssr: false,
    loading: () => null,
  }),
  'calendar-java': nextDynamic(() => import('./demos/UmlViz').catch(islandUnavailable<typeof import('./demos/UmlViz')>), {
    ssr: false,
    loading: () => null,
  }),
  'ieee-mip-optimizer': nextDynamic(() => import('./demos/MipViz').catch(islandUnavailable<typeof import('./demos/MipViz')>), {
    ssr: false,
    loading: () => null,
  }),
}

/** v3 §2.6 — the guide island listens for this on window. */
const GUIDE_TRIED_EVENT = 'signal:guide-tried'
/**
 * v3 §2.6 item 6 — the guide's "Try it" for "Open a project full size" (and
 * any palette row that wants it): `window.dispatchEvent(new CustomEvent(
 * 'signal:maximize-project', { detail: { slug? } }))` maximizes the window
 * (the named project when given, else whatever is open). Dispatch after
 * scrolling to #projects; retry briefly until the island has mounted (m).
 */
export const MAXIMIZE_PROJECT_EVENT = 'signal:maximize-project'

function Icon({ name }: { name: 'refresh' | 'expand' | 'restore' | 'play' }) {
  const d = {
    refresh: 'M10.2 6.6A4.3 4.3 0 1 1 8.9 2.9M9.4 .9v2.6H6.8',
    expand: 'M7.5 1h3.5v3.5M11 1L7 5M4.5 11H1V7.5M1 11l4-4',
    restore: 'M11 4.5H7.5V1M7.5 4.5L11 1M1 7.5h3.5V11M4.5 7.5L1 11',
    play: 'M3 1.5v9l7-4.5z',
  }[name]
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path
        d={d}
        fill={name === 'play' ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export interface ProjectWindowProps {
  /** Pin the window to one project (used by /work/[slug]); omits store sync. */
  fixedSlug?: ProjectSlug
}

export default function ProjectWindow({ fixedSlug }: ProjectWindowProps) {
  const storeSlug = useSignalStore((s) => s.activeProject)
  const active = fixedSlug ?? storeSlug
  const reduced = usePrefersReducedMotion()

  const [displaySlug, setDisplaySlug] = useState<ProjectSlug>(active)
  const [fading, setFading] = useState(false)
  const [running, setRunning] = useState(false)
  const [game, setGame] = useState<string>(() => windowTabs(getProject(active)!)[0].id)
  const [resetKey, setResetKey] = useState(0)
  const [hovered, setHovered] = useState(false)
  /** §8.1 yellow — per-window collapse state, not persisted. */
  const [collapsedSlugs, setCollapsedSlugs] = useState<Partial<Record<ProjectSlug, boolean>>>({})
  /** §8.3 — measured frame height, locked into the in-flow placeholder. */
  const [slotHeight, setSlotHeight] = useState<number | null>(null)
  const pendingRunRef = useRef<ProjectSlug | null>(null)
  /** A maximize asked for by event while the window was swapping projects. */
  const pendingMaxRef = useRef(false)
  /** The visitor pressed stop — do not auto-run again until a swap. */
  const stoppedRef = useRef(false)
  const displaySlugRef = useRef(displaySlug)
  displaySlugRef.current = displaySlug
  const frameRef = useRef<HTMLDivElement | null>(null)

  // The demo runs itself once the window is in view (v3: "it runs right here").
  const { ref: inViewRef, inView } = useInViewOnce<HTMLDivElement>({
    threshold: 0.2,
    rootMargin: '0px 0px 5% 0px',
  })
  const setFrame = useCallback(
    (node: HTMLDivElement | null) => {
      frameRef.current = node
      inViewRef(node)
    },
    [inViewRef],
  )
  useEffect(() => {
    if (inView && !stoppedRef.current) setRunning(true)
  }, [inView])

  const maximized = useSignalStore((s) => s.maximizedProject) === displaySlug
  const collapsed = !!collapsedSlugs[displaySlug]
  const caseId = `pw-case-${fixedSlug ?? 'main'}`
  const paneId = `pw-pane-${fixedSlug ?? 'main'}`

  const startRun = (slug: ProjectSlug) => {
    stoppedRef.current = false
    setRunning(true)
    trackProjectRun(slug)
  }
  const stopRun = () => {
    stoppedRef.current = true
    setRunning(false)
  }

  const maximize = useCallback(() => {
    useSignalStore.getState().setMaximizedProject(displaySlugRef.current)
  }, [])
  const restore = () => useSignalStore.getState().setMaximizedProject(null)

  // The in-flow height, kept fresh while the window is NOT a lightbox: the
  // store can be set from outside (the guide's "Open a project full size",
  // the palette), so the placeholder, the analytics event and the guide's
  // `open-project` completion all key off `maximized` itself — whoever set it.
  const flowHeightRef = useRef<number | null>(null)
  useLayoutEffect(() => {
    if (!maximized && frameRef.current) flowHeightRef.current = frameRef.current.offsetHeight
  })
  useEffect(() => {
    if (!maximized) return
    setSlotHeight(flowHeightRef.current)
    trackEvent('project_maximized', { slug: displaySlugRef.current })
    window.dispatchEvent(new CustomEvent(GUIDE_TRIED_EVENT, { detail: { id: 'open-project' } }))
    return () => setSlotHeight(null)
  }, [maximized])

  // The guide / palette ask for full size by event (§2.6 item 6).
  useEffect(() => {
    const onMax = (e: Event) => {
      const slug = (e as CustomEvent<{ slug?: string }>).detail?.slug
      if (slug && isProjectSlug(slug) && slug !== displaySlugRef.current) {
        if (fixedSlug) return
        useSignalStore.getState().setActiveProject(slug)
        pendingMaxRef.current = true
        return
      }
      if (useSignalStore.getState().maximizedProject === displaySlugRef.current) return
      maximize()
    }
    window.addEventListener(MAXIMIZE_PROJECT_EVENT, onMax)
    return () => window.removeEventListener(MAXIMIZE_PROJECT_EVENT, onMax)
  }, [fixedSlug, maximize])
  useEffect(() => {
    if (!pendingMaxRef.current || fading) return
    pendingMaxRef.current = false
    maximize()
  }, [displaySlug, fading, maximize])

  // Selection change → close any lightbox, then 100ms fade out, swap content,
  // fade back (≈200ms total). The title-bar text dips in sync (§8.2).
  useEffect(() => {
    if (active === displaySlug) return
    const store = useSignalStore.getState()
    if (store.maximizedProject) store.setMaximizedProject(null)
    const swap = () => {
      setDisplaySlug(active)
      setGame(windowTabs(getProject(active)!)[0].id)
      stoppedRef.current = false
      setRunning(inView || pendingRunRef.current === active)
      pendingRunRef.current = null
      setFading(false)
    }
    if (reduced) {
      swap()
      return
    }
    setFading(true)
    const id = setTimeout(swap, 100)
    return () => clearTimeout(id)
  }, [active, displaySlug, reduced, inView])

  // Cross-island events: palette/terminal select or run a project.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const slug = (e as CustomEvent<{ slug?: string }>).detail?.slug
      if (!slug || !isProjectSlug(slug)) return
      pendingRunRef.current = null
    }
    const onRun = (e: Event) => {
      const slug = (e as CustomEvent<{ slug?: string }>).detail?.slug
      if (!slug || !isProjectSlug(slug)) return
      if (!fixedSlug) useSignalStore.getState().setActiveProject(slug)
      if (slug === displaySlugRef.current) {
        stoppedRef.current = false
        setRunning(true)
        if (slug === 'triplay-ai') setGame('connect-four')
      } else {
        pendingRunRef.current = slug
      }
      trackProjectRun(slug)
    }
    window.addEventListener(SIGNAL_EVENTS.openProject, onOpen)
    window.addEventListener(SIGNAL_EVENTS.runProject, onRun)
    return () => {
      window.removeEventListener(SIGNAL_EVENTS.openProject, onOpen)
      window.removeEventListener(SIGNAL_EVENTS.runProject, onRun)
    }
  }, [fixedSlug])

  // Esc precedence (§8.3): maximized restores FIRST — the demo keeps running;
  // a second Esc returns the stage to its poster (§4.6). The palette owns Esc
  // while open.
  useEffect(() => {
    if (!running && !maximized) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const store = useSignalStore.getState()
      if (store.paletteOpen) return
      if (store.maximizedProject === displaySlugRef.current) {
        store.setMaximizedProject(null)
        return
      }
      stoppedRef.current = true
      setRunning(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [running, maximized])

  // §8.3 while maximized: body scroll locked, Lenis stopped, focus moved into
  // the dialog and returned on close.
  useEffect(() => {
    if (!maximized) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    getLenis()?.stop()
    frameRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      getLenis()?.start()
      previouslyFocused?.focus?.()
    }
  }, [maximized])

  // Focus trap while maximized: Tab cycles inside.
  const onFrameKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!maximized || e.key !== 'Tab') return
    const focusables = frameRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])',
    )
    if (!focusables || focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const project = getProject(displaySlug)
  if (!project) return null

  const Demo = DEMOS[project.slug]
  const tabs = windowTabs(project)
  const activeTab = tabs.find((t) => t.id === game) ?? tabs[0]
  const tagline = project.games?.find((g) => g.id === activeTab.id)?.tagline
  const isBoard = project.games ? activeTab.id === 'connect-four' : false

  // PRINT page-turn: the neighbouring issues (wraps).
  const idx = projectSlugs.indexOf(project.slug)
  const prevSlug = projectSlugs[(idx + projectSlugs.length - 1) % projectSlugs.length]
  const nextSlug = projectSlugs[(idx + 1) % projectSlugs.length]
  const turnTo = (slug: ProjectSlug) => {
    if (fixedSlug) return
    useSignalStore.getState().setActiveProject(slug)
    trackProjectOpened(slug)
  }

  return (
    <LazyMotion features={domMax} strict>
      {/* Reserved-height placeholder — the page behind the lightbox never
          reflows (§8.3 zero CLS). */}
      <div style={maximized && slotHeight !== null ? { height: slotHeight } : undefined}>
        <AnimatePresence>
          {maximized ? (
            <m.div
              key="pw-backdrop"
              className="pw-backdrop"
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={reduced ? { duration: 0 } : { duration: 0.3, ease: EASE_STRUCTURAL }}
            />
          ) : null}
        </AnimatePresence>
        <m.div
          ref={setFrame}
          layoutId={`pw-${displaySlug}`}
          layout={!reduced}
          transition={reduced ? { duration: 0 } : SPRING_UI}
          className={clsx('pw ed-stage', maximized && 'pw-max')}
          data-component="ProjectWindow"
          data-island="client"
          data-running={running ? '' : undefined}
          data-board={isBoard ? '' : undefined}
          role={maximized ? 'dialog' : undefined}
          aria-modal={maximized || undefined}
          aria-label={maximized ? `${project.name} — full size` : `Project window — ${project.name}`}
          tabIndex={maximized ? -1 : undefined}
          onKeyDown={onFrameKeyDown}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
        >
          <span className="pw-rim" aria-hidden="true" />

          {/* Title bar */}
          <div className="pw-bar">
            {/* §8.1 functional lights (decorative on touch — CSS) */}
            <span className="pw-lights">
              <button
                type="button"
                className="pw-light"
                data-light="red"
                disabled={!running}
                aria-label={workCopy.window.stop}
                onClick={stopRun}
              >
                <span className="pw-light-disc" aria-hidden="true">
                  <span className="pw-light-glyph">×</span>
                </span>
              </button>
              <button
                type="button"
                className="pw-light"
                data-light="yellow"
                aria-label={collapsed ? workCopy.window.expand : workCopy.window.collapse}
                aria-expanded={!collapsed}
                aria-controls={caseId}
                onClick={() =>
                  setCollapsedSlugs((c) => ({ ...c, [displaySlug]: !c[displaySlug] }))
                }
              >
                <span className="pw-light-disc" aria-hidden="true">
                  <span className="pw-light-glyph">−</span>
                </span>
              </button>
              <button
                type="button"
                className="pw-light"
                data-light="green"
                aria-label={maximized ? workCopy.window.restore : workCopy.window.maximize.screen}
                onClick={() => (maximized ? restore() : maximize())}
              >
                <span className="pw-light-disc" aria-hidden="true">
                  <span className="pw-light-glyph">+</span>
                </span>
              </button>
            </span>

            <div
              role="tablist"
              aria-label={project.games ? `Games in ${project.name}` : 'Open project'}
              className="pw-tabs"
              style={{ opacity: fading ? 0 : 1, transition: 'opacity 75ms var(--ease-swift)' }}
            >
              {tabs.map((tab) => {
                const selected = tab.id === activeTab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`${paneId}-tab-${tab.id}`}
                    aria-selected={selected}
                    aria-controls={paneId}
                    tabIndex={selected ? 0 : -1}
                    className="pw-tab"
                    onClick={() => {
                      setGame(tab.id)
                      if (!running) startRun(project.slug)
                    }}
                    onKeyDown={(e) => {
                      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
                      e.preventDefault()
                      const i = tabs.findIndex((t) => t.id === tab.id)
                      const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]
                      setGame(n.id)
                      document.getElementById(`${paneId}-tab-${n.id}`)?.focus()
                    }}
                  >
                    {tab.label}
                  </button>
                )
              })}
              {tagline ? (
                <span className="pw-tagline ed-print-only" aria-hidden="true">
                  — {tagline}
                </span>
              ) : null}
            </div>

            <div className="pw-ctl">
              {running && isBoard ? (
                <button
                  type="button"
                  className="pw-btn"
                  onClick={() => setResetKey((k) => k + 1)}
                >
                  <Icon name="refresh" />
                  <span>{workCopy.window.newGame}</span>
                </button>
              ) : null}
              {!running ? (
                <button type="button" className="pw-btn" onClick={() => startRun(project.slug)}>
                  <Icon name="play" />
                  <span>{workCopy.window.run}</span>
                </button>
              ) : null}
              <button
                type="button"
                className="pw-btn pw-btn-max"
                onClick={() => (maximized ? restore() : maximize())}
              >
                <Icon name={maximized ? 'restore' : 'expand'} />
                {maximized ? (
                  <span>{workCopy.window.restore}</span>
                ) : (
                  <span>
                    <EdText
                      screen={workCopy.window.maximize.screen}
                      print={workCopy.window.maximize.print}
                    />
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Crossfading window content */}
          <div
            className="pw-body"
            data-collapsed={collapsed || undefined}
            style={{
              opacity: fading ? 0 : 1,
              transition: 'opacity 100ms var(--ease-swift)',
            }}
          >
            {/* The demo pane */}
            <div
              id={paneId}
              role="tabpanel"
              aria-labelledby={`${paneId}-tab-${activeTab.id}`}
              className="pw-demo"
            >
              {/* SCREEN atmosphere / PRINT sunburst — decorative, per edition. */}
              <span className="ed-beam pw-beam" aria-hidden="true" />
              <span className="ed-sunburst pw-sunburst ed-print-only" aria-hidden="true" />
              <span className="ed-halftone-red pw-screen ed-print-only" aria-hidden="true" />

              <div className="pw-stage">
                <div className="pw-plate" aria-hidden="true">
                  <GenerativePlate
                    variant={project.slug}
                    seed={project.name}
                    // No demo island yet ⇒ the plate animates instead.
                    animate={(hovered && !running) || (running && !Demo)}
                  />
                </div>
                {running && Demo ? (
                  <div className="pw-live">
                    <Demo game={activeTab.id as ProjectGameId} resetKey={resetKey} />
                  </div>
                ) : running ? null : (
                  <button
                    type="button"
                    onClick={() => startRun(project.slug)}
                    className="pw-run"
                  >
                    <span className="pw-btn">
                      <Icon name="play" />
                      <span>{workCopy.window.run}</span>
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* §8.1 yellow collapse wrapper */}
            <div id={caseId} className="pw-case-col">
              <div className="pw-case-inner">
                <CaseFile
                  project={project}
                  nav={
                    fixedSlug ? null : (
                      <span className="cf-turn ed-print-only">
                        <button
                          type="button"
                          className="cf-pg"
                          onClick={() => turnTo(prevSlug)}
                          aria-label={`${workCopy.caseFile.previous}: ${getProject(prevSlug)!.name}`}
                        >
                          ← {getProject(prevSlug)!.name}
                        </button>
                        <button
                          type="button"
                          className="cf-pg is-next"
                          onClick={() => turnTo(nextSlug)}
                          aria-label={`${workCopy.caseFile.next}: ${getProject(nextSlug)!.name}`}
                        >
                          {getProject(nextSlug)!.name} →
                        </button>
                      </span>
                    )
                  }
                />
              </div>
            </div>
          </div>
        </m.div>
      </div>
    </LazyMotion>
  )
}
