'use client'

/**
 * Edition picker — the gate (V3_SPEC §2.5, X1). Mounted on '/' only
 * (app/page.tsx). SSR renders nothing. After mount it reads
 * html[data-pick] (written pre-paint when nothing is stored, or by the
 * palette's `choose-edition` → requestEditionPick()) and watches it with a
 * MutationObserver; while it is '1' the lazy surface
 * (./EditionPickerSurface.client.tsx — never in the first-load bundle)
 * mounts. The surface clears the attribute at the moment of choice and
 * fades; it calls `onDone` after the fade, which is when THIS gate stops
 * rendering it (the attribute going away does not unmount it early).
 *
 * styles/v3/picker.css is imported here (not in the surface) so the
 * pre-paint cover `html[data-pick='1'] body::before` is in the page CSS
 * from the first paint and the surface never flashes unstyled.
 *
 * Budget (§7): this island ≤ 3 KB gz — an attribute read, an observer and
 * a dynamic import.
 */

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useState } from 'react'
import { PICK_ATTR } from '@/lib/commands/context'
import '@/styles/v3/picker.css'

const EditionPickerSurface = dynamic(() => import('./EditionPickerSurface.client'), {
  ssr: false,
})

export default function EditionPicker() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    const sync = () => {
      if (root.getAttribute(PICK_ATTR) === '1') setShow(true)
    }
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(root, { attributes: true, attributeFilter: [PICK_ATTR] })
    return () => observer.disconnect()
  }, [])

  const onDone = useCallback(() => setShow(false), [])

  if (!show) return null
  return <EditionPickerSurface onDone={onDone} />
}
