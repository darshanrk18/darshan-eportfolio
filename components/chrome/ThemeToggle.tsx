'use client'

/**
 * Theme toggle — `--theme=dark` ⇄ `--theme=light` (spec §4.2).
 * Delegates to applyTheme() (persists localStorage['signal.theme'], writes
 * html[data-theme], fires theme_toggled). Stays in sync when the theme is
 * changed elsewhere (palette / terminal) by watching the html attribute.
 * SSR renders the dark label (the server never knows the stored theme).
 */

import { useEffect, useState } from 'react'
import { applyTheme, getCurrentTheme, type Theme } from '@/lib/commands/context'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    setTheme(getCurrentTheme())
    const observer = new MutationObserver(() => setTheme(getCurrentTheme()))
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => observer.disconnect()
  }, [])

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={theme === 'light'}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className="type-label-sm rounded-btn border border-hairline px-2 py-1 text-secondary transition-colors hover:border-hairline-strong hover:text-primary"
      data-component="ThemeToggle"
    >
      {`--theme=${theme}`}
    </button>
  )
}
