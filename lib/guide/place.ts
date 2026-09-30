/**
 * V3_SPEC §2.6 — where the coach mark sits around the control it names
 * (components/guide/GuideCoach.client.tsx). Pure geometry, viewport
 * coordinates in, viewport coordinates out; the caller adds the scroll
 * offset. Rides the coach chunk only. Unit-tested in tests/guide.test.ts.
 *
 * Preference: BELOW the control; ABOVE it when there is no room below (and
 * the mark would still clear the fixed bar); to its LEFT or RIGHT when
 * neither fits (a tall control such as the portrait panel); else below
 * anyway. Horizontally the mark is clamped inside the viewport with a 12 px
 * gutter.
 *
 * "Never over other text" (X3): with `collides` the caller scores each
 * candidate by how much page content it would cover; the first side in the
 * order above whose mark covers nothing wins, sliding along the control
 * (so the notch still points at it) to find that clear spot, and when every
 * candidate covers something the least covering one is used.
 */

export type CoachSide = 'below' | 'above' | 'right' | 'left'

export interface CoachBox {
  top: number
  bottom: number
  left: number
  right: number
}

export interface CoachPlacement {
  top: number
  left: number
  side: CoachSide
}

export interface PlaceOptions {
  /** Content area (px²) the mark would cover at this box; 0 = clear. */
  collides?: (box: CoachBox) => number
}

/** Gap between the control and the mark. */
export const COACH_GAP = 12
/** Breathing room the mark keeps from the viewport's bottom edge. */
const BOTTOM_ROOM = 24
/** Breathing room the mark keeps under the fixed bar. */
const BAR_ROOM = 8
const GUTTER = 12
/** How far the mark may slide along the control while its notch still points at it. */
const NOTCH_REACH = 40
/** Slide step when looking for a clear spot. */
const SLIDE_STEP = 24

/** Offsets 0, +s, −s, +2s, −2s … within [lo, hi] (relative to `start`). */
function slideRange(start: number, lo: number, hi: number): number[] {
  const out: number[] = []
  const push = (x: number) => {
    if (x >= lo - 0.5 && x <= hi + 0.5 && !out.includes(x)) out.push(x)
  }
  push(Math.max(lo, Math.min(start, hi)))
  for (let k = 1; k <= 40; k++) {
    push(start + k * SLIDE_STEP)
    push(start - k * SLIDE_STEP)
    if (start + k * SLIDE_STEP > hi && start - k * SLIDE_STEP < lo) break
  }
  return out
}

export function placeBeside(
  control: CoachBox,
  size: { width: number; height: number },
  viewport: { width: number; height: number; navHeight: number },
  opts: PlaceOptions = {}
): CoachPlacement {
  const maxLeft = viewport.width - size.width - GUTTER
  const clampLeft = (x: number) => Math.max(GUTTER, Math.min(x, maxLeft))
  const minTop = viewport.navHeight + COACH_GAP
  const lowest = viewport.height - size.height - GUTTER
  const clampTop = (y: number) => Math.max(minTop, Math.min(y, lowest))

  const fitsBelow = viewport.height - control.bottom >= size.height + COACH_GAP + BOTTOM_ROOM
  const fitsAbove = control.top - COACH_GAP - size.height >= viewport.navHeight + BAR_ROOM
  const fitsRight = control.right + COACH_GAP + size.width <= viewport.width - GUTTER
  const fitsLeft = control.left - COACH_GAP - size.width >= GUTTER

  // the x (below / above) or y (left / right) the mark may take while its
  // notch still reaches the control
  const xs = () => {
    const base = clampLeft(control.left)
    const slid = slideRange(
      base,
      Math.max(GUTTER, control.left - size.width + NOTCH_REACH),
      Math.min(maxLeft, control.right - NOTCH_REACH)
    )
    return [base, ...slid.filter((x) => x !== base)]
  }
  const ys = () => {
    const base = clampTop((control.top + control.bottom) / 2 - size.height / 2)
    const slid = slideRange(
      base,
      Math.max(minTop, control.top - size.height + NOTCH_REACH),
      Math.min(lowest, control.bottom - NOTCH_REACH)
    )
    return [base, ...slid.filter((y) => y !== base)]
  }

  const candidates: CoachPlacement[] = []
  if (fitsBelow)
    for (const x of xs())
      candidates.push({ top: control.bottom + COACH_GAP, left: x, side: 'below' })
  if (fitsAbove)
    for (const x of xs())
      candidates.push({ top: control.top - COACH_GAP - size.height, left: x, side: 'above' })
  if (fitsLeft)
    for (const y of ys())
      candidates.push({ top: y, left: control.left - COACH_GAP - size.width, side: 'left' })
  if (fitsRight)
    for (const y of ys())
      candidates.push({ top: y, left: control.right + COACH_GAP, side: 'right' })

  if (candidates.length === 0) {
    return { top: control.bottom + COACH_GAP, left: clampLeft(control.left), side: 'below' }
  }
  const collides = opts.collides
  if (!collides) return candidates[0]

  let best = candidates[0]
  let bestScore = Infinity
  for (const c of candidates) {
    const score = collides({
      top: c.top,
      bottom: c.top + size.height,
      left: c.left,
      right: c.left + size.width,
    })
    if (score <= 0) return c
    if (score < bestScore) {
      bestScore = score
      best = c
    }
  }
  return best
}
