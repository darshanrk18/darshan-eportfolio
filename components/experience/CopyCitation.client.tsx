'use client'

/**
 * "Copy the citation" — beside "Read the paper" on the IEEE entry. Copies
 * the BibTeX-ish citation built by ./citation.ts (RSC) and reads "Copied"
 * for 1.5 s. Visitor language only (clutter law); the only transition is the
 * micro colour change.
 */

import { useEffect, useRef, useState } from 'react'
import { copyToClipboard } from '@/lib/utils/copy'
import { XP_COPY } from './copy'

export default function CopyCitation({ citation }: { citation: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <button
      type="button"
      className="xp-lnk xp-lnk--btn"
      data-component="CopyCitation"
      data-island="client"
      aria-live="polite"
      onClick={async () => {
        const ok = await copyToClipboard(citation)
        if (!ok) return
        setCopied(true)
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => setCopied(false), 1500)
      }}
    >
      {copied ? XP_COPY.copied : XP_COPY.copyCitation}
    </button>
  )
}
