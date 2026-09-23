'use client'

/**
 * §4.4 / §5.7 — the source↔render wormhole (About only).
 *
 * Layout wrapper for the two panes (both server-rendered, passed in as
 * props) plus the interaction layer:
 * - ONE delegated pointerover listener (+ focusin for keyboard): hovering or
 *   focusing a rendered block ([data-line]) washes its source row(s) with
 *   --bg-raised and a 2px electron left border, and scrolls the first row
 *   into view within the source pane.
 * - Mobile/tablet (<lg): source pane hidden; a `view source` chip swaps
 *   rendered → raw in place (rendered pane stays screen-reader-accessible).
 * - Entrance: fade-up on first scroll-enter (SSR renders content visible;
 *   instant under reduced motion via useInViewOnce + CSS).
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import clsx from 'clsx'
import { useInViewOnce } from '@/lib/motion/useInViewOnce'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'

interface WormholeProps {
  /** The aria-hidden markdown source pane (SourcePane, RSC). */
  source: ReactNode
  /** The rendered pane: pull-quote + paragraphs + stat chips (RSC). */
  rendered: ReactNode
}

export default function Wormhole({ source, rendered }: WormholeProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [viewSource, setViewSource] = useState(false)
  const reduced = usePrefersReducedMotion()
  const { ref: inViewRef, inView } = useInViewOnce<HTMLDivElement>({ threshold: 0.1 })
  // 'ssr' = server default (visible, no animation classes); 'hidden' = armed
  // for reveal; 'reveal' = play fade-up once.
  const [phase, setPhase] = useState<'ssr' | 'hidden' | 'reveal'>('ssr')

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node
      inViewRef(node)
    },
    [inViewRef],
  )

  useEffect(() => {
    if (reduced) {
      setPhase('ssr')
    } else if (inView) {
      setPhase((p) => (p === 'hidden' ? 'reveal' : p))
    } else {
      setPhase('hidden')
    }
  }, [inView, reduced])

  // The delegated wormhole listener (one per section, per spec).
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    let litRows: HTMLElement[] = []
    let currentId: string | null = null

    const clear = () => {
      for (const el of litRows) {
        el.style.removeProperty('background-color')
        el.style.borderLeftColor = 'transparent'
      }
      litRows = []
      currentId = null
    }

    const highlight = (id: string) => {
      if (id === currentId) return
      clear()
      currentId = id
      root
        .querySelectorAll<HTMLElement>(`[data-pane="source"] [data-line="${id}"]`)
        .forEach((el) => {
          el.style.backgroundColor = 'var(--bg-raised)'
          el.style.borderLeftColor = 'var(--accent-electron)'
          litRows.push(el)
        })
      const first = litRows[0]
      // Only auto-scroll when the source pane is actually rendered (desktop).
      if (first && first.offsetParent !== null) {
        first.scrollIntoView({ block: 'nearest' })
      }
    }

    const idFrom = (target: EventTarget | null): string | null => {
      if (!(target instanceof Element)) return null
      if (target.closest('[data-pane="rendered"]') === null) return null
      return target.closest('[data-line]')?.getAttribute('data-line') ?? null
    }

    const onPointerOver = (e: Event) => {
      const id = idFrom(e.target)
      if (id !== null) highlight(id)
      else clear()
    }
    const onPointerLeave = () => clear()
    const onFocusIn = (e: FocusEvent) => {
      const id = idFrom(e.target)
      if (id !== null) highlight(id)
    }
    const onFocusOut = (e: FocusEvent) => {
      if (idFrom(e.relatedTarget) === null) clear()
    }

    root.addEventListener('pointerover', onPointerOver)
    root.addEventListener('pointerleave', onPointerLeave)
    root.addEventListener('focusin', onFocusIn)
    root.addEventListener('focusout', onFocusOut)
    return () => {
      root.removeEventListener('pointerover', onPointerOver)
      root.removeEventListener('pointerleave', onPointerLeave)
      root.removeEventListener('focusin', onFocusIn)
      root.removeEventListener('focusout', onFocusOut)
      clear()
    }
  }, [])

  return (
    <div
      ref={setRefs}
      className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-8"
      data-component="Wormhole"
    >
      {/* Mobile/tablet: swap rendered ↔ raw in place */}
      <div className="mb-6 lg:hidden">
        <button
          type="button"
          aria-pressed={viewSource}
          onClick={() => setViewSource((v) => !v)}
          className="type-label-sm hairline rounded-chip bg-raised min-h-11 px-4 py-2 text-secondary transition-colors hover:text-primary"
          style={{
            transitionDuration: 'var(--dur-micro)',
            transitionTimingFunction: 'var(--ease-swift)',
          }}
        >
          {viewSource ? 'view rendered' : 'view source'}
        </button>
      </div>

      <div
        data-pane="source"
        aria-hidden="true"
        className={clsx(
          'lg:sticky lg:top-24 lg:col-span-5 lg:block lg:max-h-[calc(100vh-160px)] lg:overflow-y-auto',
          phase === 'hidden' && 'opacity-0',
          phase === 'reveal' && 'fade-up',
          viewSource ? 'block' : 'hidden',
        )}
        style={{ '--reveal-delay': '80ms' } as CSSProperties}
      >
        {source}
      </div>

      <div
        data-pane="rendered"
        className={clsx(
          'lg:col-span-7 lg:not-sr-only lg:block',
          phase === 'hidden' && 'opacity-0',
          phase === 'reveal' && 'fade-up',
          // Keep the real copy readable by screen readers while raw is shown.
          viewSource ? 'sr-only' : 'block',
        )}
      >
        {rendered}
      </div>
    </div>
  )
}
