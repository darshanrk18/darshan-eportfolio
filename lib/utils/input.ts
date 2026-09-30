/**
 * Mouse or touch words. An instruction that names a key or a hover ("Press
 * ⌘K", "hover a job", "press its number") has a second wording for a touch
 * screen, where there is no key to press and nothing to hover. Both wordings
 * render, on the server too (no hydration mismatch), and CSS shows one:
 * `.mouse-only` / `.touch-only` in app/globals.css, drawn by
 * components/chrome/InputWords.tsx. See styles/v3/README.md §4a.
 *
 * Pure: the copy modules take an InputKind and return that wording.
 */

export type InputKind = 'mouse' | 'touch'

/**
 * "Touch" in CSS: no hover and a coarse pointer — the same test that hides
 * the top bar's ⌘K chip (styles/v3/chrome.css). app/globals.css hides
 * `.mouse-only` under it and `.touch-only` under its exact complement.
 */
export const TOUCH_MEDIA = '(hover: none) and (pointer: coarse)'
export const NOT_TOUCH_MEDIA = '(hover: hover), (pointer: fine), (pointer: none)'

/** The palette's keycap as the frames draw it (Apple keyboards). */
export const PALETTE_KEY = '⌘K'

/** The keycap for this platform: "Ctrl K" off Apple, like the top bar's chip. */
export function paletteKeyFor(platform: string): string {
  return /Mac|iPhone|iPad|iPod/.test(platform) ? PALETTE_KEY : 'Ctrl K'
}
