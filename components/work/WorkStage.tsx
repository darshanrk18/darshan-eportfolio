'use client'

/**
 * /work/[slug] window (spec §4.11; v3 both editions). The permalink page
 * adopts the project window's skin (styles/v3/work.css) without the main
 * page's island: this client component renders the title bar (the demo
 * tabs, New game for the board, Run / Stop) and the demo pane (the
 * generative-plate poster with "Run the demo", which lazy-loads the
 * project's demo island on first run — the same demos as ProjectWindow);
 * the server-rendered case file arrives as `children` and sits in the
 * window's second column. Esc / Stop return the pane to its poster. No
 * maximize here — the page is already the project full size.
 */

import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import clsx from 'clsx'
import GenerativePlate from '@/components/projects/GenerativePlate'
import {
  getProject,
  windowTabs,
  workCopy,
  type ProjectGameId,
  type ProjectSlug,
} from '@/lib/data/projects'
import { trackProjectRun } from '@/lib/utils/analytics'
import { islandUnavailable } from '@/lib/utils/island'

import '@/styles/v3/work.css'

interface DemoProps {
  game?: ProjectGameId
  resetKey?: number
}

// Each demo chunk loads only when its project is first run (§6.4 rule 4).
const DEMOS: Partial<Record<ProjectSlug, ComponentType<DemoProps>>> = {
  'ticket-forge': dynamic(() => import('@/components/projects/demos/TicketForgeViz').catch(islandUnavailable<typeof import('@/components/projects/demos/TicketForgeViz')>)),
  trackfolio: dynamic(() => import('@/components/projects/demos/TrackfolioViz').catch(islandUnavailable<typeof import('@/components/projects/demos/TrackfolioViz')>)),
  'triplay-ai': dynamic(() => import('@/components/projects/demos/ConnectFour').catch(islandUnavailable<typeof import('@/components/projects/demos/ConnectFour')>)),
  'box-archive': dynamic(() => import('@/components/projects/demos/BoxArchViz').catch(islandUnavailable<typeof import('@/components/projects/demos/BoxArchViz')>)),
  'expense-share': dynamic(() => import('@/components/projects/demos/ExpenseViz').catch(islandUnavailable<typeof import('@/components/projects/demos/ExpenseViz')>)),
  'calendar-java': dynamic(() => import('@/components/projects/demos/UmlViz').catch(islandUnavailable<typeof import('@/components/projects/demos/UmlViz')>)),
  'ieee-mip-optimizer': dynamic(() => import('@/components/projects/demos/MipViz').catch(islandUnavailable<typeof import('@/components/projects/demos/MipViz')>)),
}

function Icon({ name }: { name: 'refresh' | 'play' | 'stop' }) {
  const d = {
    refresh: 'M10.2 6.6A4.3 4.3 0 1 1 8.9 2.9M9.4 .9v2.6H6.8',
    play: 'M3 1.5v9l7-4.5z',
    stop: 'M2.5 2.5h7v7h-7z',
  }[name]
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path
        d={d}
        fill={name === 'refresh' ? 'none' : 'currentColor'}
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export interface WorkStageProps {
  slug: ProjectSlug
  /** Project display name — also the plate seed (seed = project name, §5.8). */
  name: string
  /** The server-rendered case file (the window's second column). */
  children?: ReactNode
}

export default function WorkStage({ slug, name, children }: WorkStageProps) {
  const project = getProject(slug)
  const tabs = project ? windowTabs(project) : [{ id: slug, label: name }]
  const [game, setGame] = useState<string>(tabs[0].id)
  const [running, setRunning] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [hovered, setHovered] = useState(false)
  const Demo = DEMOS[slug]
  const activeTab = tabs.find((t) => t.id === game) ?? tabs[0]
  const isBoard = project?.games ? activeTab.id === 'connect-four' : false
  const tagline = project?.games?.find((g) => g.id === activeTab.id)?.tagline
  const paneId = `pw-pane-${slug}`

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
    <div
      className={clsx('pw ed-stage')}
      data-component="WorkStage"
      data-island="client"
      data-running={running ? '' : undefined}
      data-board={running && isBoard ? '' : undefined}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <span className="pw-rim" aria-hidden="true" />
      <div className="pw-bar">
        <div
          role="tablist"
          aria-label={project?.games ? `Games in ${name}` : 'Open project'}
          className="pw-tabs"
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
                  if (!running) run()
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
            <button type="button" className="pw-btn" onClick={() => setResetKey((k) => k + 1)}>
              <Icon name="refresh" />
              <span>{workCopy.window.newGame}</span>
            </button>
          ) : null}
          {running ? (
            <button type="button" className="pw-btn" onClick={() => setRunning(false)}>
              <Icon name="stop" />
              <span>{workCopy.window.stop}</span>
            </button>
          ) : (
            <button type="button" className="pw-btn" onClick={run}>
              <Icon name="play" />
              <span>{workCopy.window.run}</span>
            </button>
          )}
        </div>
      </div>

      <div className="pw-body">
        <div id={paneId} role="tabpanel" aria-labelledby={`${paneId}-tab-${activeTab.id}`} className="pw-demo">
          <span className="ed-beam pw-beam" aria-hidden="true" />
          <span className="ed-sunburst pw-sunburst ed-print-only" aria-hidden="true" />
          <span className="ed-halftone-red pw-screen ed-print-only" aria-hidden="true" />
          <div className="pw-stage">
            <div className="pw-plate" aria-hidden="true">
              {/* No demo island yet ⇒ the plate animates in place. */}
              <GenerativePlate
                variant={slug}
                seed={name}
                animate={(hovered && !running) || (running && !Demo)}
              />
            </div>
            {running && Demo ? (
              <div className="pw-live">
                <Demo game={activeTab.id as ProjectGameId} resetKey={resetKey} />
              </div>
            ) : running ? null : (
              <button type="button" onClick={run} className="pw-run">
                <span className="pw-btn">
                  <Icon name="play" />
                  <span>{workCopy.window.run}</span>
                </span>
              </button>
            )}
          </div>
        </div>
        <div className="pw-case-col">
          <div className="pw-case-inner">{children}</div>
        </div>
      </div>
    </div>
  )
}
