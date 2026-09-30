'use client'

/**
 * v3 §2 / README §6 — the edition in force for JS-driven skins (Connect
 * Four's disc words, the console's face renderer, per-edition labels).
 * Reads html[data-edition] after mount (the server answer is 'screen'),
 * then follows every switch through a MutationObserver on the attribute —
 * so it works on '/', '/work/[slug]' and '/arcade' alike, whether or not
 * the EditionToggle island (which mirrors the store) is mounted.
 */

import { useEffect, useState } from 'react'
import { EDITION_ATTR, getCurrentEdition, type Edition } from '@/lib/commands/context'

export function useEdition(): Edition {
  const [edition, setEdition] = useState<Edition>('screen')
  useEffect(() => {
    const sync = () => setEdition(getCurrentEdition())
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: [EDITION_ATTR] })
    return () => observer.disconnect()
  }, [])
  return edition
}
