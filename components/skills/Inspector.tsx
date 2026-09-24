'use client'

/**
 * §4.5 skill inspector — kubectl-describe panel.
 * Desktop/tablet: 360px panel sliding in from the right (spring 300/30,
 * --z-inspector, --elev-window). Mobile (<768): bottom sheet, tap outside or
 * close to dismiss. Focus-managed: focus moves in on open, Esc returns it to
 * the node; outside click closes. Usage lines come ONLY from SkillNode.usedIn
 * (CONTENT_FINAL verified map); empty ⇒ `Context: core stack`. Usage lines
 * with a `projectSlug` deep-link to that project (in-page explorer when the
 * Projects section is present, /work/<slug> permalink otherwise / without
 * JS). Reduced motion: no slide.
 */

import { useEffect, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { AnimatePresence, LazyMotion, domAnimation, m } from 'motion/react'
import { SPRING_UI } from '@/lib/motion/tokens'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'
import type { SkillNode } from '@/lib/data/skills'
import type { ProjectSlug } from '@/lib/data/projects'
import { scrollToAnchor, SIGNAL_EVENTS } from '@/lib/commands/context'
import { useSignalStore } from '@/lib/state/store'
import { trackProjectOpened } from '@/lib/utils/analytics'

export interface InspectorProps {
  /** Node to describe; null closes the panel. */
  node: SkillNode | null
  /** restoreFocus: true for Esc/close-button (focus returns to the node). */
  onClose: (restoreFocus: boolean) => void
}

export default function Inspector({ node, onClose }: InspectorProps) {
  const reduced = usePrefersReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)
  const [sheet, setSheet] = useState(false)

  // Bottom sheet below 768px (viewport query — not a reduced-motion query).
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setSheet(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const open = node !== null
  const nodeId = node?.id

  // Focus management + Esc + outside click.
  useEffect(() => {
    if (!open) return
    panelRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose(true)
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (target && panelRef.current && !panelRef.current.contains(target)) onClose(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open, nodeId, onClose])

  const offscreen = sheet ? { y: '100%' as const } : { x: 380 }
  const onscreen = sheet ? { y: 0 } : { x: 0 }

  // Deep-link a usage line to its project: same behavior as CommandCtx
  // .openProject when the Projects explorer is on this page; otherwise the
  // anchor's /work/<slug> permalink handles it (also the no-JS path).
  const openProject = (event: ReactMouseEvent<HTMLAnchorElement>, slug: ProjectSlug) => {
    if (!document.getElementById('projects')) return
    event.preventDefault()
    onClose(false)
    useSignalStore.getState().setActiveProject(slug)
    scrollToAnchor('#projects')
    window.dispatchEvent(new CustomEvent(SIGNAL_EVENTS.openProject, { detail: { slug } }))
    trackProjectOpened(slug)
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <AnimatePresence>
        {node ? (
          <m.div
            key={sheet ? 'skills-inspector-sheet' : 'skills-inspector-panel'}
            ref={panelRef}
            role="dialog"
            id="skills-inspector"
            aria-label={`${node.label} — usage details`}
            data-component="Inspector"
            data-island="client"
            tabIndex={-1}
            className="bg-panel elev-window fixed flex flex-col outline-none max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[70vh] md:inset-y-0 md:right-0 md:w-[360px]"
            style={{ zIndex: 'var(--z-inspector)' }}
            initial={reduced ? false : offscreen}
            animate={onscreen}
            exit={offscreen}
            transition={reduced ? { duration: 0 } : SPRING_UI}
          >
            <div className="border-hairline flex h-12 shrink-0 items-center justify-between border-b px-4">
              <span className="type-label-xs text-secondary">describe · {node.id}</span>
              <button
                type="button"
                aria-label="Close inspector"
                onClick={() => onClose(true)}
                className="type-code text-secondary hover:text-primary -mr-2 flex h-11 w-11 shrink-0 items-center justify-center md:h-8 md:w-8"
              >
                ✕
              </button>
            </div>
            <div className="type-code overflow-y-auto p-4">
              <dl className="skills-describe">
                <dt>Name:</dt>
                <dd>{node.id}</dd>
                <dt>Kind:</dt>
                <dd>{node.kind}</dd>
                {node.usedIn.length > 0 ? (
                  <>
                    <dt>Status:</dt>
                    <dd>In production</dd>
                    <dt>Used in:</dt>
                    <dd>
                      {node.usedIn.map((usage, i) => {
                        const slug = usage.projectSlug
                        return (
                          <div key={i}>
                            {slug ? (
                              <a
                                href={`/work/${slug}`}
                                onClick={(event) => openProject(event, slug)}
                                className="underline underline-offset-2 transition-colors duration-(--dur-micro) ease-(--ease-swift) hover:text-signal focus-visible:text-signal"
                              >
                                {usage.where}
                              </a>
                            ) : (
                              usage.where
                            )}
                            {usage.note ? ` — ${usage.note}` : null}
                          </div>
                        )
                      })}
                    </dd>
                  </>
                ) : (
                  <>
                    <dt>Context:</dt>
                    <dd>core stack</dd>
                  </>
                )}
              </dl>
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </LazyMotion>
  )
}
