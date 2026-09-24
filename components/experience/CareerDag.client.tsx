'use client'

/**
 * §4.7 / §5.6 — the git-DAG rail. Decorative client island (aria-hidden):
 * measures the RSC-rendered commit markers inside [data-dag-root], builds the
 * `main` + `feat/ms-cs` SVG paths, and binds scroll progress (Motion
 * `useScroll` + `useSpring`) to each path's stroke-dashoffset. Fully drawn
 * under reduced motion. The year rail brightens as its node crosses viewport
 * center. No rAF loop of its own — Motion's scroll pipeline drives it.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useScroll, useSpring } from 'motion/react'
import { yearRail } from '@/lib/data/experience'
import { SPRING_UI } from '@/lib/motion/tokens'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'

interface NodePoint {
  x: number
  y: number
}

interface Geom {
  w: number
  h: number
  nodes: Record<string, NodePoint>
}

const NODE_IDS = [
  'aws-future',
  'aws-intern',
  'neu-ta',
  'neu-branch',
  'schneider',
  'ieee-tag',
] as const

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

/** Year-rail marker y positions, page order top→bottom (newest first):
 *  2027 → future/HEAD node, 2026 → AWS intern node, 2025 → TA node,
 *  2021 → schneider node. Must stay in sync with yearRail in lib/data. */
function yearTops(g: Geom): number[] {
  return [
    g.nodes['aws-future'].y,
    g.nodes['aws-intern'].y,
    g.nodes['neu-ta'].y,
    g.nodes['schneider'].y,
  ]
}

