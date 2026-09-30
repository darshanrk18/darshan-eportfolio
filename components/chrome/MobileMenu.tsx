'use client'

/**
 * Mobile menu (v2 §4.2; v3 §3 "Mobile"): the full-screen sheet behind the
 * top bar's "Menu" control (bar < 1130). Both skins via styles/v3/chrome.css
 * (`.sig-menu*`): SCREEN = near-black glass sheet, Cinzel section rows;
 * PRINT = paper sheet, Bangers section rows, ink rules.
 *
 * Rows: the five section names (About · Skills · Work · Experience ·
 * Contact) staggered in at 50ms, a rule, then CV · Download résumé · Copy
 * email · GitHub · LinkedIn, and the edition toggle in the foot. Visitor
 * language only — no file names (`resume.pdf`), no command syntax.
 * Focus-trapped, Esc closes, body scroll locked while open.
 */

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, LazyMotion, domAnimation, m, type Variants } from 'motion/react'
import { profile } from '@/lib/data/profile'
import { copyEmailAction, scrollToAnchor } from '@/lib/commands/context'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'
import { EASE_OUT_EXPO, EASE_STRUCTURAL, STAGGER_ITEMS } from '@/lib/motion/tokens'
import { trackCvViewed, trackResumeDownloaded } from '@/lib/utils/analytics'
import EditionToggle from '@/components/edition/EditionToggle.client'
import DkSeal from '@/components/chrome/DkSeal'
import Logo from '@/components/skills/Logo'
import { NAV_ITEMS, SOCIAL_LINKS, TOP_ANCHOR } from './navItems'

export interface MobileMenuProps {
  open: boolean
  onClose: () => void
}

export default function MobileMenu({ open, onClose }: MobileMenuProps) {
  const reduced = usePrefersReducedMotion()
  const sheetRef = useRef<HTMLDivElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const [emailCopied, setEmailCopied] = useState(false)
  const copiedTimer = useRef<number | null>(null)

  // Body scroll lock + focus management while open.
  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [open])

  useEffect(
    () => () => {
      if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current)
    },
    []
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
      return
    }
    if (e.key !== 'Tab') return
    // Focus trap: cycle within the sheet.
    const focusables = sheetRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])'
    )
    if (!focusables || focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const goToSection = (anchor: string) => {
    onClose()
    // Let the close commit release the body scroll lock before scrolling.
    window.setTimeout(() => scrollToAnchor(anchor), 30)
  }

  const copyEmail = async () => {
    const ok = await copyEmailAction(profile.email)
    if (!ok) return
    setEmailCopied(true)
    if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current)
    copiedTimer.current = window.setTimeout(() => setEmailCopied(false), 1500)
  }

  const listVariants: Variants = {
    hidden: {},
    show: {
      transition: reduced
        ? { staggerChildren: 0, delayChildren: 0 }
        : { staggerChildren: STAGGER_ITEMS, delayChildren: 0.15 },
    },
  }
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    show: {
      opacity: 1,
      y: 0,
      transition: reduced ? { duration: 0.1 } : { duration: 0.35, ease: EASE_OUT_EXPO },
    },
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <AnimatePresence>
        {open ? (
          <m.div
            key="mobile-menu"
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            data-component="MobileMenu"
            data-island="client"
            onKeyDown={handleKeyDown}
            className="sig-menu"
            initial={reduced ? { opacity: 0 } : { y: '-100%' }}
            animate={reduced ? { opacity: 1 } : { y: 0 }}
            exit={reduced ? { opacity: 0 } : { y: '-100%' }}
            transition={reduced ? { duration: 0.12 } : { duration: 0.5, ease: EASE_STRUCTURAL }}
          >
            <div className="sig-menu-head">
              <a
                href={TOP_ANCHOR}
                className="sig-menu-ident"
                onClick={(e) => {
                  e.preventDefault()
                  goToSection(TOP_ANCHOR)
                }}
              >
                <DkSeal variant="mark" size={26} />
                <span className="sr-only">Darshan Konnur, home</span>
              </a>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="sig-menu-close"
              >
                Close ✕
              </button>
            </div>

            <m.ul
              variants={listVariants}
              initial="hidden"
              animate="show"
              className="sig-menu-list"
            >
              {NAV_ITEMS.map((item) => (
                <m.li key={item.anchor} variants={itemVariants}>
                  <a
                    href={item.anchor}
                    className="sig-menu-row is-section"
                    onClick={(e) => {
                      e.preventDefault()
                      goToSection(item.anchor)
                    }}
                  >
                    {item.label}
                  </a>
                </m.li>
              ))}

              <m.li variants={itemVariants} aria-hidden="true">
                <span className="sig-menu-rule" />
              </m.li>

              <m.li variants={itemVariants}>
                <a
                  href="/cv"
                  className="sig-menu-row"
                  onClick={() => {
                    trackCvViewed()
                    onClose()
                  }}
                >
                  CV
                </a>
              </m.li>
              <m.li variants={itemVariants}>
                <a
                  href={profile.resumePdf}
                  download="darshan-konnur.pdf"
                  className="sig-menu-row"
                  onClick={() => {
                    trackResumeDownloaded('mobile-menu')
                    onClose()
                  }}
                >
                  Download résumé
                </a>
              </m.li>
              <m.li variants={itemVariants}>
                <button type="button" className="sig-menu-row" onClick={copyEmail}>
                  <span className={emailCopied ? 'is-live' : undefined} aria-live="polite">
                    {emailCopied ? 'Copied ✓' : 'Copy email'}
                  </span>
                </button>
              </m.li>
              {SOCIAL_LINKS.map((link) => (
                <m.li key={link.id} variants={itemVariants}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sig-menu-row"
                    onClick={onClose}
                  >
                    <Logo id={link.id} mono size={18} />
                    {link.label} ↗
                  </a>
                </m.li>
              ))}
            </m.ul>

            <div className="sig-menu-foot">
              <span className="sig-menu-hint">Edition</span>
              <EditionToggle />
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </LazyMotion>
  )
}
