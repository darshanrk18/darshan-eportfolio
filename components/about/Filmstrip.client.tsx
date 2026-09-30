'use client'

/**
 * The S2 filmstrip's interaction layer (SCREEN): a thin island around the
 * server-rendered strip. Two jobs:
 *  1. Entrance (S2 motion note): the first time the strip scrolls into view
 *     it gets `is-in` — the two city rules draw left to right and the six
 *     photographs fade up ~90 ms apart (CSS, about.css); once per visit.
 *     Reduced motion resolves at once (useInViewOnce).
 *  2. The photo viewer: ONE delegated click listener on the strip catches a
 *     frame link (`[data-photo]`), prevents the native jump to the image
 *     file (the no-JS path) and opens the large view with its caption in a
 *     `next/dynamic` chunk that loads on first use only. Focus returns to
 *     the frame on close.
 */

import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { PHOTOS, isPhotoKey, type PhotoKey } from '@/lib/data/photos'
import { useInViewOnce } from '@/lib/motion/useInViewOnce'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'

const PhotoViewer = dynamic(() => import('./PhotoViewer.client'), { ssr: false })

export interface FilmstripProps {
  /** The order the strip shows (the viewer's prev / next follow it). */
  order: readonly PhotoKey[]
  closeLabel: string
  children: ReactNode
}

export default function Filmstrip({ order, closeLabel, children }: FilmstripProps) {
  const reduced = usePrefersReducedMotion()
  const { ref: inViewRef, inView } = useInViewOnce<HTMLDivElement>({ threshold: 0.25 })
  // 'ssr' = server default (final state, no classes); 'hidden' = armed for the
  // entrance after hydration; 'in' = play once. Reduced motion stays 'ssr'.
  const [phase, setPhase] = useState<'ssr' | 'hidden' | 'in'>('ssr')
  const [open, setOpen] = useState<number | null>(null)
  const returnRef = useRef<HTMLElement | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node
      inViewRef(node)
    },
    [inViewRef],
  )

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    const target = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-photo]') : null
    if (!target) return
    const key = target.dataset.photo ?? ''
    if (!isPhotoKey(key)) return
    const index = order.indexOf(key)
    if (index < 0) return
    e.preventDefault()
    returnRef.current = target
    setOpen(index)
  }

  const close = useCallback(() => {
    setOpen(null)
    const el = returnRef.current
    returnRef.current = null
    el?.focus()
  }, [])

  useEffect(() => {
    if (reduced) setPhase('ssr')
    else if (inView) setPhase((p) => (p === 'hidden' ? 'in' : p))
    else setPhase('hidden')
  }, [inView, reduced])

  return (
    <div
      ref={setRefs}
      className={phase === 'in' ? 'ab-strip is-in' : phase === 'hidden' ? 'ab-strip is-hidden' : 'ab-strip'}
      onClick={onClick}
      data-component="Filmstrip"
      data-island="client"
    >
      {children}
      {open !== null ? (
        <PhotoViewer
          photos={order.map((k) => PHOTOS[k])}
          index={open}
          closeLabel={closeLabel}
          onIndex={setOpen}
          onClose={close}
        />
      ) : null}
    </div>
  )
}
