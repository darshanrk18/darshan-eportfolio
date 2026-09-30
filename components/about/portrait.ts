/**
 * The Decompiled Portrait's contracts (pure, node-safe; no React, no DOM).
 *
 * - PORTRAIT_REVEAL_EVENT: window event other islands dispatch to run the
 *   reveal from outside (the guide's "Try it", the palette `reveal-portrait`
 *   command): scroll to #about first, then dispatch with a short retry until
 *   the island has mounted (director call m). No detail.
 * - The guide completion (V3_SPEC §2.6 item 3): when a reveal completes the
 *   FIRST time on a page, the island dispatches GUIDE_TRIED_EVENT with
 *   `{ detail: { id: PORTRAIT_GUIDE_ID } }`. The literals mirror
 *   lib/guide/guide.ts (asserted in tests/hero-about.test.ts) so the
 *   portrait chunk never imports the guide lib.
 * - PHOTO ramps: the SCREEN reveal resolves from PHOTO_ASCII glyphs; the
 *   PRINT reveal dissolves the halftone dot screen. The visible wording is
 *   always "Reveal the portrait" / "Replay the portrait" (clutter law).
 */

export const PORTRAIT_REVEAL_EVENT = 'signal:reveal-portrait'
export const GUIDE_TRIED_EVENT = 'signal:guide-tried'
export const PORTRAIT_GUIDE_ID = 'reveal-portrait'

/** The SCREEN sweep's length; the CSS keyframe matches (portrait.css). */
export const PORTRAIT_SWEEP_MS = 1200
/** The PRINT dissolve's length; the CSS transition matches. */
export const PORTRAIT_DISSOLVE_MS = 600
/** A PRINT reveal triggered from outside (guide / palette) shows this long, then reverses. */
export const PORTRAIT_HOLD_MS = 2200
