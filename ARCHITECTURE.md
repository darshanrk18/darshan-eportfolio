# Architecture

Next.js 15 (App Router), React 19, Tailwind v4, zustand, motion, vitest.
Version 3 replaced the dark/light theme with two editions — SCREEN and PRINT —
that share one DOM and differ only in CSS, plus the islands that make the page
interactive.

## One DOM, two skins

- `html[data-edition="screen" | "print"]` is the single switch. An inline
  pre-paint script (`lib/edition/prepaint.ts`, injected by `app/layout.tsx`)
  reads `localStorage['signal.edition']` and writes the attribute before the
  first paint, so there is no flash. With nothing stored it also sets
  `data-pick="1"`, which mounts the edition picker on `/`.
- Tokens: `app/globals.css` keeps the v2 token names (`--bg-*`, `--text-*`,
  `--accent-*`, …) and gives them SCREEN values on `:root` and PRINT values
  under `html[data-edition='print']`, so every component recolours by itself.
  v3-only tokens carry the SCREEN light, glass and metal recipes and PRINT's
  paper, ink and comic colours.
- Skins: `styles/v3/screen.css` is nested under `html[data-edition='screen']`,
  `styles/v3/print.css` under `html[data-edition='print']`. Both style the
  same `.ed-*` classes (`.ed-stage`, `.ed-card`, `.ed-panel`, `.ed-btn`,
  `.ed-disp`, `.ed-label`, …) and the `data-surface` hooks. Section
  stylesheets in `styles/v3/` follow the same pattern and are imported by
  their section component.
- Decoration that only one edition shows (SCREEN atmosphere, PRINT halftone
  and registration marks) is always rendered, `aria-hidden`, and hidden by the
  other skin's CSS, so the server render never mismatches.
- Fonts come from `next/font/google`: Cinzel, Marcellus and IBM Plex Mono for
  SCREEN; Bangers, Alfa Slab One, Archivo for PRINT. Only the active edition's
  families are painted.

## Switching

`switchEdition()` in `lib/commands/context.ts` runs a View Transition and
keys `styles/v3/switch.css` through `html[data-edition-switch="press" |
"projector"]`: SCREEN → PRINT is the press (dot wave, colour plates slightly
off register, ink lands), PRINT → SCREEN is the projector (colour drains, dots
swell, a key light rises). Reduced motion or no View Transitions API means a
crossfade or an instant switch. Scroll position is kept.

## Page composition (`app/page.tsx`)

EditionPicker · IntroGate · LenisProvider · Navbar · ReducedMotionBanner ·
main [Hero · About · Skills · Projects · Experience · Contact] · Footer ·
CommandPalette · Guide · BuildInfo · CursorHalo.

Sections are server components that render their finished state; small
client islands hydrate the interactive parts (`data-component` /
`data-island` mark them). Heavy or rarely used surfaces load on demand with
`next/dynamic`: the picker surface, the intro, the guide surface and coach
mark, the Build info panel, the demos, the terminal interpreter.

## How the islands talk

- `lib/state/store.ts` (zustand) mirrors the edition, palette and guide
  state, the active project, focused skills and whether an overlay is open.
- Window events carry cross-island requests: `signal:guide-tried` (a feature
  reports completion), `signal:reveal-portrait`, `signal:blame-on`,
  `signal:terminal-run`, `signal:maximize-project`, `signal:intro-start`,
  `signal:intro-done`, plus the registry's `SIGNAL_EVENTS`. Actions that
  target a lazy island scroll to it first and retry the dispatch until it has
  mounted.
- `lib/commands/registry.ts` is the one list of commands; the palette, the
  terminal and the guide's "Try it" all go through it or through the same
  events, so a feature completes the same way however it was reached.

## The guide

`lib/guide/core.ts` holds the eight items, their storage
(`localStorage['signal.guide']`), the next-untried logic and the coach-mark
bookkeeping (`sessionStorage['signal.coach']`); `lib/guide/guide.ts` adds the
visitor copy per edition; `lib/guide/actions.ts` performs each item.
`components/guide/Guide.client.tsx` portals the chip into the navbar's
`#guide-slot`, listens for completions and schedules at most one coach mark,
placed by `lib/guide/place.ts` so it never covers text or another control.

## The intro (PRINT's boot)

`components/intro/IntroGate.client.tsx` is always mounted and decides when to
import the sequence: a stored PRINT visit with no session flag, the picker's
PRINT choice, or a replay. `lib/intro/timeline.ts` is a pure beat list
(montage → rush → letterform reveal → chrome flood → lockup, under 14 s).
Skip, Escape, wheel and touch fast-forward; the hand-off prints the crimson
page into the cream cover and lands on the hero.

## Data and content

Everything a visitor reads is data in `lib/data/`: `profile`, `projects`,
`experience`, `skills` (with the verified `usedIn` map that drives both the
usage map and the skills-per-job highlight), `photos`, `logos`, `hero`,
`about`, `issue`, `introAssets`, `photoAscii`. Tests assert the content rules
(no placeholders, no internals in visible strings, verified skill claims).

## Build guards

`npm run build` = `next build` → `scripts/check-prepaint.mjs` (the inline
pre-paint script must be present and parseable in the prerendered HTML) →
`scripts/measure-bundle.mjs` (gzipped first-load per route against the
budgets; writes `lib/build/manifest.json`, which only the lazy Build info
panel reads).

## QA tooling

`scripts/qa/cdp.mjs` drives headless Chrome from a JSON plan
(`scripts/qa/plans/*.json`): seed storage, navigate, scroll, click, type,
probe, screenshot, dump visible text and ARIA names. It was used for the
smoke renders and the visible-text sweep of both editions.
