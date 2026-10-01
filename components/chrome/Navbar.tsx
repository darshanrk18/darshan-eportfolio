'use client'

/**
 * Navbar — the top bar in both editions (V3_SPEC §1.7, §3 "Navbar", §6).
 *
 * One DOM, two skins (styles/v3/chrome.css, imported here):
 *   SCREEN (S1/S6 frames): Studio Seal ident (silver, champagne glint) · thin
 *   rule · section names in Cinzel caps · right cluster.
 *   PRINT (P1 masthead): the seal bug + "KONNUR COMICS" wordmark · "No. 1 ·
 *   10¢" issue box (shown only where it fits) · ink-box nav pills · the
 *   same right cluster.
 * Right cluster (both): `#guide-slot` (an EMPTY span the Guide island (C5)
 * portals its "8 things to try" chip into — rendered once, present in the
 * desktop and the phone bar) · EditionToggle · rule · GitHub · LinkedIn ·
 * CV · ⌘K keycap (hidden on touch). Compact (bar narrower than 1130 —
 * phones, tablets, narrow windows, where the full bar cannot fit with the
 * wider Ctrl K keycap): ident · guide slot · toggle · Menu (→ MobileMenu);
 * under 360, and under 480 once the guide is complete, the toggle lives
 * only in the menu's foot.
 *
 * v3 removed at rest (clutter law): the `~/darshan-konnur` breadcrumb, the
 * `main ✓` branch chip, the file-name tabs and the `compiled NN%` readout.
 * ScrollProgress stays as the bare 2px bar.
 *
 * Scrolled state (> 24px): `data-scrolled="1"` → glass (SCREEN) / paper +
 * ink rule (PRINT). Scrollspy: the section crossing the 40–45% viewport
 * band is active (aria-current + the steel underline in SCREEN, the ink
 * pill in PRINT) and is written to the store (activeSection, sectionsSeen)
 * for the palette narrator and Build info's honest "sections seen" count.
 * The active section is also mirrored as `data-section="about|…|contact"`
 * on the header: S6's motion note fades GitHub · LinkedIn · CV out of the
 * SCREEN bar while the Contact letter (which carries the same links) is in
 * view, so each link shows once per screen (chrome.css).
 *
 * SSR output is the same JS-free bar of anchor links — links work without JS.
 * Bundle: Navbar delta ≤ 1 KB (§7) — no new deps beyond DkSeal and Logo.
 */

import { useEffect, useRef, useState } from 'react'
import { LazyMotion, domAnimation, m } from 'motion/react'
import { SECTION_ANCHORS, type SectionAnchor } from '@/lib/commands/sections'
import { scrollToAnchor } from '@/lib/commands/context'
import { useMagnetic } from '@/lib/motion/useMagnetic'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'
import { SPRING_UI } from '@/lib/motion/tokens'
import { useSignalStore } from '@/lib/state/store'
import { trackCvViewed } from '@/lib/utils/analytics'
import EditionToggle from '@/components/edition/EditionToggle.client'
import DkSeal from '@/components/chrome/DkSeal'
import Logo from '@/components/skills/Logo'
import MobileMenu from './MobileMenu'
import ScrollProgress from './ScrollProgress'
import { NAV_ITEMS, SOCIAL_LINKS, TOP_ANCHOR } from './navItems'
import '@/styles/v3/chrome.css'

