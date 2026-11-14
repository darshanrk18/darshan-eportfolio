'use client'

/**
 * Cover foot — "Replay the intro". Does what the palette's `replay-intro`
 * command does: clears the session flag and dispatches
 * SIGNAL_EVENTS.replayIntro; the always-on intro listener (C6)
 * dynamic-imports the intro. Shown in both editions (each skins it in
 * hero.css), so a visitor can find the intro again without the palette.
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
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
        <path
          d="M11.5 7.5A4.5 4.5 0 1 1 10 3.6M10.5 1v3h-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{label}</span>
    </button>
  )
}
