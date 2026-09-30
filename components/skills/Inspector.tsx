'use client'

/**
 * v3 skill inspector — the card beside the diagram (S3 §3 F3 "aside.insp":
 * logo tile, name, kind line, one-line blurb, the verified usage rows with
 * years) and, under PRINT, the close-up panel (P3 §3 C2: sunburst art with
 * the big die-cut sticker, the name in slab caps, the group tag, the blurb,
 * "Where he used it" and the rows). ONE DOM, two skins (styles/v3/skills.css).
 *
 * Desktop (≥ 1200): an inline column that always shows the shown skill
 * (selected or hover/focus preview; Python at rest) and cross-fades on
 * change. Below 1200 the same element is a bottom sheet that opens only on
 * a tap (`sheetOpen`), with focus moved in, Esc and outside-tap to close.
 * Every fact comes from lib/data/skills `usedIn` (CONTENT_FINAL); an empty
 * list shows the core-stack line. Rows that name a project deep-link to it
 * (in-page window when the Work section is present, /work/<slug> otherwise).
 */

import { useEffect, useRef } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { CORE_STACK_LINE, getUsagePlace, skillTrayLabel, type Skill } from '@/lib/data/skills'
import type { ProjectSlug } from '@/lib/data/projects'
import { scrollToAnchor, SIGNAL_EVENTS } from '@/lib/commands/context'
import { useSignalStore } from '@/lib/state/store'
import { trackProjectOpened } from '@/lib/utils/analytics'
import Logo from './Logo'
import { SKILLS_COPY } from './copy'

export interface InspectorProps {
  /** The skill shown (selected or previewed); null = the prompt state. */
  skill: Skill | null
  /** Below 1200 px the card is a sheet; it is open only after a tap. */
  sheetOpen: boolean
  /** Close: the prompt state (desktop) / the sheet slides away (phone). */
  onClose: () => void
}

export default function Inspector({ skill, sheetOpen, onClose }: InspectorProps) {
  const panelRef = useRef<HTMLElement>(null)

  /* Sheet mode: focus in, Esc closes, tapping outside closes. Desktop never
     moves focus (the card is inline and follows hover). */
  useEffect(() => {
    if (!sheetOpen) return
    const panel = panelRef.current
    if (!panel) return
    const wasNarrow = window.matchMedia('(max-width: 1199px)').matches
    if (!wasNarrow) return
    /* Next frame: the sheet's open state has been painted (a hidden element
       cannot take focus). */
    const focusTimer = window.requestAnimationFrame(() => panel.focus({ preventScroll: true }))
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (target && !panel.contains(target)) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.cancelAnimationFrame(focusTimer)
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [sheetOpen, onClose])

  const openProject = (event: ReactMouseEvent<HTMLAnchorElement>, slug: ProjectSlug) => {
    if (!document.getElementById('projects')) return
    event.preventDefault()
    useSignalStore.getState().setActiveProject(slug)
    scrollToAnchor('#projects')
    window.dispatchEvent(new CustomEvent(SIGNAL_EVENTS.openProject, { detail: { slug } }))
    trackProjectOpened(slug)
  }

  return (
    <aside
      ref={panelRef}
      className="sk-insp ed-panel"
      data-component="Inspector"
      data-island="client"
      data-open={skill ? 'true' : 'false'}
      data-sheet-open={sheetOpen ? 'true' : undefined}
      aria-label={skill ? SKILLS_COPY.inspectorName(skill.label) : SKILLS_COPY.inspectorLabel}
      tabIndex={-1}
    >
      {/* SCREEN: the steel tick where the leader arrives (positioned by --leader-y). */}
      <span aria-hidden="true" className="sk-insp-tick ed-screen-only" />
      {skill ? (
        <div className="sk-insp-body" key={skill.id}>
          {/* PRINT: the close-up's top art — sunburst + red dot screen + the big die-cut sticker. */}
          <div aria-hidden="true" className="sk-insp-art ed-print-only">
            <span className="ed-sunburst sk-insp-burst" />
            <span className="ed-halftone-red sk-insp-dots" />
            <span className="sk-insp-big">
              <Logo id={skill.id} size={96} />
            </span>
          </div>
          <button
            type="button"
            className="sk-insp-close"
            aria-label={SKILLS_COPY.inspectorClose}
            onClick={onClose}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
              <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
          {/* PRINT: the caption box under the art; SCREEN: the card body. */}
          <div className="sk-insp-text">
            <div className="sk-insp-head">
              <span className="sk-insp-tile ed-screen-only" aria-hidden="true">
                <Logo id={skill.id} size={26} />
              </span>
              <div className="sk-insp-title">
                <p className="sk-insp-name">{skill.label}</p>
                <p className="sk-insp-kind">
                  <span className="ed-screen-only">{skill.kind}</span>
                  <span className="ed-print-only sk-insp-tag">{skillTrayLabel(skill)}</span>
                </p>
              </div>
            </div>
            <p className="sk-insp-desc">{skill.blurb}</p>
            {skill.usedIn.length > 0 ? (
              <>
                <p className="sk-insp-where ed-print-only" aria-hidden="true">
                  {SKILLS_COPY.printWhere}
                </p>
                <ul className="sk-insp-rows">
                  {skill.usedIn.map((usage) => {
                    const place = getUsagePlace(usage.place)
                    if (!place) return null
                    const slug = place.projectSlug
                    const label = (
                      <>
                        <span className="ed-screen-only">{place.name}</span>
                        <span className="ed-print-only">{place.printName}</span>
                      </>
                    )
                    const name = slug ? (
                      <a
                        href={`/work/${slug}`}
                        className="sk-insp-link"
                        onClick={(event) => openProject(event, slug)}
                      >
                        {label}
                      </a>
                    ) : (
                      label
                    )
                    return (
                      <li key={usage.place}>
                        <span aria-hidden="true" className="sk-insp-dot ed-print-only" />
                        {/* One cell beside the PRINT dot: name (+ year) and the note flow together. */}
                        <div className="sk-insp-cell">
                          <div className="sk-insp-row">
                            <b>{name}</b>
                            <span className="sk-insp-year ed-screen-only">{place.year}</span>
                          </div>
                          {usage.note ? <p className="sk-insp-note">{usage.note}</p> : null}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </>
            ) : (
              <p className="sk-insp-core">{CORE_STACK_LINE}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="sk-insp-body sk-insp-body--empty">
          <p className="sk-insp-prompt">{SKILLS_COPY.inspectorPrompt}</p>
        </div>
      )}
    </aside>
  )
}
