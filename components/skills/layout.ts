/**
 * v3 system-diagram geometry — ONE DOM, TWO plans.
 *
 * SCREEN (S3 §2 F1a–F1d, §5 "Wires"): the frame's diagram `.dg`, 826 × 492,
 * seven trays with 128 × 30 tiles on a 36 px row pitch, six steel wires with
 * junction dots and chevrons, a Languages strip, and a leader from the shown
 * tile to the inspector.
 *
 * PRINT (P3 §2 C1b–C1e, §5 "Wires"): the schematic panel's padding box,
 * 880 × 664, the same seven trays as tinted group boxes plus the DevOps and
 * Languages rails, ten dashed ink wires with arrowheads, and a callout arrow
 * from the schematic's right edge into the close-up.
 *
 * The trays are absolutely positioned by CSS from per-edition custom
 * properties (`--sx --sy --sw --sh` / `--px --py --pw --ph`, written inline
 * by SystemDiagram.client from the rects below), and both wire layers are
 * rendered; styles/v3/skills.css shows one plan per edition. Below 1200 px
 * both editions stack the trays in TRAY_STACK_ORDER (no wires).
 *
 * Capacity is asserted by tests/skills.test.ts: no tray overflows its box in
 * either plan.
 */

import type { SkillClusterId, SkillTrayId } from '@/lib/data/skills'
import { createSeededRandom } from '@/lib/utils/seeded'

/* ------------------------------------------------------------------------- */
/* SCREEN plan                                                               */
/* ------------------------------------------------------------------------- */

export const DIAGRAM_W = 826
export const DIAGRAM_H = 492

/** Tile box (S3 §2 F1b). */
export const TILE_W = 128
export const TILE_H = 30
/** Row pitch (tile height + 6 px gap). */
export const TILE_PITCH = 36
/** Column pitch inside a two-column tray (128 + 8). */
export const TILE_COL_PITCH = 136
/** Inset from the tray edge to the first tile. */
export const TILE_INSET = 8
/** Height of the tray label row (tiles start at tray.y + 32). */
export const TRAY_LABEL_H = 32

export interface TrayRect {
  x: number
  y: number
  w: number
  h: number
}

/** The seven trays (dg-relative px, S3 §2 F1a). */
export const TRAY_RECTS: Record<SkillClusterId, TrayRect> = {
  frontend: { x: 0, y: 0, w: 144, h: 214 },
  backend: { x: 182, y: 0, w: 280, h: 214 },
  data: { x: 500, y: 0, w: 144, h: 214 },
  monitoring: { x: 682, y: 0, w: 144, h: 214 },
  testing: { x: 0, y: 248, w: 144, h: 178 },
  devops: { x: 182, y: 248, w: 280, h: 178 },
  cloud: { x: 500, y: 248, w: 144, h: 178 },
}

/** Tile columns per tray (Backend and DevOps are two columns). */
export const TRAY_COLS: Record<SkillClusterId, 1 | 2> = {
  frontend: 1,
  backend: 2,
  data: 1,
  monitoring: 1,
  testing: 1,
  devops: 2,
  cloud: 1,
}

/** The Languages strip (S3 §2 F1c): label at x 8, tiles from x 96, y 462. */
export const LANG_ROW = { x: 0, y: 462, w: DIAGRAM_W, h: 30, labelW: 96 } as const

/** How many tiles a SCREEN tray holds without overflowing its box. */
export function trayCapacity(id: SkillClusterId): number {
  const rect = TRAY_RECTS[id]
  const rows = Math.floor((rect.h - TRAY_LABEL_H - TILE_INSET + (TILE_PITCH - TILE_H)) / TILE_PITCH)
  return rows * TRAY_COLS[id]
}

/* ------------------------------------------------------------------------- */
/* PRINT plan                                                                */
/* ------------------------------------------------------------------------- */

export const PRINT_DIAGRAM_W = 880
export const PRINT_DIAGRAM_H = 664

/** Sticker box inside a group (P3 §5): 28 px inner + 3.5 px die-cut margin. */
export const STICKER_H = 35
/** Row / column gap between stickers. */
export const STICKER_GAP = 8
/** Group header bar height + its gap to the first row (P3 §2 C1b). */
export const PRINT_GROUP_HEAD_H = 38

