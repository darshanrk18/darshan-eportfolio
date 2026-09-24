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

/**
 * v2 §4.1 LCP-gate revert switch. Gate MEASURED on the production build
 * (2026-09-23, both Lighthouse desktop preset ×2 and a real-Chrome
 * PerformanceObserver probe, kinetic ON vs OFF vs v1):
 * — The letter split has ZERO LCP cost: LH LCP 1.41/1.43s with it on,
 *   1.45/1.46s with it off (noise); real-Chrome candidates are identical.
 * — On any FIRST visit the LCP API's element is a BOOT OVERLAY line in v1
 *   AND v2 (the masked h1 first paints clipped, so its recorded candidate
 *   never beats the boot line) — a pre-existing v1 condition, untouched by
 *   this feature. v1→v2 LCP: real Chrome 744→764ms (+20ms); LH's simulated
 *   throttling stretches the §6.3 POST-line schedule to +~340ms, still well
 *   under the 2.0s hard floor. Flip to false to restore the v1 single-line
 *   h1 (the ripple then degrades to nothing — whole-word italic flash would
 *   need the letter spans).
 */
export const KINETIC_NAME = true

const BOOT_DELAY_SCRIPT = `(function(){try{var e=document.getElementById('hero');if(e&&document.documentElement.getAttribute('data-boot')==='1'){e.style.setProperty('--hd','850ms')}}catch(t){}})()`

/**
 * v2 §4.1 hover ripple (~15 lines, inline — zero bundle bytes). Fine pointers
 * only; rAF-throttled pointermove on the h1 sets data-hot on the hovered
 * letter and data-hot-prev on its previous sibling; CSS does the italics.
 * Runs at the END of the section so the h1 exists when it executes.
 */
const HERO_RIPPLE_SCRIPT = `(function(){try{
if(!matchMedia('(hover: hover) and (pointer: fine)').matches)return;
var h=document.querySelector('#hero h1');if(!h)return;
var hot=null,prev=null,raf=0,ev=null;
function clear(){if(hot){hot.removeAttribute('data-hot');hot=null}if(prev){prev.removeAttribute('data-hot-prev');prev=null}}
function apply(){raf=0;if(!ev)return;
var t=ev.target&&ev.target.closest?ev.target.closest('.hero-letter'):null;
if(t===hot)return;clear();if(!t)return;
hot=t;t.setAttribute('data-hot','');
var p=t.previousElementSibling;
if(p&&p.classList&&p.classList.contains('hero-letter')){prev=p;p.setAttribute('data-hot-prev','')}}
h.addEventListener('pointermove',function(e){ev=e;if(!raf)raf=requestAnimationFrame(apply)},{passive:true});
h.addEventListener('pointerleave',function(){ev=null;if(raf){cancelAnimationFrame(raf);raf=0}clear()});
}catch(e){}})()`

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
/* v2 §4.1 kinetic name. LCP reasoning (the gate's DOM-paint argument): the
   letters are plain server-rendered spans with NO opacity/transform of their
   own outside the mask — the from-state (0.35em rise + 2deg tilt, fill:both)
   only offsets them INSIDE the same overflow-hidden .reveal-mask line v1
   already animates from translateY(110%), so first-paint content, the LCP
   element (the h1 text) and its paint timing are byte-identical to v1. */
.hero-letter {
  display: inline-block;
  animation: letter-rise 700ms var(--ease-out-expo) both;
  animation-delay: calc(var(--hd, 0ms) + 80ms + var(--li, 0) * 28ms);
  transition: transform 120ms var(--ease-swift);
}
/* No 'to' block: the animation settles into the underlying (hover-able)
   transform, so fill:both never pins transform against the ripple scale. */
@keyframes letter-rise {
  from { transform: translateY(0.35em) rotate(2deg); }
}
/* Hover ripple: the hot letter + both neighbors go italic at +0.5% scale. */
.hero-letter[data-hot],
.hero-letter[data-hot] + .hero-letter,
.hero-letter[data-hot-prev] {
  font-style: italic;
  transform: scale(1.005);
}
html[data-motion='reduced'] .hero-type { animation: none; clip-path: none; }
html[data-motion='reduced'] .hero-pill-glow { animation: none; }
html[data-motion='reduced'] .hero-letter {
  animation: none !important;
  transform: none !important;
  font-style: normal !important;
}
@media (prefers-reduced-motion: reduce) {
  html:not([data-motion='full']) .hero-type { animation: none; clip-path: none; }
  html:not([data-motion='full']) .hero-pill-glow { animation: none; }
  html:not([data-motion='full']) .hero-letter {
    animation: none !important;
    transform: none !important;
    font-style: normal !important;
  }
}
`

export default function Hero() {
  return (
    <section
      id="hero"
      aria-label="Introduction"
      className="relative flex min-h-svh flex-col justify-center overflow-hidden"
      data-component="Hero"
      data-island="RSC"
      style={{ ['--vs-i' as string]: 0 }}
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

        {/* 2 — the LCP h1: line-mask reveal, permanent signal caret.
            v2 §4.1: per-letter kinetic rise INSIDE the masked line (KINETIC_NAME
            gates the split; sr-only keeps the accessible name one string). */}
        <h1 className="type-display-hero text-primary">
          <span className="reveal-mask block">
            {KINETIC_NAME ? (
              <span className="reveal-line" style={delay(80)}>
                <span className="sr-only">{profile.displayName}</span>
                <span aria-hidden="true">
                  {Array.from(profile.displayName).map((ch, i) => (
                    <span key={i} className="hero-letter" style={{ '--li': i } as CSSProperties}>
                      {ch === ' ' ? '\u00A0' : ch}
                    </span>
                  ))}
                </span>
                <span className="caret" aria-hidden="true" />
              </span>
            ) : (
              <span className="reveal-line" style={delay(80)}>
                {profile.displayName}
                <span className="caret" aria-hidden="true" />
              </span>
            )}
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
      <div className="absolute inset-x-0 bottom-8" style={{ zIndex: 'var(--z-content)' }}>
        <div className="container-site fade-up grid grid-cols-3 items-end" style={delay(1600)}>
          <p className="type-label-xs text-secondary hidden self-center md:block">
            scroll ↓ or type
          </p>
          <div className="col-start-2 justify-self-center">
            <PalettePill />
          </div>
        </div>
      </div>

      {/* v2 §4.1 hover-ripple wiring — end of section so the h1 is parsed. */}
      {KINETIC_NAME && <script dangerouslySetInnerHTML={{ __html: HERO_RIPPLE_SCRIPT }} />}
    </section>
  )
}
