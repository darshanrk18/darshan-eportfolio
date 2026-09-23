'use client'

/**
 * `copy email` quick-row action (spec §4.3): click copies the address and
 * swaps the label to `copied ✓` in signal for 1.2s. Renders as a mailto
 * anchor so the no-JS fallback still works; JS enhances it into a copy.
 */

import { useEffect, useRef, useState } from 'react'
import { profile } from '@/lib/data/profile'
import { copyEmailAction } from '@/lib/commands/context'

const LINK_CLASS =
  'text-secondary transition-colors hover:text-primary underline-offset-4 hover:underline'

export default function CopyEmailInline() {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current)
    }
  }, [])

  const onClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const ok = await copyEmailAction(profile.email)
    if (!ok) {
      // Clipboard unavailable — fall back to the mailto the anchor points at.
      window.location.href = `mailto:${profile.email}`
      return
    }
    setCopied(true)
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setCopied(false), 1200)
  }

  return (
    <a
      href={`mailto:${profile.email}`}
      onClick={onClick}
      className={copied ? 'text-signal' : LINK_CLASS}
      aria-label={`Copy email address ${profile.email}`}
    >
      <span aria-live="polite">{copied ? 'copied ✓' : 'copy email'}</span>
    </a>
  )
}
