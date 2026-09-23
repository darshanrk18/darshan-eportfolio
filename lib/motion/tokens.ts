/**
 * Motion tokens (spec §3) — JS mirror of the CSS vars in app/globals.css.
 * Easings are cubic-bezier tuples in the shape `motion/react` accepts
 * (`transition={{ ease: EASE_OUT_EXPO }}`); durations are in SECONDS.
 */

export type BezierTuple = [number, number, number, number]

/** Entrances/reveals, 500–700ms. */
export const EASE_OUT_EXPO: BezierTuple = [0.16, 1, 0.3, 1]
/** Micro-interactions, 150–200ms (hover, press, chips). */
export const EASE_SWIFT: BezierTuple = [0.3, 0, 0, 1]
/** Structural moves, 500–700ms (menu, window open/close, boot exit). */
export const EASE_STRUCTURAL: BezierTuple = [0.76, 0, 0.24, 1]

/** Durations in seconds (motion/react convention). */
export const DUR_MICRO = 0.18
export const DUR_ENTER = 0.6
export const DUR_SLOW = 0.9

/** Springs — cursor/layout-driven only (tab underline, inspector slide). */
export const SPRING_UI = { type: 'spring', stiffness: 300, damping: 30 } as const
/** Palette pop: scale 0.98 → 1 in 150ms swift. */
export const PALETTE_POP = { duration: 0.15, ease: EASE_SWIFT } as const

/** Typing effects: ms per character (§3.2). */
export const TYPE_MS_PER_CHAR = 24
/** Terminal output streaming: ms per line (§5.3; 0 under reduced motion). */
export const STREAM_MS_PER_LINE = 12
/** Count-ups: 1.2s ease-out-expo, fire once (§3.2). */
export const COUNT_UP_S = 1.2
/** Stagger steps in seconds: masked lines 80ms; list items/chips 50ms (§3.3). */
export const STAGGER_LINES = 0.08
export const STAGGER_ITEMS = 0.05
/** Caret blink period (§3.2) — CSS owns the animation; JS mirror for timers. */
export const CARET_BLINK_S = 1.1
