/**
 * v3 §2.8 — an official logo beside a visible name (Phase B).
 * Server-safe (no hooks). Renders `<span class="ed-logo"><img …></span>` with
 * explicit width/height, `loading="lazy"`, `decoding="async"` and `alt=""`:
 * the logo is decorative because the caller always shows the name next to it
 * (BRIEF-R2 §2). `mono` picks the mono file and adds the `mono` class so the
 * edition CSS (`.ed-logo img.mono`, styles/v3 — SCREEN whitens it with
 * `filter: brightness(0) invert(1)`) can grade it; colour files are used as a
 * fallback and are whitened by the same filter. Ids with no official logo
 * (mockito, sql) render a text chip of the same size (`.ed-logo-chip`), and
 * an unknown id renders nothing — the name still reads.
 *
 * Usage:  <Logo id="docker" mono size={20} /> <span>Docker</span>
 *         <Logo id={logoIdForName(tech) ?? ''} />   // project stack chips
 */

import { resolveLogo } from '@/lib/data/logos'

export interface LogoProps {
  /** Skill / language / social id from lib/data/logos.ts (e.g. 'docker'). */
  id: string
  /** Rendered box in CSS px (width = height). Default 20. */
  size?: number
  /** SCREEN glass tiles: the mono file + the `mono` filter class. */
  mono?: boolean
  /** Extra classes on the `.ed-logo` wrapper (e.g. sticker / tile skins). */
  className?: string
}

export default function Logo({ id, size = 20, mono = false, className }: LogoProps) {
  const logo = resolveLogo(id, mono)
  if (!logo) return null
  const box = { width: size, height: size }
  const classes = ['ed-logo', className].filter(Boolean).join(' ')

  if (logo.kind === 'chip') {
    return (
      <span className={`${classes} ed-logo-chip`} data-logo={id} style={box} aria-hidden="true">
        {logo.text}
      </span>
    )
  }

  return (
    <span className={classes} data-logo={id} style={box}>
      {/* Plain <img>: static SVGs under public/logos, sized by the caller — not next/image. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo.src}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        alt=""
        className={logo.mono ? 'mono' : undefined}
      />
    </span>
  )
}
