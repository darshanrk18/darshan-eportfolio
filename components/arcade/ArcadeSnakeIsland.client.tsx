'use client'

/**
 * Client-boundary wrapper for the /arcade snake (V2_SPEC §10.5): the game
 * (sim + SVG board + A* import) code-splits into its own lazy chunk, so the
 * arcade route's OWN chunk stays a ≤8KB shell (§12.2) — the same pattern as
 * the connect-four window.
 */

import dynamic from 'next/dynamic'
import { islandUnavailable } from '@/lib/utils/island'

// Server-rendered like the Connect Four window (no layout shift on hydration):
// the sim is seeded and deterministic, the ticker starts in an effect.
const ArcadeSnake = dynamic(() => import('./ArcadeSnake.client').catch(islandUnavailable<typeof import('./ArcadeSnake.client')>), {
  loading: () => <p className="type-code text-secondary">Starting the autopilot…</p>,
})

export default function ArcadeSnakeIsland() {
  return <ArcadeSnake />
}
