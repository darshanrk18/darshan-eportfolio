'use client'

/**
 * Terminal-chrome project window (spec §4.6, v2 §8).
 * Title bar (three FUNCTIONAL traffic lights §8.1: red stops the demo,
 * yellow collapses the case file, green maximizes; ▶ run / ■ stop) →
 * 16:10 stage (generative-plate poster; the demo island mounts over it on
 * run) → PROBLEM / BUILD / RESULT case file → footer strip (stack chips,
 * view source, read paper, permalink, touch-only ⤢ maximize chip).
 * Selection crossfades content (200ms total) with reserved heights to
 * prevent CLS, plus a synced title-bar opacity dip (§8.2). Green opens a
 * Motion layoutId FLIP lightbox (§8.3): fixed full-viewport frame, focus
 * trap, body scroll + Lenis lock, Esc-restores-first precedence, and a
 * reserved-height placeholder in the flow for zero CLS. Demos are lazy
 * islands loaded on first ▶ run only; the poster is the fallback.
 * Listens for SIGNAL_EVENTS.openProject / runProject so palette and
 * terminal commands re-trigger the surface. `fixedSlug` pins the window
 * to one project for /work/[slug] reuse.
 */

import Link from 'next/link'
import nextDynamic from 'next/dynamic'
import { useEffect, useRef, useState, type ComponentType } from 'react'
import { AnimatePresence, LazyMotion, domMax, m } from 'motion/react'
import clsx from 'clsx'
import { SIGNAL_EVENTS } from '@/lib/commands/context'
import { profile } from '@/lib/data/profile'
import { getProject, isProjectSlug, type ProjectSlug } from '@/lib/data/projects'
import { getLenis } from '@/lib/motion/lenis'
import { EASE_STRUCTURAL, SPRING_UI } from '@/lib/motion/tokens'
import { useMagnetic } from '@/lib/motion/useMagnetic'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'
import { useSignalStore } from '@/lib/state/store'
import { trackEvent, trackProjectRun } from '@/lib/utils/analytics'
import GenerativePlate from './GenerativePlate'

/**
 * Demo islands, one per project — code-split; a chunk loads only the first
 * time its project is run (§6.4). While loading (and under any failure to
 * mount) the generative-plate poster beneath stays visible.
 */
const DEMOS: Partial<Record<ProjectSlug, ComponentType>> = {
  'ticket-forge': nextDynamic(() => import('./demos/TicketForgeViz'), {
    ssr: false,
    loading: () => null,
  }),
  trackfolio: nextDynamic(() => import('./demos/TrackfolioViz'), {
    ssr: false,
    loading: () => null,
  }),
  'triplay-ai': nextDynamic(() => import('./demos/ConnectFour'), {
    ssr: false,
    loading: () => null,
  }),
  'box-archive': nextDynamic(() => import('./demos/BoxArchViz'), {
    ssr: false,
    loading: () => null,
  }),
  'expense-share': nextDynamic(() => import('./demos/ExpenseViz'), {
    ssr: false,
    loading: () => null,
  }),
  'calendar-java': nextDynamic(() => import('./demos/UmlViz'), {
    ssr: false,
    loading: () => null,
  }),
  'ieee-mip-optimizer': nextDynamic(() => import('./demos/MipViz'), {
    ssr: false,
    loading: () => null,
  }),
}

