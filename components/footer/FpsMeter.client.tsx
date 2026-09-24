'use client'

/**
 * FpsMeter — the live figure in the footer's self-verifying readout (§4.9/§5.9).
 * Rides the shared ticker via subscribeFps (EMA, 2×/s) — never its own rAF —
 * and only while the footer is actually on screen (own IntersectionObserver).
 * Renders '— fps' until the first sample; a frozen 'static' label under
 * reduced motion / tier T0. Hover or focus reveals a 60-point frame-time
 * sparkline plus the current glyph-field tier and particle count.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { subscribeFps, getFrameRing } from '@/lib/perf/fps'
import { TIER_PARTICLES, tierLabel } from '@/lib/perf/tiers'
import { useSignalStore } from '@/lib/state/store'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'

const SPARK_W = 120
const SPARK_H = 28
const SPARK_POINTS = 60
/** Frame times are plotted clamped to [0, 50] ms (50ms = 20fps floor). */
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

export default function FpsMeter() {
  const reduced = usePrefersReducedMotion()
  const glyphTier = useSignalStore((s) => s.glyphTier)
  const isStatic = reduced || glyphTier === 0

  const [fps, setFps] = useState<number | null>(null)
  const [frames, setFrames] = useState<readonly number[]>([])
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const rootRef = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    if (isStatic) return undefined
    const el = rootRef.current
    if (el === null) return undefined

    let unsub: (() => void) | null = null
    const start = () => {
      if (unsub !== null) return
      setFrames(getFrameRing())
      unsub = subscribeFps((nextFps, frameTimes) => {
        setFps(nextFps)
        setFrames(frameTimes)
      })
    }
    const stop = () => {
      unsub?.()
      unsub = null
    }

    if (typeof IntersectionObserver === 'undefined') {
      start()
      return stop
    }
    const io = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1]
      if (entry !== undefined && entry.isIntersecting) {
        start()
      } else {
        stop()
      }
    })
    io.observe(el)
    return () => {
      io.disconnect()
      stop()
    }
  }, [isStatic])

  const show = useCallback(() => setHovered(true), [])
  const hide = useCallback(() => setHovered(false), [])

  const open = hovered || focused
  const label = isStatic ? 'static' : fps === null ? '— fps' : `${fps} fps`
  const path = sparklinePath(frames)
  const lastMs = frames.length > 0 ? frames[frames.length - 1] : null
  const particles = glyphTier !== null ? TIER_PARTICLES[glyphTier] : null

  return (
    <span
      ref={rootRef}
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      data-component="FpsMeter"
      data-island="client"
    >
      <button
        type="button"
        className="type-label-sm cursor-default text-secondary transition-colors hover:text-primary"
        aria-expanded={open}
        aria-controls="fps-meter-detail"
        aria-label={`${label} — show frame-time detail`}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        {label}
      </button>
      {open ? (
        <div
          id="fps-meter-detail"
          role="status"
          className="elev-window absolute right-0 bottom-full mb-2 w-max rounded-card border border-hairline bg-raised p-3"
          style={{ zIndex: 'var(--z-toast)' }}
        >
          {path !== '' ? (
            <>
              <svg
                aria-hidden="true"
                width={SPARK_W}
                height={SPARK_H}
                viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
                className="block"
              >
                <path d={path} fill="none" stroke="var(--accent-signal)" strokeWidth="1.5" />
              </svg>
              <p className="type-label-xs mt-2 text-secondary">
                frame {lastMs !== null ? lastMs.toFixed(1) : '—'} ms
              </p>
            </>
          ) : (
            <p className="type-label-xs text-secondary">
              {isStatic ? 'animation off' : 'sampling…'}
            </p>
          )}
          <p className="type-label-xs mt-1 text-secondary">
            tier {tierLabel(glyphTier)}
            {particles !== null ? ` · ${particles} particles` : ''}
          </p>
        </div>
      ) : null}
    </span>
  )
}
