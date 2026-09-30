'use client'

/**
 * The rack (V3_SPEC §3 Work; S4 §G–H "More projects", P4 §D–E "Back
 * issues") — the v3 replacement for the v2 explorer tree. One list, two
 * skins (styles/v3/work.css):
 *   SCREEN  six glass posters (the open project is hidden): line-art plate
 *           (the existing GenerativePlate), name, one-liner (`short`), the
 *           `bill` logo chips, the award laurels on Ticket-Forge and the
 *           "Live" pill on Trackfolio.
 *   PRINT   seven hand-set comic covers, newest first: ink band (No. NN ·
 *           year), the plate on a per-cover dress, Bangers title, `coverLine`,
 *           `coverStack` chips + "+N", the "3rd place" burst, the "Live"
 *           pill, and the "Now open ↑" stamp on the open issue.
 * Every card is a real link to /work/<slug> (works without JS); with JS it
 * selects the project in the shared store and scrolls the window into view.
 * Plates draw once when the rack scrolls into view (a 3.5 s animate window)
 * and on hover; reduced motion shows their end state.
 */

import { useEffect, useState } from 'react'
import clsx from 'clsx'
import Logo from '@/components/skills/Logo'
import { scrollToAnchor } from '@/lib/commands/context'
import { logoIdForName } from '@/lib/data/logos'
import { coverMoreCount, projects, workCopy, type Project, type ProjectSlug } from '@/lib/data/projects'
import { useInViewOnce } from '@/lib/motion/useInViewOnce'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'
import { useSignalStore } from '@/lib/state/store'
import { trackProjectOpened } from '@/lib/utils/analytics'
import EdText from './EdText'
import GenerativePlate from './GenerativePlate'

/** S4 §5 — the laurel branch of the award badge (mirrored for the right side). */
const LAUREL =
  'M40.47 57.20Q37.82 62.29 31.20 62.13Q34.77 56.55 40.47 57.20ZM31.79 53.31Q27.76 56.97 21.91 54.65Q26.93 50.85 31.79 53.31ZM31.79 53.31Q27.74 50.27 29.00 44.57Q33.33 48.48 31.79 53.31ZM25.00 46.65Q20.21 48.58 15.78 44.59Q21.49 42.87 25.00 46.65ZM25.00 46.65Q22.40 42.62 25.39 37.97Q27.95 42.87 25.00 46.65ZM20.94 38.05Q16.06 38.19 13.44 33.21Q19.06 33.55 20.94 38.05ZM20.94 38.05Q19.95 33.63 24.13 30.49Q24.79 35.67 20.94 38.05ZM20.11 28.58Q15.76 27.11 15.07 21.86Q19.92 24.00 20.11 28.58ZM20.11 28.58Q20.68 24.35 25.39 22.94Q24.29 27.73 20.11 28.58ZM22.62 19.41Q19.27 16.71 20.37 11.86Q23.94 15.31 22.62 19.41ZM22.62 19.41Q24.50 15.88 29.10 16.17Q26.57 20.02 22.62 19.41ZM28.15 11.67Q26.09 8.22 28.62 4.34Q30.63 8.52 28.15 11.67ZM28.15 11.67Q30.94 9.19 34.87 10.93Q31.41 13.49 28.15 11.67ZM36.02 6.33Q35.34 2.67 38.79 0.10Q39.20 4.39 36.02 6.33ZM36.02 6.33Q39.25 5.07 42.11 7.85Q38.27 8.97 36.02 6.33ZM38.66 5.32Q41.13 2.02 45.79 3.00Q42.60 6.54 38.66 5.32Z'
const LAUREL_STEM = 'M43.24 57.74A27 27 0 0 1 38.66 5.32'

function Laurels() {
  return (
    <svg viewBox="12 -1 70 65" width="24" height="22.3" aria-hidden="true">
      <g fill="currentColor" stroke="currentColor" strokeWidth="1.6">
        <path d={LAUREL_STEM} fill="none" strokeWidth="1.1" strokeLinecap="round" />
        <path d={LAUREL} stroke="none" />
      </g>
      <g fill="currentColor" stroke="currentColor" strokeWidth="1.6" transform="translate(94 0) scale(-1 1)">
        <path d={LAUREL_STEM} fill="none" strokeWidth="1.1" strokeLinecap="round" />
        <path d={LAUREL} stroke="none" />
      </g>
    </svg>
  )
}

