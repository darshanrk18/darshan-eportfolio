'use client'

/**
 * /work/[slug] stage (spec §4.11): the generative-plate poster with a
 * ▶ run button that lazy-loads the project's demo island on first run
 * (same demos as the main-page project window). `esc` / ■ stop returns
 * to the poster. The poster is the permanent fallback everywhere.
 */

import { useEffect, useState, type ComponentType } from 'react'
import dynamic from 'next/dynamic'
import GenerativePlate from '@/components/projects/GenerativePlate'
import type { ProjectSlug } from '@/lib/data/projects'
import { trackProjectRun } from '@/lib/utils/analytics'

// Each demo chunk loads only when its project is first run (§6.4 rule 4).
const DEMOS: Partial<Record<ProjectSlug, ComponentType>> = {
  'ticket-forge': dynamic(() => import('@/components/projects/demos/TicketForgeViz')),
  trackfolio: dynamic(() => import('@/components/projects/demos/TrackfolioViz')),
  'triplay-ai': dynamic(() => import('@/components/projects/demos/ConnectFour')),
  'box-archive': dynamic(() => import('@/components/projects/demos/BoxArchViz')),
  'expense-share': dynamic(() => import('@/components/projects/demos/ExpenseViz')),
  'calendar-java': dynamic(() => import('@/components/projects/demos/UmlViz')),
  'ieee-mip-optimizer': dynamic(() => import('@/components/projects/demos/MipViz')),
}

export interface WorkStageProps {
  slug: ProjectSlug
  /** Project display name — also the plate seed (seed = project name, §5.8). */
  name: string
}

export default function WorkStage({ slug, name }: WorkStageProps) {
  const [running, setRunning] = useState(false)
  const Demo = DEMOS[slug]

  // Esc stops the demo (§7.1: Esc stops demos; focus is never trapped).
  useEffect(() => {
    if (!running) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setRunning(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [running])

  const run = () => {
    setRunning(true)
    trackProjectRun(slug)
  }

  return (
    <div className="border-b border-hairline">
      {running && Demo ? (
        <div className="relative bg-panel p-4" style={{ minHeight: '20rem' }}>
          <Demo />
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => setRunning(false)}
              className="type-label-sm hairline rounded-btn px-3 py-2 text-secondary transition-colors hover:border-hairline-strong hover:text-primary"
              aria-label={`Stop ${name} demo`}
            >
              ■ stop
            </button>
          </div>
        </div>
      ) : (
        <div className="relative bg-panel" style={{ aspectRatio: '16 / 10' }}>
          <div className="absolute inset-0" aria-hidden="true">
            {/* No demo island yet ⇒ ▶ run animates the plate in place. */}
            <GenerativePlate variant={slug} seed={name} animate={running && !Demo} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              type="button"
              onClick={run}
              className="type-label-sm rounded-btn bg-overlay px-5 py-3 text-signal transition-colors hover:text-primary"
              style={{ border: '1px solid var(--border-hairline)', minHeight: 44 }}
              aria-label={`Run ${name} demo`}
            >
              ▶ run
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
