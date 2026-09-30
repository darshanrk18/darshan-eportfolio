/**
 * Pre-paint resolution of the edition / motion / intro attributes
 * (V3_SPEC §2.1) — the ONE definition of the inline <script> that
 * app/layout.tsx renders as the first element in <body>, before anything
 * paints. Exported as a string (PREPAINT_SCRIPT) so tests/edition.test.ts
 * can evaluate it against a fake document, and mirrored by
 * resolvePrepaint(), the same decision as a pure function that the test
 * checks the script against (parity over every input combination).
 *
 * What the script writes on <html>:
 *  - data-edition: localStorage['signal.edition'] when it is 'screen' or
 *    'print'; otherwise 'screen' AND data-pick="1" (picker eligible — the
 *    EditionPicker island renders only when it sees that attribute).
 *  - data-motion:  'reduced' | 'full' — localStorage['signal.motion'] wins,
 *    else the system preference (unchanged from v2).
 *  - data-intro:   "1" ONLY when the STORED edition is print AND motion is
 *    not reduced AND sessionStorage['signal.intro'] is absent. A first-visit
 *    PRINT choice starts the intro from the picker itself, never from here.
 * And first in <head>: a `<meta name="theme-color">` of its own (the "lead"
 * meta — the first theme-color in tree order is the one a browser tints its
 * bar with). For a stored PRINT visit it carries PRINT's paper, on every
 * route (/cv, /work/*, /arcade and the 404 mount no EditionToggle to correct
 * the server's metas). Otherwise it has no content — not a theme colour at
 * all — and the server's SCREEN metas apply. syncEditionMeta() rewrites every
 * theme-color meta on a switch, the lead included, and React never owns the
 * lead, so it keeps the edition through the client-side navigations that
 * re-render the server's metas SCREEN-dark. Two rules keep React off it: the
 * server's metas are never rewritten here (React 19 hydrates a <meta> by its
 * content — a rewritten one gets a second, dark copy appended), and the
 * lead's content never equals theirs while the page hydrates (else React
 * adopts the lead as one of its own and later moves or drops it).
 * When storage throws (blocked / private mode) everything falls back to
 * screen + picker + full motion + no intro. It never writes data-theme or
 * data-boot (both retired in v3). Budget: ≤ ~580 bytes.
 *
 * This module is imported by the RSC layout: keep it dependency-free (no
 * DOM, no store, no 'use client' imports). lib/commands/context.ts
 * re-exports the constants for client code — import from there.
 */

/** The two editions (V3_SPEC §0). */
export type Edition = 'screen' | 'print'

/** Where a switch came from — the `via` of the `edition_switched` event. */
export type EditionVia = 'picker' | 'toggle' | 'palette' | 'terminal'

/** localStorage key holding the remembered edition ('screen' | 'print'). */
export const EDITION_STORAGE_KEY = 'signal.edition'
/** sessionStorage key ('1') — the PRINT intro already ran this session. */
export const INTRO_SESSION_KEY = 'signal.intro'
/** html attribute carrying the edition in force ('screen' | 'print'). */
export const EDITION_ATTR = 'data-edition'
/** html attribute ('1') — the edition picker should show. */
export const PICK_ATTR = 'data-pick'
/** html attribute ('1') — the PRINT intro should run on this page load. */
export const INTRO_ATTR = 'data-intro'

/**
 * v3 §2.2 — `<meta name="theme-color">` per edition (the page colour, so a
 * phone's browser bar matches the page). The server's metas (app/layout.tsx
 * viewport) are SCREEN's; the pre-paint script's lead meta carries PRINT's
 * for a stored PRINT visit, and syncEditionMeta() (lib/commands/context.ts)
 * follows every switch.
 */
export const EDITION_THEME_COLOR: Record<Edition, string> = {
  screen: '#050607',
  print: '#f3e8cf',
}

