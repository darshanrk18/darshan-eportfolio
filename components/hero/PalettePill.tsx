'use client'

/**
 * The ⌘K invitation (spec §4.3): a keyboard-keycap-styled pill, bottom-center
 * of the hero, breathing a low-intensity signal glow on a 4s cycle (CSS in
 * Hero's scoped styles). Click opens the command palette via the store.
 */

import { useSignalStore } from '@/lib/state/store'

export default function PalettePill() {
  const setPaletteOpen = useSignalStore((s) => s.setPaletteOpen)

  return (
    <button
      type="button"
      onClick={() => setPaletteOpen(true)}
      className="hero-pill type-label-sm bg-raised hairline rounded-btn text-secondary hover:text-primary relative px-4 py-2 transition-colors"
    >
      <span className="hero-pill-glow" aria-hidden="true" />
      <kbd className="font-mono text-primary">⌘K</kbd> — do anything
    </button>
  )
}
