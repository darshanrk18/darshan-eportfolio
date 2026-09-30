/**
 * The copy-email micro-burst (spec §4.8): twelve dots from the click point,
 * once per page session, never under reduced motion (the caller checks).
 * Its own module, imported on the first copy click, so the always-loaded
 * contact island does not carry it (the '/' first-load budget, §7).
 */

import { EASE_OUT_EXPO } from '@/lib/motion/tokens'

/** Page-session latch: the micro-burst fires once per session (§4.8). */
let burstFired = false

export function fireBurst(x: number, y: number): void {
  if (burstFired || typeof document === 'undefined') return
  burstFired = true

  const host = document.createElement('div')
  host.setAttribute('aria-hidden', 'true')
  host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:var(--z-toast)'
  document.body.appendChild(host)

  const easing = `cubic-bezier(${EASE_OUT_EXPO.join(', ')})`
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('span')
    p.style.cssText =
      `position:absolute;left:${x}px;top:${y}px;width:4px;height:4px;` +
      'border-radius:999px;background:var(--accent-signal)'
    host.appendChild(p)
    if (typeof p.animate !== 'function') continue
    const angle = (i / 12) * Math.PI * 2
    const dist = 36 + (i % 3) * 14
    const dx = Math.cos(angle) * dist
    const dy = Math.sin(angle) * dist
    p.animate(
      [
        { transform: 'translate(-50%, -50%)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`, opacity: 0 },
      ],
      { duration: 600, easing, fill: 'forwards' },
    )
  }
  window.setTimeout(() => host.remove(), 650)
}
