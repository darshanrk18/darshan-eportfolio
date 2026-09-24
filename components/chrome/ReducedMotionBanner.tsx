'use client'

/**
 * Reduced-motion auto-offer (spec §3.4): when motion is reduced, a one-time
 * dismissible banner under the nav offers `Prefer the fast version? → /cv`.
 * Dismissal is persisted. SSR renders nothing (the hook resolves false on the
 * server); the banner appears after hydration only for reduced-motion users.
 */

import { useEffect, useState } from 'react'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'
import { trackCvViewed } from '@/lib/utils/analytics'

const DISMISS_KEY = 'signal.cv-offer-dismissed'

export default function ReducedMotionBanner() {
  const reduced = usePrefersReducedMotion()
  // Start dismissed so nothing flashes before localStorage is consulted.
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === '1')
    } catch {
      setDismissed(false)
    }
  }, [])

  if (!reduced || dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* storage unavailable — dismissed for this page view only */
    }
  }

  return (
    <div
      role="status"
      data-component="ReducedMotionBanner"
      data-island="client"
      className="fixed inset-x-0 top-12 border-b border-hairline bg-raised"
      style={{ zIndex: 'var(--z-nav)' }}
    >
      <div className="container-site flex min-h-10 items-center justify-between gap-4 py-1">
        <p className="type-label-sm text-secondary">
          Prefer the fast version?{' '}
          <a
            href="/cv"
            onClick={() => trackCvViewed()}
            className="text-signal underline underline-offset-4"
          >
            → /cv
          </a>
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss this offer"
          className="type-label-sm px-2 py-1 text-secondary hover:text-primary"
        >
          dismiss ✕
        </button>
      </div>
    </div>
  )
}
