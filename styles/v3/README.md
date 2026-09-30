# styles/v3 — the two editions (SCREEN | PRINT)

Read this before touching a section. It is the CSS side of V3_SPEC §2 and §3;
the TypeScript side is `lib/commands/context.ts` (edition API) and
`lib/edition/prepaint.ts` (the pre-paint script + constants).

## 1. The attribute

`html[data-edition="screen" | "print"]` is the ONE switch. It is written
pre-paint by the inline script (`lib/edition/prepaint.ts` → `app/layout.tsx`),
so the first paint already has the stored edition, and rewritten only by
`applyEdition()` / `switchEdition()` in `lib/commands/context.ts`.

Related html attributes (all written by the same modules, never by hand):

| attribute | who sets it | meaning |
|---|---|---|
| `data-edition` | pre-paint script, `applyEdition()` | edition in force (`screen` is the default and the SSR answer) |
| `data-pick="1"` | pre-paint (nothing stored), `requestEditionPick()` (palette `choose-edition`) | the EditionPicker island (C5) should render; the picker clears it on a choice |
| `data-intro="1"` | pre-paint only | stored PRINT + full motion + `sessionStorage['signal.intro']` absent → the intro host (C6) runs the intro |
| `data-edition-switch="press" \| "projector"` | `switchEdition()` for the life of one view transition | keys `switch.css` |
| `data-motion="reduced" \| "full"` | pre-paint, `setMotionPreference()` | unchanged from v2 |

Storage: `localStorage['signal.edition']` ∈ `screen|print`;
`sessionStorage['signal.intro']='1'` once the intro has run this session.
`data-theme`, `signal.theme`, `data-boot`, `signal.boot` no longer exist.

## 2. Tokens (app/globals.css)

The v2 token API is unchanged in NAME (`--bg-page --bg-panel --bg-raised
--bg-overlay --border-hairline --border-strong --text-primary --text-secondary
--text-tertiary --accent-signal/electron/amber/magenta/error(+ -dim)
--grid-dot(-awake) --selection-bg --glow-* --elev-window`, radii, easings,
durations, `--z-*`). `:root` holds the SCREEN values, `html[data-edition='print']`
the PRINT values, so every v2 component recolours by itself. Meaning per edition:

| token | SCREEN | PRINT |
|---|---|---|
| `--accent-signal` | champagne `#d8c49a` — the ONE live accent / primary | comic red `#d7262d` — pressable / live |
| `--accent-electron` | steel `#c9d2dc` (secondary) | blue `#1e6fd6` |
| `--accent-amber` | prompt `#c9b688` | yellow `#f6c21c` |
| `--accent-magenta` | code keyword steel-blue (never a colour accent) | dark red `#b11e25` |
| `--border-hairline` / `--border-strong` | steel hairlines at .14 / .35 | ink `#17141b` (draw boxes at 2px) |
| `--elev-window` | soft 48px black drop | hard `6px 6px 0` ink |
| `--glow-*` | champagne rings ≤ .25 + 24px blur | flat 2px rings, no blur |
| `--ed-btn` / `--ed-btn-ink` | champagne metal gradient / near-black | comic red / paper |
| `--ed-shadow` | soft glass drop | `4px 4px 0 var(--text-primary)` (the comic shadow) |

v3 SCREEN-only tokens (palette-41): `--ed-field --ed-light --ed-halo --ed-beam
--ed-stage --ed-glass --ed-line-hi --ed-glow --ed-metal --ed-btn-shadow
--ed-champ(2,3) --ed-steel(2,3) --ed-body --ed-bright --ed-link(-hi)
--ed-prompt --ed-string --ed-code-cm --ed-code-kw --ed-term(-dim) --ed-tint`
and the §2.2a glass recipe `--ed-glass-fill --ed-glass-blur
--ed-glass-blur-stage --ed-glass-edge --ed-glass-edge-top --ed-glass-hi
--ed-glass-lo --ed-glass-sheen --ed-glass-shadow`.
v3 PRINT-only tokens (kit-print): `--ed-paper2 --ed-white --ed-ink2 --ed-red2
--ed-yellow2 --ed-blue2`.

