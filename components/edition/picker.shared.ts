/**
 * The edition picker's shared, server-safe facts (V3_SPEC §2.5, X1) — what
 * the server-rendered SHELL (./PickerShell.tsx, in the page HTML for every
 * visit) and the interactive SURFACE (./EditionPickerSurface.client.tsx,
 * the lazy chunk) both need: the approved copy, the portrait's silhouette,
 * which portrait encode each viewport draws, and the attribute the surface
 * writes when it has taken over from the shell. No DOM, no React, no
 * 'use client': app/page.tsx imports it through the shell.
 */

import { PHOTOS } from '@/lib/data/photos'
import { EDITION_ATTR, EDITION_STORAGE_KEY, INTRO_ATTR, PICK_ATTR } from '@/lib/edition/prepaint'
import { INTRO_START_EVENT } from '@/lib/intro/events'

export {
  PICKER_FAILED_ATTR,
  PICKER_FALLBACK_MS,
  PICKER_LIVE_ATTR,
  PICKER_QUEUED_ATTR,
  PICKER_QUEUED_CLASS,
  PICKER_SHELL_ATTR,
} from './picker.attrs'
import {
  PICKER_FAILED_ATTR,
  PICKER_FALLBACK_MS,
  PICKER_LIVE_ATTR,
  PICKER_QUEUED_ATTR,
  PICKER_QUEUED_CLASS,
  PICKER_SHELL_ATTR,
} from './picker.attrs'

/**
 * The shell's inline <script> (rendered by PickerShell right after its
 * markup, so it runs the moment the parser has the shell — long before the
 * page's JS). Three jobs, all inert once the surface is live
 * (html[data-picker-live]) or the picker is gone (data-pick cleared):
 *
 *  1. QUEUE a choice: a click on either half (a tap, a pointer, Enter/Space
 *     on the focused button) writes html[data-pick-queued] and the pressed
 *     class; the keys 1 / 2 click the halves (aria-keyshortcuts). If the
 *     surface is still not live PICKER_FALLBACK_MS after the tap (its chunk
 *     failed or is stuck), the script applies the choice itself — stores
 *     the edition, sets the attribute, clears data-pick (the shell and the
 *     cover go, the page scrolls) and, for PRINT with full motion, raises
 *     data-intro + `signal:intro-start` so the intro gate runs whether or
 *     not it has hydrated yet. A visitor is never stuck on the picker. If
 *     the surface chunk has already failed (html[data-picker-failed], set
 *     by the gate), a tap is applied at once.
 *  2. TRAP focus: Tab / Shift+Tab move between the two halves and never
 *     leave the dialog (the surface installs the same trap later).
 *  3. START the PRINT half's fonts (Bangers, Alfa Slab One, Archivo — the
 *     latin faces only), on a first visit only (data-pick): FontFace.load()
 *     on the CSS-connected faces, so they are requested here, at the top
 *     of the body, instead of at the first style pass after the whole
 *     document has parsed — the shortest possible fallback-font window at
 *     the first paint. A return visit never fetches them from here.
 *
 * Separate from the ≤ 460 B pre-paint script (lib/edition/prepaint.ts):
 * scripts/check-prepaint.mjs identifies that one by its storage key AND its
 * reduced-motion query, so this script's fallback may name the key. Plain
 * ES5, no template literals (the same minifier caveat as the pre-paint
 * script). Budget: ≤ 1.4 KB.
 */

export const PICKER_SHELL_SCRIPT =
  "(function(){var d=document,h=d.documentElement,s=d.querySelector('[@SHELL@]');if(!s)return;" +
  "var w=0,b=s.querySelectorAll('.pk-half'),on=function(){return h.getAttribute('@PICK@')=='1'&&!h.hasAttribute('@LIVE@')};" +
  "s.addEventListener('click',function(e){var t=e.target.closest('.pk-half');" +
  "if(t&&on()){h.setAttribute('@QUEUED@',t.classList.contains('pk-half-s')?'screen':'print');" +
  "for(var i=0;i<b.length;i++)b[i].classList.toggle('@QCLASS@',b[i]==t);" +
  "clearTimeout(w);w=setTimeout(function(){var v=h.getAttribute('@QUEUED@');if(!on()||!v)return;" +
  "try{localStorage.setItem('@EKEY@',v)}catch(x){}h.setAttribute('@EATTR@',v);h.removeAttribute('@QUEUED@');h.removeAttribute('@PICK@');" +
  "if(v=='print'&&h.getAttribute('data-motion')!='reduced'){h.setAttribute('@IATTR@','1');dispatchEvent(new CustomEvent('@IEVT@'))}},h.hasAttribute('@FAILED@')?0:@FALLBACK@)}},true);" +
  "d.addEventListener('keydown',function(e){if(!on()||/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))return;" +
  "var a=d.activeElement,k=e.key;" +
  "if(k=='Tab'){e.preventDefault();(a==b[0]?b[1]:a==b[1]?b[0]:e.shiftKey?b[1]:b[0]).focus()}" +
  "else if(k=='1'||k=='2'){e.preventDefault();b[k-1].click()}},true);" +
  "if(on())try{d.fonts.forEach(function(f){if(/^(Bangers|Alfa Slab One|Archivo)$/.test(f.family)&&/^u\\+0?0(-0*ff|\\?\\?)/i.test(f.unicodeRange))f.load()})}catch(x){}})();"

