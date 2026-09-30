'use client'

/**
 * "Copy email" quick action (v3 S1 quick row): click copies the address and
 * swaps the label to "Copied" in the live colour for 1.2 s. Renders as a
 * mailto anchor so the no-JS fallback still works; JS enhances it into a
 * copy. Visitor language only (clutter law).
 */

import { useEffect, useRef, useState } from 'react'
import { profile } from '@/lib/data/profile'
import { copyEmailAction } from '@/lib/commands/context'

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
      className={copied ? 'link-draw is-live' : 'link-draw'}
      aria-label={`Copy email address ${profile.email}`}
    >
      <span aria-live="polite">{copied ? 'Copied' : 'Copy email'}</span>
    </a>
  )
}
