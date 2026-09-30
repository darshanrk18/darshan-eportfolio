'use client'

/**
 * The guide's runtime (V3_SPEC §2.6) — the lazy chunk behind
 * components/guide/Guide.client.tsx carrying what the chip does not need at
 * first paint (§7). Mounted once the tried list has hydrated from storage,
 * so a coach mark never suggests something the device says was tried.
 *
 *   • other-edition: a MutationObserver on html[data-edition] reports the
 *     item for a REAL switch (toggle / palette / terminal) — never the
 *     picker's choice (its batch also touches data-pick), never the first
 *     paint;
 *   • the COACH-MARK scheduler: at most one, for the next untried item
 *     whose section is active (store.activeSection), after 1.2 s of idle
 *     there; never while the guide, the palette, Build info, a maximized
 *     project window or any overlay covers the page; never under 640 px;
 *     once per session (sessionStorage['signal.coach']). The mark itself
 *     (./GuideCoach.client.tsx) is a further chunk, loaded only when one is
 *     due; it anchors beside the control it names and drops itself when no
 *     control is there.
 */

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useState } from 'react'
import { EDITION_ATTR, PICK_ATTR } from '@/lib/commands/context'
import {
  COACH_IDLE_MS,
  COACH_MIN_WIDTH,
  GUIDE_TRIED_EVENT,
  coachCandidate,
  markCoachShown,
  readCoachShown,
  type GuideId,
} from '@/lib/guide/core'
import { useSignalStore } from '@/lib/state/store'
import { trackEvent } from '@/lib/utils/analytics'
import { islandUnavailable } from '@/lib/utils/island'

const GuideCoach = dynamic(() => import('./GuideCoach.client').catch(islandUnavailable<typeof import('./GuideCoach.client')>), { ssr: false })

function safeSession(): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export default function GuideRuntime() {
  const tried = useSignalStore((s) => s.guideTried)
  const open = useSignalStore((s) => s.guideOpen)
  const activeSection = useSignalStore((s) => s.activeSection)
  const overlayOpen = useSignalStore((s) => s.overlayOpen)
  const paletteOpen = useSignalStore((s) => s.paletteOpen)
  const buildInfoOpen = useSignalStore((s) => s.buildInfoOpen)
  const maximized = useSignalStore((s) => s.maximizedProject)
  const [coach, setCoach] = useState<GuideId | null>(null)

  /** Something covers the page (or the window's own lightbox is up): no coach. */
  const covered = open || overlayOpen || paletteOpen || buildInfoOpen || maximized !== null

  // other-edition: html[data-edition] changes by a visitor's switch.
  useEffect(() => {
    const root = document.documentElement
    const observer = new MutationObserver((records) => {
      if (records.some((r) => r.attributeName === PICK_ATTR)) return
      const switched = records.some(
        (r) =>
          r.attributeName === EDITION_ATTR &&
          r.oldValue !== null &&
          r.oldValue !== root.getAttribute(EDITION_ATTR)
      )
      if (!switched) return
      window.dispatchEvent(new CustomEvent(GUIDE_TRIED_EVENT, { detail: { id: 'other-edition' } }))
    })
    observer.observe(root, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: [EDITION_ATTR, PICK_ATTR],
    })
    return () => observer.disconnect()
  }, [])

  // The coach mark: one at a time, after the idle; hidden again when its
  // section scrolls away, the item completes or something covers the page.
  useEffect(() => {
    if (coach !== null) {
      const stillDue =
        !covered &&
        !tried.includes(coach) &&
        coachCandidate({ tried, shown: [], activeSection, viewportWidth: window.innerWidth }) === coach
      if (!stillDue) setCoach(null)
      return undefined
    }
    if (covered) return undefined
    const candidate = coachCandidate({
      tried,
      shown: readCoachShown(safeSession()),
      activeSection,
      viewportWidth: window.innerWidth,
    })
    if (!candidate) return undefined
    const t = window.setTimeout(() => {
      markCoachShown(safeSession(), readCoachShown(safeSession()), candidate)
      setCoach(candidate)
      trackEvent('guide_coach', { id: candidate })
    }, COACH_IDLE_MS)
    return () => window.clearTimeout(t)
  }, [coach, tried, activeSection, covered])

  // A window narrowed under the phone width drops the mark.
  useEffect(() => {
    if (coach === null) return undefined
    const onResize = () => {
      if (window.innerWidth < COACH_MIN_WIDTH) setCoach(null)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [coach])

  const dismiss = useCallback(() => setCoach(null), [])

  return coach !== null ? <GuideCoach id={coach} onDismiss={dismiss} /> : null
}
