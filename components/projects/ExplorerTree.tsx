'use client'

/**
 * Directory-tree project selector (spec §4.6, v2 §8.2).
 * Desktop (≥1024): a `projects/` + `research/` tree of button rows —
 * selected row gets --bg-raised + a signal left border, and its folder
 * glyph rotates 90° (180ms swift). On any selection change (click, palette
 * or terminal) the newly-selected row's border pulses once (600ms
 * --ease-out-expo box-shadow, class dropped on animationend). Tablet/
 * mobile: a horizontal row of tab-chips above the window. Selection lives
 * in the shared store.
 */

import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { projects, type ProjectSlug } from '@/lib/data/projects'
import { useInViewOnce } from '@/lib/motion/useInViewOnce'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'
import { useSignalStore } from '@/lib/state/store'
import { trackProjectOpened } from '@/lib/utils/analytics'

const GROUPS = [
  { dir: 'projects' as const, items: projects.filter((p) => p.dir === 'projects') },
  { dir: 'research' as const, items: projects.filter((p) => p.dir === 'research') },
]

export default function ExplorerTree() {
  const active = useSignalStore((s) => s.activeProject)
  const setActive = useSignalStore((s) => s.setActiveProject)

  // §6.6.2 — desktop rows enter with the established 50ms stagger on FIRST
  // section entry (classes from styles/v2/scroll.css; server markup is the
  // finished state — `.tree-reveal-armed` is only ADDED here after hydration,
  // and never under reduced motion, so no-JS/reduced render instantly).
  const reduced = usePrefersReducedMotion()
  const { ref: treeRef, inView: treeInView } = useInViewOnce<HTMLDivElement>({ threshold: 0.2 })
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!reduced && !treeInView) setArmed(true)
  }, [reduced, treeInView])

  // §8.2 — pulse the newly-selected row once per selection change (any
  // source: row click, palette, terminal), never on initial mount.
  const [pulseSlug, setPulseSlug] = useState<ProjectSlug | null>(null)
  const prevActive = useRef(active)
  useEffect(() => {
    if (prevActive.current === active) return
    prevActive.current = active
    setPulseSlug(active)
  }, [active])

  const select = (slug: ProjectSlug) => {
    if (slug === active) return
    setActive(slug)
    trackProjectOpened(slug)
  }

  return (
    <>
      {/* Desktop: directory tree */}
      <div
        ref={treeRef}
        role="group"
        aria-label="Project explorer"
        className={clsx(
          'type-code hidden lg:block',
          armed && 'tree-reveal-armed',
          armed && treeInView && 'tree-reveal-in'
        )}
        data-component="ExplorerTree"
        data-island="client"
      >
        {GROUPS.map((group, gi) => (
          <div key={group.dir} className="mb-2">
            <p className="text-secondary py-1">{group.dir}/</p>
            <ul>
              {group.items.map((p, pi) => {
                const selected = p.slug === active
                /* §6.6.2 — continuous stagger index across both groups. */
                const treeIndex = gi === 0 ? pi : GROUPS[0].items.length + pi
                return (
                  <li
                    key={p.slug}
                    className="tree-reveal-row"
                    style={{ '--tree-i': treeIndex } as React.CSSProperties}
                  >
                    <button
                      type="button"
                      onClick={() => select(p.slug)}
                      aria-current={selected ? 'true' : undefined}
                      onAnimationEnd={(e) => {
                        if (e.animationName === 'pw-row-pulse') setPulseSlug(null)
                      }}
                      className={clsx(
                        'w-full border-l-2 py-1.5 pr-2 pl-4 text-left transition-colors duration-(--dur-micro) ease-(--ease-swift)',
                        selected
                          ? 'border-signal bg-raised text-primary'
                          : 'text-secondary hover:bg-raised/50 hover:text-primary border-transparent',
                        pulseSlug === p.slug && 'pw-row-pulse'
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={clsx(
                          'mr-2 inline-block transition-transform duration-(--dur-micro) ease-(--ease-swift)',
                          selected && 'rotate-90'
                        )}
                      >
                        ▸
                      </span>
                      {p.slug}/
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
      {/* (mobile chips keep their instant render — §6.6.2 names desktop rows) */}

      {/* Tablet/mobile: horizontal tab-chips */}
      <ul aria-label="Projects" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 lg:hidden">
        {projects.map((p) => {
          const selected = p.slug === active
          return (
            <li key={p.slug} className="shrink-0">
              <button
                type="button"
                onClick={() => select(p.slug)}
                aria-current={selected ? 'true' : undefined}
                className={clsx(
                  'type-label-sm rounded-chip min-h-11 border px-4 whitespace-nowrap transition-colors duration-(--dur-micro) ease-(--ease-swift)',
                  selected
                    ? 'border-signal bg-raised text-primary'
                    : 'border-hairline text-secondary hover:border-hairline-strong hover:text-primary'
                )}
              >
                {p.slug}
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}
