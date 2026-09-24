'use client'

/**
 * The ⌘K invitation (spec §4.3): a keyboard-keycap-styled pill, bottom-center
 * of the hero, breathing a low-intensity signal glow on a 4s cycle (CSS in
 * Hero's scoped styles). Click opens the command palette via the store.
 * v2 §6.5: one of the ~10 named magnetic elements (label parallax on the
 * inner span; inert on coarse pointers / reduced motion via the hook).
 */

import { useRef } from 'react'
import { useMagnetic } from '@/lib/motion/useMagnetic'
import { useSignalStore } from '@/lib/state/store'

export default function PalettePill() {
  const setPaletteOpen = useSignalStore((s) => s.setPaletteOpen)
  const ref = useRef<HTMLButtonElement>(null)
  useMagnetic(ref, { strength: 0.25, radius: 80 })

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => setPaletteOpen(true)}
      className="hero-pill type-label-sm bg-raised hairline rounded-btn text-secondary hover:text-primary relative px-4 py-2 transition-colors"
      data-component="PalettePill"
      data-island="client"
    >
      <span className="hero-pill-glow" aria-hidden="true" />
      <span data-mag-label>
        <kbd className="font-mono text-primary">⌘K</kbd> — do anything
      </span>
    </button>
  )
}
