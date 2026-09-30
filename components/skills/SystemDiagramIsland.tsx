'use client'

/**
 * §6.4 client-boundary wrapper: `dynamic()` only code-splits from inside the
 * client graph (in an RSC it stays in the route entry), so this tiny island
 * owns the split. `ssr: true` keeps the diagram's complete semantic markup in
 * the server HTML; the interactivity chunk (diagram + inspector) loads async
 * after hydration starts and attaches to the existing DOM.
 *
 * It also queues the two window events the diagram answers
 * (SIGNAL_EVENTS.deployAll — "Light up the toolkit" from the guide, palette
 * or terminal; SIGNAL_EVENTS.inspectSkill — the palette's skill deep-link):
 * the SSR markup already satisfies the callers' "island mounted" selector,
 * so their one-shot dispatch can arrive before the lazy chunk has mounted —
 * this wrapper is hydrated in the main pass and hands the request down as a
 * prop (director call (m)).
 */

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { SIGNAL_EVENTS } from '@/lib/commands/context'
import type { DiagramRequest } from './guide'
import { islandUnavailable } from '@/lib/utils/island'

const SystemDiagram = dynamic(() => import('./SystemDiagram.client').catch(islandUnavailable<typeof import('./SystemDiagram.client')>))

export default function SystemDiagramIsland() {
  const [request, setRequest] = useState<DiagramRequest | null>(null)

  useEffect(() => {
    let serial = 0
    const onDeployAll = () => setRequest({ kind: 'light', serial: ++serial })
    const onInspect = (event: Event) => {
      const id = (event as CustomEvent<{ id?: unknown }>).detail?.id
      if (typeof id === 'string') setRequest({ kind: 'inspect', id, serial: ++serial })
    }
    window.addEventListener(SIGNAL_EVENTS.deployAll, onDeployAll)
    window.addEventListener(SIGNAL_EVENTS.inspectSkill, onInspect)
    return () => {
      window.removeEventListener(SIGNAL_EVENTS.deployAll, onDeployAll)
      window.removeEventListener(SIGNAL_EVENTS.inspectSkill, onInspect)
    }
  }, [])

  return <SystemDiagram request={request} />
}
