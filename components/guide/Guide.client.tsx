'use client'

/**
 * The guide — the always-mounted island (V3_SPEC §2.6, inventory X3).
 * Mounted once in app/page.tsx after the palette. This is the part that
 * rides the first-load bundle, so it is deliberately small (§7): the chip,
 * the progress state and the completion listeners. It owns:
 *
 *   • the "8 things to try" CHIP, portalled into the Navbar's `#guide-slot`
 *     (one chip, present in the desktop and the phone bar; a ring + dot
 *     progress icon in both editions, the label uppercased by PRINT's CSS);
 *   • the progress STATE: hydrates store.guideTried from
 *     localStorage['signal.guide'] on mount and persists every change;
 *   • the completion LISTENERS — the one choke point:
 *       – window 'signal:guide-tried' { detail: { id } } from every area
 *         (ConnectFour → play-c4, ProjectWindow → open-project, the
 *         portrait, the toolkit, the blame toggle, the terminal);
 *       – store.paletteOpen turning true → go-anywhere;
 *   • the aria-live "Tried: … n of 8 tried." confirmation (§6), whose copy
 *     module loads on demand;
 *   • the completion beat: at 8/8 the chip reads "You've tried everything"
 *     once, then keeps its label and hides its ring.
 *
 * Everything not needed at first paint is a next/dynamic chunk: the
 * SURFACE (SCREEN popover / PRINT checklist, while open) and the RUNTIME
 * (./GuideRuntime.client.tsx — the other-edition observer and the
 * coach-mark scheduler, which loads the coach mark itself when one is
 * due). This file imports lib/guide/core.ts, never the copy or the actions.
 * styles/v3/guide.css is imported here so the chip is styled from the
 * first paint of the bar.
 */

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  GUIDE_CHIP_LABEL,
  GUIDE_COMPLETE_LABEL,
  GUIDE_TOTAL,
  GUIDE_TRIED_EVENT,
  chipNameSuffix,
  isComplete,
  isGuideId,
  readTried,
  triedCount,
  writeTried,
} from '@/lib/guide/core'
import { useSignalStore } from '@/lib/state/store'
import { trackEvent } from '@/lib/utils/analytics'
import { islandUnavailable } from '@/lib/utils/island'
import '@/styles/v3/guide.css'

const GuideSurface = dynamic(() => import('./GuideSurface.client').catch(islandUnavailable<typeof import('./GuideSurface.client')>), { ssr: false })
const GuideRuntime = dynamic(() => import('./GuideRuntime.client').catch(islandUnavailable<typeof import('./GuideRuntime.client')>), { ssr: false })

/** The Navbar's slot the chip is portalled into (components/chrome/Navbar.tsx). */
const SLOT_ID = 'guide-slot'
/** The slot is in the SSR HTML; the retry only covers a bar that mounts late. */
const SLOT_RETRY_MS = 100
const SLOT_RETRY_MAX_MS = 1500
/** How long the completion label stays on the chip. */
const COMPLETE_FLASH_MS = 4000

