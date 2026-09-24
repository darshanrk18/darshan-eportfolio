'use client'

/**
 * /arcade connect-four (V2_SPEC §10.5) — the EXISTING lazy ConnectFour
 * island, worker and all, mounted running (no poster). The dynamic import
 * targets the same module as ProjectWindow's demo map, so webpack serves the
 * same shared chunk; `/` loads nothing new.
 */

import dynamic from 'next/dynamic'

const ConnectFour = dynamic(() => import('@/components/projects/demos/ConnectFour'), {
  ssr: false,
  loading: () => <p className="type-code text-secondary">compiling minimax…</p>,
})

export default function ArcadeConnectFour() {
  return <ConnectFour />
}