const CASE_COLUMNS = ['PROBLEM', 'BUILD', 'RESULT'] as const

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
  const [hovered, setHovered] = useState(false)
  /** §8.1 yellow — per-window collapse state, not persisted. */
  const [collapsedSlugs, setCollapsedSlugs] = useState<Partial<Record<ProjectSlug, boolean>>>({})
  /** §8.3 — measured frame height, locked into the in-flow placeholder. */
  const [slotHeight, setSlotHeight] = useState<number | null>(null)
  const pendingRunRef = useRef<ProjectSlug | null>(null)
  const displaySlugRef = useRef(displaySlug)
  displaySlugRef.current = displaySlug
  const frameRef = useRef<HTMLDivElement | null>(null)
  /** §6.5 — the ▶ run button is one of the ~10 named magnetic elements. */
  const runBtnRef = useRef<HTMLButtonElement | null>(null)
  useMagnetic(runBtnRef, { strength: 0.25, radius: 80 })

  const maximized = useSignalStore((s) => s.maximizedProject) === displaySlug
  const collapsed = !!collapsedSlugs[displaySlug]
  const caseId = `pw-case-${fixedSlug ?? 'main'}`

  const startRun = (slug: ProjectSlug) => {
    setRunning(true)
    trackProjectRun(slug)
  }

  const maximize = () => {
    setSlotHeight(frameRef.current?.offsetHeight ?? null)
    useSignalStore.getState().setMaximizedProject(displaySlug)
    trackEvent('project_maximized', { slug: displaySlug })
  }
  const restore = () => useSignalStore.getState().setMaximizedProject(null)

  // Selection change → close any lightbox, then 100ms fade out, swap content,
  // fade back (≈200ms total). The title-bar text dips in sync (§8.2).
  useEffect(() => {
    if (active === displaySlug) return
    const store = useSignalStore.getState()
    if (store.maximizedProject) store.setMaximizedProject(null)
    if (reduced) {
      setDisplaySlug(active)
      setRunning(pendingRunRef.current === active)
      pendingRunRef.current = null
      return
    }
    setFading(true)
    const id = setTimeout(() => {
      setDisplaySlug(active)
      setRunning(pendingRunRef.current === active)
      pendingRunRef.current = null
      setFading(false)
    }, 100)
    return () => clearTimeout(id)
  }, [active, displaySlug, reduced])

  // Cross-island events: palette/terminal select or run a project.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const slug = (e as CustomEvent<{ slug?: string }>).detail?.slug
      if (!slug || !isProjectSlug(slug)) return
      pendingRunRef.current = null
      if (slug === displaySlugRef.current) setRunning(false)
    }
    const onRun = (e: Event) => {
      const slug = (e as CustomEvent<{ slug?: string }>).detail?.slug
      if (!slug || !isProjectSlug(slug)) return
      if (!fixedSlug) useSignalStore.getState().setActiveProject(slug)
      if (slug === displaySlugRef.current) {
        setRunning(true)
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
      setRunning(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [running, maximized])

  // §8.3 while maximized: body scroll locked (MobileMenu mechanism), Lenis
  // stopped, focus moved into the dialog and returned on close.
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

  // Focus trap while maximized (MobileMenu pattern): Tab cycles inside.
  const onFrameKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!maximized || e.key !== 'Tab') return
    const focusables = frameRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])'
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
  const repoHref = project.repoUrl ?? profile.githubUrl
  const caseCopy: Record<(typeof CASE_COLUMNS)[number], string> = {
    PROBLEM: project.problem,
    BUILD: project.build,
    RESULT: project.result,
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
          ref={frameRef}
          layoutId={`pw-${displaySlug}`}
          layout={!reduced}
          transition={reduced ? { duration: 0 } : SPRING_UI}
          className={clsx('elev-window bg-panel', maximized && 'pw-max')}
          data-component="ProjectWindow"
          data-island="client"
          role={maximized ? 'dialog' : undefined}
          aria-modal={maximized || undefined}
          aria-label={maximized ? `${project.name} — maximized` : undefined}
          tabIndex={maximized ? -1 : undefined}
          onKeyDown={onFrameKeyDown}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
        >
          {/* Title bar */}
          <div className="border-hairline flex items-center gap-3 border-b px-4 py-2.5">
            {/* §8.1 functional traffic lights (decorative on touch — CSS) */}
            <span className="pw-lights">
              <button
                type="button"
                className="pw-light"
                data-light="red"
                disabled={!running}
                aria-label="Stop demo"
                onClick={() => setRunning(false)}
              >
                <span className="pw-light-disc" aria-hidden="true">
                  <span className="pw-light-glyph">×</span>
                </span>
              </button>
              <button
                type="button"
                className="pw-light"
                data-light="yellow"
                aria-label="Collapse case file"
                aria-expanded={!collapsed}
                aria-controls={caseId}
                onClick={() => setCollapsedSlugs((c) => ({ ...c, [displaySlug]: !c[displaySlug] }))}
              >
                <span className="pw-light-disc" aria-hidden="true">
                  <span className="pw-light-glyph">−</span>
                </span>
              </button>
              <button
                type="button"
                className="pw-light"
                data-light="green"
                aria-label={maximized ? 'Restore window' : 'Maximize window'}
                onClick={() => (maximized ? restore() : maximize())}
              >
                <span className="pw-light-disc" aria-hidden="true">
                  <span className="pw-light-glyph">+</span>
                </span>
              </button>
            </span>
            <span
              className="type-label-sm text-secondary min-w-0 truncate"
              style={{ opacity: fading ? 0 : 1, transition: 'opacity 75ms var(--ease-swift)' }}
            >
              {project.windowTitle}
            </span>
            {project.award ? (
              <span className="type-label-xs rounded-chip bg-amber-dim text-amber min-w-0 truncate px-2 py-0.5">
                {project.award}
              </span>
            ) : null}
            {project.live ? (
              <span className="type-label-xs text-signal flex shrink-0 items-center gap-1.5">
                <span
                  className="bg-signal inline-block h-1.5 w-1.5 rounded-full"
                  style={{ animation: 'pulse-soft 2s ease-in-out infinite' }}
                  aria-hidden="true"
                />
                LIVE
              </span>
            ) : null}
            <button
              ref={runBtnRef}
              type="button"
              onClick={() => (running ? setRunning(false) : startRun(project.slug))}
              aria-label={
                running ? `Stop the ${project.name} demo` : `Run the ${project.name} demo`
              }
              className="type-label-sm rounded-btn border-hairline text-signal hover:border-hairline-strong ml-auto shrink-0 border px-3 py-1 transition-colors duration-(--dur-micro) ease-(--ease-swift)"
            >
              {/* §6.5 — the ▶ run button is one of the ~10 magnetic elements. */}
              <span data-mag-label>{running ? '■ stop' : '▶ run'}</span>
            </button>
          </div>

          {/* Crossfading window content (stage height is reserved by aspect ratio;
              in the lightbox the stage grows to fill instead — CSS §8.3) */}
          <div
            className="pw-body"
            style={{
              opacity: fading ? 0 : 1,
              transition: 'opacity 100ms var(--ease-swift)',
            }}
          >
            {/* Stage */}
            <div className="pw-stage bg-panel relative aspect-[16/10] overflow-hidden">
              <GenerativePlate
                variant={project.slug}
                seed={project.name}
                // No demo island yet ⇒ ▶ run animates the generative plate instead.
                animate={(hovered && !running) || (running && !Demo)}
              />
              {running && Demo ? (
                <div className="absolute inset-0">
                  <Demo />
                </div>
              ) : running ? null : (
                <button
                  type="button"
                  onClick={() => startRun(project.slug)}
                  aria-label={`Run the ${project.name} demo`}
                  className="group absolute inset-0 flex items-center justify-center"
                >
                  <span className="type-label-sm rounded-btn border-hairline bg-overlay text-signal group-hover:border-hairline-strong group-hover:shadow-(--glow-signal) border px-4 py-2 transition-[border-color,box-shadow] duration-(--dur-micro) ease-(--ease-swift)">
                    ▶ run
                  </span>
                </button>
              )}
            </div>

            {/* §8.1 yellow collapse wrapper: 1fr → 0fr, no measured heights */}
            <div id={caseId} className="pw-collapse" data-collapsed={collapsed || undefined}>
              <div className="pw-collapse-inner">
                {/* Case file — copy verbatim from lib/data/projects (Appendix A.3) */}
                <div className="border-hairline grid gap-6 border-t p-6 lg:min-h-[184px] lg:grid-cols-3 lg:gap-8">
                  {CASE_COLUMNS.map((label) => (
                    <div key={label}>
                      <h3 className="type-label-xs text-secondary mb-2">{label}</h3>
                      <p className="font-sans text-[15px] leading-[1.65]">{caseCopy[label]}</p>
                    </div>
                  ))}
                </div>

                {/* Footer strip */}
                <div className="border-hairline flex flex-wrap items-center gap-x-6 gap-y-3 border-t px-6 py-4">
                  {project.stack.length > 0 ? (
                    <ul aria-label="Stack" className="flex flex-wrap gap-2">
                      {project.stack.map((item) => (
                        <li
                          key={item}
                          className="type-label-sm rounded-chip border-hairline bg-raised text-secondary border px-2 py-0.5"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {/* §8.3 touch affordance — hidden on fine pointers (CSS) */}
                  <button
                    type="button"
                    onClick={() => (maximized ? restore() : maximize())}
                    className="pw-max-chip type-label-sm rounded-btn border-hairline text-secondary hover:text-primary border px-3 transition-colors duration-(--dur-micro) ease-(--ease-swift)"
                  >
                    {maximized ? '⤢ restore' : '⤢ maximize'}
                  </button>
                  <div className="type-label-sm ml-auto flex flex-wrap gap-x-4 gap-y-2">
                    <a
                      href={repoHref}
                      target="_blank"
                      rel="noreferrer"
                      className="link-draw text-secondary hover:text-primary transition-colors duration-(--dur-micro) ease-(--ease-swift)"
                    >
                      [ view source ]
                    </a>
                    {project.demoUrl ? (
                      <a
                        href={project.demoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="link-draw text-secondary hover:text-primary transition-colors duration-(--dur-micro) ease-(--ease-swift)"
                      >
                        {project.live ? '[ open app ]' : '[ watch demo ]'}
                      </a>
                    ) : null}
                    {project.paperUrl ? (
                      <a
                        href={project.paperUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="link-draw text-secondary hover:text-primary transition-colors duration-(--dur-micro) ease-(--ease-swift)"
                      >
                        [ read paper ]
                      </a>
                    ) : null}
                    {fixedSlug ? null : (
                      <Link
                        href={`/work/${project.slug}`}
                        className="link-draw text-secondary hover:text-primary transition-colors duration-(--dur-micro) ease-(--ease-swift)"
                      >
                        [ permalink ]
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </m.div>
      </div>
    </LazyMotion>
  )
}
