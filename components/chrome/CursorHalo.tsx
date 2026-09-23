'use client'

/**
 * §2.4 cursor halo — the ONE pointermove listener on the site. Writes the
 * CSS vars --mx/--my (consumed by body::after's 400px radial mask) via rAF.
 * Static on touch (hover:none hides the layer in CSS) and under reduced
 * motion. Renders nothing.
 */

import { useEffect } from 'react'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'

export default function CursorHalo() {
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (reduced) return
    if (!window.matchMedia('(pointer: fine)').matches) return

    const root = document.documentElement
    let raf = 0
    let x = -999
    let y = -999

    const onMove = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      if (raf === 0) {
        raf = requestAnimationFrame(() => {
          raf = 0
          root.style.setProperty('--mx', `${x}px`)
          root.style.setProperty('--my', `${y}px`)
        })
      }
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (raf !== 0) cancelAnimationFrame(raf)
      root.style.removeProperty('--mx')
      root.style.removeProperty('--my')
    }
  }, [reduced])

  return null
}
