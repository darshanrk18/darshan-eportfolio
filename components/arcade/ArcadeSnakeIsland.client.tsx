'use client'

/**
 * Client-boundary wrapper for the /arcade snake (V2_SPEC §10.5): the game
 * (sim + SVG board + A* import) code-splits into its own lazy chunk, so the
 * arcade route's OWN chunk stays a ≤8KB shell (§12.2) — the same pattern as
 * the connect-four window.
 */

import dynamic from 'next/dynamic'

const ArcadeSnake = dynamic(() => import('./ArcadeSnake.client'), {
  ssr: false,
  loading: () => <p className="type-code text-secondary">Starting the autopilot…</p>,
})

export default function ArcadeSnakeIsland() {
  return <ArcadeSnake />
}