Fonts (§2.3), switched by the attribute:

| var | SCREEN | PRINT |
|---|---|---|
| `--font-display` | Cinzel (`--font-cinzel`) | Bangers (`--font-bangers`) |
| `--font-body` | Marcellus (`--font-marcellus`) | Archivo (`--font-archivo`) |
| `--font-slab` | Marcellus | Alfa Slab One (`--font-alfa`) |
| `--font-mono` | IBM Plex Mono (`--font-plexmono`) | same |

Tailwind utilities: `font-sans` = the body face, `font-serif` = the display
face, `font-mono` = Plex. (The v2 `--font-jbmono` compat alias is gone; use
`--font-mono`.)

Z ladder: `--z-boot` is gone; `--z-intro: 80` (intro overlay) and
`--z-picker: 90` (the picker sits above the intro so its PRINT choice can
cross-fade into the first beat).

## 3. One DOM, two skins — the `.ed-*` classes

Sections keep ONE markup. Edition differences are CSS: `styles/v3/screen.css`
is nested entirely under `html[data-edition='screen']`, `print.css` under
`html[data-edition='print']`, and both style the SAME class names:

| class | SCREEN | PRINT |
|---|---|---|
| `.ed-stage` | the big glass block (14px blur, inner glow) | 4px ink frame + 6px hard shadow, paper white |
| `.ed-card` / `.ed-panel` | smoked frosted glass (§2.2a) — `.ed-card` adds 22×24 padding | 2px ink box + `--ed-shadow`, paper white |
| `.ed-chip` | thin tint, edge only (NOT glass) | 2px ink, 3px shadow |
| `.ed-kbd` | glass keycap | ink keycap |
| `.ed-console-area` | darker `rgba(5,6,7,.55)` (NOT glass, code stays readable) | paper white |
| `.ed-bubble` | glass quote card | speech bubble with tail |
| `.ed-btn` | mono uppercase, steel outline | Bangers, 2px ink, hard shadow, presses 2px |
| `.ed-btn-primary` | champagne fill (`--ed-btn`) — the ONE primary per view | comic red |
| `.ed-btn-live` | champagne outline + text | yellow fill |
| `.ed-disp` | Cinzel 500, .06em | Bangers, yellow with ink stroke + red/ink offsets (`.is-red`, `.is-white`) |
| `.ed-metal` | silver→champagne metal, 11 s sheen | flat ink (PRINT stamps its own name) |
| `.ed-label` | 11px mono, .28em, steel — section kickers | 10px mono 600, ink2 |
| `.ed-label-xs` | 10px mono, .24em, steel3 — captions | same as `.ed-label` |
| `.ed-body` / `.ed-mono` | Marcellus 17 / Plex 12.5 steel | Archivo 15 / Plex 12 ink |
| `.ed-live` / `.ed-soft` | champagne / steel | red / blue |
| `.ed-logo`, `.ed-sticker` | mono-white logo (`filter` inverted) in a tinted tile; `.is-active` restores colour | colour logo on a white die-cut sticker (2.5px ink, rounded, hard shadow) |
| `.ed-toggle` | the SCREEN\|PRINT pill (champagne ON) | ink box pill (red ON) |
| `.ed-h`, `.ed-bang`, `.ed-cap`, `.ed-pill`, `.ed-stamp`, `.ed-red/.ed-yellow/.ed-blue/.ed-ink` (fills), `.ed-halftone(-red/-blue)`, `.ed-lines`, `.ed-sunburst`, `.ed-sfx(.is-red/.is-blue)`, `.ed-regmark`, `.ed-cmyk`, `.ed-ink-logo` | inert / hidden | the comic furniture |
| `.ed-light`, `.ed-halo`, `.ed-gate`, `.ed-beam`, `.ed-ember`, `.ed-grain`, `.ed-float(.b/.c)`, `.ed-corner` | the atmosphere (design 41) | hidden |

