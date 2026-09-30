'use client'

/**
 * Edition toggle — the `SCREEN | PRINT` pill (V3_SPEC §2.4, §3 "Navbar").
 *
 * Two real buttons in a role="group": each is named "Switch to the SCREEN /
 * PRINT edition" (the name contains its visible label, WCAG 2.5.3) and
 * carries aria-pressed for the edition in force. Pressing the other one
 * runs switchEdition(next, { originEl }) — the §2.4 press / projector view
 * transition — with `via: 'toggle'`. `originEl` is the PRESSED pill, so
 * the press's dot wave grows from exactly where the visitor clicked (X2:
 * "from the toggle's corner"; switch.css reads --switch-x/--switch-y).
 *
 * X2 lock: while the 700 ms choreography runs the group is `data-switching`
 * and both pills are aria-disabled (the padlock beat — a second click cannot
 * queue a reverse transition mid-flight; `press` ignores it, and the focused
 * pill keeps keyboard focus instead of dropping it to <body>); it unlocks on `finished`, clears
 * the inline --switch-x/--switch-y it seeded, and an aria-live region says
 * "Now in the PRINT edition" (X2 flag 12).
 *
 * The ON pill is drawn by CSS from html[data-edition] (styles/v3/screen.css
 * and print.css `.ed-toggle > [data-ed=…]`), never from React state, so a
 * stored PRINT visitor sees the right pill on the first paint with no
 * hydration flash; React state only drives the ARIA. A MutationObserver on
 * data-edition keeps that state in sync when the palette, the terminal or
 * the picker switch editions elsewhere. On mount it also mirrors the
 * edition into the store and re-syncs the theme-color metas (a safety net:
 * the pre-paint script's lead meta already carries a stored PRINT visit's).
 */

import { useEffect, useRef, useState } from 'react'
import {
  EDITION_ATTR,
  SWITCH_ORIGIN_X_VAR,
  SWITCH_ORIGIN_Y_VAR,
  getCurrentEdition,
  switchEdition,
  syncEditionMeta,
  type Edition,
} from '@/lib/commands/context'
import { useSignalStore } from '@/lib/state/store'

const OPTIONS: readonly Edition[] = ['screen', 'print']

export interface EditionToggleProps {
  className?: string
}

export default function EditionToggle({ className }: EditionToggleProps) {
  const [edition, setEdition] = useState<Edition>('screen')
  const [switching, setSwitching] = useState(false)
  const [announce, setAnnounce] = useState('')
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    const sync = () => {
      const current = getCurrentEdition()
      setEdition(current)
      useSignalStore.getState().setEdition(current)
    }
    sync()
    syncEditionMeta(getCurrentEdition())
    const observer = new MutationObserver(sync)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [EDITION_ATTR],
    })
    return () => {
      mounted.current = false
      observer.disconnect()
    }
  }, [])

  const press = (option: Edition, originEl: HTMLButtonElement) => {
    if (option === edition || switching) return
    setSwitching(true)
    void switchEdition(option, { originEl, via: 'toggle' }).finally(() => {
      // The origin vars served this press's dot wave only: leave no inline
      // style behind (switch.css falls back to the toggle's corner).
      const style = document.documentElement.style
      style.removeProperty(SWITCH_ORIGIN_X_VAR)
      style.removeProperty(SWITCH_ORIGIN_Y_VAR)
      if (!mounted.current) return
      setSwitching(false)
      setAnnounce(`Now in the ${option.toUpperCase()} edition`)
    })
  }

  return (
    <div
      role="group"
      aria-label="Edition"
      className={className ? `ed-toggle ${className}` : 'ed-toggle'}
      data-component="EditionToggle"
      data-island="client"
      data-switching={switching ? '1' : undefined}
    >
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          data-ed={option}
          aria-pressed={edition === option}
          aria-label={`Switch to the ${option.toUpperCase()} edition`}
          aria-disabled={switching || undefined}
          onClick={(e) => press(option, e.currentTarget)}
        >
          {option.toUpperCase()}
        </button>
      ))}
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>
    </div>
  )
}
