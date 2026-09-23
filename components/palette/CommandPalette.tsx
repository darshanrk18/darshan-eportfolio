'use client'

/**
 * ⌘K command palette — lazy shell (spec §5.2).
 *
 * This tiny always-mounted island owns the *intent* layer only:
 *   • the global ⌘K / Ctrl+K listener (ignores focused inputs while closed),
 *   • the `signal:palette` window event (alternate open trigger),
 *   • chunk prefetch on idle + on first hover of any palette chip,
 *   • `palette_opened` analytics.
 * The cmdk dialog itself lives in ./PaletteDialog and is code-split; it only
 * mounts while the palette is open (store `paletteOpen`, set by the nav ⌘K
 * chip, the hero pill, and the listeners here).
 */

import dynamic from 'next/dynamic'
import { useEffect, useRef } from 'react'
import { useSignalStore } from '@/lib/state/store'
import { trackPaletteOpened } from '@/lib/utils/analytics'

/** One import promise: prefetch and dynamic() share the webpack chunk cache. */
const loadPaletteDialog = () => import('./PaletteDialog')

const PaletteDialog = dynamic(loadPaletteDialog, { ssr: false })

/** Elements whose hover should warm the palette chunk (nav chip, hero pill). */
const TRIGGER_SELECTOR =
  '[data-palette-trigger], [aria-label="Open command palette"], .hero-pill'

export default function CommandPalette() {
  const open = useSignalStore((s) => s.paletteOpen)
  const setPaletteOpen = useSignalStore((s) => s.setPaletteOpen)

  // Global ⌘K / Ctrl+K toggle. While closed it ignores text inputs; while
  // open (focus sits in the palette's own input) it always closes.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'k' || !(e.metaKey || e.ctrlKey) || e.repeat) return
      const { paletteOpen, setPaletteOpen: setOpen } = useSignalStore.getState()
      if (!paletteOpen) {
        const t = e.target
        if (t instanceof HTMLElement) {
          const tag = t.tagName
          if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable) {
            return
          }
        }
      }
      e.preventDefault()
      setOpen(!paletteOpen)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Alternate open trigger: `signal:palette` custom event on window.
  useEffect(() => {
    const onOpenEvent = () => useSignalStore.getState().setPaletteOpen(true)
    window.addEventListener('signal:palette', onOpenEvent)
    return () => window.removeEventListener('signal:palette', onOpenEvent)
  }, [])

  // Chunk prefetch: on idle (§6.4 step 2) + on first hover of a ⌘K chip.
  useEffect(() => {
    let prefetched = false
    const prefetch = () => {
      if (prefetched) return
      prefetched = true
      void loadPaletteDialog()
    }

    let idleId: number | undefined
    let timeoutId: number | undefined
    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(() => prefetch())
    } else {
      timeoutId = window.setTimeout(prefetch, 2500)
    }

    const onPointerOver = (e: Event) => {
      const t = e.target
      if (t instanceof Element && t.closest(TRIGGER_SELECTOR)) {
        prefetch()
        document.removeEventListener('pointerover', onPointerOver)
      }
    }
    document.addEventListener('pointerover', onPointerOver, { passive: true })

    return () => {
      if (idleId !== undefined && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId)
      }
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
      document.removeEventListener('pointerover', onPointerOver)
    }
  }, [])

  // Analytics: fire once per open transition.
  const wasOpen = useRef(false)
  useEffect(() => {
    if (open && !wasOpen.current) trackPaletteOpened()
    wasOpen.current = open
  }, [open])

  if (!open) return null
  return <PaletteDialog onClose={() => setPaletteOpen(false)} />
}
