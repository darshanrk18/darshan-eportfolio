'use client'

/**
 * The guide's surface (V3_SPEC §2.6, inventory X3 crop A) — the lazy chunk
 * behind components/guide/Guide.client.tsx, mounted only while
 * store.guideOpen. One DOM, two skins (styles/v3/guide.css):
 *   SCREEN — a glass popover anchored under the "8 things to try" pill
 *            (344 wide, notch on the pill's centre), the page scrimmed and
 *            blurred 1 px; 160 ms fade + 4 px rise.
 *   PRINT  — a comic checklist card (358 wide, −0.5°, pointer at the chip)
 *            slapped down with a hard two-step drop; the veil is paper.
 *   < 640  — a bottom sheet (full width, 16 px gutters, ≤ 80vh, handle).
 *
 * role="dialog" aria-modal, aria-label "8 things to try"; focus trapped,
 * Esc and the scrim close. Rows are the eight items in chapter order; the
 * NEXT untried row (aria-current="step") opens with its one-line "how" and
 * the "Try it" button, any row opens the same way on click. "This page"
 * marks rows whose section is the active one. "Try it" closes the surface
 * and runs lib/guide/actions (the feature's island then reports the
 * completion). PRINT's tried marks are the red seal impression; a mark
 * that completes while the surface is open lands with the stamp beat.
 * Footer: "More in ⌘K" / "More under Jump" opens the palette.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import DkSeal from '@/components/chrome/DkSeal'
import { createCommandCtx, getCurrentEdition } from '@/lib/commands/context'
import { runGuideAction } from '@/lib/guide/actions'
import {
  GUIDE_CHIP_LABEL,
  GUIDE_IDS,
  GUIDE_ITEMS,
  GUIDE_MORE_LABEL,
  GUIDE_NEXT_LABEL,
  GUIDE_THIS_PAGE_LABEL,
  GUIDE_TRIED_LABEL,
  GUIDE_TRY_LABEL,
  GUIDE_UNTRIED_LABEL,
  isTried,
  nextUntried,
  progressLabel,
  type GuideId,
} from '@/lib/guide/guide'
import { useSignalStore } from '@/lib/state/store'

export interface GuideSurfaceProps {
  /** The chip the popover anchors to (null → centred). */
  anchor: HTMLElement | null
  onClose: () => void
}

/** Popover width per skin (X3: 344 SCREEN / 358 PRINT). */
const WIDTH = { screen: 344, print: 358 } as const
/** Under this width the surface is a bottom sheet (CSS media query mirror). */
const SHEET_MAX_WIDTH = 640

type RowState = 'tried' | 'next' | 'untried'

