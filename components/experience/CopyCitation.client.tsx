'use client'

/**
 * §4.7 education card — `copy citation` button. Copies the BibTeX-ish citation
 * built by the RSC card; flashes `copied ✓` in signal. The card's pacing rule
 * bans ambient motion, so the only transition is the 180ms border micro-state.
 */

import { useEffect, useRef, useState } from 'react'
import { copyToClipboard } from '@/lib/utils/copy'

export default function CopyCitation({ citation }: { citation: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <button
      type="button"
      onClick={async () => {
        const ok = await copyToClipboard(citation)
        if (!ok) return
        setCopied(true)
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => setCopied(false), 1500)
      }}
      className="type-label-sm rounded-btn border-hairline bg-raised hover:border-hairline-strong mt-3 min-h-11 border px-4 py-2 [transition:border-color_180ms_var(--ease-swift)]"
    >
      {copied ? <span className="text-signal">copied ✓</span> : 'copy citation'}
    </button>
  )
}
