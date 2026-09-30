'use client'

/**
 * Deterministic generative project plates (spec §5.8).
 * One 480×300 Canvas 2D component; seed = fnv1a(project name) → mulberry32
 * (via createSeededRandom) — every visitor sees the same artwork per project.
 * Static first frame by default; animates at 30fps only while the parent
 * window is hovered/running (`animate` prop), riding the shared ticker.
 * Always static on touch, reduced motion, and while off-screen.
 * All colors come from the CSS tokens in app/globals.css — zero literals.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ProjectSlug } from '@/lib/data/projects'
import { createSeededRandom } from '@/lib/utils/seeded'
import { subscribeTicker } from '@/lib/motion/ticker'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'

export interface GenerativePlateProps {
  variant: ProjectSlug
  seed: string
  /** Parent gates this on window hover / demo running. Default false (static). */
  animate?: boolean
}

const W = 480
const H = 300
const FRAME_MS = 1000 / 30

/* ----------------------------------------------------------------- palette */

interface Palette {
  signal: string
  electron: string
  amber: string
  magenta: string
  hairline: string
  strong: string
}

function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement)
  const v = (name: string) => cs.getPropertyValue(name).trim()
  return {
    signal: v('--accent-signal'),
    electron: v('--accent-electron'),
    amber: v('--accent-amber'),
    magenta: v('--accent-magenta'),
    hairline: v('--border-hairline'),
    strong: v('--border-strong'),
  }
}

/* ------------------------------------------------------------------ scenes */

interface Pt {
  x: number
  y: number
}

interface TreeNode {
  x: number
  y: number
  depth: number
  phase: number
  a: number
}

interface TreeScene {
  kind: 'tree'
  nodes: TreeNode[]
  edges: { from: number; to: number; pv: boolean }[]
}

interface IsoStack {
  gx: number
  gz: number
  h: number
  phase: number
  hot: boolean
  pulse: boolean
}

interface IsoScene {
  kind: 'iso'
  stacks: IsoStack[]
}

interface SankeyBand {
  y: number
  w: number
  accent: 'electron' | 'signal' | 'magenta'
}

interface SankeyScene {
  kind: 'sankey'
  bands: SankeyBand[]
}

interface GridCell {
  x: number
  y: number
  w: number
  h: number
  a: number
}

interface GridScene {
  kind: 'grid'
  cells: GridCell[]
}

interface MipScene {
  kind: 'mip'
  hull: Pt[]
  cuts: { a: Pt; b: Pt }[]
  c: Pt
  minD: number
  maxD: number
  opt: Pt
}

interface RankPoint {
  x: number
  y: number
  phase: number
  a: number
}

interface RankScene {
  kind: 'rank'
  /** Background embedding-space points. */
  field: RankPoint[]
  /** The incoming-ticket query vector. */
  query: Pt
  /** Top-k candidates, ranked (conf descending). */
  top: { x: number; y: number; phase: number; conf: number }[]
}

interface DagNode {
  x: number
  y: number
  main: boolean
  /** Immutable submission snapshot marker. */
  snapshot: boolean
  phase: number
}

interface DagScene {
  kind: 'dag'
  nodes: DagNode[]
  edges: { a: number; b: number; branch: boolean }[]
}

type Scene = TreeScene | IsoScene | SankeyScene | GridScene | MipScene | RankScene | DagScene

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

