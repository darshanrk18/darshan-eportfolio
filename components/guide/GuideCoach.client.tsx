'use client'

/**
 * The coach mark (V3_SPEC §2.6, inventory X3 crop B1) — the lazy chunk the
 * guide runtime mounts for ONE untried item at a time, beside the control
 * it means. The control is resolved by lib/guide/actions findCoachAnchor:
 * the section's own `data-guide-anchor="<item id>"` element first (the
 * toolkit button, the skills-per-job switch), else the item's COACH_ANCHORS
 * fallbacks (the portrait's replay / panel, the game board or the window's
 * tabs, the Maximize control, the console prompt) — the first VISIBLE one.
 * Lazy islands are waited for (≤ 1.5 s); with no control the mark never
 * draws and dismisses itself (never the viewport's corner, never over
 * something else).
 *
 * Placed in page coordinates (absolute, so it scrolls with the page) below
 * the control; above it when there is no room below (measured with its own
 * height, never under the fixed bar); to its left or right when neither
 * fits (a tall control like the portrait panel); re-measured on resize and
 * once more after the neighbours have had time to mount. It never sits over
 * other text (X3): every candidate spot is scored against the section's
 * visible text, images and controls (outside the control's own island), and
 * the first clear one wins — sliding along the control so the notch still
 * points at it — else the least covering one.
 *
 * SCREEN — a small glass callout with a notch, the line and a dismiss ×.
 * PRINT  — a yellow "TRY THIS" panel with a sunburst corner, the speech
 *          bubble and the red button that performs the action.
 * The line has a touch wording where it names a hover (both render, CSS
 * shows one — InputWords). Under reduced motion there is no mark for an
 * animation that motion setting turns off (SCREEN's portrait: no replay).
 * role="note"; the dismiss is a real button named "Dismiss the hint"; the
 * action button carries the item's label. Never under 640 px and never
 * alongside the open guide, the palette or a lightbox (the runtime gates
 * that).
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import InputWords from '@/components/chrome/InputWords'
import { createCommandCtx, getCurrentEdition } from '@/lib/commands/context'
import { findCoachAnchor, runGuideAction } from '@/lib/guide/actions'
import {
  GUIDE_COACH_KICKER,
  GUIDE_DISMISS_LABEL,
  getGuideItem,
  guideCoach,
  type GuideId,
} from '@/lib/guide/guide'
import { placeBeside, type CoachBox, type CoachPlacement } from '@/lib/guide/place'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'
import { useSignalStore } from '@/lib/state/store'

export interface GuideCoachProps {
  id: GuideId
  onDismiss: () => void
}

const WIDTH = 256
/** How long to wait for a lazy island's control before giving up (no mark). */
const ANCHOR_WAIT_MS = 1500
const ANCHOR_POLL_MS = 100
/** A second measurement, once lazy neighbours have had time to mount. */
const REMEASURE_MS = 800

/** Overlap area of two boxes (px²). */
function overlap(a: CoachBox, b: CoachBox): number {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left)
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
  return w > 0 && h > 0 ? w * h : 0
}

function isShown(el: HTMLElement): boolean {
  if (typeof el.checkVisibility === 'function') {
    return el.checkVisibility({
      opacityProperty: true,
      visibilityProperty: true,
    } as CheckVisibilityOptions)
  }
  const cs = getComputedStyle(el)
  return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) !== 0
}

/** How much covering the control's OWN island counts (the frames put the mark's tail into that panel). */
const OWN_ISLAND_WEIGHT = 0.35

interface ContentBox extends CoachBox {
  weight: number
}

/**
 * What the mark must not cover, in viewport coordinates: the page section's
 * visible text runs, images / small graphics and controls, leaving out the
 * control itself, decorative furniture (aria-hidden non-media) and
 * full-bleed backgrounds (a graphic wider than most of the viewport is a
 * background, not content). Content inside the control's own island (the
 * panel it lives in) weighs less than a neighbour's: covering the panel's
 * own prompt beats covering the next card's caption. Only what is on
 * screen counts.
 */
