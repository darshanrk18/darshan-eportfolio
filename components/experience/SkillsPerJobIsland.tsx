'use client'

/**
 * Client-boundary wrapper for the "See which skills each job used" panel:
 * `dynamic()` only code-splits from inside the client graph, so this tiny
 * island owns the split. `ssr: true` keeps the panel's markup (title, the
 * switch in its off state, the job tabs, the prompt) in the server HTML with
 * zero layout shift; the interactivity chunk attaches after hydration.
 *
 * It also queues `signal:blame-on` (./events): the SSR markup already
 * satisfies the guide's "island mounted" selector, so the guide's one-shot
 * dispatch can arrive before the lazy chunk has mounted — this wrapper is
 * hydrated in the main pass and hands the request down as a prop.
 */

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { BLAME_ON_EVENT, type BlameRequest } from './events'

const SkillsPerJob = dynamic(() => import('./SkillsPerJob.client'))

export default function SkillsPerJobIsland() {
  const [request, setRequest] = useState<BlameRequest | null>(null)

  useEffect(() => {
    let serial = 0
    const onBlameOn = (event: Event) => {
      const job = (event as CustomEvent<{ job?: unknown }>).detail?.job
      setRequest({ job: typeof job === 'string' ? job : undefined, serial: ++serial })
    }
    window.addEventListener(BLAME_ON_EVENT, onBlameOn)
    return () => window.removeEventListener(BLAME_ON_EVENT, onBlameOn)
  }, [])

  return <SkillsPerJob request={request} />
}
