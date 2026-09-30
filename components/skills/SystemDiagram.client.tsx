'use client'

/**
 * v3 system diagram — the Skills island (S3 "INSTRUMENTS" / P3 "THE TOOLKIT").
 * SSRs the complete markup (tiles are real <button>s, the wire layers are
 * aria-hidden SVGs, the usage map is a list of real controls), then hydrates:
 *
 * - selection: a tile click selects a skill (aria-pressed); hover / focus
 *   previews it; the inspector beside the diagram shows the shown skill and
 *   the leader (SCREEN) / callout (PRINT) re-routes to its tile. Python is
 *   selected at rest (S3 §4). `SIGNAL_EVENTS.inspectSkill` (palette
 *   `skill-<id>`) selects too, consuming the palette's store focus.
 * - "Light up the toolkit": the tray-by-tray sequence (LIGHT_ORDER per
 *   edition, ≈ 180 ms a tray, ≈ 2.4 s), also fired by SIGNAL_EVENTS.deployAll
 *   (palette / terminal `deploy-all`, the guide). Dispatches the guide's
 *   `light-toolkit` completion at start; ONE aria-live announcement at the
 *   end. Reduced motion: the final state at once.
 * - both window events are heard by the always-mounted SystemDiagramIsland
 *   wrapper and arrive here as the `request` prop (director call (m)): a
 *   dispatch before this chunk mounted still lands.
 * - "Where I've used them": choosing a row lights that place's tools in the
 *   diagram and dims the rest; chips select their skill.
 * - store.focusedSkills (the Experience panel's hover, the palette) marks
 *   tiles [data-blamed]; this island never writes [] to it on mount, so the
 *   two focus sources coexist (v3 gotcha).
 *
 * Geometry: ./layout (SCREEN 826 × 492, PRINT 880 × 664; both plans on one
 * DOM via CSS custom properties). Skins: styles/v3/skills.css.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  USAGE_PLACES,
  getSkill,
  languages,
  skillClusters,
  skillsUsedAt,
  usageRows,
  type Skill,
  type SkillCluster,
  type SkillTrayId,
  type UsagePlaceId,
} from '@/lib/data/skills'
import { EDITION_ATTR, getCurrentEdition } from '@/lib/commands/context'
import { useSignalStore } from '@/lib/state/store'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'
import { trackEvent } from '@/lib/utils/analytics'
import EdLogo from './EdLogo'
import Inspector from './Inspector'
import { DEFAULT_SKILL_ID, SKILLS_COPY } from './copy'
import { markGuideTried, type DiagramRequest } from './guide'
import {
  DIAGRAM_H,
  DIAGRAM_W,
  LANG_ROW,
  LANG_ROW_PRINT,
  LEADER_REACH,
  LIGHT_ORDER,
  LIGHT_SETTLE_MS,
  LIGHT_STEP_MS,
  PRINT_CALLOUT,
  PRINT_DIAGRAM_H,
  PRINT_DIAGRAM_W,
  TRAY_COLS,
  TRAY_RECTS,
  TRAY_RECTS_PRINT,
  TRAY_STACK_ORDER,
  WIRES,
  WIRES_PRINT,
  leaderPath,
  stickerTilt,
  type DiagramWire,
  type TrayRect,
} from './layout'

/** Trays in DOM / stack order (desktop positions come from the rects). */
const orderedClusters: readonly SkillCluster[] = TRAY_STACK_ORDER.map((id) =>
  skillClusters.find((c) => c.id === id)
).filter((c): c is SkillCluster => c !== undefined)

const rows = usageRows()

/** Both plans' boxes as CSS custom properties on one element. */
function planVars(screen: TrayRect, print: TrayRect): CSSProperties {
  return {
    ['--sx' as string]: `${screen.x}px`,
    ['--sy' as string]: `${screen.y}px`,
    ['--sw' as string]: `${screen.w}px`,
    ['--sh' as string]: `${screen.h}px`,
    ['--px' as string]: `${print.x}px`,
    ['--py' as string]: `${print.y}px`,
    ['--pw' as string]: `${print.w}px`,
    ['--ph' as string]: `${print.h}px`,
  }
}

