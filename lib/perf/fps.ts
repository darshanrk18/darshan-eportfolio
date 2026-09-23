/**
 * Live FPS meter on the shared ticker (spec §5.9/§8.3): rAF delta → EMA,
 * callbacks at 2Hz, plus a 60-sample frame-time ring buffer for the footer
 * hover sparkline. Client-only; subscribing on the server is a no-op.
 */

import { subscribeTicker } from '@/lib/motion/ticker'

export type FpsCallback = (
  /** Rounded EMA frames-per-second. */
  fps: number,
  /** Last 60 frame times in ms, oldest → newest (copy). */
  frameTimes: readonly number[],
) => void

const RING_SIZE = 60
const EMIT_EVERY_MS = 500
const EMA_ALPHA = 0.1

const callbacks = new Set<FpsCallback>()
const ring: number[] = []
let emaFps = 0
let sinceEmit = 0
let unsubscribe: (() => void) | null = null

function onTick(dtMs: number): void {
  if (dtMs <= 0) return
  const instant = 1000 / dtMs
  emaFps = emaFps === 0 ? instant : emaFps + EMA_ALPHA * (instant - emaFps)

  ring.push(dtMs)
  if (ring.length > RING_SIZE) ring.shift()

  sinceEmit += dtMs
  if (sinceEmit >= EMIT_EVERY_MS) {
    sinceEmit = 0
    const fps = Math.round(emaFps)
    const copy = ring.slice()
    for (const cb of callbacks) cb(fps, copy)
  }
}

/** Subscribe to FPS updates (2×/s). Returns an unsubscribe function. */
export function subscribeFps(cb: FpsCallback): () => void {
  if (typeof window === 'undefined') return () => {}
  callbacks.add(cb)
  if (unsubscribe === null) {
    unsubscribe = subscribeTicker(onTick)
  }
  return () => {
    callbacks.delete(cb)
    if (callbacks.size === 0 && unsubscribe !== null) {
      unsubscribe()
      unsubscribe = null
    }
  }
}

/** Snapshot of the current frame-time ring (oldest → newest). */
export function getFrameRing(): readonly number[] {
  return ring.slice()
}
