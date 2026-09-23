/**
 * The ONE shared rAF ticker (spec §6.4/§8.3). Every rAF consumer on the site
 * subscribes here — never call requestAnimationFrame directly in components.
 *
 * Behavior:
 * - Single rAF loop; starts with the first subscriber, stops with the last.
 * - Pauses globally while `document.hidden` (visibilitychange).
 * - Battery guard: after 60s with no user input, halves to 30fps until the
 *   next input.
 *
 * Client-only: `subscribeTicker` is a safe no-op on the server.
 */

export type TickerCallback = (
  /** Delta since the previous tick, in ms (clamped to 100ms after pauses). */
  dtMs: number,
  /** Current high-resolution timestamp (performance.now()). */
  nowMs: number,
) => void

const IDLE_AFTER_MS = 60_000
const HALF_RATE_FRAME_MS = 1000 / 30

const subscribers = new Set<TickerCallback>()
let rafId: number | null = null
let lastTime = 0
let lastInputAt = 0
let halfRateAccumulator = 0
let listenersInstalled = false

function onInput(): void {
  lastInputAt = performance.now()
}

function onVisibility(): void {
  if (document.hidden) {
    stopLoop()
  } else if (subscribers.size > 0) {
    startLoop()
  }
}

function installGlobalListeners(): void {
  if (listenersInstalled || typeof window === 'undefined') return
  listenersInstalled = true
  lastInputAt = performance.now()
  const opts = { passive: true } as const
  window.addEventListener('pointerdown', onInput, opts)
  window.addEventListener('pointermove', onInput, opts)
  window.addEventListener('keydown', onInput, opts)
  window.addEventListener('wheel', onInput, opts)
  window.addEventListener('touchstart', onInput, opts)
  document.addEventListener('visibilitychange', onVisibility)
}

function loop(now: number): void {
  rafId = requestAnimationFrame(loop)
  const dt = lastTime === 0 ? 16.7 : Math.min(now - lastTime, 100)
  lastTime = now

  // Battery guard: idle ⇒ 30fps.
  if (now - lastInputAt > IDLE_AFTER_MS) {
    halfRateAccumulator += dt
    if (halfRateAccumulator < HALF_RATE_FRAME_MS) return
    const emitDt = halfRateAccumulator
    halfRateAccumulator = 0
    emit(emitDt, now)
    return
  }
  halfRateAccumulator = 0
  emit(dt, now)
}

function emit(dt: number, now: number): void {
  for (const cb of subscribers) {
    try {
      cb(dt, now)
    } catch (error) {
      console.error('ticker subscriber threw:', error)
    }
  }
}

function startLoop(): void {
  if (rafId !== null || typeof window === 'undefined') return
  lastTime = 0
  rafId = requestAnimationFrame(loop)
}

function stopLoop(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

/**
 * Subscribe to the shared ticker. Returns an unsubscribe function.
 * Pair with an IntersectionObserver in your island: unsubscribe while
 * off-screen (§6.4 rule 5).
 */
export function subscribeTicker(cb: TickerCallback): () => void {
  if (typeof window === 'undefined') return () => {}
  installGlobalListeners()
  subscribers.add(cb)
  if (!document.hidden) startLoop()
  return () => {
    subscribers.delete(cb)
    if (subscribers.size === 0) stopLoop()
  }
}

/** Introspection for the footer/debug readout. */
export function getTickerState(): { running: boolean; subscribers: number; idleHalfRate: boolean } {
  const now = typeof performance !== 'undefined' ? performance.now() : 0
  return {
    running: rafId !== null,
    subscribers: subscribers.size,
    idleHalfRate: listenersInstalled && now - lastInputAt > IDLE_AFTER_MS,
  }
}
