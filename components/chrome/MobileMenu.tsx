'use client'

/**
 * Mobile menu (spec §4.2): full-screen --bg-panel sheet (structural ease,
 * 500ms) rendered as a file tree — the 5 section entries staggered in at
 * 50ms, plus `cv ↗`, `resume.pdf ↓`, `email` rows and the theme toggle.
 * Focus-trapped, Esc closes, body scroll locked while open.
 */

import { useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
  m,
  type Variants,
} from 'motion/react'
import { profile } from '@/lib/data/profile'
import { sectionTabs } from '@/lib/commands/registry'
import { copyEmailAction, scrollToAnchor } from '@/lib/commands/context'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'
import { EASE_OUT_EXPO, EASE_STRUCTURAL, STAGGER_ITEMS } from '@/lib/motion/tokens'
import { trackCvViewed, trackResumeDownloaded } from '@/lib/utils/analytics'
import ThemeToggle from './ThemeToggle'

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

  const rowClass =
    'flex min-h-11 w-full items-center gap-3 px-4 text-left type-code text-secondary hover:bg-raised hover:text-primary'

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
            onKeyDown={handleKeyDown}
            className="fixed inset-0 flex flex-col bg-panel"
            style={{ zIndex: 'var(--z-nav)' }}
            initial={reduced ? { opacity: 0 } : { y: '-100%' }}
            animate={reduced ? { opacity: 1 } : { y: 0 }}
            exit={reduced ? { opacity: 0 } : { y: '-100%' }}
            transition={reduced ? { duration: 0.12 } : { duration: 0.5, ease: EASE_STRUCTURAL }}
          >
            <div className="flex h-12 items-center justify-between border-b border-hairline px-4">
              <span className="type-label-sm text-secondary">~/darshan-konnur</span>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="type-label-sm min-h-11 px-3 text-secondary hover:text-primary"
              >
                close ✕
              </button>
            </div>

            <m.ul
              variants={listVariants}
              initial="hidden"
              animate="show"
              className="flex-1 overflow-y-auto py-4"
            >
              <m.li variants={itemVariants} aria-hidden="true">
                <span className="flex min-h-11 items-center px-4 type-code text-tertiary">
                  ~/darshan-konnur
                </span>
              </m.li>
              {sectionTabs.map((tab) => (
                <m.li key={tab.anchor} variants={itemVariants}>
                  <a
                    href={tab.anchor}
                    className={rowClass}
                    onClick={(e) => {
                      e.preventDefault()
                      goToSection(tab.anchor)
                    }}
                  >
                    <span className="pl-4">{tab.tab}</span>
                  </a>
                </m.li>
              ))}

              <m.li variants={itemVariants} aria-hidden="true">
                <span className="mx-4 my-3 block border-t border-hairline" />
              </m.li>

              <m.li variants={itemVariants}>
                <a
                  href="/cv"
                  className={rowClass}
                  onClick={() => {
                    trackCvViewed()
                    onClose()
                  }}
                >
                  <span className="pl-4">cv ↗</span>
                </a>
              </m.li>
              <m.li variants={itemVariants}>
                <a
                  href={profile.resumePdf}
                  download="darshan-konnur.pdf"
                  className={rowClass}
                  onClick={() => {
                    trackResumeDownloaded('mobile-menu')
                    onClose()
                  }}
                >
                  <span className="pl-4">resume.pdf ↓</span>
                </a>
              </m.li>
              <m.li variants={itemVariants}>
                <button type="button" className={rowClass} onClick={copyEmail}>
                  <span className={`pl-4 ${emailCopied ? 'text-signal' : ''}`}>
                    {emailCopied ? 'copied ✓' : 'email'}
                  </span>
                </button>
              </m.li>
            </m.ul>

            <div className="border-t border-hairline p-4">
              <ThemeToggle />
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </LazyMotion>
  )
}
