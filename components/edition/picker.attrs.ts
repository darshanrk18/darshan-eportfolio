/**
 * The picker's attribute names and timings — a module of plain strings, so
 * the always-loaded gate (EditionPicker.client.tsx) can use them without
 * pulling the shell's drawing data (silhouette, inline script, photos) into
 * the first-load bundle. picker.shared.ts re-exports all of it.
 */

/** html attribute ('1') — the surface is live and has replaced the shell (picker.css hides it). */
export const PICKER_LIVE_ATTR = 'data-picker-live'

/** The shell root's marker; the surface finds it to sync animations before the swap. */
export const PICKER_SHELL_ATTR = 'data-pk-shell'

/**
 * html attribute ('screen' | 'print') — a choice made on the SHELL before the
 * surface was live (a tap, Enter/Space, or 1 / 2), written by the shell's
 * inline script (PICKER_SHELL_SCRIPT) and consumed by the surface the moment
 * it takes over: it chooses at once, so nothing a visitor did in the
 * pre-hydration window is lost.
 */
export const PICKER_QUEUED_ATTR = 'data-pick-queued'

/** Class the shell's script puts on the half that was chosen (its pressed look, picker.css). */
export const PICKER_QUEUED_CLASS = 'is-queued'

/** How long a queued tap waits for the surface before the shell applies it itself. */
export const PICKER_FALLBACK_MS = 6000

/** html attribute ('1') — the surface chunk failed to load; the shell applies a tap at once. */
export const PICKER_FAILED_ATTR = 'data-picker-failed'
