/**
 * v2 §6.6 — the ONE shared mono-label decode utility.
 *
 * Rules of use (the rationed decode budget, spec §0 rail 7 + §6.6):
 * - Mono labels ONLY (filenames, toggle labels, captions) — never body copy.
 * - ≤2 decodes per section; each call is one-shot, caller-armed.
 *
 * `decodeText(final, onFrame)` runs a 6-frame, 400ms character decode:
 * random chars from the terminal glyph set settle left→right until the final
 * string stands. Returns a cancel function (safe to call after settle).
 *
 * Callers gate on reduced motion themselves (usePrefersReducedMotion) — this
 * module stays render-agnostic and does no motion policy of its own.
 */

/** Terminal glyph set the scramble frames draw from (mono-safe, 1ch wide). */
const DECODE_GLYPHS = '<>/\\[]{}=+*#%&$@!?;:^~'

export interface DecodeOptions {
  /** Total frames including the settled final frame. Default 6 (§6.6). */
  frames?: number
  /** Total duration in ms. Default 400 (§6.6). */
  durationMs?: number
}

/**
 * Decode toward `final`, emitting each frame's text to `onFrame`.
 * The last frame is always exactly `final`. Returns cancel().
 */
export function decodeText(
  final: string,
  onFrame: (text: string) => void,
  options: DecodeOptions = {},
): () => void {
  const { frames = 6, durationMs = 400 } = options
  if (typeof window === 'undefined' || final.length === 0 || frames <= 1) {
    onFrame(final)
    return () => {}
  }

  const stepMs = durationMs / frames
  let frame = 0
  let timer: number | null = null

  const tick = () => {
    frame += 1
    if (frame >= frames) {
      timer = null
      onFrame(final)
      return
    }
    // Settle left→right: the first `settled` chars are final, the rest scramble.
    const settled = Math.floor((frame / frames) * final.length)
    let text = final.slice(0, settled)
    for (let i = settled; i < final.length; i++) {
      const ch = final[i]
      // Preserve whitespace so the label never jitters in width.
      text +=
        ch === ' '
          ? ' '
          : DECODE_GLYPHS[Math.floor(Math.random() * DECODE_GLYPHS.length)]
    }
    onFrame(text)
    timer = window.setTimeout(tick, stepMs)
  }

  timer = window.setTimeout(tick, stepMs)
  return () => {
    if (timer !== null) {
      window.clearTimeout(timer)
      timer = null
      onFrame(final)
    }
  }
}