function contentBoxes(anchor: HTMLElement, self: HTMLElement | null): ContentBox[] {
  const scope: HTMLElement = anchor.closest('section[id]') ?? document.body
  const own = anchor.closest<HTMLElement>('[data-component]')
  const vw = window.innerWidth
  const vh = window.innerHeight
  const boxes: ContentBox[] = []
  for (const el of Array.from(scope.querySelectorAll<HTMLElement>('*'))) {
    if (el === anchor || anchor.contains(el)) continue
    if (self && self.contains(el)) continue
    const tag = el.tagName.toLowerCase()
    const media = tag === 'img' || tag === 'svg' || tag === 'canvas' || tag === 'video'
    const control =
      tag === 'button' || tag === 'a' || tag === 'input' || tag === 'select' || tag === 'textarea'
    const ownText =
      !media &&
      !control &&
      Array.from(el.childNodes).some(
        (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim() !== ''
      )
    if (!media && !control && !ownText) continue
    if (!media && el.closest('[aria-hidden="true"]')) continue
    if (!isShown(el)) continue
    const r = el.getBoundingClientRect()
    if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > vh) continue
    if (media && r.width > vw * 0.6 && r.height > vh * 0.4) continue
    const weight = own && own !== scope && own.contains(el) ? OWN_ISLAND_WEIGHT : 1
    boxes.push({ top: r.top, bottom: r.bottom, left: r.left, right: r.right, weight })
  }
  return boxes
}

function readNavHeight(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--nav-h')
  const n = parseFloat(raw)
  return Number.isFinite(n) ? n : 64
}

export default function GuideCoach({ id, onDismiss }: GuideCoachProps) {
  const router = useRouter()
  const ctx = useMemo(() => createCommandCtx(router), [router])
  const storeEdition = useSignalStore((s) => s.edition)
  const edition = storeEdition ?? getCurrentEdition()
  const motion = usePrefersReducedMotion() ? 'reduced' : 'full'
  const ref = useRef<HTMLElement>(null)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [pos, setPos] = useState<CoachPlacement | null>(null)

  // Find the control; wait for a lazy island; give up quietly.
  useEffect(() => {
    let cancelled = false
    let timer: number | null = null
    const started = Date.now()
    const look = () => {
      if (cancelled) return
      const el = findCoachAnchor(id)
      if (el) {
        setAnchor(el)
        return
      }
      if (Date.now() - started >= ANCHOR_WAIT_MS) {
        onDismiss()
        return
      }
      timer = window.setTimeout(look, ANCHOR_POLL_MS)
    }
    look()
    return () => {
      cancelled = true
      if (timer !== null) window.clearTimeout(timer)
    }
  }, [id, onDismiss])

  // Place beside it. The mark renders hidden first so its own height is
  // known when it has to sit above the control.
  useLayoutEffect(() => {
    if (!anchor) return undefined
    const place = () => {
      const r = anchor.getBoundingClientRect()
      const boxes = contentBoxes(anchor, ref.current)
      const p = placeBeside(
        r,
        { width: WIDTH, height: ref.current?.offsetHeight ?? 0 },
        { width: window.innerWidth, height: window.innerHeight, navHeight: readNavHeight() },
        { collides: (box) => boxes.reduce((sum, b) => sum + overlap(box, b) * b.weight, 0) }
      )
      setPos({ top: p.top + window.scrollY, left: p.left + window.scrollX, side: p.side })
    }
    place()
    const late = window.setTimeout(place, REMEASURE_MS)
    window.addEventListener('resize', place)
    return () => {
      window.clearTimeout(late)
      window.removeEventListener('resize', place)
    }
  }, [anchor])

  const tryIt = useCallback(() => {
    onDismiss()
    void runGuideAction(id, ctx)
  }, [ctx, id, onDismiss])

  const line = guideCoach(id, edition, 'mouse', motion)
  if (!anchor || !line) return null
  const item = getGuideItem(id)

  return (
    <aside
      ref={ref}
      role="note"
      className="gd-coach"
      data-component="GuideCoach"
      data-island="client"
      data-side={pos?.side}
      style={{
        top: pos?.top ?? 0,
        left: pos?.left ?? 0,
        width: WIDTH,
        visibility: pos ? undefined : 'hidden',
        ['--vs-i' as string]: 8,
      }}
    >
      <span className="gd-coach-notch" aria-hidden="true" />
      <span className="gd-coach-sun" aria-hidden="true" />
      <div className="gd-coach-body">
        <span className="gd-coach-kicker" aria-hidden="true">
          {GUIDE_COACH_KICKER}
        </span>
        <p className="gd-coach-text">
          <InputWords mouse={line} touch={guideCoach(id, edition, 'touch', motion)} />
        </p>
        <button type="button" className="gd-coach-try" onClick={tryIt}>
          <span className="gd-try-play" aria-hidden="true" />
          {item.label[edition]}
        </button>
      </div>
      <button
        type="button"
        className="gd-coach-x"
        aria-label={GUIDE_DISMISS_LABEL}
        onClick={onDismiss}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2 2l8 8M10 2l-8 8" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>
    </aside>
  )
}
