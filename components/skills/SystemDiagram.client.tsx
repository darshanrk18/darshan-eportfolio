'use client'

/**
 * §4.5 interactive system diagram.
 * SSRs the complete diagram markup (nodes are real <button>s, edges are an
 * aria-hidden SVG layer), then hydrates: node focus/dim states, packet dots
 * paused off-screen via IntersectionObserver, the kubectl-describe Inspector,
 * and the SIGNAL_EVENTS.inspectSkill palette deep-link.
 * Desktop (≥1024): absolute layout from ./layout. Below: vertical pipeline.
 */

import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { getSkillNode, skillClusters, type SkillCluster, type SkillNode } from '@/lib/data/skills'
import { SIGNAL_EVENTS } from '@/lib/commands/context'
import { useSignalStore } from '@/lib/state/store'
import Inspector from './Inspector'
import { CLUSTER_FLOW_ORDER, CLUSTER_RECTS, DIAGRAM_H, DIAGRAM_W, EDGES } from './layout'

/** Clusters in flow order (frontend → api → data → testing → infra → observability). */
const orderedClusters: readonly SkillCluster[] = CLUSTER_FLOW_ORDER.map((id) =>
  skillClusters.find((c) => c.id === id),
).filter((c): c is SkillCluster => c !== undefined)

const pct = (v: number) => `${((v / DIAGRAM_W) * 100).toFixed(4)}%`

const accentVar = (accent: string) => `var(--accent-${accent})`

function NodeButton({
  node,
  selected,
  onSelect,
}: {
  node: SkillNode
  selected: boolean
  onSelect: (id: string) => void
}) {
  return (
    <button
      type="button"
      data-skill-id={node.id}
      data-selected={selected ? 'true' : undefined}
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
  onSelect,
}: {
  cluster: SkillCluster
  abs: boolean
  focusedIds: readonly string[]
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
      style={style}
    >
      <p className="skills-cluster-label type-label-xs">{cluster.label}</p>
      <div className={listClass}>
        {cluster.nodes.map((node) => (
          <NodeButton
            key={node.id}
            node={node}
            selected={focusedIds.includes(node.id)}
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
      data-live={live ? 'true' : 'false'}
      data-focused={focusedSkills.length > 0 ? 'true' : 'false'}
    >
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
        {orderedClusters.map((cluster) => (
          <ClusterPanel
            key={cluster.id}
            cluster={cluster}
            abs
            focusedIds={focusedSkills}
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
              onSelect={handleSelect}
            />
          </Fragment>
        ))}
      </div>

      <Inspector node={activeNode} onClose={handleClose} />
    </div>
  )
}
