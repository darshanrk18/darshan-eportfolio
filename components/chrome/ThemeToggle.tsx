'use client'

/**
 * Theme toggle — `--theme=dark` ⇄ `--theme=light` (v1 spec §4.2, v2 §6.1).
 *
 * v2 §6.1 — the switch is a moment: on toggle, the new theme wipes out
 * radially from the toggle's own coordinates via the stable same-document
 * `document.startViewTransition` API (the wipe CSS lives in
 * styles/v2/chrome.css, keyed off html[data-theme-wipe] so it never collides
 * with the §6.4 cross-document sweep). The label does its 6-frame mono decode
 * (`--theme=dark` → `--theme=light`) — a sanctioned mono-label decode.
 *
 * Fallbacks: no startViewTransition (Safari <18) or reduced motion → instant
 * switch, exactly v1. Persistence (applyTheme) and the pre-paint script are
 * untouched. Stays in sync when the theme changes elsewhere (palette /
 * terminal) by watching the html attribute; those external switches decode
 * the label too but never wipe (the wipe belongs to the toggle's own coords).
 */

import { useEffect, useRef, useState } from 'react'
import { applyTheme, getCurrentTheme, type Theme } from '@/lib/commands/context'
import { decodeText } from '@/lib/motion/decode'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'

export default function ThemeToggle() {
  const reduced = usePrefersReducedMotion()
  const [theme, setTheme] = useState<Theme>('dark')
  const [label, setLabel] = useState('--theme=dark')
  const btnRef = useRef<HTMLButtonElement>(null)
  const cancelDecodeRef = useRef<(() => void) | null>(null)
  // Mirrors `reduced` for non-reactive reads inside the sync observer.
  const reducedRef = useRef(reduced)
  reducedRef.current = reduced

  // Decode the label toward the (already switched) theme's text.
  const settleLabel = (next: Theme) => {
    cancelDecodeRef.current?.()
    const final = `--theme=${next}`
    if (reducedRef.current) {
      setLabel(final)
      return
    }
    cancelDecodeRef.current = decodeText(final, setLabel)
  }

  useEffect(() => {
    const initial = getCurrentTheme()
    setTheme(initial)
    setLabel(`--theme=${initial}`)
    const observer = new MutationObserver(() => {
      const current = getCurrentTheme()
      setTheme((prev) => {
        if (prev !== current) settleLabel(current)
        return current
      })
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => {
      observer.disconnect()
      cancelDecodeRef.current?.()
    }
    // settleLabel reads live state through refs — mount-only is intentional.
  }, [])

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    const doSwitch = () => {
      applyTheme(next)
      // State/label sync happens in the MutationObserver above.
    }

    const root = document.documentElement
    if (!('startViewTransition' in document) || reduced) {
      doSwitch()
      return
    }

    // §6.1 — radial wipe from the toggle's center.
    const r = btnRef.current?.getBoundingClientRect()
    if (r) {
      root.style.setProperty('--wipe-x', `${r.left + r.width / 2}px`)
      root.style.setProperty('--wipe-y', `${r.top + r.height / 2}px`)
    }
    // Scope the wipe animation to this transition only (see chrome.css §6.1
    // vs §6.4 — both style ::view-transition-new(root)).
    root.setAttribute('data-theme-wipe', '1')
    const transition = document.startViewTransition(doSwitch)
    transition.finished
      .catch(() => {
        /* skipped/interrupted transitions still settle the attribute */
      })
      .finally(() => {
        root.removeAttribute('data-theme-wipe')
      })
  }

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={toggle}
      aria-pressed={theme === 'light'}
      /* WCAG 2.5.3 Label in Name (axe label-content-name-mismatch): the
         accessible name must CONTAIN the visible `--theme=…` label. */
      aria-label={
        theme === 'dark'
          ? '--theme=dark — switch to light theme'
          : '--theme=light — switch to dark theme'
      }
      className="type-label-sm rounded-btn border border-hairline px-2 py-1 text-secondary transition-colors hover:border-hairline-strong hover:text-primary"
      data-component="ThemeToggle"
      data-island="client"
    >
      {label}
    </button>
  )
}