/** PICKER_SHELL_SCRIPT with its attribute names resolved (what PickerShell renders). */
export const PICKER_SHELL_SCRIPT_RESOLVED = Object.entries({
  '@SHELL@': PICKER_SHELL_ATTR,
  '@PICK@': PICK_ATTR,
  '@LIVE@': PICKER_LIVE_ATTR,
  '@QUEUED@': PICKER_QUEUED_ATTR,
  '@QCLASS@': PICKER_QUEUED_CLASS,
  '@EKEY@': EDITION_STORAGE_KEY,
  '@EATTR@': EDITION_ATTR,
  '@IATTR@': INTRO_ATTR,
  '@IEVT@': INTRO_START_EVENT,
  '@FALLBACK@': String(PICKER_FALLBACK_MS),
  '@FAILED@': PICKER_FAILED_ATTR,
  // every occurrence (split/join: a string .replace() swaps only the first)
}).reduce((js, [token, value]) => js.split(token).join(value), PICKER_SHELL_SCRIPT)

/** The approved X1 copy (inventory §3) — every visible string of the picker. */
export const PICKER_COPY = {
  ask: 'Choose your edition',
  caption: 'Same story in both. Switch anytime from the top bar.',
  screen: {
    title: 'SCREEN',
    body: 'A dark, cinematic cut.',
    cta: 'Enter the feature',
  },
  print: {
    title: 'PRINT',
    body: 'An inked, four-color comic.',
    cta: 'Open the issue',
  },
} as const

/** The silhouette of the Sep 29 studio portrait (option A: dark wall, natural
 *  crop), traced from its mask into the X1 frame's 800 × 800 space — the same
 *  file as public/photo/portrait-41.webp (design-workshop/photos/options). */
export const SILHOUETTE =
  'M793.8 793.8 L100.0 793.8 L97.7 793.8 L96.8 760.9 L103.2 717.3 L110.5 699.1 L120.5 685.5 L129.1 678.6 L142.7 674.1 L179.1 655.9 L237.3 617.7 L242.7 612.3 L248.2 610.5 L260.9 599.5 L274.5 592.3 L285.0 580.9 L285.9 564.5 L290.5 554.5 L285.9 527.3 L277.7 509.1 L267.7 502.7 L266.8 499.1 L261.4 495.5 L261.4 490.9 L252.3 481.8 L251.4 473.6 L238.6 446.4 L231.4 414.5 L230.5 380.0 L233.2 362.7 L235.9 307.3 L235.0 290.0 L232.3 286.4 L233.2 280.0 L231.4 275.5 L233.2 257.3 L226.8 242.7 L228.6 226.4 L225.0 200.0 L231.4 190.0 L233.2 178.2 L244.1 167.3 L254.1 150.0 L285.5 120.5 L307.3 119.5 L339.1 112.3 L349.1 107.7 L363.6 96.8 L374.5 95.0 L399.1 95.0 L425.5 104.1 L436.4 104.1 L447.3 108.6 L466.4 124.1 L490.9 137.7 L501.4 149.1 L505.9 160.9 L509.5 164.5 L519.1 171.4 L525.5 172.3 L535.0 181.8 L539.5 192.7 L537.7 206.4 L532.3 212.7 L530.5 221.8 L523.2 230.9 L523.2 235.5 L514.1 245.5 L519.5 250.9 L519.5 257.3 L516.4 261.4 L506.4 260.5 L502.3 263.6 L499.5 278.2 L495.0 285.5 L495.9 301.8 L492.3 314.5 L491.4 339.1 L493.6 342.3 L505.5 343.2 L510.5 348.2 L515.0 367.3 L505.9 405.5 L493.2 435.5 L490.9 437.7 L479.1 437.7 L476.8 440.0 L474.1 451.8 L475.9 488.2 L503.6 516.8 L539.1 543.2 L556.4 546.8 L628.2 579.5 L650.9 586.8 L672.7 598.6 L684.5 601.4 L721.8 604.1 L755.5 616.8 L763.2 624.5 L772.3 639.1 L780.5 665.5 L787.7 704.5 L791.4 712.7 L793.8 720.9 L793.8 793.8Z'

/**
 * The phone layout (picker.css: the halves stack under 768 px). The SAME
 * query decides the shell's portrait encode in CSS and the surface's in JS,
 * so the two always draw the same file — the swap never fetches.
 */
export const PICKER_PHONE_QUERY = '(max-width: 767.98px)'

/** The portrait encode phones draw (the figure box is ≈ 270 CSS px there;
 *  660 px is the hero's phone encode too, so the request is shared). */
export const PICKER_PHONE_PORTRAIT_WIDTH = 660

export interface PickerPortraitSources {
  /** SCREEN grade (`-41`). */
  screen: string
  /** PRINT grade (`-paper`). */
  print: string
}

function encode(src: string, width: number): string {
  return width === PHOTOS.portrait.width ? src : src.replace(/(\.\w+)$/, `-${width}$1`)
}

/** The portrait files the picker draws: the 880 px masters, or the phone encodes. */
export function pickerPortraitSources(phone: boolean): PickerPortraitSources {
  const width = phone ? PICKER_PHONE_PORTRAIT_WIDTH : PHOTOS.portrait.width
  return {
    screen: encode(PHOTOS.portrait.screen, width),
    print: encode(PHOTOS.portrait.print, width),
  }
}
