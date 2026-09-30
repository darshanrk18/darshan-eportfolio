/**
 * v3 — an official logo that reads right in BOTH editions from ONE DOM
 * (V3_SPEC §2.8, Phase B contract). Renders the mono file (`.lg-mono`,
 * whitened by the SCREEN skin) AND the colour file (`.lg-color`, the PRINT
 * sticker and the SCREEN active node) side by side; the edition CSS shows
 * one and hides the other, so a switch never re-fetches or re-renders, and
 * the server markup is identical for both editions (no hydration mismatch).
 * Hidden images have no box, so lazy loading never fetches the unused file.
 * Server-safe: no hooks. Always place it beside the visible name.
 */

import Logo from './Logo'

export interface EdLogoProps {
  id: string
  /** Rendered box in CSS px (width = height). Default 18. */
  size?: number
}

export default function EdLogo({ id, size = 18 }: EdLogoProps) {
  return (
    <>
      <Logo id={id} size={size} mono className="lg-mono" />
      <Logo id={id} size={size} className="lg-color" />
    </>
  )
}
