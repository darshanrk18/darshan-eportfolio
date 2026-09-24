'use client'

/**
 * §4.5 interactive system diagram.
 * SSRs the complete diagram markup (nodes are real <button>s, edges are an
 * aria-hidden SVG layer), then hydrates: node focus/dim states, packet dots
 * paused off-screen via IntersectionObserver, the kubectl-describe Inspector,
 * and the SIGNAL_EVENTS.inspectSkill palette deep-link.
 * Desktop (≥1024): absolute layout from ./layout. Below: vertical pipeline.
 *
 * v2 §7.1 — `$ deploy --all`: a prompt-line button (JS-only, height reserved)
 * runs the cluster-wave build in CLUSTER_FLOW_ORDER with a typed status line,
 * REAL performance.now() elapsed, a derived module count, packet speed-up,
 * a Prometheus/Grafana finale pulse, and ONE aria-live announcement. Also
 * triggered by SIGNAL_EVENTS.deployAll (palette/terminal `deploy-all`).
 * Reduced motion: instant final state. State classes live in
 * styles/v2/experience.css.
 */

import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  allSkillNodes,
  getSkillNode,
  skillClusters,
  type SkillCluster,
  type SkillNode,
} from '@/lib/data/skills'
import { SIGNAL_EVENTS } from '@/lib/commands/context'
import { useSignalStore } from '@/lib/state/store'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'
import { trackEvent } from '@/lib/utils/analytics'
import Inspector from './Inspector'
import { CLUSTER_FLOW_ORDER, CLUSTER_RECTS, DIAGRAM_H, DIAGRAM_W, EDGES } from './layout'

/** Clusters in flow order (frontend → api → data → testing → infra → observability). */
const orderedClusters: readonly SkillCluster[] = CLUSTER_FLOW_ORDER.map((id) =>
  skillClusters.find((c) => c.id === id),
).filter((c): c is SkillCluster => c !== undefined)

const pct = (v: number) => `${((v / DIAGRAM_W) * 100).toFixed(4)}%`

const accentVar = (accent: string) => `var(--accent-${accent})`

/* ------------------------------------------------------------------------- */
/* v2 §7.1 — `$ deploy --all`                                                 */
/* ------------------------------------------------------------------------- */

/** §7.1/§0.3 — module count is DERIVED from the data, never hardcoded. */
const MODULE_COUNT = allSkillNodes.length
/** Status line typing speed (caret-motif prompt line). */
const DEPLOY_TYPE_MS = 24
/** Cluster-wave stagger along CLUSTER_FLOW_ORDER. */
const DEPLOY_WAVE_MS = 120
/** Gap between the last wave landing and the finale/settled status line. */
const DEPLOY_FINALE_LAG_MS = 360

const deployFinalLine = (elapsedS: string) =>
  `system healthy ✓ · ${MODULE_COUNT}/${MODULE_COUNT} in ${elapsedS}s`

function NodeButton({
  node,
  selected,
  blamed,
  onSelect,
}: {
  node: SkillNode
  selected: boolean
  /** v2 §9.1 — in store.focusedSkills via the blame toggle, inspector NOT
   *  open on it (blame ≠ inspector-open): 2px electron ring, stays bright. */
  blamed: boolean
  onSelect: (id: string) => void
}) {
  return (
    <button
      type="button"
      data-skill-id={node.id}
      data-selected={selected ? 'true' : undefined}
      data-blamed={blamed ? 'true' : undefined}
      aria-expanded={selected}
      aria-haspopup="dialog"
      aria-label={`${node.label} — view usage`}
      className="skills-node type-label-sm"
      onClick={() => onSelect(node.id)}
    >
      <span className="truncate">{node.label}</span>
    </button>
  )
}