/** The seven groups (panel-relative px, P3 §2 C1b–C1d; DevOps is the rail). */
export const TRAY_RECTS_PRINT: Record<SkillClusterId, TrayRect> = {
  frontend: { x: 20, y: 60, w: 126, h: 176 },
  backend: { x: 198, y: 60, w: 350, h: 176 },
  data: { x: 600, y: 60, w: 260, h: 176 },
  testing: { x: 20, y: 280, w: 244, h: 133 },
  monitoring: { x: 316, y: 280, w: 256, h: 133 },
  cloud: { x: 660, y: 280, w: 200, h: 133 },
  devops: { x: 20, y: 472, w: 840, h: 57 },
}

/** The Languages rail (P3 §2 C1e). */
export const LANG_ROW_PRINT = { x: 20, y: 584, w: 840, h: 57 } as const

/**
 * Sticker rows a PRINT group can hold (the rails hold one row). Stickers are
 * auto-width, so capacity is checked as rows × the frame's stickers-per-row
 * (P3 §2: Frontend 1, Backend 3, Data 2, Testing 2, Monitoring 2, Cloud 2).
 */
export const PRINT_PER_ROW: Record<SkillClusterId, number> = {
  frontend: 1,
  backend: 3,
  data: 2,
  testing: 2,
  monitoring: 2,
  cloud: 2,
  devops: 7,
}

export function printTrayCapacity(id: SkillClusterId): number {
  const rect = TRAY_RECTS_PRINT[id]
  if (id === 'devops') return PRINT_PER_ROW.devops
  const rows = Math.floor((rect.h - PRINT_GROUP_HEAD_H + STICKER_GAP) / (STICKER_H + STICKER_GAP))
  return rows * PRINT_PER_ROW[id]
}

/**
 * Deterministic sticker tilt (P3 §9.16): seeded from the skill id, ±1.6°,
 * identical on the server and the client. SCREEN ignores it.
 */
export function stickerTilt(id: string): number {
  const r = createSeededRandom(`sticker:${id}`)()
  return Math.round((r * 3.2 - 1.6) * 10) / 10
}

/* ------------------------------------------------------------------------- */
/* Orders                                                                    */
/* ------------------------------------------------------------------------- */

/**
 * DOM / reading order of the trays on desktop and the vertical stack below
 * 1200 px (S3 phone recommendation: Frontend → Backend → Data → Testing →
 * DevOps → Cloud → Monitoring → Languages).
 */
export const TRAY_STACK_ORDER: readonly SkillClusterId[] = [
  'frontend',
  'backend',
  'data',
  'testing',
  'devops',
  'cloud',
  'monitoring',
]

/**
 * "Light up the toolkit" order per edition. SCREEN follows the wires
 * (S3 motion note): Frontend → Backend → Data, Backend ↓ DevOps → Cloud,
 * then the dashed rails Testing → DevOps and Cloud ↑ Monitoring, Languages
 * last. PRINT lights bottom-up (P3 motion note): Languages, DevOps, then
 * Testing / Monitoring / Cloud, then Frontend / Backend / Data.
 */
export const LIGHT_ORDER: Record<'screen' | 'print', readonly SkillTrayId[]> = {
  screen: ['frontend', 'backend', 'data', 'devops', 'cloud', 'testing', 'monitoring', 'languages'],
  print: ['languages', 'devops', 'testing', 'monitoring', 'cloud', 'frontend', 'backend', 'data'],
}

/** Stagger between two trays lighting up (S3: the sequence lands in ≈ 2.4 s). */
export const LIGHT_STEP_MS = 240
/** After the last tray: the active tile settles, the leader traces. */
export const LIGHT_SETTLE_MS = 420

/* ------------------------------------------------------------------------- */
/* Wires                                                                     */
/* ------------------------------------------------------------------------- */

export interface DiagramWire {
  id: string
  from: SkillTrayId
  to: SkillTrayId
  /** Wire path in diagram units (from the junction dot to the arrow). */
  d: string
  /** Junction dot at the source tray's edge. */
  junction: { x: number; y: number }
  /** Arrowhead path at the far end. */
  chevron: string
  /** The two SCREEN rails are dashed (S3 §5); every PRINT wire is dashed. */
  dashed?: boolean
}

