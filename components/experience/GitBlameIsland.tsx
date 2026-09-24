'use client'

/**
 * v2 §9.1/§12.1 in-view loader for the git-blame island. Same pattern as
 * CareerDagIsland: the chunk (~1.5KB — toggle, delegated listeners, march IO)
 * loads only once the Experience section is within half a viewport. The RSC
 * slot in Experience.tsx reserves the toggle's 24px row, so mounting causes
 * zero CLS. No-JS: the island never mounts — blame and the march are simply
 * absent (the bullets and the static dashed HEAD ring are the fallback).
 */

import dynamic from 'next/dynamic'
import { useInViewOnce } from '@/lib/motion/useInViewOnce'

const GitBlame = dynamic(() => import('./GitBlame.client'), { ssr: false })

export default function GitBlameIsland() {
  const { ref, inView } = useInViewOnce<HTMLDivElement>({
    threshold: 0,
    rootMargin: '50% 0px',
  })
  return (
    <div ref={ref} className="flex h-6 w-full items-center justify-end">
      {inView ? <GitBlame /> : null}
    </div>
  )
}
