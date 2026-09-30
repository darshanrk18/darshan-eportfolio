'use client'

/**
 * P1 imprint — "Replay the intro". Does what the palette's `replay-intro`
 * command does once PRINT is already in force: clears the session flag and
 * dispatches SIGNAL_EVENTS.replayIntro; the always-on intro listener (C6)
 * dynamic-imports the intro. Rendered inside the PRINT-only imprint, so it
 * never shows in SCREEN.
 */

import { INTRO_SESSION_KEY, SIGNAL_EVENTS } from '@/lib/commands/context'

export default function ReplayIntro({ label }: { label: string }) {
  const replay = () => {
    try {
      sessionStorage.removeItem(INTRO_SESSION_KEY)
    } catch {
      /* storage unavailable — the intro still runs */
    }
    window.dispatchEvent(new CustomEvent(SIGNAL_EVENTS.replayIntro))
  }
  return (
    <button
      type="button"
      className="hero-replay-intro"
      onClick={replay}
      data-component="ReplayIntro"
      data-island="client"
    >
      {label}
    </button>
  )
}
