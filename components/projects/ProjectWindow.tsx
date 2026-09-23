'use client'

/**
 * Terminal-chrome project window (spec §4.6).
 * Title bar (three decorative circles, window title, ▶ run / ■ stop) →
 * 16:10 stage (generative-plate poster; the demo island mounts over it on
 * run) → PROBLEM / BUILD / RESULT case file → footer strip (stack chips,
 * view source, read paper, permalink). Selection crossfades content
 * (200ms total) with reserved heights to prevent CLS. Demos are lazy
 * islands loaded on first ▶ run only; the poster is the fallback.
 * Listens for SIGNAL_EVENTS.openProject / runProject so palette and
 * terminal commands re-trigger the surface. `fixedSlug` pins the window
 * to one project for /work/[slug] reuse.
 */

import Link from 'next/link'
import nextDynamic from 'next/dynamic'
import { useEffect, useRef, useState, type ComponentType } from 'react'
import { SIGNAL_EVENTS } from '@/lib/commands/context'
import { profile } from '@/lib/data/profile'
import { getProject, isProjectSlug, type ProjectSlug } from '@/lib/data/projects'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'
import { useSignalStore } from '@/lib/state/store'
import { trackProjectRun } from '@/lib/utils/analytics'
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
  const pendingRunRef = useRef<ProjectSlug | null>(null)
  const displaySlugRef = useRef(displaySlug)
  displaySlugRef.current = displaySlug

  const startRun = (slug: ProjectSlug) => {
    setRunning(true)
    trackProjectRun(slug)
  }

  // Selection change → 100ms fade out, swap content, fade back (≈200ms total).
  useEffect(() => {
    if (active === displaySlug) return
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

  // Esc returns the stage to its poster (§4.6); the palette owns Esc while open.
  useEffect(() => {
    if (!running) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (useSignalStore.getState().paletteOpen) return
      setRunning(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [running])

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
    <div
      className="elev-window bg-panel"
      data-component="ProjectWindow"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {/* Title bar */}
      <div className="border-hairline flex items-center gap-3 border-b px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="border-hairline h-2 w-2 rounded-full border" />
          <span className="border-hairline h-2 w-2 rounded-full border" />
          <span className="border-hairline h-2 w-2 rounded-full border" />
        </span>
        <span className="type-label-sm text-secondary min-w-0 truncate">{project.windowTitle}</span>
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
          type="button"
          onClick={() => (running ? setRunning(false) : startRun(project.slug))}
          aria-label={running ? `Stop the ${project.name} demo` : `Run the ${project.name} demo`}
          className="type-label-sm rounded-btn border-hairline text-signal hover:border-hairline-strong ml-auto shrink-0 border px-3 py-1 transition-colors duration-(--dur-micro) ease-(--ease-swift)"
        >
          {running ? '■ stop' : '▶ run'}
        </button>
      </div>

      {/* Crossfading window content (stage height is reserved by aspect ratio) */}
      <div
        style={{
          opacity: fading ? 0 : 1,
          transition: 'opacity 100ms var(--ease-swift)',
        }}
      >
        {/* Stage */}
        <div className="bg-panel relative aspect-[16/10] overflow-hidden">
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
          <div className="type-label-sm ml-auto flex flex-wrap gap-x-4 gap-y-2">
            <a
              href={repoHref}
              target="_blank"
              rel="noreferrer"
              className="text-secondary hover:text-primary transition-colors duration-(--dur-micro) ease-(--ease-swift)"
            >
              [ view source ]
            </a>
            {project.demoUrl ? (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-secondary hover:text-primary transition-colors duration-(--dur-micro) ease-(--ease-swift)"
              >
                {project.live ? '[ open app ]' : '[ watch demo ]'}
              </a>
            ) : null}
            {project.paperUrl ? (
              <a
                href={project.paperUrl}
                target="_blank"
                rel="noreferrer"
                className="text-secondary hover:text-primary transition-colors duration-(--dur-micro) ease-(--ease-swift)"
              >
                [ read paper ]
              </a>
            ) : null}
            {fixedSlug ? null : (
              <Link
                href={`/work/${project.slug}`}
                className="text-secondary hover:text-primary transition-colors duration-(--dur-micro) ease-(--ease-swift)"
              >
                [ permalink ]
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
