/**
 * Shared cross-section client state (zustand v5).
 * Import ONLY from client components: `useSignalStore((s) => s.field)`.
 */

import { create } from 'zustand'
import type { SectionAnchor } from '@/lib/commands/sections'
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

  /* ------------------------------------------------------------------ v2 -- */

  /**
   * v2 §10.2 — the section currently in view: 'hero' above #about, 'footer'
   * past #contact, null before the scrollspy first reports. WRITTEN by the
   * Navbar scrollspy (chrome agent, ~3 lines); READ by the palette narrator
   * ("Next" group in PaletteDialog).
   */
  activeSection: SectionAnchor | 'hero' | 'footer' | null
  setActiveSection: (section: SectionAnchor | 'hero' | 'footer' | null) => void

  /**
   * v2 §10.3 — ids seen this visit: 'hero' + the five anchor ids (no '#').
   * WRITTEN once per id by SectionsSeen.client (one IO, ~0.4 threshold band);
   * READ by the footer BuildComplete payoff for the honest `N/6` count.
   * markSectionSeen is idempotent — repeat calls for a seen id change nothing.
   */
  sectionsSeen: Record<string, true>
  markSectionSeen: (id: string) => void

  /**
   * v2 §10.1 — CRT phosphor mode, the React mirror of html[data-crt='1'].
   * Do NOT touch the DOM attribute or localStorage[CRT_STORAGE_KEY] here:
   * the always-mounted CommandPalette island subscribes to this flag,
   * applies/removes the attribute, persists, and plays the unlock moment; it
   * also hydrate-applies the persisted value by calling setCrtEnabled once.
   * Entry points (konami, palette `crt-mode`, terminal `crt on|off`) all
   * just call setCrtEnabled.
   */
  crtEnabled: boolean
  setCrtEnabled: (on: boolean) => void

  /**
   * v2 §10.4 — true while the registry-driven demo tour is executing.
   * WRITTEN by lib/commands/demoRunner (set on start, cleared on abort or
   * finish); READ by surfaces that must ignore synthetic input while the
   * demo drives (e.g. the §4.2 keypress spawn, GlyphField Scene).
   */
  demoRunning: boolean
  setDemoRunning: (running: boolean) => void

  /**
   * v2 §8.3 — slug of the project window currently maximized as a lightbox,
   * or null. WRITTEN by ProjectWindow (green light / touch chip / Esc /
   * restore); READ by the Esc-precedence keydown (maximized first, demo-stop
   * second) and by whoever coordinates `getLenis()?.stop()` / `.start()`
   * and the body scroll lock.
   */
  maximizedProject: ProjectSlug | null
  setMaximizedProject: (slug: ProjectSlug | null) => void
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

  /* v2 */
  activeSection: null,
  setActiveSection: (section) => set({ activeSection: section }),

  sectionsSeen: {},
  markSectionSeen: (id) =>
    set((s) => (s.sectionsSeen[id] ? s : { sectionsSeen: { ...s.sectionsSeen, [id]: true } })),

  crtEnabled: false,
  setCrtEnabled: (on) => set({ crtEnabled: on }),

  demoRunning: false,
  setDemoRunning: (running) => set({ demoRunning: running }),

  maximizedProject: null,
  setMaximizedProject: (slug) => set({ maximizedProject: slug }),
}))