const chevronRight = (x: number, y: number) =>
  `M ${x - 3.5} ${y - 3.5} L ${x} ${y} L ${x - 3.5} ${y + 3.5}`
const chevronDown = (x: number, y: number) =>
  `M ${x - 3.5} ${y - 3.5} L ${x} ${y} L ${x + 3.5} ${y - 3.5}`
const chevronUp = (x: number, y: number) =>
  `M ${x - 3.5} ${y + 3.5} L ${x} ${y} L ${x + 3.5} ${y + 3.5}`

/** The six wires of the S3 frame (§5 "Wires"), in SCREEN draw-on order. */
export const WIRES: readonly DiagramWire[] = [
  {
    id: 'frontend-backend',
    from: 'frontend',
    to: 'backend',
    d: 'M 147 107 H 180.5',
    junction: { x: 144, y: 107 },
    chevron: chevronRight(180.5, 107),
  },
  {
    id: 'backend-data',
    from: 'backend',
    to: 'data',
    d: 'M 465 107 H 498.5',
    junction: { x: 462, y: 107 },
    chevron: chevronRight(498.5, 107),
  },
  {
    id: 'backend-devops',
    from: 'backend',
    to: 'devops',
    d: 'M 322 217 V 246.5',
    junction: { x: 322, y: 214 },
    chevron: chevronDown(322, 246.5),
  },
  {
    id: 'devops-cloud',
    from: 'devops',
    to: 'cloud',
    d: 'M 465 337 H 498.5',
    junction: { x: 462, y: 337 },
    chevron: chevronRight(498.5, 337),
  },
  {
    id: 'testing-devops',
    from: 'testing',
    to: 'devops',
    d: 'M 147 337 H 180.5',
    junction: { x: 144, y: 337 },
    chevron: chevronRight(180.5, 337),
    dashed: true,
  },
  {
    id: 'cloud-monitoring',
    from: 'cloud',
    to: 'monitoring',
    d: 'M 647 337 H 748 Q 754 337 754 331 V 215.5',
    junction: { x: 644, y: 337 },
    chevron: chevronUp(754, 215.5),
    dashed: true,
  },
]

/* PRINT arrowheads are filled 8 × 10 ink polygons (P3 §5). */
const arrowRight = (x: number, y: number) => `M ${x} ${y - 5} L ${x + 8} ${y} L ${x} ${y + 5} Z`
const arrowUp = (x: number, y: number) => `M ${x - 5} ${y} L ${x} ${y - 8} L ${x + 5} ${y} Z`

/** The ten dashed ink wires of the P3 frame (§5 "Wires"), bottom-up flow. */
export const WIRES_PRINT: readonly DiagramWire[] = [
  {
    id: 'p-frontend-backend',
    from: 'frontend',
    to: 'backend',
    d: 'M 146 118 H 190',
    junction: { x: 146, y: 118 },
    chevron: arrowRight(190, 118),
    dashed: true,
  },
  {
    id: 'p-backend-data',
    from: 'backend',
    to: 'data',
    d: 'M 548 118 H 592',
    junction: { x: 548, y: 118 },
    chevron: arrowRight(592, 118),
    dashed: true,
  },
  {
    id: 'p-testing-frontend',
    from: 'testing',
    to: 'frontend',
    d: 'M 84 280 V 244',
    junction: { x: 84, y: 280 },
    chevron: arrowUp(84, 244),
    dashed: true,
  },
  {
    id: 'p-monitoring-backend',
    from: 'monitoring',
    to: 'backend',
    d: 'M 444 280 V 244',
    junction: { x: 444, y: 280 },
    chevron: arrowUp(444, 244),
    dashed: true,
  },
  {
    id: 'p-cloud-data',
    from: 'cloud',
    to: 'data',
    d: 'M 760 280 V 244',
    junction: { x: 760, y: 280 },
    chevron: arrowUp(760, 244),
    dashed: true,
  },
  {
    id: 'p-devops-testing',
    from: 'devops',
    to: 'testing',
    d: 'M 160 472 V 421',
    junction: { x: 160, y: 472 },
    chevron: arrowUp(160, 421),
    dashed: true,
  },
  {
    id: 'p-devops-monitoring',
    from: 'devops',
    to: 'monitoring',
    d: 'M 444 472 V 421',
    junction: { x: 444, y: 472 },
    chevron: arrowUp(444, 421),
    dashed: true,
  },
  {
    id: 'p-devops-cloud',
    from: 'devops',
    to: 'cloud',
    d: 'M 760 472 V 421',
    junction: { x: 760, y: 472 },
    chevron: arrowUp(760, 421),
    dashed: true,
  },
  {
    id: 'p-languages-devops-a',
    from: 'languages',
    to: 'devops',
    d: 'M 300 584 V 537',
    junction: { x: 300, y: 584 },
    chevron: arrowUp(300, 537),
    dashed: true,
  },
  {
    id: 'p-languages-devops-b',
    from: 'languages',
    to: 'devops',
    d: 'M 620 584 V 537',
    junction: { x: 620, y: 584 },
    chevron: arrowUp(620, 537),
    dashed: true,
  },
]

