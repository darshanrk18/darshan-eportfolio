/**
 * Lenis singleton bridge (V2_SPEC §5.1) — lets non-React code reach the live
 * smooth-scroll instance: `scrollToAnchor()` in lib/commands/context.ts eases
 * anchors through it, and the §8.3 maximize lightbox calls
 * `getLenis()?.stop()` / `.start()` around its scroll lock.
 *
 * The `lenis` package is imported TYPE-ONLY here, so this module costs ~0.1KB
 * and the ~9KB library bundles only where the provider imports it for value
 * (components/chrome/LenisProvider.tsx, mounted in app/page.tsx ONLY — never
 * app/layout.tsx: /cv stays zero-JS).
 *
 * `getLenis()` returns null on touch, under reduced motion, before the
 * provider mounts, and on /cv — callers must keep their native fallback.
 */

import type Lenis from 'lenis'

let instance: Lenis | null = null

/** LenisProvider hands over the live instance on mount, null on destroy. */
export function setLenis(lenis: Lenis | null): void {
  instance = lenis
}

/** The live Lenis instance, or null wherever smooth scroll is disabled. */
export function getLenis(): Lenis | null {
  return instance
}