function buildTree(rnd: () => number): TreeScene {
  const nodes: TreeNode[] = [{ x: W / 2, y: 34, depth: 0, phase: rnd() * Math.PI * 2, a: rnd() }]
  const edges: TreeScene['edges'] = []
  let frontier = [0]
  for (let depth = 1; depth <= 4; depth++) {
    const next: number[] = []
    for (const pi of frontier) {
      if (nodes.length > 90) break
      const parent = nodes[pi]
      const kids = rnd() < 0.3 ? 3 : 2
      for (let k = 0; k < kids; k++) {
        const spread = 175 / Math.pow(depth, 1.25)
        const x = clamp(parent.x + (k - (kids - 1) / 2) * spread + (rnd() - 0.5) * 14, 16, W - 16)
        const y = 34 + depth * 57 + (rnd() - 0.5) * 12
        nodes.push({ x, y, depth, phase: rnd() * Math.PI * 2, a: rnd() })
        edges.push({ from: pi, to: nodes.length - 1, pv: false })
        next.push(nodes.length - 1)
      }
    }
    frontier = next
  }
  // Principal variation: the first-child chain from the root, in signal.
  let cur = 0
  for (;;) {
    const edge = edges.find((e) => e.from === cur)
    if (!edge) break
    edge.pv = true
    cur = edge.to
  }
  return { kind: 'tree', nodes, edges }
}

function buildIso(rnd: () => number): IsoScene {
  const stacks: IsoStack[] = []
  for (let gx = 0; gx < 4; gx++) {
    for (let gz = 0; gz < 3; gz++) {
      stacks.push({
        gx,
        gz,
        h: 1 + Math.floor(rnd() * 3),
        phase: rnd() * Math.PI * 2,
        hot: false,
        pulse: false,
      })
    }
  }
  stacks[Math.floor(rnd() * stacks.length)].hot = true
  stacks[Math.floor(rnd() * stacks.length)].pulse = true
  return { kind: 'iso', stacks }
}

function buildSankey(rnd: () => number): SankeyScene {
  const ys = [64, 128, 192, 252]
  const raw = ys.map(() => 0.5 + rnd())
  const total = raw.reduce((s, v) => s + v, 0)
  const accents: SankeyBand['accent'][] = ['electron', 'signal', 'magenta', 'electron']
  const bands: SankeyBand[] = ys.map((y, i) => ({
    y,
    w: Math.max(10, (raw[i] / total) * 110),
    accent: accents[i],
  }))
  return { kind: 'sankey', bands }
}

function subdivide(
  x: number,
  y: number,
  w: number,
  h: number,
  depth: number,
  rnd: () => number,
  cells: GridCell[],
): void {
  if (depth === 0 || w < 44 || h < 32 || rnd() < 0.16) {
    cells.push({ x, y, w, h, a: rnd() })
    return
  }
  const vertical = w > h * 1.2 ? true : h > w * 1.2 ? false : rnd() < 0.5
  const r = 0.35 + rnd() * 0.3
  if (vertical) {
    subdivide(x, y, w * r, h, depth - 1, rnd, cells)
    subdivide(x + w * r, y, w * (1 - r), h, depth - 1, rnd, cells)
  } else {
    subdivide(x, y, w, h * r, depth - 1, rnd, cells)
    subdivide(x, y + h * r, w, h * (1 - r), depth - 1, rnd, cells)
  }
}

function buildGrid(rnd: () => number): GridScene {
  const cells: GridCell[] = []
  subdivide(12, 12, W - 24, H - 24, 5, rnd, cells)
  return { kind: 'grid', cells }
}

function convexHull(pts: Pt[]): Pt[] {
  const s = [...pts].sort((p, q) => p.x - q.x || p.y - q.y)
  const cross = (o: Pt, a: Pt, b: Pt) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
  const lower: Pt[] = []
  for (const p of s) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0)
      lower.pop()
    lower.push(p)
  }
  const upper: Pt[] = []
  for (let i = s.length - 1; i >= 0; i--) {
    const p = s[i]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0)
      upper.pop()
    upper.push(p)
  }
  lower.pop()
  upper.pop()
  return lower.concat(upper)
}