/* localStorage['signal.motion'] is owned by lib/motion/useReducedMotion
   (a 'use client' module this RSC-safe file must not import); the literal
   is asserted against MOTION_STORAGE_KEY in tests/edition.test.ts. */
const MOTION_KEY = 'signal.motion'

/**
 * The inline pre-paint script. Built from the constants above so the
 * script and the TypeScript side can never disagree on a key or attribute.
 *
 * Assembled at RUNTIME from a plain string with @placeholders@ (never a
 * concatenation of template literals): the production minifier folded the
 * earlier `tpl + tpl` form into a broken inline script (every piece after
 * an interpolation was dropped), so a deployed page never set the edition
 * attribute — no picker, no editions, no intro. `scripts/check-prepaint.mjs`
 * runs after `next build` and fails the build if the prerendered HTML does
 * not carry this exact, parseable script.
 */
const PREPAINT_TEMPLATE =
  "(function(){var d=document.documentElement,a=function(n,v){d.setAttribute(n,v)},e,r,s;" +
  "try{e=localStorage.getItem('@EDITION@');" +
  "var m=localStorage.getItem('@MOTION@');" +
  "r=m?m=='reduced':matchMedia('(prefers-reduced-motion:reduce)').matches;" +
  "s=!sessionStorage.getItem('@INTRO_SESSION@')}catch(x){}" +
  "if(e!='screen'&&e!='print'){e='screen';a('@PICK_ATTR@','1')}" +
  "a('@EDITION_ATTR@',e);" +
  "a('data-motion',r?'reduced':'full');" +
  "if(s&&e=='print'&&!r)a('@INTRO_ATTR@','1');" +
  "var t=document.createElement('meta');t.name='theme-color';" +
  "if(e=='print')t.content='@PRINT_THEME@';document.head.prepend(t)})();"

export const PREPAINT_SCRIPT = PREPAINT_TEMPLATE.replace('@EDITION@', EDITION_STORAGE_KEY)
  .replace('@MOTION@', MOTION_KEY)
  .replace('@INTRO_SESSION@', INTRO_SESSION_KEY)
  .replace('@PICK_ATTR@', PICK_ATTR)
  .replace('@EDITION_ATTR@', EDITION_ATTR)
  .replace('@INTRO_ATTR@', INTRO_ATTR)
  .replace('@PRINT_THEME@', EDITION_THEME_COLOR.print)

export interface PrepaintInput {
  /** localStorage['signal.edition'] (null when absent). */
  storedEdition: string | null
  /** localStorage['signal.motion'] (null when absent). */
  storedMotion: string | null
  /** matchMedia('(prefers-reduced-motion: reduce)').matches */
  systemReduced: boolean
  /** sessionStorage['signal.intro'] present. */
  introSeen: boolean
}

export interface PrepaintResult {
  edition: Edition
  /** data-pick="1" — nothing valid was stored, show the picker. */
  pick: boolean
  motion: 'reduced' | 'full'
  /** data-intro="1" — stored PRINT + full motion + intro not yet seen. */
  intro: boolean
  /**
   * The content of the lead theme-color meta the script prepends to <head>
   * on every load: PRINT's paper for a stored PRINT visit, else null (the
   * meta has no content until a switch gives it one).
   */
  themeColor: string | null
}

/** The pre-paint decision as a pure function (parity-tested against the script). */
export function resolvePrepaint(input: PrepaintInput): PrepaintResult {
  const stored = input.storedEdition === 'screen' || input.storedEdition === 'print'
  const edition: Edition = stored ? (input.storedEdition as Edition) : 'screen'
  const reduced = input.storedMotion ? input.storedMotion === 'reduced' : input.systemReduced
  return {
    edition,
    pick: !stored,
    motion: reduced ? 'reduced' : 'full',
    intro: stored && edition === 'print' && !reduced && !input.introSeen,
    themeColor: edition === 'print' ? EDITION_THEME_COLOR.print : null,
  }
}
