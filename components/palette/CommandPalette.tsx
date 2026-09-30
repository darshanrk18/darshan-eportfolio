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
import {
  CRT_STORAGE_KEY,
  SIGNAL_EVENTS,
  isSourceModeOn,
  setSourceMode,
} from '@/lib/commands/context'
import { useSignalStore } from '@/lib/state/store'
import { trackPaletteOpened } from '@/lib/utils/analytics'
import { islandUnavailable } from '@/lib/utils/island'

/** One import promise: prefetch and dynamic() share the webpack chunk cache. */
const loadPaletteDialog = () => import('./PaletteDialog')

const PaletteDialog = dynamic(
  () => loadPaletteDialog().catch(islandUnavailable<typeof import('./PaletteDialog')>),
  { ssr: false },
)

/** Elements whose hover should warm the palette chunk (nav chip, hero pill). */
const TRIGGER_SELECTOR = '[data-palette-trigger], [aria-label="Open command palette"], .hero-pill'

/** v2 §10.1 — the sitewide konami sequence (outside inputs) unlocks CRT. */
const KONAMI_KEYS =
  'ArrowUp ArrowUp ArrowDown ArrowDown ArrowLeft ArrowRight ArrowLeft ArrowRight b a'.split(' ')

function isTextEntryTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false
  const tag = t.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable
}

/** Lazy toast — the Toast module never rides the immediate chunk. */
const lazyToast = (message: string) =>
  void import('@/components/chrome/Toast').then((m) => m.showToast(message))

export default function CommandPalette() {
  const open = useSignalStore((s) => s.paletteOpen)
  const setPaletteOpen = useSignalStore((s) => s.setPaletteOpen)
  const crtEnabled = useSignalStore((s) => s.crtEnabled)

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

  // v2 §7.2 — Esc dismisses view-source mode early (palette closed only:
  // while open, Esc belongs to cmdk). setSourceMode owns attribute + timer.
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (useSignalStore.getState().paletteOpen) return
      if (isSourceModeOn()) setSourceMode(false)
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
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
      void loadPaletteDialog().catch(() => {}) // a warm-up; the real load reports its own failure
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

  // ---------------------------------------------------------------- v2 §10.1
  // CRT phosphor mode — THIS island is the ONE owner of html[data-crt='1']
  // and localStorage[CRT_STORAGE_KEY]. Every entry point (konami, palette
  // `crt-mode`, terminal `crt on|off`) only calls store.setCrtEnabled.

  // Hydrate-apply the persisted opt-in once on mount (NOT the pre-paint head
  // script — a one-frame-late cosmetic opt-in is accepted by decision §J1).
  // Silent: no unlock toast/degauss on restore.
  const crtWasOn = useRef(false)
  const crtSilent = useRef(false)
  useEffect(() => {
    try {
      if (localStorage.getItem(CRT_STORAGE_KEY) === '1') {
        crtSilent.current = true
        useSignalStore.getState().setCrtEnabled(true)
      }
    } catch {
      /* storage unavailable — CRT simply starts off */
    }
  }, [])

  // Apply/remove the attribute, persist, and play the unlock moment
  // (degauss wobble is VISUAL ONLY + toast) on interactive false→true.
  useEffect(() => {
    if (crtEnabled === crtWasOn.current) return
    crtWasOn.current = crtEnabled
    const root = document.documentElement
    if (crtEnabled) root.dataset.crt = '1'
    else delete root.dataset.crt
    try {
      if (crtEnabled) localStorage.setItem(CRT_STORAGE_KEY, '1')
      else localStorage.removeItem(CRT_STORAGE_KEY)
    } catch {
      /* attribute still applies for this page */
    }
    if (crtEnabled) {
      if (crtSilent.current) {
        crtSilent.current = false
        return
      }
      root.dataset.crtDegauss = '1'
      window.setTimeout(() => {
        delete document.documentElement.dataset.crtDegauss
      }, 350)
      lazyToast('CRT MODE UNLOCKED — phosphor burn-in not covered by warranty')
    }
  }, [crtEnabled])

  // Konami ring buffer on the global keydown — ignores focused inputs (the
  // terminal keeps its own in-focus `nice.` easter egg, §11.2) and modified
  // keys; observes only, never preventDefault.
  useEffect(() => {
    let idx = 0
    const onKonamiKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) {
        idx = 0
        return
      }
      if (isTextEntryTarget(e.target)) {
        idx = 0
        return
      }
      const expected = KONAMI_KEYS[idx]
      if (e.key === expected || e.key.toLowerCase() === expected) {
        idx += 1
        if (idx === KONAMI_KEYS.length) {
          idx = 0
          useSignalStore.getState().setCrtEnabled(true)
        }
      } else {
        idx = e.key === KONAMI_KEYS[0] ? 1 : 0
      }
    }
    window.addEventListener('keydown', onKonamiKey)
    return () => window.removeEventListener('keydown', onKonamiKey)
  }, [])

  // ---------------------------------------------------------------- v2 §10.4
  // `demo` — the always-mounted listener. Reduced motion refuses with a toast
  // (the terminal builtin prints its own refusal line instead of dispatching);
  // otherwise the runner chunk loads ON INVOCATION only. No auto-arm exists.
  useEffect(() => {
    const onDemo = () => {
      if (useSignalStore.getState().motionReduced) {
        lazyToast('demo needs animation — motion is set to reduced')
        return
      }
      void import('@/lib/commands/demoRunner').then((m) => m.startDemo())
    }
    window.addEventListener(SIGNAL_EVENTS.demo, onDemo)
    return () => window.removeEventListener(SIGNAL_EVENTS.demo, onDemo)
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