function buildMip(rnd: () => number): MipScene {
  const raw: Pt[] = Array.from({ length: 8 }, () => ({
    x: 100 + rnd() * 280,
    y: 60 + rnd() * 180,
  }))
  const hull = convexHull(raw)
  const theta = rnd() * Math.PI * 2
  const c = { x: Math.cos(theta), y: Math.sin(theta) }
  let minD = Infinity
  let maxD = -Infinity
  let opt = hull[0]
  for (const p of hull) {
    const d = c.x * p.x + c.y * p.y
    if (d < minD) minD = d
    if (d > maxD) {
      maxD = d
      opt = p
    }
  }
  const cuts: MipScene['cuts'] = []
  for (let i = 0; i < hull.length && cuts.length < 4; i += 2) {
    cuts.push({ a: hull[i], b: hull[(i + 1) % hull.length] })
  }
  return { kind: 'mip', hull, cuts, c, minD, maxD, opt }
}

/** ticket-forge: vector-space ranking — drifting embedding points, a query
 *  vector, top-k candidates linked by dashed similarity lines, and a ranked
 *  confidence-bar rail on the right. */
function buildRank(rnd: () => number): RankScene {
  const query: Pt = { x: 120 + rnd() * 60, y: 105 + rnd() * 60 }
  const field: RankPoint[] = Array.from({ length: 34 }, () => ({
    x: 20 + rnd() * 290,
    y: 24 + rnd() * (H - 48),
    phase: rnd() * Math.PI * 2,
    a: rnd(),
  }))
  const top: RankScene['top'] = []
  for (let i = 0; i < 5; i++) {
    const theta = rnd() * Math.PI * 2
    const r = 34 + rnd() * 60
    top.push({
      x: clamp(query.x + Math.cos(theta) * r, 24, 305),
      y: clamp(query.y + Math.sin(theta) * r, 24, H - 24),
      phase: rnd() * Math.PI * 2,
      conf: 0.94 - i * 0.13 - rnd() * 0.05,
    })
  }
  return { kind: 'rank', field, query, top }
}

/** trackfolio: branching version graph — a main resume lane, tailored
 *  branches forking off, and amber immutable-snapshot markers. */
function buildDag(rnd: () => number): DagScene {
  const nodes: DagNode[] = []
  const edges: DagScene['edges'] = []
  const laneY = [150, 88 + rnd() * 10, 204 + rnd() * 10]
  const mainCount = 7
  const mainIdx: number[] = []
  for (let i = 0; i < mainCount; i++) {
    nodes.push({
      x: 36 + (i * (W - 72)) / (mainCount - 1),
      y: laneY[0],
      main: true,
      snapshot: false,
      phase: rnd() * Math.PI * 2,
    })
    mainIdx.push(nodes.length - 1)
    if (i > 0) edges.push({ a: mainIdx[i - 1], b: mainIdx[i], branch: false })
  }
  for (let b = 0; b < 2; b++) {
    const forkAt = 1 + b * 2 + Math.floor(rnd() * 2)
    const y = laneY[b + 1]
    const count = 2 + Math.floor(rnd() * 2)
    let prev = mainIdx[forkAt]
    for (let i = 0; i < count; i++) {
      const x = clamp(nodes[mainIdx[forkAt]].x + (i + 1) * 52 + rnd() * 10, 36, W - 36)
      nodes.push({ x, y, main: false, snapshot: i === count - 1, phase: rnd() * Math.PI * 2 })
      edges.push({ a: prev, b: nodes.length - 1, branch: true })
      prev = nodes.length - 1
    }
    // The first branch merges back into a later main commit.
    if (b === 0) {
      const mergeAt = Math.min(mainCount - 1, forkAt + count + 1)
      edges.push({ a: prev, b: mainIdx[mergeAt], branch: true })
    }
  }
  return { kind: 'dag', nodes, edges }
}

function buildScene(variant: ProjectSlug, seed: string): Scene {
  const rnd = createSeededRandom(seed)
  switch (variant) {
    case 'ticket-forge':
      return buildRank(rnd)
    case 'trackfolio':
      return buildDag(rnd)
    case 'triplay-ai':
      return buildTree(rnd)
    case 'box-archive':
      return buildIso(rnd)
    case 'expense-share':
      return buildSankey(rnd)
    case 'calendar-java':
      return buildGrid(rnd)
    case 'ieee-mip-optimizer':
      return buildMip(rnd)
  }
}