/** Logo (colour file; SCREEN whitens it by CSS) + the visible name. */
function BillItem({ name }: { name: string }) {
  const id = logoIdForName(name)
  return (
    <li data-boxed={id ? undefined : ''}>
      {id ? <Logo id={id} size={13} /> : null}
      <span>{name}</span>
    </li>
  )
}

function RackCard({
  project,
  index,
  open,
  animate,
  onSelect,
}: {
  project: Project
  index: number
  open: boolean
  animate: boolean
  onSelect: (slug: ProjectSlug) => void
}) {
  const [hovered, setHovered] = useState(false)
  const award = project.award?.split(' — ') ?? null
  const more = coverMoreCount(project)
  const issue = String(index + 1).padStart(2, '0')
  const facts = [
    `Issue ${issue}, ${project.name}, ${project.year}`,
    award ? `${award[0]}, ${award[1] ?? ''}`.trim() : null,
    project.live ? 'Live in production' : null,
    open ? 'Open above' : null,
  ]
    .filter(Boolean)
    .join('. ')

  return (
    <li
      className="rk-item"
      data-slug={project.slug}
      data-open={open ? '' : undefined}
      data-dress={index + 1}
      style={{ ['--rk-i' as string]: index }}
    >
      <a
        className="rk-card ed-panel"
        data-surface="panel"
        href={`/work/${project.slug}`}
        aria-current={open ? 'true' : undefined}
        aria-label={facts}
        onClick={(e) => {
          e.preventDefault()
          onSelect(project.slug)
        }}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <span className="rk-band ed-print-only" aria-hidden="true">
          <b>No. {issue}</b>
          <span>{project.year}</span>
        </span>

        <span className="rk-plate" aria-hidden="true">
          <GenerativePlate variant={project.slug} seed={project.name} animate={animate || hovered} />
        </span>

        {award ? (
          <>
            <span className="rk-award ed-screen-only" aria-hidden="true">
              <Laurels />
              <span>
                <b>{award[0]}</b>
                {award[1] ? <span>{award[1]}</span> : null}
              </span>
            </span>
            <span className="rk-burst ed-sfx is-red ed-print-only" aria-hidden="true">
              {award[0]}
            </span>
          </>
        ) : null}

        <span className="rk-stamp ed-stamp ed-print-only" aria-hidden="true">
          {workCopy.print.nowOpen}
        </span>

        <span className="rk-body">
          <span className="rk-title">
            <span>{project.name}</span>
            {project.live ? (
              <i className="rk-live" aria-hidden="true">
                <i />
                {workCopy.caseFile.live}
              </i>
            ) : null}
          </span>
          <span className="rk-line">
            <EdText screen={project.short} print={project.coverLine} />
          </span>
          <ul className="rk-bill is-screen ed-screen-only" aria-hidden="true">
            {project.bill.map((name) => (
              <BillItem key={name} name={name} />
            ))}
          </ul>
          <ul className="rk-bill is-print ed-print-only" aria-hidden="true">
            {project.coverStack.map((name) => (
              <BillItem key={name} name={name} />
            ))}
            {more > 0 ? (
              <li className="rk-more" data-boxed="">
                <span>+{more}</span>
              </li>
            ) : null}
          </ul>
        </span>
      </a>
    </li>
  )
}

export default function ProjectRack() {
  const active = useSignalStore((s) => s.activeProject)
  const setActive = useSignalStore((s) => s.setActiveProject)
  const reduced = usePrefersReducedMotion()

  // Plates draw once when the rack scrolls into view (S4 motion note).
  const { ref, inView } = useInViewOnce<HTMLUListElement>({ threshold: 0.2 })
  const [drawing, setDrawing] = useState(false)
  useEffect(() => {
    if (!inView || reduced) return
    setDrawing(true)
    const id = window.setTimeout(() => setDrawing(false), 3500)
    return () => window.clearTimeout(id)
  }, [inView, reduced])

  const select = (slug: ProjectSlug) => {
    if (slug !== active) {
      setActive(slug)
      trackProjectOpened(slug)
    }
    scrollToAnchor('#projects')
  }

  return (
    <ul
      ref={ref}
      className={clsx('rk')}
      aria-labelledby="projects-rack-heading"
      data-component="ProjectRack"
      data-island="client"
    >
      {projects.map((p, i) => (
        <RackCard
          key={p.slug}
          project={p}
          index={i}
          open={p.slug === active}
          animate={drawing}
          onSelect={select}
        />
      ))}
    </ul>
  )
}