export default function CareerDag() {
  const reduced = usePrefersReducedMotion()
  const containerRef = useRef<HTMLElement | null>(null)
  const mainPathRef = useRef<SVGPathElement | null>(null)
  const branchPathRef = useRef<SVGPathElement | null>(null)
  const geomRef = useRef<Geom | null>(null)
  const [geom, setGeom] = useState<Geom | null>(null)
  const [ready, setReady] = useState(false)
  const [activeYears, setActiveYears] = useState(0)

  // The host div's parent is the RSC [data-dag-root] wrapper — that element is
  // both the measuring container and the useScroll target. Ref callbacks run
  // before effects, so Motion sees a populated ref on mount.
  const setHost = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node?.parentElement ?? null
  }, [])

  const { scrollYProgress } = useScroll({
    target: containerRef as React.RefObject<HTMLElement>,
    offset: ['start 0.8', 'end 0.55'],
  })
  const springP = useSpring(scrollYProgress, {
    stiffness: SPRING_UI.stiffness,
    damping: SPRING_UI.damping,
  })

  // Measure marker centers relative to the wrapper; re-measure on any size
  // change (details panels expanding/collapsing shift every node below them).
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const measure = () => {
      const rect = container.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      const nodes: Record<string, NodePoint> = {}
      container.querySelectorAll<HTMLElement>('[data-dag-node]').forEach((el) => {
        const r = el.getBoundingClientRect()
        const id = el.dataset.dagId
        if (id) nodes[id] = { x: r.left - rect.left + r.width / 2, y: r.top - rect.top + r.height / 2 }
      })
      if (!NODE_IDS.every((id) => nodes[id])) return
      const g: Geom = { w: rect.width, h: rect.height, nodes }
      geomRef.current = g
      setGeom(g)
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  // Bind spring-smoothed scroll progress to stroke-dashoffset. Under reduced
  // motion the effect never runs, leaving both paths fully drawn.
  useEffect(() => {
    if (reduced || !geom) return
    const main = mainPathRef.current
    const branch = branchPathRef.current
    if (!main || !branch) return
    const lm = main.getTotalLength()
    const lb = branch.getTotalLength()
    main.style.strokeDasharray = `${lm}`
    branch.style.strokeDasharray = `${lb}`
    const apply = (v: number) => {
      main.style.strokeDashoffset = `${lm * (1 - clamp01(v / 0.75))}`
      branch.style.strokeDashoffset = `${lb * (1 - clamp01((v - 0.2) / 0.8))}`
    }
    apply(springP.get())
    setReady(true)
    const unsubscribe = springP.on('change', apply)
    return () => {
      unsubscribe()
      main.style.strokeDasharray = ''
      main.style.strokeDashoffset = ''
      branch.style.strokeDasharray = ''
      branch.style.strokeDashoffset = ''
    }
  }, [reduced, geom, springP])

  // Year-rail markers brighten as their node crosses viewport center.
  useEffect(() => {
    if (reduced) {
      setActiveYears(yearRail.length)
      return
    }
    const update = () => {
      const g = geomRef.current
      const container = containerRef.current
      if (!g || !container) return
      const rect = container.getBoundingClientRect()
      const centerY = window.innerHeight / 2 - rect.top
      const n = yearTops(g).filter((y) => centerY >= y).length
      setActiveYears((prev) => (prev === n ? prev : n))
    }
    update()
    return scrollYProgress.on('change', update)
  }, [reduced, geom, scrollYProgress])

  const drawn = reduced || ready

  let mainD = ''
  let branchD = ''
  let futureD = ''
  if (geom) {
    const f = geom.nodes['aws-future']
    const i = geom.nodes['aws-intern']
    const s = geom.nodes['schneider']
    const b = geom.nodes['neu-branch']
    const t = geom.nodes['neu-ta']
    const tag = geom.nodes['ieee-tag']
    // main: straight vertical from the newest real commit (AWS intern, top)
    // down through schneider to the tag node. Draw start is at the top so the
    // scroll-linked stroke grows in reading order.
    mainD = `M ${i.x} ${i.y} L ${i.x} ${tag.y - 10}`
    // HEAD → future: dashed incoming segment from the intern commit up to the
    // future marker's dashed ring (the commit that does not exist yet).
    futureD = `M ${i.x} ${i.y - 10} L ${f.x} ${f.y + 12}`
    // branch: the feat/ms-cs lane — open-ended above the TA node (the branch
    // is still current), runs down through TA and the branch node, and curves
    // back into main at the schneider commit where it diverged.
    branchD =
      `M ${b.x} ${t.y - 24} ` +
      `L ${b.x} ${b.y} ` +
      `C ${b.x} ${b.y + 48}, ${s.x} ${s.y - 48}, ${s.x} ${s.y}`
  }

  return (
    <div
      ref={setHost}
      aria-hidden="true"
      data-component="CareerDag"
      data-island="client"
      className="pointer-events-none absolute inset-0"
    >
      {geom ? (
        <>
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox={`0 0 ${geom.w} ${geom.h}`}
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              ref={mainPathRef}
              d={mainD}
              stroke="var(--accent-signal)"
              strokeWidth={2}
              strokeLinecap="round"
              style={{ opacity: drawn ? 0.9 : 0 }}
            />
            {/* HEAD → future: incoming segment, dashed by design (never
                scroll-drawn — dashes and draw-on-scroll both use dasharray). */}
            <path
              d={futureD}
              stroke="var(--accent-signal)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="4 6"
              style={{
                opacity: drawn ? 0.6 : 0,
                transition: 'opacity 180ms var(--ease-swift)',
              }}
            />
            <path
              ref={branchPathRef}
              d={branchD}
              stroke="var(--accent-electron)"
              strokeWidth={2}
              strokeLinecap="round"
              style={{ opacity: drawn ? 0.9 : 0 }}
            />
          </svg>
          <div className="absolute inset-y-0 left-0 hidden lg:block">
            {yearRail.map((year, i) => (
              <span
                key={year}
                className={`type-label-xs absolute left-0 -translate-y-1/2 [transition:color_180ms_var(--ease-swift)] ${
                  i < activeYears ? 'text-primary' : 'text-tertiary'
                }`}
                style={{ top: yearTops(geom)[i] }}
              >
                {year}
              </span>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
