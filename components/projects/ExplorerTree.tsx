'use client'

/**
 * Directory-tree project selector (spec §4.6).
 * Desktop (≥1024): a `projects/` + `research/` tree of button rows —
 * selected row gets --bg-raised + a signal left border, and its folder
 * glyph rotates 90° (180ms swift). Tablet/mobile: a horizontal row of
 * tab-chips above the window. Selection lives in the shared store.
 */

import clsx from 'clsx'
import { projects, type ProjectSlug } from '@/lib/data/projects'
import { useSignalStore } from '@/lib/state/store'
import { trackProjectOpened } from '@/lib/utils/analytics'

const GROUPS = [
  { dir: 'projects' as const, items: projects.filter((p) => p.dir === 'projects') },
  { dir: 'research' as const, items: projects.filter((p) => p.dir === 'research') },
]

export default function ExplorerTree() {
  const active = useSignalStore((s) => s.activeProject)
  const setActive = useSignalStore((s) => s.setActiveProject)

  const select = (slug: ProjectSlug) => {
    if (slug === active) return
    setActive(slug)
    trackProjectOpened(slug)
  }

  return (
    <>
      {/* Desktop: directory tree */}
      <div
        role="group"
        aria-label="Project explorer"
        className="type-code hidden lg:block"
        data-component="ExplorerTree"
      >
        {GROUPS.map((group) => (
          <div key={group.dir} className="mb-2">
            <p className="text-secondary py-1">{group.dir}/</p>
            <ul>
              {group.items.map((p) => {
                const selected = p.slug === active
                return (
                  <li key={p.slug}>
                    <button
                      type="button"
                      onClick={() => select(p.slug)}
                      aria-current={selected ? 'true' : undefined}
                      className={clsx(
                        'w-full border-l-2 py-1.5 pr-2 pl-4 text-left transition-colors duration-(--dur-micro) ease-(--ease-swift)',
                        selected
                          ? 'border-signal bg-raised text-primary'
                          : 'text-secondary hover:bg-raised/50 hover:text-primary border-transparent',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={clsx(
                          'mr-2 inline-block transition-transform duration-(--dur-micro) ease-(--ease-swift)',
                          selected && 'rotate-90',
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

      {/* Tablet/mobile: horizontal tab-chips */}
      <ul
        aria-label="Projects"
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 lg:hidden"
      >
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
                    : 'border-hairline text-secondary hover:border-hairline-strong hover:text-primary',
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
