import type { ComponentType } from 'react'

/** What a lazy island renders when its chunk never arrives: nothing. */
function IslandUnavailable(): null {
  return null
}

/**
 * The `.catch` for every `dynamic(() => import(…))` island: when the chunk
 * fails to load (a dropped request on a bad connection, or a tab left open
 * across a redeploy whose chunks are gone), the island renders nothing and
 * the rest of the page keeps working — instead of the rejection reaching the
 * page's error boundary and replacing the whole site with the error screen.
 * Typed as the module it stands in for, so `dynamic()` keeps the island's
 * real props type:  dynamic(() => import('./X').catch(islandUnavailable<typeof import('./X')>))
 * — or, when the call site already names its props, `dynamic<Props>(…)`.
 */
export function islandUnavailable<M = { default: ComponentType<unknown> }>(error: unknown): M {
  console.error('[island] a lazy chunk failed to load; the island is skipped', error)
  return { default: IslandUnavailable } as unknown as M
}
