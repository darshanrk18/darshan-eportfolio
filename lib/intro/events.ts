/**
 * v3 §2.7 — the intro's cross-island contract, as pure constants (no DOM,
 * no React) so the picker (C5), the hero (C2) and the palette can import
 * them from anywhere without pulling the intro chunk.
 *
 * Events (all on window, no detail):
 *   INTRO_START_EVENT  — the picker chose PRINT on a first visit; the gate
 *                        (components/intro/IntroGate.client.tsx) loads and
 *                        runs the intro. The picker dispatches it AFTER
 *                        applyEdition('print', 'picker').
 *   SIGNAL_EVENTS.replayIntro ('signal:replay-intro', lib/commands/context)
 *                      — the palette `replay-intro` command / the cover's
 *                        "Replay the intro" button; same handling.
 *   INTRO_DONE_EVENT   — dispatched by the intro when the cover LANDS (the
 *                        overlay is still fading for 200 ms); the hero's
 *                        entry gate (components/hero/HeroEntry.client.tsx)
 *                        releases its hold on it.
 *
 * Attributes:
 *   INTRO_HANDOFF_ATTR — html[data-intro-handoff='print'|'register'|'stamp'
 *                        |'land'] for the hand-off's lifetime only; styles/
 *                        v3/intro.css keys the Navbar's masthead drop and
 *                        its empty seal slot off it (the seal itself is
 *                        stamped by the overlay's own copy). Removed when
 *                        the overlay unmounts.
 *   INTRO_NAME_TARGET_ATTR — `data-intro-name` on the hero element whose
 *                        box is the FINAL resting box of the surname line
 *                        of the PRINT cover's name (the block, not an
 *                        animated inner span). The hand-off FLIP-lands the
 *                        intro's KONNUR on it; without it the fallback is
 *                        `#hero h1`, and with neither the name fades.
 */

export const INTRO_START_EVENT = 'signal:intro-start'
export const INTRO_DONE_EVENT = 'signal:intro-done'

export const INTRO_HANDOFF_ATTR = 'data-intro-handoff'
export const INTRO_NAME_TARGET_ATTR = 'data-intro-name'

/** The hand-off's html attribute values, in beat order. */
export type IntroHandoffPhase = 'print' | 'register' | 'stamp' | 'land'