function safeLocal(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export default function Guide() {
  const tried = useSignalStore((s) => s.guideTried)
  const open = useSignalStore((s) => s.guideOpen)
  const setGuideOpen = useSignalStore((s) => s.setGuideOpen)
  const paletteOpen = useSignalStore((s) => s.paletteOpen)

  const [slot, setSlot] = useState<HTMLElement | null>(null)
  const chipRef = useRef<HTMLButtonElement>(null)
  const [completeFlash, setCompleteFlash] = useState(false)
  const [announce, setAnnounce] = useState('')
  /** True once the tried list came back from storage (the runtime waits for it). */
  const [hydrated, setHydrated] = useState(false)
  const wasComplete = useRef(false)

  const count = triedCount(tried)
  const complete = isComplete(tried)

  // ---------------------------------------------------------------- mount
  // The chip's portal target + hydration from device storage.
  useEffect(() => {
    const store = useSignalStore.getState()
    for (const id of readTried(safeLocal())) store.markGuideTried(id)
    wasComplete.current = isComplete(useSignalStore.getState().guideTried)
    setHydrated(true)

    const started = Date.now()
    let timer: number | null = null
    const find = () => {
      const el = document.getElementById(SLOT_ID)
      if (el) {
        setSlot(el)
        return
      }
      if (Date.now() - started < SLOT_RETRY_MAX_MS) timer = window.setTimeout(find, SLOT_RETRY_MS)
    }
    find()
    return () => {
      if (timer !== null) window.clearTimeout(timer)
    }
  }, [])

  // Persist every change after hydration (the store is the mirror, storage the truth).
  useEffect(() => {
    if (!hydrated) return
    writeTried(safeLocal(), tried)
  }, [hydrated, tried])

  // --------------------------------------------------------- completion
  // 'signal:guide-tried' from every area → mark + announce (copy on demand).
  useEffect(() => {
    const onTried = (e: Event) => {
      const id = (e as CustomEvent<{ id?: unknown }>).detail?.id
      if (!isGuideId(id)) return
      const store = useSignalStore.getState()
      if (store.guideTried.includes(id)) return
      store.markGuideTried(id)
      trackEvent('guide_tried', { id })
      const edition = store.edition ?? 'screen'
      const now = useSignalStore.getState().guideTried
      void import('@/lib/guide/guide').then((m) => setAnnounce(m.triedAnnouncement(id, now, edition)))
    }
    window.addEventListener(GUIDE_TRIED_EVENT, onTried)
    return () => window.removeEventListener(GUIDE_TRIED_EVENT, onTried)
  }, [])

  // go-anywhere: the palette opens.
  useEffect(() => {
    if (!paletteOpen) return
    window.dispatchEvent(new CustomEvent(GUIDE_TRIED_EVENT, { detail: { id: 'go-anywhere' } }))
  }, [paletteOpen])

  // The completion beat: the chip reads "You've tried everything" once.
  useEffect(() => {
    if (!hydrated) return undefined
    if (complete && !wasComplete.current) {
      wasComplete.current = true
      setCompleteFlash(true)
      const t = window.setTimeout(() => setCompleteFlash(false), COMPLETE_FLASH_MS)
      return () => window.clearTimeout(t)
    }
    return undefined
  }, [hydrated, complete])

  // ------------------------------------------------------------- handlers
  const toggle = useCallback(() => {
    const next = !useSignalStore.getState().guideOpen
    if (next) {
      setCompleteFlash(false)
      trackEvent('guide_opened', { tried: triedCount(useSignalStore.getState().guideTried) })
    }
    setGuideOpen(next)
  }, [setGuideOpen])

  const close = useCallback(() => setGuideOpen(false), [setGuideOpen])

  const pct = Math.round((count / GUIDE_TOTAL) * 100)

  const chip = (
    <>
      <button
        ref={chipRef}
        type="button"
        className="gd-chip"
        aria-expanded={open}
        aria-controls="guide-surface"
        data-component="Guide"
        data-island="client"
        data-open={open ? '1' : undefined}
        data-complete={complete ? '1' : undefined}
        style={{ ['--vs-i' as string]: 8 }}
        onClick={toggle}
      >
        <svg className="gd-ring" viewBox="0 0 20 20" aria-hidden="true">
          <circle className="gd-ring-track" cx="10" cy="10" r="8" />
          <circle
            className="gd-ring-fill"
            cx="10"
            cy="10"
            r="8"
            pathLength={100}
            style={{ strokeDasharray: `${pct} 100` }}
          />
          <circle className="gd-ring-dot" cx="10" cy="10" r="2.2" />
        </svg>
        <span className="gd-chip-label">{completeFlash ? GUIDE_COMPLETE_LABEL : GUIDE_CHIP_LABEL}</span>
        <span className="sr-only">{chipNameSuffix(tried, open)}</span>
        <span className="gd-chip-count" aria-hidden="true">
          {count}/{GUIDE_TOTAL}
        </span>
      </button>
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>
    </>
  )

  return (
    <>
      {slot ? createPortal(chip, slot) : null}
      {open ? <GuideSurface anchor={chipRef.current} onClose={close} /> : null}
      {hydrated ? <GuideRuntime /> : null}
    </>
  )
}