export default function Navbar() {
  const reduced = usePrefersReducedMotion()
  const setPaletteOpen = useSignalStore((s) => s.setPaletteOpen)

  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  // Server renders ⌘K; corrected to Ctrl K after mount on non-Apple platforms.
  const [kbdLabel, setKbdLabel] = useState('⌘K')

  const visibleSections = useRef(new Map<string, boolean>())

  // §6.5 magnetic tactility — exactly the two navbar chips the spec names.
  const cvChipRef = useRef<HTMLAnchorElement>(null)
  const kbdChipRef = useRef<HTMLButtonElement>(null)
  useMagnetic(cvChipRef, { strength: 0.25, radius: 80 })
  useMagnetic(kbdChipRef, { strength: 0.25, radius: 80 })

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
          // v2 §10.3 — honest seen-count for Build info (idempotent write).
          if (entry.isIntersecting) useSignalStore.getState().markSectionSeen(entry.target.id)
        }
        let current: SectionAnchor | null = null
        for (const anchor of SECTION_ANCHORS) {
          if (visibleSections.current.get(anchor.slice(1))) current = anchor
        }
        setActive(current)
        // v2 §10.2 — the palette narrator reads the active section from the
        // store; before the first section the visitor is in the hero.
        useSignalStore.getState().setActiveSection(current ?? 'hero')
        // v2 §10.3 — the band sits above #about only at the top of the page.
        if (current === null) useSignalStore.getState().markSectionSeen('hero')
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    )
    for (const el of targets) io.observe(el)
    return () => io.disconnect()
  }, [])

  const goTo = (anchor: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    scrollToAnchor(anchor)
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <header
        data-component="Navbar"
        data-island="client"
        data-scrolled={scrolled ? '1' : '0'}
        data-section={active ? active.slice(1) : undefined}
        className="sig-nav"
      >
        <ScrollProgress />
        <nav aria-label="Primary" className="container-site sig-nav-bar">
          {/* Ident — the Studio Seal (SCREEN mark / PRINT bug + wordmark). */}
          <a href={TOP_ANCHOR} onClick={goTo(TOP_ANCHOR)} className="sig-nav-ident">
            <DkSeal variant="mark" size={28} className="ed-screen-only" />
            <DkSeal variant="bug" size={40} className="ed-print-only" />
            <span className="sig-nav-word ed-print-only" aria-hidden="true">
              KONNUR
              <br />
              COMICS
            </span>
            {/* The accessible name per edition (P6 inventory): the other
                edition's span is display:none, so only one is ever read. */}
            <span className="sr-only ed-screen-only">Darshan Konnur, home</span>
            <span className="sr-only ed-print-only">Konnur Comics, back to the cover</span>
          </a>
          {/* PRINT issue box — comic furniture (decorative). The wrapper
              lets it show only where the masthead has room (chrome.css). */}
          <span className="sig-nav-issue-wrap ed-print-only" aria-hidden="true">
            <span className="sig-nav-issue">
              <b>No. 1</b>
              <i />
              <span>10¢</span>
            </span>
          </span>
          <span className="sig-nav-vr ed-screen-only" aria-hidden="true" />

          {/* Section links (desktop/tablet) */}
          <ul className="sig-nav-links">
            {NAV_ITEMS.map((item) => {
              const isActive = active === item.anchor
              return (
                <li key={item.anchor}>
                  <a
                    href={item.anchor}
                    aria-current={isActive ? 'true' : undefined}
                    onClick={goTo(item.anchor)}
                  >
                    {item.label}
                  </a>
                  {isActive ? (
                    <m.span
                      layoutId="tab-underline"
                      aria-hidden="true"
                      transition={reduced ? { duration: 0 } : SPRING_UI}
                      className="sig-nav-underline"
                    />
                  ) : null}
                </li>
              )
            })}
          </ul>

          {/* Right cluster */}
          <div className="sig-nav-tools">
            {/* The Guide island (C5) portals its chip here — keep this span
                EMPTY on the server; it collapses (display:none) while empty. */}
            <span id="guide-slot" className="sig-nav-guide-slot" />
            <EditionToggle />
            <span className="sig-nav-vr ed-screen-only sig-nav-desk" aria-hidden="true" />
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.id}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                className="sig-nav-ic sig-nav-desk"
              >
                <Logo id={link.id} mono size={17} />
              </a>
            ))}
            <a
              ref={cvChipRef}
              href="/cv"
              onClick={() => trackCvViewed()}
              className="sig-nav-cv sig-nav-desk"
            >
              <span data-mag-label>CV</span>
            </a>
            <button
              ref={kbdChipRef}
              type="button"
              onClick={() => setPaletteOpen(true)}
              /* Name contains the visible keycap (WCAG 2.5.3); data-palette-trigger
                 keeps the CommandPalette hover-prefetch selector matching. */
              aria-label={`${kbdLabel} — open the command palette`}
              aria-keyshortcuts="Meta+K Control+K"
              data-palette-trigger
              className="sig-nav-kbd sig-nav-desk"
            >
              <kbd className="ed-kbd" data-mag-label>
                {kbdLabel}
              </kbd>
              <span className="sig-nav-jump ed-print-only" aria-hidden="true">
                Jump
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              className="sig-nav-menu sig-nav-phone"
            >
              Menu
            </button>
          </div>
        </nav>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </LazyMotion>
  )
}