/* --------------------------------------------------------------- renderers */

function drawTree(ctx: CanvasRenderingContext2D, scene: TreeScene, t: number, pal: Palette): void {
  const pos = (n: TreeNode): Pt => ({
    x: n.x + Math.sin(t * 0.6 + n.phase) * 3,
    y: n.y + Math.cos(t * 0.5 + n.phase * 1.7) * 2,
  })
  ctx.lineWidth = 1
  for (const e of scene.edges) {
    const a = pos(scene.nodes[e.from])
    const b = pos(scene.nodes[e.to])
    ctx.strokeStyle = e.pv ? pal.signal : pal.hairline
    ctx.globalAlpha = e.pv ? 0.55 : 0.9
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
  for (const n of scene.nodes) {
    const p = pos(n)
    ctx.fillStyle = n.depth % 2 === 0 ? pal.signal : pal.electron
    ctx.globalAlpha = 0.18 + n.a * 0.45
    const s = n.depth === 0 ? 4 : 3
    ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s)
  }
  ctx.globalAlpha = 1
}

function drawIso(ctx: CanvasRenderingContext2D, scene: IsoScene, t: number, pal: Palette): void {
  const iw = 26
  const ih = 13
  const bh = 20
  const cx = W / 2
  const cy = 96
  const px = (gx: number, gz: number) => cx + (gx - gz) * iw
  const py = (gx: number, gz: number) => cy + (gx + gz) * ih
  ctx.lineWidth = 1
  for (const s of scene.stacks) {
    const bob = Math.sin(t * 1.2 + s.phase) * 1.5
    for (let l = 0; l < s.h; l++) {
      const lift = (l + 1) * bh - bob
      const top: Pt[] = [
        { x: px(s.gx, s.gz), y: py(s.gx, s.gz) - lift },
        { x: px(s.gx + 1, s.gz), y: py(s.gx + 1, s.gz) - lift },
        { x: px(s.gx + 1, s.gz + 1), y: py(s.gx + 1, s.gz + 1) - lift },
        { x: px(s.gx, s.gz + 1), y: py(s.gx, s.gz + 1) - lift },
      ]
      const topmost = l === s.h - 1
      if (s.pulse && topmost) {
        ctx.fillStyle = pal.signal
        ctx.globalAlpha = 0.1 + 0.12 * (0.5 + 0.5 * Math.sin(t * 2 + s.phase))
        ctx.beginPath()
        top.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
        ctx.closePath()
        ctx.fill()
      }
      ctx.strokeStyle = s.hot && topmost ? pal.electron : pal.hairline
      ctx.globalAlpha = s.hot && topmost ? 0.7 : 0.9
      ctx.beginPath()
      top.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
      ctx.closePath()
      // Visible vertical edges (left, front, right corners).
      for (const corner of [top[0], top[1], top[3]]) {
        ctx.moveTo(corner.x, corner.y)
        ctx.lineTo(corner.x, corner.y + bh)
      }
      ctx.stroke()
    }
  }
  ctx.globalAlpha = 1
}

