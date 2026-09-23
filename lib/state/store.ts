/**
 * Shared cross-section client state (zustand v5).
 * Import ONLY from client components: `useSignalStore((s) => s.field)`.
 */

import { create } from 'zustand'
import type { ProjectSlug } from '@/lib/data/projects'
import type { GlyphTier } from '@/lib/perf/tiers'

export interface SignalState {
  /** Skill node ids currently highlighted in the Skills diagram ([] = none). */
  focusedSkills: string[]
  setFocusedSkills: (ids: string[]) => void

  /** Project selected in the Projects explorer/window. */
  activeProject: ProjectSlug
  setActiveProject: (slug: ProjectSlug) => void

  /** ⌘K palette open state. */
  paletteOpen: boolean
  setPaletteOpen: (open: boolean) => void

  /**
   * Reduced-motion flag — mirrors html[data-motion]. Do NOT set directly;
   * call setMotionPreference() from lib/motion/useReducedMotion, which keeps
   * DOM attribute, localStorage, and this store in sync.
   */
  motionReduced: boolean
  setMotionReduced: (reduced: boolean) => void

  /** Current glyph-field tier (null until the field reports; feeds the footer). */
  glyphTier: GlyphTier | null
  setGlyphTier: (tier: GlyphTier | null) => void
}

export const useSignalStore = create<SignalState>()((set) => ({
  focusedSkills: [],
  setFocusedSkills: (ids) => set({ focusedSkills: ids }),

  activeProject: 'ticket-forge',
  setActiveProject: (slug) => set({ activeProject: slug }),

  paletteOpen: false,
  setPaletteOpen: (open) => set({ paletteOpen: open }),

  motionReduced: false,
  setMotionReduced: (reduced) => set({ motionReduced: reduced }),

  glyphTier: null,
  setGlyphTier: (tier) => set({ glyphTier: tier }),
}))
