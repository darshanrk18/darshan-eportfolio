'use client'

/**
 * "Back to top" — the footer's one interactive control. A plain anchor to
 * `#top` (works without JS: the HTML spec special-cases that fragment) that,
 * with JS, goes through scrollToAnchor so the scroll glides on Lenis and
 * focus lands on the `#top` sentinel app/page.tsx renders. The label is the
 * RSC-rendered children (edition-specific arrow included).
 */

import type { ReactNode } from 'react'
import { scrollToAnchor } from '@/lib/commands/context'
import { TOP_ANCHOR } from '@/components/chrome/navItems'

export default function BackToTop({ children }: { children: ReactNode }) {
  return (
    <a
      href={TOP_ANCHOR}
      className="sig-foot-up"
      onClick={(e) => {
        e.preventDefault()
        scrollToAnchor(TOP_ANCHOR)
      }}
    >
      {children}
    </a>
  )
}
