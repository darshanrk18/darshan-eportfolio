'use client'

/**
 * /arcade connect-four (V2_SPEC §10.5) — the EXISTING lazy ConnectFour
 * island, worker and all, mounted running (no poster), server-rendered so
 * the window has its real height from the first paint. The dynamic import
 * targets the same module as ProjectWindow's demo map, so webpack serves the
 * same shared chunk; `/` loads nothing new.
 */

import dynamic from 'next/dynamic'
import { islandUnavailable } from '@/lib/utils/island'

// Server-rendered (no `ssr: false`): the board's markup is in the page HTML
// at its real height, so nothing below it moves when the island hydrates
// (a one-line placeholder swapped for a ~600 px board was a 0.17 CLS on
// phones). The initial state is deterministic and the worker starts in an
// effect, so the server and client renders agree. The chunk stays split.
const ConnectFour = dynamic(() => import('@/components/projects/demos/ConnectFour').catch(islandUnavailable<typeof import('@/components/projects/demos/ConnectFour')>), {
  loading: () => <p className="type-code text-secondary">Setting up the board…</p>,
})

export default function ArcadeConnectFour() {
  return <ConnectFour />
}