function drawSankey(
  ctx: CanvasRenderingContext2D,
  scene: SankeyScene,
  t: number,
  pal: Palette,
): void {
  const x0 = 48
  const x1 = 432
  const total = scene.bands.reduce((s, b) => s + b.w, 0)
  const accent = (name: SankeyBand['accent']) =>
    name === 'signal' ? pal.signal : name === 'magenta' ? pal.magenta : pal.electron
  let sy = (H - total) / 2
  ctx.lineWidth = 1
  for (const band of scene.bands) {
    const srcTop = sy
    sy += band.w
    const dstTop = band.y - band.w / 2
    const midX = (x0 + x1) / 2
    // Band edges (solid) + inner flow lines (dashed, drifting).
    const lines = 4
    for (let i = 0; i < lines; i++) {
      const f = i / (lines - 1)
      const yA = srcTop + f * band.w
      const yB = dstTop + f * band.w
      const edge = i === 0 || i === lines - 1
      if (edge) {
        ctx.setLineDash([])
        ctx.strokeStyle = accent(band.accent)
        ctx.globalAlpha = 0.45
      } else {
        ctx.setLineDash([6, 6])
        ctx.lineDashOffset = -t * 22
        ctx.strokeStyle = pal.signal
        ctx.globalAlpha = 0.3
      }
      ctx.beginPath()
      ctx.moveTo(x0, yA)
      ctx.bezierCurveTo(midX, yA, midX, yB, x1, yB)
      ctx.stroke()
    }
    ctx.setLineDash([])
    // Terminal bar at the destination.
    ctx.strokeStyle = pal.hairline
    ctx.globalAlpha = 0.9
    ctx.strokeRect(x1 + 4, dstTop, 4, band.w)
  }
  // Source bar.
  ctx.strokeStyle = pal.hairline
  ctx.globalAlpha = 0.9
  ctx.strokeRect(x0 - 8, (H - total) / 2, 4, total)
  ctx.globalAlpha = 1
}

function drawGrid(ctx: CanvasRenderingContext2D, scene: GridScene, t: number, pal: Palette): void {
  ctx.lineWidth = 1
  for (const cell of scene.cells) {
    const pulse = 0.7 + 0.3 * Math.sin(t * 1.4 + cell.a * Math.PI * 2)
    if (cell.a < 0.1) {
      ctx.fillStyle = pal.signal
      ctx.globalAlpha = 0.08 * pulse
      ctx.fillRect(cell.x + 1, cell.y + 1, cell.w - 2, cell.h - 2)
    }
    ctx.strokeStyle = cell.a > 0.92 ? pal.electron : pal.hairline
    ctx.globalAlpha = cell.a > 0.92 ? 0.5 * pulse : 0.9
    ctx.strokeRect(cell.x, cell.y, cell.w, cell.h)
  }
  ctx.globalAlpha = 1
}

function drawMip(ctx: CanvasRenderingContext2D, scene: MipScene, t: number, pal: Palette): void {
  const { hull, cuts, c, minD, maxD, opt } = scene
  ctx.lineWidth = 1
  // Constraint cuts: hull edges extended as faint dashed lines.
  ctx.setLineDash([4, 6])
  ctx.strokeStyle = pal.hairline
  ctx.globalAlpha = 0.8
  for (const cut of cuts) {
    const dx = cut.b.x - cut.a.x
    const dy = cut.b.y - cut.a.y
    const n = Math.hypot(dx, dy) || 1
    const ux = dx / n
    const uy = dy / n
    ctx.beginPath()
    ctx.moveTo(cut.a.x - ux * 600, cut.a.y - uy * 600)
    ctx.lineTo(cut.b.x + ux * 600, cut.b.y + uy * 600)
    ctx.stroke()
  }
  ctx.setLineDash([])
  // Feasible region.
  ctx.strokeStyle = pal.strong
  ctx.globalAlpha = 1
  ctx.beginPath()
  hull.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
  ctx.closePath()
  ctx.stroke()
  for (const p of hull) {
    ctx.fillStyle = pal.hairline
    ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3)
  }
  // Objective line sweeping toward the optimum (2.5s sweep, 3.5s hold, loops).
  const cycle = t % 6
  const p = Math.min(cycle / 2.5, 1)
  const eased = 1 - Math.pow(1 - p, 3)
  const s = minD + (maxD - minD) * eased
  const qx = c.x * s
  const qy = c.y * s
  ctx.strokeStyle = pal.electron
  ctx.globalAlpha = 0.7
  ctx.beginPath()
  ctx.moveTo(qx - -c.y * 600, qy - c.x * 600)
  ctx.lineTo(qx + -c.y * 600, qy + c.x * 600)
  ctx.stroke()
  // Optimum vertex pulses once the sweep converges.
  const r = p >= 1 ? 3 + 1.5 * Math.abs(Math.sin(t * 3)) : 3
  ctx.fillStyle = pal.signal
  ctx.globalAlpha = 0.9
  ctx.beginPath()
  ctx.arc(opt.x, opt.y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = pal.signal
  ctx.globalAlpha = 0.3
  ctx.beginPath()
  ctx.arc(opt.x, opt.y, r + 3, 0, Math.PI * 2)
  ctx.stroke()
  ctx.globalAlpha = 1
}

