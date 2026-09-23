'use client'

/**
 * §6.4 in-view loader for the scroll-linked DAG overlay. The overlay is
 * purely decorative (its own SSR output is an empty aria-hidden host and the
 * RSC shell draws a static hairline fallback), so nothing is lost by not
 * server-rendering it — which lets the chunk load only once the section is
 * within half a viewport (IO, rootMargin '50% 0px', per §6.4 item 3).
 *
 * The sentinel div fills [data-dag-root] for the observer; the island mounts
 * as its *sibling* so CareerDag's own host keeps [data-dag-root] as its
 * parentElement (it measures markers through that container).
 */

import dynamic from 'next/dynamic'
import { useInViewOnce } from '@/lib/motion/useInViewOnce'

const CareerDag = dynamic(() => import('./CareerDag.client'), { ssr: false })

export default function CareerDagIsland() {
  const { ref, inView } = useInViewOnce<HTMLDivElement>({
    threshold: 0,
    rootMargin: '50% 0px',
  })
  return (
    <>
      <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0" />
      {inView ? <CareerDag /> : null}
    </>
  )
}
