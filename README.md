# Darshan Konnur — portfolio

The personal site of Darshan Konnur, software engineer in Boston. Live at
[darshan-eportfolio.vercel.app](https://darshan-eportfolio.vercel.app).

Version 3 ships the site as **two complete editions** of the same story:

- **SCREEN** — a dark, cinematic cut: a black field with a volumetric light,
  a metal-finish name, steel labels, and blocks of highly transparent frosted
  glass.
- **PRINT** — an inked, four-colour comic: cream paper, ink boxes, halftone
  photographs, stickers and a short intro sequence that "prints" into the
  cover.

A first visit opens with a picker; the choice is remembered on the device and
can be switched from the top bar at any time (a 700 ms "press" / "projector"
transition, a crossfade under reduced motion).

## What is on the page

- A command palette (⌘K) that reaches every section and action, with a
  "Next" row that always suggests the next untried thing.
- A guide — "8 things to try" — that tracks what a visitor has done and shows
  one coach mark at a time.
- A working console with a small command set (`whoami`, `whoami --face`,
  `sudo hire darshan`, `snake --autopilot`, `help`, …).
- Playable Connect Four against a Minimax engine in a web worker, plus Snake
  (A* autopilot) and a camera-driven Rock-Paper-Scissors demo.
- A skills system diagram with official logos, a skill inspector, "Light up
  the toolkit", and a map of where each tool was used.
- A career graph with a "Next" marker, and a "See which skills each job used"
  cross-highlight.
- A portrait that resolves from characters to the photograph.
- `/cv`, a zero-JavaScript résumé page; `/work/<slug>` pages per project; a
  hidden `/arcade`.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # next build + pre-paint guard + bundle budget check
npm run start      # serve the production build
npm run typecheck
npm run lint
npm test           # vitest
```

Node 24 and npm 11 are used in CI (`.github/workflows/ci.yml`), which runs
typecheck, lint, tests and the build on every pull request.

## Budgets the build enforces

- `/` first-load JavaScript ≤ 178 KB gzipped (`scripts/measure-bundle.mjs`
  writes the numbers to `lib/build/manifest.json` and fails the build when
  over).
- `/cv` route-own JavaScript ≤ 0.5 KB gzipped.
- The inline pre-paint script (the one that sets the edition before first
  paint) must survive minification intact (`scripts/check-prepaint.mjs`).

## Where things live

| Path | What |
|---|---|
| `app/` | App Router pages: `/`, `/cv`, `/work/[slug]`, `/arcade`, metadata, OG image |
| `components/` | Sections (`hero`, `about`, `skills`, `projects`, `experience`, `contact`), chrome, palette, guide, edition picker, intro, terminal |
| `lib/data/` | Every visitor-facing fact and string: profile, projects, experience, skills, photos, logos, guide copy |
| `lib/edition/` | The edition attribute, storage keys and the pre-paint script |
| `lib/commands/` | Command registry, command context, section anchors |
| `lib/guide/` | The guide's items, storage and actions |
| `lib/intro/` | The intro timeline and events |
| `styles/v3/` | The two skins (`screen.css`, `print.css`), the switch, and per-section stylesheets; see `styles/v3/README.md` |
| `public/` | Photos (both grades), logos, brand marks, intro plates, résumé PDF |
| `scripts/` | Bundle budget, pre-paint guard, headless QA driver (`scripts/qa`) |
| `tests/` | Vitest suites for data, commands, editions, guide, intro, skills, work, contact |

`ARCHITECTURE.md` explains how the two editions share one DOM and how the
islands talk to each other.

## Content and quality rules

- Every string a visitor sees comes from `lib/data/`; nothing is hard-coded
  in components.
- No build or pipeline internals are drawn at rest (file names, sizes, frame
  rates, hashes, command syntax outside the console). Build evidence lives
  behind the palette's "Build info".
- Every technical skill shows its official logo, never a drawn imitation.
- Reduced motion is honoured everywhere: no entry choreography, no intro, a
  crossfade instead of the edition transition.
