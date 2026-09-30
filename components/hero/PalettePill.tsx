'use client'

/**
 * The ⌘K hint (v3 S1: "Press ⌘K to go anywhere") — a keycap in a quiet
 * line under the hero. Click opens the command palette via the store.
 * The `.hero-pill` class keeps it inside CommandPalette's hover-prefetch
 * TRIGGER_SELECTOR. Hidden on touch screens by its wrapper's `.mouse-only`
 * (Hero.tsx, app/globals.css: no keyboard — a dead shortcut would be clutter;
 * the class is !important so the SCREEN skin's own display rules cannot bring
 * it back). On a phone the palette opens from the guide's "Go anywhere" row
 * and its footer.
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
      aria-keyshortcuts={kbd === '⌘K' ? 'Meta+K' : 'Control+K'}
      data-component="PalettePill"
      data-island="client"
    >
      <span data-mag-label>
        Press <kbd className="ed-kbd">{kbd}</kbd> to go anywhere
      </span>
    </button>
  )
}
