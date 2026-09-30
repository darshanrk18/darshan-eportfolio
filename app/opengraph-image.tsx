/**
 * OG / Twitter card (v2 §7.2; v3 §3 / §5) — the SCREEN look via next/og:
 * black field with the volumetric top light, the Studio Seal in silver,
 * the Cinzel name, an IBM Plex Mono status line with a champagne live dot.
 * No build evidence (clutter law), no image assets: the seal is an inline
 * path (components/chrome/DkSeal DK_SEAL_MARK_PATH).
 *
 * Satori rules: flex only, no CSS vars (hex copies of the SCREEN tokens),
 * one font loader per family + weight, exact glyphs requested. Fonts are
 * fetched from Google Fonts at build time; if a fetch fails the card falls
 * back to next/og's default font rather than failing the build.
 */

import { ImageResponse } from 'next/og'
import { DK_SEAL_MARK_PATH } from '@/components/chrome/DkSeal'
import { profile } from '@/lib/data/profile'

export const alt = 'Darshan Konnur — Software Engineer'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/* SCREEN tokens (app/globals.css :root), copied because Satori has no vars. */
const FIELD = '#050607'
const SILVER = '#d9dde4'
const STEEL = '#aab3c0'
const STEEL_DIM = '#8b96a4'
const CHAMPAGNE = '#d8c49a'
const EDGE = 'rgba(154,165,179,0.3)'

async function loadGoogleFont(
  family: string,
  weight: number,
  text: string
): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`
    const css = await (await fetch(url)).text()
    const match = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)
    if (!match?.[1]) return null
    const res = await fetch(match[1])
    if (!res.ok) return null
    return await res.arrayBuffer()
  } catch {
    return null
  }
}

export default async function OpengraphImage() {
  const name = profile.displayName.toUpperCase()
  const kicker = profile.status.toUpperCase()
  const line = `${profile.role} · ${profile.location}`

  const [cinzel, plex] = await Promise.all([
    loadGoogleFont('Cinzel', 500, name),
    loadGoogleFont('IBM Plex Mono', 400, `${kicker}${line}`),
  ])

  const fonts: { name: string; data: ArrayBuffer; style: 'normal'; weight: 400 | 500 }[] = []
  if (cinzel) fonts.push({ name: 'Cinzel', data: cinzel, style: 'normal', weight: 500 })
  if (plex) fonts.push({ name: 'IBM Plex Mono', data: plex, style: 'normal', weight: 400 })

  const displayFamily = cinzel ? 'Cinzel' : 'serif'
  const monoFamily = plex ? 'IBM Plex Mono' : 'monospace'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: FIELD,
          backgroundImage:
            'radial-gradient(ellipse at 50% -10%, rgba(214,196,158,0.18) 0%, rgba(140,155,175,0.07) 42%, rgba(5,6,7,0) 72%)',
          padding: '56px 72px 60px',
          border: `1px solid ${EDGE}`,
        }}
      >
        {/* Ident — the Studio Seal, silver. */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <svg width="56" height="56" viewBox="0 0 100 100" fill={SILVER}>
            <path d={DK_SEAL_MARK_PATH} />
          </svg>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Kicker with the live dot. */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontFamily: monoFamily,
              fontSize: 22,
              color: STEEL,
              letterSpacing: '0.28em',
            }}
          >
            <div
              style={{
                display: 'flex',
                width: 10,
                height: 10,
                borderRadius: 999,
                backgroundColor: CHAMPAGNE,
                marginRight: 18,
                boxShadow: '0 0 12px rgba(216,196,154,0.55)',
              }}
            />
            {kicker}
          </div>
          {/* The name — Cinzel, silver, metal-lit. */}
          <div
            style={{
              display: 'flex',
              marginTop: 26,
              fontFamily: displayFamily,
              /* 14 caps at 0.06em fit the 1056 px column with room to spare. */
              fontSize: 88,
              lineHeight: 1,
              color: SILVER,
              letterSpacing: '0.06em',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </div>
          {/* The champagne rule under the name (an SVG line: Satori collapses
              an empty sized div inside a column). */}
          <svg width="220" height="2" viewBox="0 0 220 2" style={{ marginTop: 28 }}>
            <rect width="220" height="1" fill={CHAMPAGNE} fillOpacity="0.7" />
          </svg>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontFamily: monoFamily,
            fontSize: 24,
            color: STEEL_DIM,
            letterSpacing: '0.08em',
          }}
        >
          {line}
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length > 0 ? fonts : undefined }
  )
}