Keyframes (SCREEN): `ed-sheen ed-floatA ed-floatB ed-floatC ed-breathe ed-ember`.

### data-surface hooks

When a v2 component's markup should pick up the skin without a class
rename, set `data-surface` on the element; both skins target the hook with
the same recipe as the class:

`data-surface="stage" | "card" | "panel" | "chip" | "btn-primary" | "btn-live" | "label" | "kicker" | "title"`

(`kicker` = `.ed-label` — the eyebrow above a section title; `label` =
`.ed-label-xs` — small captions; `title` = `.ed-disp`.)

## 4. Edition-only decorative nodes

Render BOTH editions' decoration on the server; CSS decides. Every such node
is `aria-hidden="true"` with `pointer-events: none` (the recipes set it) and
carries a class that the other edition hides with `display: none`:

```tsx
{/* SCREEN atmosphere — hidden under PRINT by print.css */}
<div aria-hidden="true" className="ed-light" style={{ inset: '-20% 10% auto', height: 480 }} />
{/* PRINT decoration — hidden under SCREEN by screen.css */}
<span aria-hidden="true" className="ed-regmark ed-print-only" style={{ top: 8, left: 8 }} />
```

Generic wrappers: `.ed-screen-only` (hidden in PRINT) and `.ed-print-only`
(hidden in SCREEN). The atmosphere classes (`ed-light/halo/gate/beam/ember/
grain/float`) and the print furniture (`ed-regmark/sunburst/sfx/stamp`) are
hidden cross-edition automatically; texture classes (`ed-halftone*`,
`ed-lines`) are backgrounds that simply do nothing in SCREEN, so a halftone
OVERLAY node also needs `.ed-print-only`. No hydration mismatch is possible:
the server renders both sets.

Section agents append their rules at the bottom of screen.css / print.css
under `/* ---- <section> ---- */`, nested under the file's html selector —
never unscoped, never in globals.css.

## 5. Switching (switch.css)

`switchEdition(next, { originEl, via })` (lib/commands/context.ts):

1. no-op if `next` is already in force;
2. no `document.startViewTransition` → `applyEdition()` instantly;
3. otherwise writes `--switch-x/--switch-y` (originEl's centre, px) on
   `<html>`, sets `data-edition-switch="press"` (→ PRINT) or `"projector"`
   (→ SCREEN), runs `applyEdition` inside the transition, removes the
   attribute on `finished` (also when the transition is skipped).

`switch.css` animates `::view-transition-old(root)` / `::view-transition-new(root)`:
PRESS 700 ms (old dims 120 ms → dot wave from the toggle's corner reveals the
paper → red/blue/yellow ghosts 2px off register for 160 ms → the ink lands),
PROJECTOR 700 ms (colour drains 200 ms → black dots swell → the key light
rises across the name → settle). `html[data-motion='reduced']` → a 200 ms
crossfade. Scroll position is kept (root snapshots). The masks are driven by
the registered properties `--ed-wipe`, `--ed-dot`, `--ed-key` — internal to
switch.css. The EditionToggle island passes itself as `originEl`; the palette
and terminal go through `ctx.setEdition(edition | 'toggle', via)`.

`applyEdition(edition, via)` = attribute + localStorage + store mirror
(`useSignalStore.edition`) + `<meta name="theme-color">` + analytics
`edition_switched { edition, via }`. The picker calls it directly with
`via: 'picker'`; nothing else should.

## 6. JS-side reads

- `getCurrentEdition()` — DOM read, `'screen'` on the server.
- `useSignalStore((s) => s.edition)` — the React mirror (null until the
  EditionToggle island has mounted or a switch happened); use it for
  JS-driven skins (Connect Four disc colours, portrait reveal target, console
  skin). CSS-only skins should key off the attribute instead.
- To react to a switch in an island: `MutationObserver` on
  `document.documentElement` with `attributeFilter: ['data-edition']`
  (see EditionToggle.client.tsx), or subscribe to the store.
