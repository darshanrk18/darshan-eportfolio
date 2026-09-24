/**
 * OG / Twitter card (spec §7.2) — pure typography via next/og: obsidian
 * background, serif name, mono status line, signal caret. No image assets.
 * Fonts are fetched from Google Fonts at build time; if that fetch fails the
 * card falls back to next/og's default font rather than failing the build.
 */

import { ImageResponse } from 'next/og'
import { profile } from '@/lib/data/profile'

export const alt = 'Darshan Konnur — Software Engineer'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

async function loadGoogleFont(family: string, text: string): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&text=${encodeURIComponent(text)}`
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
  const name = profile.displayName
  const tagline = profile.heroTagline
  const statusLine = `${profile.status} · ${profile.location}`
  const eyebrow = '~/darshan-konnur — main'

  // v2 §10.6 — the build-run motif travels with the card. VERIFIED: Google's
  // css2 endpoint silently DROPS U+2713 from JetBrains Mono subsets (the
  // fetch succeeds but the served font has no ✓ cmap entry), after which
  // Satori's own dynamic-font fetch 400s — so the glyph "still fails" and the
  // spec's sanctioned ASCII fallback row ships deterministically.
  const buildRow = 'ok · compiled · 0 errors'

  const [serif, mono] = await Promise.all([
    loadGoogleFont('Instrument Serif', name),
    loadGoogleFont('JetBrains Mono', `${tagline}${statusLine}${eyebrow}${buildRow}`),
  ])

  const fonts: { name: string; data: ArrayBuffer; style: 'normal'; weight: 400 }[] = []
  if (serif) fonts.push({ name: 'Instrument Serif', data: serif, style: 'normal', weight: 400 })
  if (mono) fonts.push({ name: 'JetBrains Mono', data: mono, style: 'normal', weight: 400 })

  const serifFamily = serif ? 'Instrument Serif' : 'serif'
  const monoFamily = mono ? 'JetBrains Mono' : 'monospace'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#050607',
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
          backgroundSize: '32px 32px',
          padding: '64px 72px',
          border: '1px solid #1C2229',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontFamily: monoFamily,
            fontSize: 24,
            color: '#8B949E',
            letterSpacing: '0.06em',
          }}
        >
          {eyebrow}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <div
              style={{
                display: 'flex',
                fontFamily: serifFamily,
                fontSize: 132,
                lineHeight: 1,
                color: '#E6EDF3',
                letterSpacing: '-0.02em',
              }}
            >
              {name}
            </div>
            <div
              style={{
                display: 'flex',
                width: 14,
                height: 104,
                marginLeft: 18,
                marginBottom: 8,
                backgroundColor: '#3FE0A0',
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 36,
              fontFamily: monoFamily,
              fontSize: 28,
              color: '#8B949E',
            }}
          >
            {tagline}
          </div>
          {/* v2 §10.6 — build-run row in the signal hex. The AWS/date line
              already lives in the tagline (kept to one occurrence). */}
          <div
            style={{
              display: 'flex',
              marginTop: 20,
              fontFamily: monoFamily,
              fontSize: 24,
              color: '#3FE0A0',
              letterSpacing: '0.04em',
            }}
          >
            {buildRow}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontFamily: monoFamily,
            fontSize: 24,
            color: '#8B949E',
            letterSpacing: '0.06em',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: 12,
              height: 12,
              borderRadius: 999,
              backgroundColor: '#3FE0A0',
              marginRight: 16,
            }}
          />
          {statusLine}
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length > 0 ? fonts : undefined },
  )
}