export default function GuideSurface({ anchor, onClose }: GuideSurfaceProps) {
  const router = useRouter()
  const ctx = useMemo(() => createCommandCtx(router), [router])
  const tried = useSignalStore((s) => s.guideTried)
  const activeSection = useSignalStore((s) => s.activeSection)
  const storeEdition = useSignalStore((s) => s.edition)
  const edition = storeEdition ?? getCurrentEdition()
  const setPaletteOpen = useSignalStore((s) => s.setPaletteOpen)
  const setOverlayOpen = useSignalStore((s) => s.setOverlayOpen)

  const next = nextUntried(tried)
  const [expanded, setExpanded] = useState<GuideId | null>(next)
  const dialogRef = useRef<HTMLElement>(null)
  /** Marks tried before this surface opened: later completions get the stamp beat. */
  const initialTried = useRef<readonly GuideId[]>(tried)
  const [pos, setPos] = useState<{ top: number; left: number; notch: number } | null>(null)

  // Position under the chip (≥ 640); the sheet layout is CSS-only below.
  useEffect(() => {
    const place = () => {
      if (window.innerWidth < SHEET_MAX_WIDTH || !anchor) {
        setPos(null)
        return
      }
      const r = anchor.getBoundingClientRect()
      const width = WIDTH[edition]
      const left = Math.max(12, Math.min(r.left, window.innerWidth - width - 12))
      setPos({ top: r.bottom + 12, left, notch: r.left + r.width / 2 - left })
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [anchor, edition])

  // Overlay flag (director call (l)), focus in, Esc, restore focus out.
  useEffect(() => {
    setOverlayOpen(true)
    const previouslyFocused = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current
    const first =
      dialog?.querySelector<HTMLElement>('[aria-current="step"]') ??
      dialog?.querySelector<HTMLElement>('button')
    first?.focus({ preventScroll: true })
    return () => {
      setOverlayOpen(false)
      previouslyFocused?.focus?.({ preventScroll: true })
    }
  }, [setOverlayOpen])

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      onClose()
      return
    }
    if (e.key !== 'Tab') return
    const focusables = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled])')
    if (!focusables || focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const tryIt = useCallback(
    (id: GuideId) => {
      onClose()
      void runGuideAction(id, ctx)
    },
    [ctx, onClose]
  )

  const more = () => {
    onClose()
    setPaletteOpen(true)
  }

  const stateOf = (id: GuideId): RowState =>
    isTried(tried, id) ? 'tried' : id === next ? 'next' : 'untried'

  return (
    <>
      <button
        type="button"
        className="gd-scrim"
        aria-label="Close the guide"
        tabIndex={-1}
        onClick={onClose}
      />
      <section
        ref={dialogRef}
        id="guide-surface"
        role="dialog"
        aria-modal="true"
        aria-label={GUIDE_CHIP_LABEL}
        className="gd"
        data-component="GuideSurface"
        data-island="client"
        data-sheet={pos ? undefined : '1'}
        style={
          pos
            ? {
                top: pos.top,
                left: pos.left,
                width: WIDTH[edition],
                ['--gd-notch' as string]: `${pos.notch}px`,
                ['--vs-i' as string]: 8,
              }
            : { ['--vs-i' as string]: 8 }
        }
        onKeyDown={onKeyDown}
      >
        <span className="gd-notch" aria-hidden="true" />
        <span className="gd-handle" aria-hidden="true" />
        <header className="gd-head">
          <h2 className="gd-title">{GUIDE_CHIP_LABEL}</h2>
          <span className="gd-count">{progressLabel(tried)}</span>
        </header>
        <div className="gd-progress" aria-hidden="true">
          {GUIDE_IDS.map((id) => (
            <i key={id} data-state={stateOf(id)} />
          ))}
        </div>
        <ol className="gd-rows">
          {GUIDE_ITEMS.map((item) => {
            const state = stateOf(item.id)
            const isOpen = expanded === item.id
            const here = item.section !== null && item.section === activeSection
            const landed = state === 'tried' && !initialTried.current.includes(item.id)
            return (
              <li key={item.id} data-state={state} data-open={isOpen ? '1' : undefined}>
                <button
                  type="button"
                  className="gd-row"
                  aria-expanded={isOpen}
                  aria-current={state === 'next' ? 'step' : undefined}
                  onClick={() => setExpanded(isOpen ? null : item.id)}
                >
                  <span className="gd-mark" data-landed={landed ? '1' : undefined}>
                    {state === 'tried' ? (
                      <>
                        <svg className="gd-check" viewBox="0 0 12 12" aria-hidden="true">
                          <path d="M2 6.2 5 9l5-6" fill="none" stroke="currentColor" strokeWidth="1.4" />
                        </svg>
                        <DkSeal variant="mark" size={22} className="gd-stamp" />
                        <span className="sr-only">{GUIDE_TRIED_LABEL}</span>
                      </>
                    ) : (
                      <>
                        <span className="gd-slot" />
                        <span className="sr-only">
                          {state === 'next' ? GUIDE_NEXT_LABEL : GUIDE_UNTRIED_LABEL}
                        </span>
                      </>
                    )}
                  </span>
                  <span className="gd-name">{item.label[edition]}</span>
                  {here ? <span className="gd-where">{GUIDE_THIS_PAGE_LABEL}</span> : null}
                </button>
                {isOpen ? (
                  <div className="gd-ex">
                    <p>{item.how[edition]}</p>
                    <button type="button" className="gd-try" onClick={() => tryIt(item.id)}>
                      <span className="gd-try-play" aria-hidden="true" />
                      {GUIDE_TRY_LABEL}
                      <svg className="gd-try-arrow" width="16" height="10" viewBox="0 0 18 10" aria-hidden="true">
                        <path d="M0 5H16M12 1L16.5 5L12 9" fill="none" stroke="currentColor" strokeWidth="1.4" />
                      </svg>
                    </button>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ol>
        <footer className="gd-foot">
          <button type="button" className="gd-more" onClick={more}>
            {GUIDE_MORE_LABEL[edition]}
            {edition === 'screen' ? <kbd className="ed-kbd">⌘K</kbd> : null}
          </button>
        </footer>
      </section>
    </>
  )
}
