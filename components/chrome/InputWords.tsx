import type { ReactNode } from 'react'

/**
 * One instruction, two wordings (lib/utils/input.ts): `mouse` for a device
 * with a mouse or trackpad, `touch` for a touch screen with no keys to press
 * and nothing to hover. Both render, on the server too, so hydration always
 * matches; `.mouse-only` / `.touch-only` (app/globals.css) show one and hide
 * the other with display:none, so only the shown words are read out. Equal
 * wordings render once, bare. No hooks: usable from server and client code.
 */
export default function InputWords({ mouse, touch }: { mouse: ReactNode; touch: ReactNode }) {
  if (mouse === touch) return <>{mouse}</>
  return (
    <>
      <span className="mouse-only">{mouse}</span>
      <span className="touch-only">{touch}</span>
    </>
  )
}
