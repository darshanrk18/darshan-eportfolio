'use client'

/**
 * The ⌘K hint (v3 S1: "Press ⌘K to go anywhere") — a keycap in a quiet
 * line under the hero. Click opens the command palette via the store.
 * The `.hero-pill` class keeps it inside CommandPalette's hover-prefetch
 * TRIGGER_SELECTOR. Hidden on touch devices by CSS (no keyboard — a dead
 * shortcut would be clutter); the palette stays reachable from the top bar.
 * v2 §6.5: one of the ~10 named magnetic elements (inert on coarse pointers
 * / reduced motion via the hook).
 */

import { useEffect, useRef, useState } from 'react'
import { useMagnetic } from '@/lib/motion/useMagnetic'
import { useSignalStore } from '@/lib/state/store'

export default function PalettePill() {
  const setPaletteOpen = useSignalStore((s) => s.setPaletteOpen)
  const ref = useRef<HTMLButtonElement>(null)
  useMagnetic(ref, { strength: 0.25, radius: 80 })
  // Server renders ⌘K; corrected to Ctrl K after mount on non-Apple platforms.
  const [kbd, setKbd] = useState('⌘K')
  useEffect(() => {
    if (!/Mac|iPhone|iPad|iPod/.test(navigator.platform)) setKbd('Ctrl K')
  }, [])

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => setPaletteOpen(true)}
      className="hero-pill"
      aria-label={`Open the command palette (${kbd === '⌘K' ? 'Command K' : 'Control K'})`}
      data-component="PalettePill"
      data-island="client"
    >
      <span data-mag-label>
        Press <kbd className="ed-kbd">{kbd}</kbd> to go anywhere
      </span>
    </button>
  )
}
