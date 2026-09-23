/**
 * Hero — the IDE workspace (spec §4.3). RSC shell.
 *
 * Invariant §0.2: the <h1> below is the LCP element — server-rendered text,
 * nothing gates it. The reveal grammar is declarative CSS (content always in
 * the DOM); the typed tagline is real text whose "typing" is a clip-path wipe.
 *
 * Boot choreography: a tiny inline script latches `--hd` (hero delay) onto the
 * section when `html[data-boot='1']` is set, so the reveal starts as the boot
 * overlay exits — and, being an inline style, it survives BootOverlay removing
 * the data-boot attribute mid-animation. Without boot, delays start at 0.
 */

import type { CSSProperties } from 'react'
import { profile } from '@/lib/data/profile'
import GlyphField from './GlyphField'
import BostonClock from './BostonClock'
import QuickRow from './QuickRow'
import PalettePill from './PalettePill'

/** Reveal delay relative to the hero timeline start (boot-aware via --hd). */
const delay = (ms: number): CSSProperties =>
  ({ '--reveal-delay': `calc(var(--hd, 0ms) + ${ms}ms)` }) as CSSProperties

const BOOT_DELAY_SCRIPT = `(function(){try{var e=document.getElementById('hero');if(e&&document.documentElement.getAttribute('data-boot')==='1'){e.style.setProperty('--hd','850ms')}}catch(t){}})()`

/* Hero-scoped styles: typed-tagline wipe + ⌘K pill glow breathe. All values
   come from the globals.css tokens; reduced-motion collapses both. */
const HERO_STYLES = `
#hero { --hd: 0ms; }
.hero-type {
  display: inline-block;
  clip-path: inset(0 100% 0 0);
  animation: hero-type var(--dur-enter) steps(32, end) forwards;
  animation-delay: calc(var(--hd, 0ms) + 700ms);
}
@keyframes hero-type {
  to { clip-path: inset(0 -2px 0 0); }
}
.hero-pill-glow {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: var(--glow-signal);
  opacity: 0.3;
  pointer-events: none;
  animation: hero-breathe 4s ease-in-out infinite;
}
@keyframes hero-breathe {
  0%, 100% { opacity: 0.25; }
  50% { opacity: 0.55; }
}
html[data-motion='reduced'] .hero-type { animation: none; clip-path: none; }
html[data-motion='reduced'] .hero-pill-glow { animation: none; }
@media (prefers-reduced-motion: reduce) {
  html:not([data-motion='full']) .hero-type { animation: none; clip-path: none; }
  html:not([data-motion='full']) .hero-pill-glow { animation: none; }
}
`

export default function Hero() {
  return (
    <section
      id="hero"
      aria-label="Introduction"
      className="relative flex min-h-svh flex-col justify-center overflow-hidden"
      data-component="Hero"
      suppressHydrationWarning
    >
      <style dangerouslySetInnerHTML={{ __html: HERO_STYLES }} />
      <script dangerouslySetInnerHTML={{ __html: BOOT_DELAY_SCRIPT }} />

      {/* Living glyph field (aria-hidden garnish) over the static constellation. */}
      <GlyphField />

      <div className="container-site relative" style={{ zIndex: 'var(--z-content)' }}>
        {/* 1 — eyebrow: decorative echo of the editor chrome */}
        <p className="type-label-xs text-secondary reveal-mask mb-6">
          <span className="reveal-line" style={delay(0)}>
            ~/darshan-konnur — main ✓
          </span>
        </p>

        {/* 2 — the LCP h1: line-mask reveal, permanent signal caret */}
        <h1 className="type-display-hero text-primary">
          <span className="reveal-mask block">
            <span className="reveal-line" style={delay(80)}>
              {profile.displayName}
              <span className="caret" aria-hidden="true" />
            </span>
          </span>
        </h1>

        {/* 3 — typed tagline: real text in the DOM, typing is visual only */}
        <p className="type-code text-secondary mt-6">
          <span className="hero-type">{profile.heroTagline}</span>
        </p>

        {/* 4 — status row: pulsing dot · status · location · live Boston time */}
        <p
          className="type-label-sm text-secondary fade-up mt-4 flex items-center gap-2"
          style={delay(1300)}
        >
          <span
            className="bg-signal inline-block h-2 w-2 rounded-full"
            style={{ animation: 'pulse-soft 2s ease-in-out infinite' }}
            aria-hidden="true"
          />
          <span>
            {profile.status} · {profile.location}
            <BostonClock />
          </span>
        </p>

        {/* 5 — recruiter quick row */}
        <div className="fade-up mt-8" style={delay(1400)}>
          <QuickRow />
        </div>
      </div>

      {/* Bottom rail: scroll hint (left) + ⌘K invitation (center) */}
      <div
        className="absolute inset-x-0 bottom-8"
        style={{ zIndex: 'var(--z-content)' }}
      >
        <div className="container-site fade-up grid grid-cols-3 items-end" style={delay(1600)}>
          <p className="type-label-xs text-secondary hidden self-center md:block">
            scroll ↓ or type
          </p>
          <div className="col-start-2 justify-self-center">
            <PalettePill />
          </div>
        </div>
      </div>
    </section>
  )
}
