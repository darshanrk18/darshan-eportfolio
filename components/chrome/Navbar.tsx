'use client'

/**
 * Navbar — editor chrome (spec §4.2).
 *
 * Fixed 48px bar, transparent over the hero, gaining --bg-overlay + blur +
 * a bottom hairline after 24px of scroll. Breadcrumb + branch chip (links to
 * the site repo), filename nav tabs with a sliding layoutId underline driven
 * by scrollspy, a `/cv` chip (recruiter escape hatch), the theme toggle, the
 * ⌘K keycap chip and the 2px build-progress bar + `compiled NN%` readout.
 *
 * This is a client component, but its SSR output is the same JS-free bar of
 * anchor links the T0 experience relies on — links work without JS.
 */

import { useEffect, useRef, useState } from 'react'
import { LazyMotion, domAnimation, m } from 'motion/react'
import { profile } from '@/lib/data/profile'
import { SECTION_ANCHORS, sectionTabs } from '@/lib/commands/registry'
import { scrollToAnchor } from '@/lib/commands/context'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'
import { SPRING_UI } from '@/lib/motion/tokens'
import { useSignalStore } from '@/lib/state/store'
import { trackCvViewed } from '@/lib/utils/analytics'
import ThemeToggle from './ThemeToggle'
import MobileMenu from './MobileMenu'
import ScrollProgress, { CompiledReadout } from './ScrollProgress'

const chipClass =
  'type-label-sm rounded-chip border border-hairline px-2 py-1 text-secondary transition-colors hover:border-hairline-strong hover:text-primary'

export default function Navbar() {
  const reduced = usePrefersReducedMotion()
  const setPaletteOpen = useSignalStore((s) => s.setPaletteOpen)

  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  // Server renders ⌘K; corrected to Ctrl K after mount on non-Apple platforms.
  const [kbdLabel, setKbdLabel] = useState('⌘K')

  const visibleSections = useRef(new Map<string, boolean>())

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!/Mac|iPhone|iPad|iPod/.test(navigator.platform)) setKbdLabel('Ctrl K')
  }, [])

  // Scrollspy: the section crossing the 40–45% viewport band is active
  // (robust for sections taller than the viewport, where intersectionRatio
  // never reaches 0.4). Also drives aria-current.
  useEffect(() => {
    const targets = SECTION_ANCHORS.map((a) => document.getElementById(a.slice(1))).filter(
      (el): el is HTMLElement => el !== null
    )
    if (targets.length === 0) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibleSections.current.set(entry.target.id, entry.isIntersecting)
        }
        let current: string | null = null
        for (const anchor of SECTION_ANCHORS) {
          if (visibleSections.current.get(anchor.slice(1))) current = anchor
        }
        setActive(current)
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    )
    for (const el of targets) io.observe(el)
    return () => io.disconnect()
  }, [])

  const paletteChip = (
    <button
      type="button"
      onClick={() => setPaletteOpen(true)}
      aria-label="Open command palette"
      className={`${chipClass} bg-raised`}
    >
      {kbdLabel}
    </button>
  )

  return (
    <LazyMotion features={domAnimation} strict>
      <header
        data-component="Navbar"
        className={`fixed inset-x-0 top-0 h-12 transition-colors duration-200 ${
          scrolled
            ? 'border-b border-hairline bg-overlay backdrop-blur-md'
            : 'border-b border-transparent'
        }`}
        style={{ zIndex: 'var(--z-nav)' }}
      >
        <ScrollProgress />
        <nav
          aria-label="Primary"
          className="container-site flex h-full items-center justify-between gap-4"
        >
          {/* Breadcrumb + branch chip */}
          <div className="flex min-w-0 items-center gap-3">
            <span className="type-label-sm truncate text-secondary">~/darshan-konnur</span>
            <a
              href={profile.siteRepoUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View this site's repository on GitHub"
              className="type-label-sm rounded-chip border border-hairline px-1.5 py-0.5 text-signal transition-colors hover:border-hairline-strong"
            >
              main ✓
            </a>
          </div>

          {/* Editor tabs (desktop/tablet) */}
          <ul className="hidden h-full items-center md:flex">
            {sectionTabs.map((tab) => {
              const isActive = active === tab.anchor
              return (
                <li key={tab.anchor} className="relative h-full">
                  <a
                    href={tab.anchor}
                    aria-current={isActive ? 'true' : undefined}
                    onClick={(e) => {
                      e.preventDefault()
                      scrollToAnchor(tab.anchor)
                    }}
                    className={`flex h-full items-center px-2.5 type-label-sm transition-colors ${
                      isActive ? 'text-primary' : 'text-secondary hover:text-primary'
                    }`}
                  >
                    {tab.tab}
                  </a>
                  {isActive ? (
                    <m.span
                      layoutId="tab-underline"
                      aria-hidden="true"
                      transition={reduced ? { duration: 0 } : SPRING_UI}
                      className="absolute bottom-0 left-2.5 right-2.5 h-[2px] bg-signal"
                    />
                  ) : null}
                </li>
              )
            })}
          </ul>

          {/* Right cluster */}
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 md:flex">
              <CompiledReadout />
              <a href="/cv" onClick={() => trackCvViewed()} className={chipClass}>
                cv ↗
              </a>
              <ThemeToggle />
            </div>
            {paletteChip}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              className="type-label-sm min-h-11 px-2 text-secondary hover:text-primary md:hidden"
            >
              menu
            </button>
          </div>
        </nav>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </LazyMotion>
  )
}