function Tile({
  skill,
  index,
  active,
  shown,
  lit,
  blamed,
  onSelect,
  onPreview,
}: {
  skill: Skill
  index: number
  active: boolean
  /** Selected or previewed — the colour logo + champagne outline. */
  shown: boolean
  /** Lit by the light-up sequence or a usage row. */
  lit: boolean
  /** In store.focusedSkills (the Experience panel / palette), not selected. */
  blamed: boolean
  onSelect: (id: string) => void
  onPreview: (id: string | null) => void
}) {
  return (
    <button
      type="button"
      className="sk-tile"
      data-skill-id={skill.id}
      data-tray={skill.cluster}
      data-shown={shown ? 'true' : undefined}
      data-lit={lit ? 'true' : undefined}
      data-blamed={blamed ? 'true' : undefined}
      aria-pressed={active}
      aria-label={SKILLS_COPY.tileName(skill.label)}
      style={{ ['--i' as string]: index, ['--r' as string]: `${stickerTilt(skill.id)}deg` }}
      onClick={() => onSelect(skill.id)}
      onPointerEnter={() => onPreview(skill.id)}
      onPointerLeave={() => onPreview(null)}
      onFocus={() => onPreview(skill.id)}
      onBlur={() => onPreview(null)}
    >
      <EdLogo id={skill.id} size={18} />
      <span className="sk-tile-name">{skill.label}</span>
    </button>
  )
}

