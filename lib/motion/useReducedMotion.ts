'use client'

/**
 * Reduced-motion policy — single source of truth (spec §3.4).
 *
 * - CSS keys off `html[data-motion="reduced"]` (set pre-paint by the inline
 *   head script in app/layout.tsx).
 * - JS reads `usePrefersReducedMotion()`. No component may query matchMedia
 *   directly.
 * - The manual toggle (palette "Disable animation", terminal `motion off|on`)
 *   calls `setMotionPreference()`, persisted under localStorage['signal.motion']
 *   ('reduced' | 'full'); a stored value wins over the system preference.
 */

import { useEffect } from 'react'
import { useSignalStore } from '@/lib/state/store'

export const MOTION_STORAGE_KEY = 'signal.motion'

let synced = false

function readDomReduced(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.dataset.motion === 'reduced'
}

function applyReduced(reduced: boolean): void {
  document.documentElement.dataset.motion = reduced ? 'reduced' : 'full'
  useSignalStore.getState().setMotionReduced(reduced)
}

function installSync(): void {
  if (synced || typeof window === 'undefined') return
  synced = true

  // Adopt whatever the pre-paint inline script decided.
  useSignalStore.getState().setMotionReduced(readDomReduced())

  // Follow live system changes — unless the user has a manual override.
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  const onChange = () => {
    try {
      if (localStorage.getItem(MOTION_STORAGE_KEY) !== null) return
    } catch {
      /* storage unavailable — treat as no override */
    }
    applyReduced(mq.matches)
  }
  mq.addEventListener('change', onChange)
}

/**
 * True when the site must render reduced motion (system preference or the
 * persisted manual override). SSR renders `false`; CSS covers the pre-mount
 * window, so gate JS-driven animation on this hook only.
 */
export function usePrefersReducedMotion(): boolean {
  const reduced = useSignalStore((s) => s.motionReduced)
  useEffect(() => {
    installSync()
  }, [])
  return reduced
}

/**
 * Manual motion override (persisted). `setMotionPreference(true)` disables
 * animation site-wide; `false` re-enables it. Callers do their own analytics
 * (trackMotionDisabled).
 */
export function setMotionPreference(reduced: boolean): void {
  if (typeof document === 'undefined') return
  try {
    localStorage.setItem(MOTION_STORAGE_KEY, reduced ? 'reduced' : 'full')
  } catch {
    /* private mode — attribute still applies for this page */
  }
  applyReduced(reduced)
}
