/**
 * §4.5 system-diagram geometry — one deterministic coordinate space shared by
 * the absolutely-positioned cluster panels (percent-of-width x, px y) and the
 * stretched SVG edge layer (viewBox = this space, preserveAspectRatio="none",
 * vector-effect="non-scaling-stroke"), so edges stay attached at any width.
 * Sized for the CONTENT_FINAL cluster contents (frontend 3 · backend 7 ·
 * data 5 · testing 4 · infra 8 · observability 3 nodes).
 */

import type { SkillClusterId } from '@/lib/data/skills'

export const DIAGRAM_W = 1160
export const DIAGRAM_H = 628

export interface ClusterRect {
  x: number
  y: number
  w: number
  h: number
}

/** Desktop (≥1024) layout: frontend → backend → data → testing row, infra ring, observability pod. */
export const CLUSTER_RECTS: Record<SkillClusterId, ClusterRect> = {
  frontend: { x: 0, y: 24, w: 250, h: 190 },
  api: { x: 340, y: 24, w: 250, h: 380 },
  data: { x: 680, y: 24, w: 250, h: 284 },
  testing: { x: 950, y: 24, w: 210, h: 236 },
  infra: { x: 0, y: 430, w: 880, h: 184 },
  observability: { x: 950, y: 430, w: 210, h: 184 },
}

/**
 * Rendering/pipeline order matching the visual flow (frontend → backend →
 * data → testing, then the infra ring and the observability pod). Drives the
 * DOM order on desktop (screen-reader order = visual flow) and the stacking
 * order of the mobile vertical pipeline.
 */
export const CLUSTER_FLOW_ORDER: readonly SkillClusterId[] = [
  'frontend',
  'api',
  'data',
  'testing',
  'infra',
  'observability',
]

export interface DiagramEdge {
  id: string
  /** Path in diagram units; direction = packet flow direction. */
  d: string
  /** Clusters this edge touches (for focus brightening). */
  clusters: readonly SkillClusterId[]
  /** Packet/hot tint (accent token name). */
  accent: 'signal' | 'electron' | 'amber' | 'magenta'
}

/** §4.5 edges: cluster→cluster flow plus infra→all and infra→observability. */
export const EDGES: readonly DiagramEdge[] = [
  { id: 'frontend-api', d: 'M 250 119 L 340 119', clusters: ['frontend', 'api'], accent: 'electron' },
  { id: 'api-data', d: 'M 590 166 L 680 166', clusters: ['api', 'data'], accent: 'signal' },
  { id: 'data-testing', d: 'M 930 134 L 950 134', clusters: ['data', 'testing'], accent: 'magenta' },
  { id: 'infra-frontend', d: 'M 125 430 L 125 214', clusters: ['infra', 'frontend'], accent: 'amber' },
  { id: 'infra-api', d: 'M 465 430 L 465 404', clusters: ['infra', 'api'], accent: 'amber' },
  { id: 'infra-data', d: 'M 805 430 L 805 308', clusters: ['infra', 'data'], accent: 'amber' },
  {
    id: 'infra-observability',
    d: 'M 880 522 L 950 522',
    clusters: ['infra', 'observability'],
    accent: 'signal',
  },
]