function WireLayer({
  plan,
  width,
  height,
  lit,
  hotTray,
  className,
  junctionR,
}: {
  plan: readonly DiagramWire[]
  width: number
  height: number
  lit: ReadonlySet<SkillTrayId>
  hotTray: SkillTrayId | null
  className: string
  /** Junction dot radius (SCREEN 2.25, PRINT 4). */
  junctionR: number
}) {
  return (
    <svg
      className={`sk-wires ${className}`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      focusable="false"
    >
      {plan.map((w) => (
        <g
          key={w.id}
          className="sk-wire"
          data-dashed={w.dashed ? 'true' : undefined}
          data-lit={lit.has(w.to) ? 'true' : undefined}
          data-hot={
            hotTray !== null && (w.from === hotTray || w.to === hotTray) ? 'true' : undefined
          }
        >
          <path className="sk-wire-path" d={w.d} />
          {/* The lit / hot overlay draws on from the junction (pathLength 1 → dashoffset 1 → 0). */}
          <path className="sk-wire-lit" d={w.d} pathLength={1} />
          <circle className="sk-wire-junction" cx={w.junction.x} cy={w.junction.y} r={junctionR} />
          <path className="sk-wire-arrow" d={w.chevron} />
        </g>
      ))}
    </svg>
  )
}

export interface SystemDiagramProps {
  /** The latest deploy-all / inspect-skill event the island wrapper heard (null = none yet). */
  request: DiagramRequest | null
}

export default function SystemDiagram({ request }: SystemDiagramProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const diagramRef = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()
  const reducedRef = useRef(reduced)
  reducedRef.current = reduced

  const [mounted, setMounted] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(DEFAULT_SKILL_ID)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [usagePlace, setUsagePlace] = useState<UsagePlaceId | null>(null)
  const [lit, setLit] = useState<readonly SkillTrayId[]>([])
  const [lighting, setLighting] = useState(false)
  const [announce, setAnnounce] = useState('')
  const [leader, setLeader] = useState<{ d: string; y: number } | null>(null)
  const [calloutY, setCalloutY] = useState<number | null>(null)
  const focusedSkills = useSignalStore((s) => s.focusedSkills)

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

  const shownId = previewId ?? activeId
  const shownSkill = shownId ? (getSkill(shownId) ?? null) : null
  const shownTray: SkillTrayId | null = shownSkill?.cluster ?? null
  const litSet = new Set<SkillTrayId>(lit)
  const usageSkills = new Set(usagePlace ? skillsUsedAt(usagePlace).map((s) => s.id) : [])

  /* ---- selection ------------------------------------------------------- */

  const select = useCallback((id: string) => {
    if (!getSkill(id)) return
    setActiveId(id)
    setPreviewId(null)
    setUsagePlace(null)
    setLit([])
    setSheetOpen(true)
  }, [])

  const preview = useCallback((id: string | null) => {
    setPreviewId(id)
  }, [])

  const close = useCallback(() => {
    setSheetOpen(false)
    setPreviewId(null)
    setActiveId((current) => {
      if (current) {
        const btn = rootRef.current?.querySelector<HTMLButtonElement>(
          `[data-skill-id="${current}"]`
        )
        window.setTimeout(() => btn?.focus({ preventScroll: true }), 0)
      }
      return null
    })
  }, [])

  const toggleRow = useCallback((place: UsagePlaceId) => {
    setUsagePlace((current) => (current === place ? null : place))
    setLit([])
  }, [])

  /* ---- "Light up the toolkit" ------------------------------------------ */

  const runLightUp = useCallback(() => {
    if (runningRef.current || typeof window === 'undefined') return
    runningRef.current = true
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []
    const later = (fn: () => void, ms: number) => {
      timersRef.current.push(window.setTimeout(fn, ms))
    }

    markGuideTried('light-toolkit')
    trackEvent('deploy_all')

    const order = LIGHT_ORDER[getCurrentEdition()]
    setLit([])
    setUsagePlace(null)
    setPreviewId(null)
    setActiveId(null)
    setAnnounce('')

    const finish = () => {
      setActiveId(DEFAULT_SKILL_ID)
      setLighting(false)
      setAnnounce(SKILLS_COPY.lightUpDone)
      runningRef.current = false
    }

    if (reducedRef.current) {
      setLit([...order])
      finish()
      return
    }
    setLighting(true)
    order.forEach((tray, i) => {
      later(
        () => setLit((prev) => (prev.includes(tray) ? prev : [...prev, tray])),
        40 + i * LIGHT_STEP_MS
      )
    })
    later(finish, 40 + order.length * LIGHT_STEP_MS + LIGHT_SETTLE_MS)
  }, [])

  /* Requests queued by SystemDiagramIsland: `light` (SIGNAL_EVENTS.deployAll)
     runs the sequence; `inspect` (the palette's `skill-<id>` deep-link)
     selects the skill and consumes the store focus the command wrote (it is
     the same skill), so the Experience panel's focus source stays separate. */
  useEffect(() => {
    if (!request) return
    if (request.kind === 'light') {
      runLightUp()
      return
    }
    const id = request.id
    if (!getSkill(id)) return
    const store = useSignalStore.getState()
    if (store.focusedSkills.length === 1 && store.focusedSkills[0] === id)
      store.setFocusedSkills([])
    select(id)
  }, [request, runLightUp, select])

  /* ---- leader (SCREEN) / callout (PRINT): measured from the shown tile --- */

  useEffect(() => {
    const diagram = diagramRef.current
    if (!diagram) return
    const measure = () => {
      if (!shownId || !window.matchMedia('(min-width: 1200px)').matches) {
        setLeader(null)
        setCalloutY(null)
        return
      }
      const tile = diagram.querySelector<HTMLElement>(`[data-skill-id="${shownId}"]`)
      if (!tile) return
      const box = diagram.getBoundingClientRect()
      const r = tile.getBoundingClientRect()
      const rect = { x: r.left - box.left, y: r.top - box.top, w: r.width, h: r.height }
      const tray = getSkill(shownId)?.cluster
      if (!tray) return
      if (getCurrentEdition() === 'print') {
        setLeader(null)
        setCalloutY(rect.y + rect.h / 2)
      } else {
        setCalloutY(null)
        setLeader(leaderPath(tray, rect))
      }
    }
    measure()
    const observer = new MutationObserver(measure)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [EDITION_ATTR],
    })
    window.addEventListener('resize', measure)
    if ('fonts' in document) document.fonts.ready.then(measure).catch(() => {})
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [shownId])

  const hotTray = previewId ? (getSkill(previewId)?.cluster ?? null) : null
  const rootStyle: CSSProperties = {
    ['--leader-y' as string]: leader ? `${leader.y}px` : '0px',
  }

  return (
    <div
      ref={rootRef}
      className="sk-diagram-root"
      data-component="SystemDiagram"
      data-island="client"
      data-lighting={lighting ? 'true' : undefined}
      data-lit={lit.length > 0 ? 'true' : undefined}
      data-usage={usagePlace ? 'true' : undefined}
      data-shown-tray={shownTray ?? undefined}
      style={rootStyle}
    >
      <div className="sk-stage-wrap">
        {/* The ONE primary action. JS-only (no-JS never sees a dead control);
            its slot is absolute in both editions, so nothing shifts. */}
        <div className="sk-light-slot">
          {mounted ? (
            <button
              type="button"
              className="sk-light-up ed-btn ed-btn-primary"
              data-surface="btn-primary"
              data-guide-anchor="light-toolkit"
              onClick={runLightUp}
              disabled={lighting}
            >
              <span aria-hidden="true" className="sk-light-bolt ed-print-only">
                <svg width="14" height="18" viewBox="0 0 14 18" focusable="false">
                  <path
                    d="M8 1 2 10h4l-1 7 7-10H8l1-6z"
                    fill="var(--accent-amber)"
                    stroke="var(--text-primary)"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              {SKILLS_COPY.lightUp}
              <svg
                className="sk-light-arrow ed-screen-only"
                width="14"
                height="10"
                viewBox="0 0 14 10"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M0 5h12M8 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </button>
          ) : null}
          <p className="sr-only" role="status">
            {announce}
          </p>
        </div>

        <div className="sk-stage" data-surface="stage">
          {/* SCREEN stage decor (S3 §6): dot grid, top light, floor, vignette, rim. */}
          <div aria-hidden="true" className="sk-grid ed-screen-only" />
          <div aria-hidden="true" className="sk-toplight ed-screen-only" />
          <div aria-hidden="true" className="sk-floor ed-screen-only" />
          <div aria-hidden="true" className="sk-vignette ed-screen-only" />
          <div aria-hidden="true" className="sk-rim ed-screen-only" />

          <div className="sk-schem">
            {/* PRINT narrator caption pinned to the schematic's corner. */}
            <p className="sk-caption ed-cap ed-print-only" aria-hidden="true">
              {SKILLS_COPY.printCaption}
            </p>
            <div
              ref={diagramRef}
              className="sk-diagram"
              role="group"
              aria-label={SKILLS_COPY.diagramLabel}
              style={{
                ...planVars(
                  { x: 0, y: 0, w: DIAGRAM_W, h: DIAGRAM_H },
                  { x: 0, y: 0, w: PRINT_DIAGRAM_W, h: PRINT_DIAGRAM_H }
                ),
              }}
            >
              <WireLayer
                plan={WIRES}
                width={DIAGRAM_W}
                height={DIAGRAM_H}
                lit={litSet}
                hotTray={hotTray}
                className="sk-wires--screen ed-screen-only"
                junctionR={2.25}
              />
              <WireLayer
                plan={WIRES_PRINT}
                width={PRINT_DIAGRAM_W}
                height={PRINT_DIAGRAM_H}
                lit={litSet}
                hotTray={hotTray}
                className="sk-wires--print ed-print-only"
                junctionR={4}
              />

              {orderedClusters.map((cluster) => (
                <div
                  key={cluster.id}
                  className="sk-tray"
                  role="group"
                  aria-label={cluster.label}
                  data-tray={cluster.id}
                  data-lit={litSet.has(cluster.id) ? 'true' : undefined}
                  data-hot={hotTray === cluster.id ? 'true' : undefined}
                  style={{
                    ...planVars(TRAY_RECTS[cluster.id], TRAY_RECTS_PRINT[cluster.id]),
                    ['--cols' as string]: TRAY_COLS[cluster.id],
                  }}
                >
                  <p className="sk-tray-label" aria-hidden="true">
                    {cluster.label}
                  </p>
                  <div className="sk-tray-tiles">
                    {cluster.nodes.map((node, i) => (
                      <Tile
                        key={node.id}
                        skill={node}
                        index={i}
                        active={node.id === activeId}
                        shown={node.id === shownId}
                        lit={usageSkills.has(node.id)}
                        blamed={focusedSkills.includes(node.id) && node.id !== activeId}
                        onSelect={select}
                        onPreview={preview}
                      />
                    ))}
                  </div>
                </div>
              ))}

              <div
                className="sk-tray sk-tray--lang"
                role="group"
                aria-label={SKILLS_COPY.languages}
                data-tray="languages"
                data-lit={litSet.has('languages') ? 'true' : undefined}
                data-hot={hotTray === 'languages' ? 'true' : undefined}
                style={{
                  ...planVars(LANG_ROW, LANG_ROW_PRINT),
                  ['--cols' as string]: languages.length,
                }}
              >
                <p className="sk-tray-label" aria-hidden="true">
                  {SKILLS_COPY.languages}
                </p>
                <div className="sk-tray-tiles">
                  {languages.map((lang, i) => (
                    <Tile
                      key={lang.id}
                      skill={lang}
                      index={i}
                      active={lang.id === activeId}
                      shown={lang.id === shownId}
                      lit={usageSkills.has(lang.id)}
                      blamed={focusedSkills.includes(lang.id) && lang.id !== activeId}
                      onSelect={select}
                      onPreview={preview}
                    />
                  ))}
                </div>
              </div>

              {/* SCREEN leader: the shown tile → the inspector's edge (steel; champagne while lit). */}
              <svg
                className="sk-leader ed-screen-only"
                width={DIAGRAM_W + LEADER_REACH}
                height={DIAGRAM_H}
                viewBox={`0 0 ${DIAGRAM_W + LEADER_REACH} ${DIAGRAM_H}`}
                aria-hidden="true"
                focusable="false"
                data-on={leader ? 'true' : undefined}
              >
                {leader ? (
                  <>
                    <path key={leader.d} className="sk-leader-path" d={leader.d} pathLength={1} />
                    <circle
                      className="sk-leader-dot"
                      cx={DIAGRAM_W + LEADER_REACH}
                      cy={leader.y}
                      r={3}
                    />
                  </>
                ) : null}
              </svg>

              {/* PRINT callout: red dot, line, arrowhead into the close-up. */}
              <svg
                className="sk-callout ed-print-only"
                width={PRINT_CALLOUT.w}
                height={PRINT_CALLOUT.h}
                viewBox={`0 0 ${PRINT_CALLOUT.w} ${PRINT_CALLOUT.h}`}
                aria-hidden="true"
                focusable="false"
                data-on={calloutY !== null ? 'true' : undefined}
                style={calloutY !== null ? { top: calloutY - PRINT_CALLOUT.h / 2 } : undefined}
              >
                <path
                  d="M6 12H42"
                  stroke="var(--text-primary)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path d="M41 4L55 12L41 20Z" fill="var(--text-primary)" />
                <circle
                  cx="6"
                  cy="12"
                  r="5"
                  fill="var(--accent-signal)"
                  stroke="var(--text-primary)"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* The inspector column sits OUTSIDE the glass stage in the DOM: on the
            desktop plan CSS places it over the stage's right column; below
            1200 it is a fixed bottom sheet, which the stage's backdrop-filter
            would otherwise contain (a filtered ancestor is the containing
            block of fixed descendants). */}
        <div className="sk-side">
          <Inspector skill={shownSkill} sheetOpen={sheetOpen} onClose={close} />
        </div>
      </div>

      {/* ---- "Where I've used them" — derived from the verified map ------- */}
      <section className="sk-usage" aria-label={SKILLS_COPY.usageTitle}>
        <div className="sk-usage-head">
          <h3 className="sk-usage-title">
            <span className="ed-screen-only">{SKILLS_COPY.usageTitle}</span>
            <span className="ed-print-only">{SKILLS_COPY.printUsageTitle}</span>
          </h3>
          <p className="sk-usage-lede ed-print-only">{SKILLS_COPY.printUsageLede}</p>
        </div>
        <ul className="sk-usage-rows">
          {rows.map((row, i) => {
            const place = USAGE_PLACES[row.place.id]
            const firstProject =
              row.place.kind !== 'experience' && rows[i - 1]?.place.kind === 'experience'
            const on = usagePlace === row.place.id
            return (
              <li
                key={row.place.id}
                className="sk-urow"
                data-place={row.place.id}
                data-kind={row.place.kind}
                data-on={on ? 'true' : undefined}
                data-empty={row.skills.length === 0 ? 'true' : undefined}
                data-first={i === 0 || firstProject ? 'true' : undefined}
              >
                {i === 0 ? (
                  <p className="sk-usage-cap ed-screen-only" aria-hidden="true">
                    {SKILLS_COPY.usageExperience}
                  </p>
                ) : null}
                {firstProject ? (
                  <p className="sk-usage-cap ed-screen-only" aria-hidden="true">
                    {SKILLS_COPY.usageProjects}
                  </p>
                ) : null}
                <div className="sk-urow-grid">
                  <button
                    type="button"
                    className="sk-urow-who"
                    aria-pressed={on}
                    aria-label={SKILLS_COPY.rowName(place.name)}
                    onClick={() => toggleRow(row.place.id)}
                  >
                    <b className="sk-urow-name">
                      <span className="ed-screen-only">{place.name}</span>
                      <span className="ed-print-only">{place.printName}</span>
                    </b>
                    <span className="sk-urow-year">
                      <span className="ed-screen-only">{place.year}</span>
                      <span className="ed-print-only">{place.printMeta}</span>
                    </span>
                  </button>
                  {row.skills.length > 0 ? (
                    <ul
                      className="sk-urow-tools"
                      aria-label={SKILLS_COPY.rowTools(
                        place.name,
                        row.skills.map((s) => s.label)
                      )}
                    >
                      {row.skills.map((skill) => (
                        <li key={skill.id}>
                          <button
                            type="button"
                            className="sk-uchip"
                            data-skill-id={skill.id}
                            data-on={skill.id === shownId ? 'true' : undefined}
                            aria-pressed={skill.id === activeId}
                            aria-label={SKILLS_COPY.tileName(skill.label)}
                            onClick={() => select(skill.id)}
                            onPointerEnter={() => preview(skill.id)}
                            onPointerLeave={() => preview(null)}
                            onFocus={() => preview(skill.id)}
                            onBlur={() => preview(null)}
                          >
                            <EdLogo id={skill.id} size={18} />
                            <span>{skill.label}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="sk-urow-none">{SKILLS_COPY.coreStack}</span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
