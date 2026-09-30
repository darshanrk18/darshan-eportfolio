'use client'

/**
 * Build info — the always-mounted shell (V3_SPEC §1.8). The palette
 * `build-info` command flips store.buildInfoOpen; while it is true this
 * island `dynamic()`-mounts the panel body (./BuildInfoPanel.client), which
 * is the ONLY module that imports lib/build/inject (and with it
 * lib/build/manifest.json), the fps meter and the tier tables — none of
 * that rides the first-load bundle. Closing (button, scrim, Esc) sets the
 * flag back to false, which unmounts the panel.
 */

import dynamic from 'next/dynamic'
import { useSignalStore } from '@/lib/state/store'

const BuildInfoPanel = dynamic(() => import('./BuildInfoPanel.client'), { ssr: false })

export default function BuildInfo() {
  const open = useSignalStore((s) => s.buildInfoOpen)
  const setOpen = useSignalStore((s) => s.setBuildInfoOpen)
  if (!open) return null
  return <BuildInfoPanel onClose={() => setOpen(false)} />
}