function drawRank(ctx: CanvasRenderingContext2D, scene: RankScene, t: number, pal: Palette): void {
  const drift = (p: { x: number; y: number; phase: number }): Pt => ({
    x: p.x + Math.sin(t * 0.5 + p.phase) * 3,
    y: p.y + Math.cos(t * 0.45 + p.phase * 1.6) * 2.5,
  })
  // Embedding-space field.
  for (const p of scene.field) {
    const q = drift(p)
    ctx.fillStyle = p.a > 0.7 ? pal.electron : pal.hairline
    ctx.globalAlpha = 0.25 + p.a * 0.4
    ctx.fillRect(q.x - 1.5, q.y - 1.5, 3, 3)
  }
  // Dashed similarity links: query → top-k.
  ctx.lineWidth = 1
  ctx.setLineDash([4, 5])
  ctx.lineDashOffset = -t * 16
  ctx.strokeStyle = pal.electron
  ctx.globalAlpha = 0.3
  for (const p of scene.top) {
    const q = drift(p)
    ctx.beginPath()
    ctx.moveTo(scene.query.x, scene.query.y)
    ctx.lineTo(q.x, q.y)
    ctx.stroke()
  }
  ctx.setLineDash([])
  // Top-k candidate points.
  scene.top.forEach((p, i) => {
    const q = drift(p)
    ctx.fillStyle = i === 0 ? pal.signal : pal.electron
    ctx.globalAlpha = 0.85 - i * 0.1
    ctx.fillRect(q.x - 2.5, q.y - 2.5, 5, 5)
  })
  // Query vector, ring pulsing.
  ctx.fillStyle = pal.signal
  ctx.globalAlpha = 0.95
  ctx.beginPath()
  ctx.arc(scene.query.x, scene.query.y, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = pal.signal
  ctx.globalAlpha = 0.3
  ctx.beginPath()
  ctx.arc(scene.query.x, scene.query.y, 8 + 2 * Math.sin(t * 2), 0, Math.PI * 2)
  ctx.stroke()
  // Ranked confidence-bar rail.
  const bx = 352
  const bw = 100
  scene.top.forEach((p, i) => {
    const y = 78 + i * 32
    ctx.strokeStyle = pal.hairline
    ctx.globalAlpha = 0.9
    ctx.strokeRect(bx, y, bw, 8)
    const pulse = i === 0 ? 0.75 + 0.25 * Math.sin(t * 2.4) : 1
    ctx.fillStyle = i === 0 ? pal.signal : pal.electron
    ctx.globalAlpha = (i === 0 ? 0.75 : 0.45) * pulse
    ctx.fillRect(bx + 1, y + 1, (bw - 2) * p.conf, 6)
  })
  ctx.globalAlpha = 1
}

function drawDag(ctx: CanvasRenderingContext2D, scene: DagScene, t: number, pal: Palette): void {
  ctx.lineWidth = 1
  for (const e of scene.edges) {
    const a = scene.nodes[e.a]
    const b = scene.nodes[e.b]
    if (e.branch) {
      ctx.setLineDash([5, 5])
      ctx.lineDashOffset = -t * 14
      ctx.strokeStyle = pal.electron
      ctx.globalAlpha = 0.45
      const mx = (a.x + b.x) / 2
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.bezierCurveTo(mx, a.y, mx, b.y, b.x, b.y)
      ctx.stroke()
      ctx.setLineDash([])
    } else {
      ctx.strokeStyle = pal.strong
      ctx.globalAlpha = 0.9
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    }
  }
  // HEAD pulse travelling the main lane.
  const mains = scene.nodes.filter((n) => n.main)
  const first = mains[0]
  const last = mains[mains.length - 1]
  const hx = first.x + (last.x - first.x) * ((t * 0.25) % 1)
  ctx.fillStyle = pal.signal
  ctx.globalAlpha = 0.5
  ctx.beginPath()
  ctx.arc(hx, first.y, 2.5, 0, Math.PI * 2)
  ctx.fill()
  // Commit nodes + immutable-snapshot markers.
  for (const n of scene.nodes) {
    if (n.snapshot) {
      ctx.strokeStyle = pal.amber
      ctx.globalAlpha = 0.9
      ctx.strokeRect(n.x - 3.5, n.y - 3.5, 7, 7)
      const halo = 6 + 2 * Math.sin(t * 2 + n.phase)
      ctx.globalAlpha = 0.25
      ctx.strokeRect(n.x - halo, n.y - halo, halo * 2, halo * 2)
    } else {
      ctx.fillStyle = n.main ? pal.signal : pal.electron
      ctx.globalAlpha = n.main ? 0.9 : 0.7
      ctx.beginPath()
      ctx.arc(n.x, n.y, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = pal.hairline
      ctx.globalAlpha = 0.9
      ctx.beginPath()
      ctx.arc(n.x, n.y, 5.5, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
  ctx.globalAlpha = 1
}

function drawScene(ctx: CanvasRenderingContext2D, scene: Scene, t: number, pal: Palette): void {
  ctx.clearRect(0, 0, W, H)
  switch (scene.kind) {
    case 'tree':
      drawTree(ctx, scene, t, pal)
      break
    case 'iso':
      drawIso(ctx, scene, t, pal)
      break
    case 'sankey':
      drawSankey(ctx, scene, t, pal)
      break
    case 'grid':
      drawGrid(ctx, scene, t, pal)
      break
    case 'mip':
      drawMip(ctx, scene, t, pal)
      break
    case 'rank':
      drawRank(ctx, scene, t, pal)
      break
    case 'dag':
      drawDag(ctx, scene, t, pal)
      break
  }
}

/* -------------------------------------------------------------- component */

export default function GenerativePlate({ variant, seed, animate = false }: GenerativePlateProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const tRef = useRef(0)
  const reduced = usePrefersReducedMotion()
  const [touch, setTouch] = useState(false)
  const [visible, setVisible] = useState(false)

  const scene = useMemo(() => buildScene(variant, seed), [variant, seed])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    drawScene(ctx, scene, tRef.current, readPalette())
  }, [scene])

  const drawRef = useRef(draw)
  drawRef.current = draw

  // Touch detection (static plates on touch, §5.8) — reduced-motion matchMedia
  // is banned, pointer capability queries are not.
  useEffect(() => {
    setTouch(window.matchMedia('(hover: none), (pointer: coarse)').matches)
  }, [])

  // Canvas setup + static first frame (re-runs when the scene changes).
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    tRef.current = 0
    draw()
  }, [draw])

  // Re-render the static frame when the edition flips (canvas colours are live tokens).
  useEffect(() => {
    const observer = new MutationObserver(() => drawRef.current())
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-edition'],
    })
    return () => observer.disconnect()
  }, [])

  // Off-screen pause (§6.4 rule 5).
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver((entries) =>
      setVisible(entries.some((e) => e.isIntersecting)),
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // 30fps animation on the shared ticker, only while hovered/running + on-screen.
  useEffect(() => {
    if (!animate || reduced || touch || !visible) return
    let acc = 0
    return subscribeTicker((dtMs) => {
      acc += dtMs
      if (acc < FRAME_MS) return
      tRef.current += acc / 1000
      acc = 0
      drawRef.current()
    })
  }, [animate, reduced, touch, visible])

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      aria-hidden="true"
      className="block h-full w-full"
    />
  )
}
