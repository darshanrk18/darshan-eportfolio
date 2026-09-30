'use client'

/**
 * Build info panel (V3_SPEC §1.8 / §5 clutter law) — the ONE place build
 * evidence is drawn. Lazy chunk (see ./BuildInfo.client); nothing here may
 * be imported from the immediate bundle.
 *
 * Rows (visitor-language labels): Version (package.json) · Build (deploy
 * SHA from lib/build/inject + the measuring build's date from the manifest)
 * · Page weight (first-load gz KB per route from lib/build/manifest.json) ·
 * Frames per second (live, lib/perf/fps, with the 60-point frame-time
 * sparkline that used to live in the footer's FpsMeter) · Animation (glyph
 * tier + particle count) · Sections seen (store.sectionsSeen — the honest
 * `N of 6` that was the v2 footer payoff).
 *
 * Honesty rails: the SHA is inlined at build time (NEXT_PUBLIC_…); the date
 * shown is the manifest's generatedAt, never `new Date()` in the browser;
 * fps reads "Animation off" under reduced motion / tier 0.
 *
 * Dialog: role=dialog, aria-modal, labelled by its title; Esc and the scrim
 * close; Tab is trapped; focus starts on Close and returns on unmount; body
 * scroll and Lenis are stopped while open. Skin: styles/v3/chrome.css
 * (`.sig-bi*` + `.ed-panel` — glass in SCREEN, ink box in PRINT).
 */

import { useEffect, useRef, useState } from 'react'
import pkg from '@/package.json'
import { buildInfo, bundleManifest } from '@/lib/build/inject'
import { profile } from '@/lib/data/profile'
import { getLenis } from '@/lib/motion/lenis'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'
import { getFrameRing, subscribeFps } from '@/lib/perf/fps'
import { TIER_PARTICLES } from '@/lib/perf/tiers'
import { useSignalStore } from '@/lib/state/store'
import { buildDateLabel, routeWeights } from './buildInfoRoutes'

const SECTION_TOTAL = 6
const SPARK_W = 120
const SPARK_H = 28
const SPARK_POINTS = 60
/** Frame times are plotted clamped to [0, 50] ms (50 ms = 20 fps floor). */
const SPARK_MAX_MS = 50

function sparklinePath(frameTimes: readonly number[]): string {
  const recent = frameTimes.slice(-SPARK_POINTS)
  if (recent.length < 2) return ''
  const stepX = SPARK_W / (SPARK_POINTS - 1)
  return recent
    .map((ms, i) => {
      const clamped = Math.min(Math.max(ms, 0), SPARK_MAX_MS)
      const x = (i * stepX).toFixed(1)
      const y = (SPARK_H - (clamped / SPARK_MAX_MS) * SPARK_H).toFixed(1)
      return `${i === 0 ? 'M' : 'L'}${x},${y}`
    })
    .join(' ')
}

export interface BuildInfoPanelProps {
  onClose: () => void
}

export default function BuildInfoPanel({ onClose }: BuildInfoPanelProps) {
  const reduced = usePrefersReducedMotion()
  const glyphTier = useSignalStore((s) => s.glyphTier)
  const seenCount = useSignalStore((s) => Object.keys(s.sectionsSeen).length)
  const isStatic = reduced || glyphTier === 0

  const panelRef = useRef<HTMLDivElement | null>(null)
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const [fps, setFps] = useState<number | null>(null)
  const [frames, setFrames] = useState<readonly number[]>([])

  // Focus + scroll lock for the dialog's lifetime.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    getLenis()?.stop()
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      getLenis()?.start()
      previouslyFocused?.focus?.()
    }
  }, [])

  // Live fps only while the panel is open (unmount unsubscribes).
  useEffect(() => {
    if (isStatic) return undefined
    setFrames(getFrameRing())
    return subscribeFps((nextFps, frameTimes) => {
      setFps(nextFps)
      setFrames(frameTimes)
    })
  }, [isStatic])

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
      return
    }
    if (e.key !== 'Tab') return
    const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])'
    )
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

  const routes = routeWeights(bundleManifest.routes)
  const builtOn = buildDateLabel(bundleManifest.generatedAt)
  const buildLabel =
    buildInfo.sha === 'dev'
      ? 'Local build'
      : `Deploy ${buildInfo.shortSha}${builtOn ? ` · ${builtOn}` : ''}`

  const fpsLabel = isStatic ? 'Animation off' : fps === null ? 'Sampling…' : `${fps}`
  const path = isStatic ? '' : sparklinePath(frames)
  const particles = glyphTier !== null ? TIER_PARTICLES[glyphTier] : null
  const animationLabel =
    glyphTier === null
      ? '—'
      : glyphTier === 0
        ? 'Static'
        : `Tier ${glyphTier}${particles ? ` · ${particles.toLocaleString('en-US')} particles` : ''}`

  return (
    <>
      <button
        type="button"
        className="sig-bi-scrim"
        aria-label="Close build info"
        tabIndex={-1}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="build-info-title"
        data-component="BuildInfo"
        data-island="client"
        className="sig-bi ed-panel"
        style={{ ['--vs-i' as string]: 10 }}
        onKeyDown={onKeyDown}
      >
        <div className="sig-bi-head">
          <h2 id="build-info-title" className="sig-bi-title ed-label">
            Build info
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="sig-bi-close"
            aria-label="Close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <dl className="sig-bi-list">
          <dt className="ed-label-xs">Version</dt>
          <dd>
            <strong>{pkg.version}</strong>
          </dd>

          <dt className="ed-label-xs">Build</dt>
          <dd>{buildLabel}</dd>

          <dt className="ed-label-xs">Page weight</dt>
          <dd>
            {routes.length > 0 ? (
              <ul className="sig-bi-routes">
                {routes.map((r) => (
                  <li key={r.label}>
                    <span>{r.label}</span>
                    <span>
                      <strong>{r.kb.toFixed(1)}</strong> KB
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              'Not measured yet'
            )}
            <span className="block">What the browser downloads on a first visit, compressed.</span>
          </dd>

          <dt className="ed-label-xs">Frames per second</dt>
          <dd aria-live="polite">
            <strong>{fpsLabel}</strong>
            {path !== '' ? (
              <svg
                aria-hidden="true"
                className="sig-bi-spark"
                width={SPARK_W}
                height={SPARK_H}
                viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
              >
                <path d={path} fill="none" strokeWidth="1.5" />
              </svg>
            ) : null}
          </dd>

          <dt className="ed-label-xs">Animation</dt>
          <dd>{animationLabel}</dd>

          <dt className="ed-label-xs">Sections seen</dt>
          <dd>
            <strong>{seenCount}</strong> of {SECTION_TOTAL}
          </dd>
        </dl>

        <p className="sig-bi-foot">
          Every figure here is measured, not typed.{' '}
          <a href={profile.siteRepoUrl} target="_blank" rel="noopener noreferrer">
            Source on GitHub ↗
          </a>
        </p>
      </div>
    </>
  )
}