function ClusterPanel({
  cluster,
  abs,
  focusedIds,
  activeId,
  deployed,
  onSelect,
}: {
  cluster: SkillCluster
  abs: boolean
  focusedIds: readonly string[]
  /** v2 §9.1 — the inspector-open node (selected), vs. blame focus. */
  activeId: string | null
  /** v2 §7.1 — this cluster's deploy wave has landed (nodes show ✓). */
  deployed: boolean
  onSelect: (id: string) => void
}) {
  const rect = CLUSTER_RECTS[cluster.id]
  const style: CSSProperties = {
    ...(abs
      ? { left: pct(rect.x), top: rect.y, width: pct(rect.w), height: rect.h }
      : undefined),
    ['--cluster-accent' as string]: accentVar(cluster.accent),
  }
  const listClass = abs
    ? cluster.id === 'infra'
      ? 'grid grid-cols-3 gap-2'
      : 'flex flex-col gap-2'
    : 'grid grid-cols-2 gap-2 md:grid-cols-3'
  return (
    <div
      role="group"
      aria-label={`${cluster.label} cluster`}
      className={abs ? 'skills-cluster skills-cluster--abs' : 'skills-cluster'}
      data-deployed={deployed ? 'true' : undefined}
      style={style}
    >
      <p className="skills-cluster-label type-label-xs">{cluster.label}</p>
      <div className={listClass}>
        {cluster.nodes.map((node) => (
          <NodeButton
            key={node.id}
            node={node}
            selected={node.id === activeId}
            blamed={focusedIds.includes(node.id) && node.id !== activeId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}

function PipeConnector({ accent, index }: { accent: string; index: number }) {
  return (
    <div className="skills-pipe-connector" aria-hidden="true">
      <svg width="2" height="32" viewBox="0 0 2 32" focusable="false">
        <g
          className="skills-edge"
          style={{ ['--edge-accent' as string]: accentVar(accent) } as CSSProperties}
        >
          <path d="M 1 0 L 1 32" className="skills-edge-base" />
          <path
            d="M 1 0 L 1 32"
            className="skills-packet"
            pathLength={100}
            style={{ animationDelay: `${index * -1.3}s` }}
          />
        </g>
      </svg>
    </div>
  )
}

export default function SystemDiagram() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [live, setLive] = useState(false)
  const focusedSkills = useSignalStore((s) => s.focusedSkills)
  const setFocusedSkills = useSignalStore((s) => s.setFocusedSkills)

  /* §7.1 deploy sequence state. `mounted` gates the button so no-JS visitors
     never see a dead control (the diagram markup itself is SSR'd). */
  const reduced = usePrefersReducedMotion()
  const reducedRef = useRef(reduced)
  reducedRef.current = reduced
  const [mounted, setMounted] = useState(false)
  const [deployedWaves, setDeployedWaves] = useState(0)
  const [deploying, setDeploying] = useState(false)
  const [finale, setFinale] = useState(false)
  const [status, setStatus] = useState('')
  const [announce, setAnnounce] = useState('')
  const timersRef = useRef<number[]>([])
  const runningRef = useRef(false)

  useEffect(() => {
    setMounted(true)
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id))
      timersRef.current = []
      runningRef.current = false
    }
  }, [])

  const runDeploy = useCallback(() => {
    if (runningRef.current || typeof window === 'undefined') return
    runningRef.current = true
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []
    const later = (fn: () => void, ms: number) => {
      timersRef.current.push(window.setTimeout(fn, ms))
    }
    /* Types `text` into the status line at 24ms/char (instant when reduced). */
    const typeStatus = (text: string, done?: () => void) => {
      if (reducedRef.current) {
        setStatus(text)
        done?.()
        return
      }
      let i = 0
      const step = () => {
        i += 1
        setStatus(text.slice(0, i))
        if (i < text.length) later(step, DEPLOY_TYPE_MS)
        else done?.()
      }
      setStatus('')
      later(step, DEPLOY_TYPE_MS)
    }

    /* GA fires at sequence start — covers the on-diagram button AND the
       palette/terminal `deploy-all` command path (§7.1 / prep contract). */
    trackEvent('deploy_all')

    /* Reset classes first so a re-run replays the CSS animations (§7.1.5). */
    setDeployedWaves(0)
    setDeploying(false)
    setFinale(false)
    setAnnounce('')
    setStatus('')

    const start = () => {
      const t0 = performance.now()
      /* §7.1 reduced motion: instant final state — all ✓, settled status
         line, no packet change, no pulse. The elapsed figure stays REAL. */
      if (reducedRef.current) {
        setDeployedWaves(orderedClusters.length)
        setStatus(deployFinalLine(((performance.now() - t0) / 1000).toFixed(1)))
        setAnnounce(`deploy complete — ${MODULE_COUNT} services healthy`)
        runningRef.current = false
        return
      }
      setDeploying(true)
      typeStatus(`building ${MODULE_COUNT} modules…`, () => {
        orderedClusters.forEach((_, i) => {
          later(() => {
            setDeployedWaves(i + 1)
            if (i === orderedClusters.length - 1) {
              later(() => {
                /* Finale: Prometheus + Grafana pulse once; the elapsed time
                   is measured, not asserted (§7.1.4). */
                const elapsed = ((performance.now() - t0) / 1000).toFixed(1)
                setDeploying(false)
                setFinale(true)
                setAnnounce(`deploy complete — ${MODULE_COUNT} services healthy`)
                typeStatus(deployFinalLine(elapsed), () => {
                  runningRef.current = false
                })
              }, DEPLOY_FINALE_LAG_MS)
            }
          }, i * DEPLOY_WAVE_MS)
        })
      })
    }
    /* One frame with classes reset, then start — replayed animations rearm. */
    later(start, 40)
  }, [])

  /* §7.1 — the `deploy-all` registry command fires this window event; the
     listener attaches on mount and must tolerate firing while off-screen
     (state updates land; the command's own scrollTo brings it into view). */
  useEffect(() => {
    const onDeployAll = () => runDeploy()
    window.addEventListener(SIGNAL_EVENTS.deployAll, onDeployAll)
    return () => window.removeEventListener(SIGNAL_EVENTS.deployAll, onDeployAll)
  }, [runDeploy])

  // Palette / terminal deep-link: `skills > docker` → open this inspector.
  useEffect(() => {
    const onInspect = (event: Event) => {
      const id = (event as CustomEvent<{ id?: string }>).detail?.id
      if (id && getSkillNode(id)) setActiveId(id)
    }
    window.addEventListener(SIGNAL_EVENTS.inspectSkill, onInspect)
    return () => window.removeEventListener(SIGNAL_EVENTS.inspectSkill, onInspect)
  }, [])

  // The store carries the focus state (shared with the STRETCH blame toggle).
  useEffect(() => {
    setFocusedSkills(activeId ? [activeId] : [])
  }, [activeId, setFocusedSkills])

  // Packet dots run only while the diagram is on screen.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setLive(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => setLive(entries.some((e) => e.isIntersecting)),
      { threshold: 0.05 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const handleSelect = useCallback((id: string) => {
    setActiveId(id)
  }, [])

  const handleClose = useCallback((restoreFocus: boolean) => {
    setActiveId((current) => {
      if (restoreFocus && current) {
        const btn = containerRef.current?.querySelector<HTMLButtonElement>(
          `[data-skill-id="${current}"]`,
        )
        setTimeout(() => btn?.focus(), 0)
      }
      return null
    })
  }, [])

  const activeNode = activeId ? (getSkillNode(activeId) ?? null) : null
  const hotClusters = new Set(
    focusedSkills
      .map((id) => getSkillNode(id)?.cluster)
      .filter((c): c is SkillNode['cluster'] => c !== undefined),
  )

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label="Skills system diagram"
      className="skills-diagram"
      data-component="SystemDiagram"
      data-island="client"
      data-live={live ? 'true' : 'false'}
      data-focused={focusedSkills.length > 0 ? 'true' : 'false'}
      data-deploying={deploying ? 'true' : undefined}
      data-finale={finale ? 'true' : undefined}
    >
      {/* §7.1 deploy bar — button only exists once JS runs (no-JS: absent);
          the container reserves both lines' height so nothing shifts. */}
      <div className="skills-deploy">
        {mounted ? (
          <button type="button" className="skills-deploy-btn type-code" onClick={runDeploy}>
            $ deploy --all ▸
          </button>
        ) : null}
        <p className="skills-deploy-status type-code" aria-hidden="true">
          {status}
          {status !== '' ? <span className="caret" aria-hidden="true" /> : null}
        </p>
        {/* One polite announcement per sequence (§7.1.5 / rails §0.3). */}
        <p className="sr-only" role="status">
          {announce}
        </p>
      </div>

      {/* Desktop: absolute layout over the stretched SVG edge layer */}
      <div className="relative hidden lg:block" style={{ height: DIAGRAM_H }}>
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`0 0 ${DIAGRAM_W} ${DIAGRAM_H}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          {EDGES.map((edge, i) => (
            <g
              key={edge.id}
              className={
                edge.clusters.some((c) => hotClusters.has(c)) ? 'skills-edge is-hot' : 'skills-edge'
              }
              style={{ ['--edge-accent' as string]: accentVar(edge.accent) } as CSSProperties}
            >
              <path d={edge.d} className="skills-edge-base" vectorEffect="non-scaling-stroke" />
              <path
                d={edge.d}
                className="skills-packet"
                pathLength={100}
                vectorEffect="non-scaling-stroke"
                style={{ animationDelay: `${i * -1.1}s` }}
              />
            </g>
          ))}
        </svg>
        {orderedClusters.map((cluster, i) => (
          <ClusterPanel
            key={cluster.id}
            cluster={cluster}
            abs
            focusedIds={focusedSkills}
            activeId={activeId}
            deployed={i < deployedWaves}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* Tablet/mobile: vertical pipeline, edges vertical */}
      <div className="flex flex-col lg:hidden">
        {orderedClusters.map((cluster, i) => (
          <Fragment key={cluster.id}>
            {i > 0 ? <PipeConnector accent={cluster.accent} index={i} /> : null}
            <ClusterPanel
              cluster={cluster}
              abs={false}
              focusedIds={focusedSkills}
              activeId={activeId}
              deployed={i < deployedWaves}
              onSelect={handleSelect}
            />
          </Fragment>
        ))}
      </div>

      <Inspector node={activeNode} onClose={handleClose} />
    </div>
  )
}