/** Wires touching a tray in a plan (hover/focus lights "that tile's tray wires"). */
export function wiresOf(
  tray: SkillTrayId,
  plan: readonly DiagramWire[] = WIRES
): readonly DiagramWire[] {
  return plan.filter((w) => w.from === tray || w.to === tray)
}

/* ------------------------------------------------------------------------- */
/* Leader (SCREEN)                                                           */
/* ------------------------------------------------------------------------- */

/** Gap between the diagram's right edge and the inspector's left edge (px) — the SCREEN stage's flex gap. */
export const LEADER_REACH = 24

/**
 * Corridors the leader may travel along to reach the inspector (the gaps
 * between the tiers and above the Languages strip), in diagram units.
 */
export const LEADER_CORRIDORS = { tier1: 231, tier2: 446 } as const

/**
 * Route the leader from a tile (its box in diagram units, measured by the
 * client) to the inspector's left edge, along the gaps: out of the tile to
 * the nearest inter-tray gap, down to the corridor below its tier, then
 * right past the diagram's edge. Languages tiles rise into the corridor
 * above them (the frame's Python leader). Returns the path and the y the
 * tail lands on (the inspector's tick sits at that y).
 */
export function leaderPath(
  tray: SkillTrayId,
  tile: { x: number; y: number; w: number; h: number }
): { d: string; y: number } {
  const midY = tile.y + tile.h / 2
  const edge = DIAGRAM_W + LEADER_REACH
  if (tray === 'languages') {
    const cx = tile.x + tile.w / 2
    const y = LEADER_CORRIDORS.tier2
    return { d: `M ${cx} ${tile.y} V ${y + 6} Q ${cx} ${y} ${cx + 6} ${y} H ${edge}`, y }
  }
  const rect = TRAY_RECTS[tray]
  // Rightmost tray: straight out to the edge at the tile's own height.
  if (rect.x + rect.w >= DIAGRAM_W) {
    return { d: `M ${tile.x + tile.w} ${midY} H ${edge}`, y: midY }
  }
  // Two-column trays exit left from the first column, right from the second.
  const exitLeft = TRAY_COLS[tray] === 2 && tile.x < rect.x + rect.w / 2
  const gapX = exitLeft ? rect.x - 19 : rect.x + rect.w + 19
  const exitX = exitLeft ? tile.x : tile.x + tile.w
  const corridor = rect.y === 0 ? LEADER_CORRIDORS.tier1 : LEADER_CORRIDORS.tier2
  const r = 6
  const turn = exitLeft ? gapX + r : gapX - r
  return {
    d:
      `M ${exitX} ${midY} H ${turn} Q ${gapX} ${midY} ${gapX} ${midY + r} ` +
      `V ${corridor - r} Q ${gapX} ${corridor} ${gapX + r} ${corridor} H ${edge}`,
    y: corridor,
  }
}

/**
 * PRINT callout (P3 §5): a red dot, a line and an arrowhead from the
 * schematic's right edge into the close-up, at the shown sticker's height.
 * 80 × 24, drawn at the diagram's right edge; only `y` moves.
 */
export const PRINT_CALLOUT = { w: 80, h: 24, reach: 24 } as const
