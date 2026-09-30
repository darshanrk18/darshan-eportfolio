/**
 * Shared cross-section client state (zustand v5).
 * Import ONLY from client components: `useSignalStore((s) => s.field)`.
 */

import { create } from 'zustand'
import type { SectionAnchor } from '@/lib/commands/sections'
import type { ProjectSlug } from '@/lib/data/projects'
import type { Edition } from '@/lib/edition/prepaint'
import { markTried, type GuideId } from '@/lib/guide/core'
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

  /* ------------------------------------------------------------------ v3 -- */

  /**
   * v3 §2.1 — the edition in force, the React mirror of html[data-edition].
   * null until an island reports (EditionToggle syncs it on mount;
   * applyEdition() writes it on every switch). Do NOT set directly from
   * components: call applyEdition() / switchEdition() from
   * lib/commands/context, which keep the attribute,
   * localStorage['signal.edition'], the theme-color meta, analytics and this
   * mirror in sync. READ it to skin JS-driven surfaces (disc colours, the
   * portrait reveal target, the console skin) — CSS-only skins should key
   * off the attribute instead.
   */
  edition: Edition | null
  setEdition: (edition: Edition | null) => void

  /**
   * v3 §1.8 — Build info panel open state (the ONLY place build evidence —
   * SHA, KB, fps, seen count — is drawn). WRITTEN by the palette
   * `build-info` command (true) and the panel's close / Esc (false); READ by
   * the C1 BuildInfo island, which is next/dynamic and mounts only while
   * this is true so the panel never rides the first-load bundle.
   */
  buildInfoOpen: boolean
  setBuildInfoOpen: (open: boolean) => void

  /* ------------------------------------------------------------ v3 C5 -- */

  /**
   * v3 §2.6 — the guide surface (popover / checklist) open state. WRITTEN
   * by the Guide island's chip, its close / Esc and the surface's "Try it"
   * (which closes before acting); READ by the coach-mark scheduler (never
   * a coach mark while the guide is open) and by the palette Next row.
   */
  guideOpen: boolean
  setGuideOpen: (open: boolean) => void

  /**
   * v3 §2.6 — the guide's tried ids, chapter order, the React mirror of
   * localStorage['signal.guide']. The Guide island hydrates it from storage
   * on mount and PERSISTS every change; every other writer goes through the
   * `signal:guide-tried` window event (the island listens) — never call
   * markGuideTried from a section. markGuideTried is idempotent: a repeat
   * id returns the same array reference, so subscribers see no change.
   * READ by the palette's Next row (next untried) and the guide surfaces.
   */
  guideTried: readonly GuideId[]
  markGuideTried: (id: GuideId) => void

  /**
   * v3 director call (l) — true while a full-screen overlay (the edition
   * picker, the PRINT intro, the guide surface) covers the page.
   * lib/motion/useInViewOnce defers its fire-once reveal while this is true
   * so entry choreography never plays unseen. WRITTEN by the picker (C5),
   * the intro (C6) and the guide surface (C5); each writer clears only what
   * it set.
   */
  overlayOpen: boolean
  setOverlayOpen: (open: boolean) => void
}

export const useSignalStore = create<SignalState>()((set) => ({
  focusedSkills: [],
  setFocusedSkills: (ids) => set({ focusedSkills: ids }),

  activeProject: 'triplay-ai',
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

  /* v3 */
  edition: null,
  setEdition: (edition) => set({ edition }),

  buildInfoOpen: false,
  setBuildInfoOpen: (open) => set({ buildInfoOpen: open }),

  /* v3 C5 */
  guideOpen: false,
  setGuideOpen: (open) => set({ guideOpen: open }),

  guideTried: [],
  markGuideTried: (id) =>
    set((s) => {
      const next = markTried(s.guideTried, id)
      return next === s.guideTried ? s : { guideTried: next }
    }),

  overlayOpen: false,
  setOverlayOpen: (open) => set({ overlayOpen: open }),
}))
