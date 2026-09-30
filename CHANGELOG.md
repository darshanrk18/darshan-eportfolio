# Changelog

Notable changes to the site, newest first. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). A major version is a
new design of the whole site; the numbers in parentheses are pull requests.

## [Unreleased]

### Added

- The site's own address, <https://www.darshankonnur.com>, used everywhere:
  canonical links, share links, the sitemap, robots.txt and structured data.
  Until then every page named the `vercel.app` address as its home. (#4)
- Share details for each page: `/cv`, `/work/*` and `/arcade` have their own
  canonical link, share title and description instead of the homepage's. (#4)
- A `favicon.ico` and an Apple touch icon: the seal on SCREEN black. (#4)
- A new share card, split down the torn seam: SCREEN on the left, PRINT on the
  right, with the name and role readable at phone size. Every page uses it. (#5)
- Repository setup: Dependabot for npm and GitHub Actions, a hardened CI
  workflow with a browser smoke test, a weekly check of every link on the live
  site, issue forms, a pull request template, a security policy, a license
  notice and this changelog.

### Changed

- The 404 page is written in plain words, in both editions. (#4)
- The old project name is gone from the share cards' site name, the console
  banner and the PRINT intro. Stored preferences are kept, so returning
  visitors keep their edition. (#4)
- Ticket-Forge's award has one name everywhere: the Google MLOps Project
  Expo. (#5)
- Trackfolio is described in plain words: "A job-search tracker with
  version-controlled resumes and a record of every application sent." (#5)
- `/cv` shows "source" only where the code is public. (#5)
- The arcade's Snake shows only the snake's length. (#5)
- The homepage description is longer (130 characters) so LinkedIn shows it in
  full; the facts are unchanged. (#6)

### Fixed

- "Copy the citation" and the CV's structured data listed Darshan as the only
  author of the IEEE paper. They now list all six authors in the publisher's
  order, with the proceedings, year, pages and DOI; the CV shows the DOI. (#4)
- `/arcade` named the homepage as its canonical page. (#4)
- In SCREEN, numbers read like letters ("IOO%", "2O25", "CS5O1O") because the
  body face draws its digits that way. The digits 0–9 now come from Tenor Sans,
  a 1.5 KB subset loaded only where a digit is drawn; letters and PRINT are
  unchanged. (#7)

## [3.0.0] - 2026-09-30

Two complete editions of the same story, SCREEN and PRINT, replace the dark
and light themes. (#3)

### Added

- **SCREEN**, a dark, cinematic cut: a black field with a volumetric light, a
  metal-finish name, steel labels and blocks of highly transparent frosted
  glass.
- **PRINT**, an inked four-colour comic: cream paper, ink boxes, halftone
  photographs, stickers, and a skippable intro that prints into the cover.
- A picker on the first visit. It is sent as part of the page, so it appears
  before any JavaScript runs, and a tap made before the page is interactive
  still counts. The choice is remembered and can be changed from the top bar.
- The guide, "8 things to try", which shows one hint at a time.
- A "Next" row in the ⌘K palette that suggests something not yet tried.
- The Studio Seal mark, photographs graded for each edition, and a new studio
  portrait.
- Official logos for every skill, and a map of where each tool was used.

### Changed

- Every earlier feature works in both editions: the palette, the console,
  Connect Four, Snake, the Rock-Paper-Scissors replay, the skills diagram, the
  career graph, the portrait, `/cv`, the `/work` pages and `/arcade`.
- Build details moved out of the page and behind the palette's "Build info".
- Analytics load once the page is idle, WebGL waits for the picker and never
  runs on a software GPU, and phones get a smaller portrait.

### Removed

- The boot sequence, and the file-name tabs, breadcrumb and compile readout in
  the top bar.

### Fixed

- A lazily loaded part of the page that fails to load (a bad connection, or an
  old tab after a deploy) now leaves only that part missing, instead of
  replacing the whole page with the error screen.
- Accessible names contain the visible text (WCAG 2.5.3) for the skill tiles,
  usage rows, the guide chip, the ⌘K hint, the picker and the project rack.
- The arcade no longer shifts while it loads.
- Links to the site's own repository are hidden while it is private; they led
  to GitHub's 404 page.

## [2.0.0] - 2026-09-24

The terminal-styled site, given motion and depth. (#2)

### Added

- A portrait that compiles from characters into a duotone photograph under a
  moving scanline, in About. The console's `whoami --face` shows it too, and
  `/cv` shows a plain photograph.
- Smooth scrolling and section entrances on the home page (`/cv` stays free of
  JavaScript).
- A kinetic serif name in the hero, and a glyph field with depth layers, click
  ripples and glyphs that appear as you type.
- A theme switch drawn as a radial wipe, a redesigned light theme, and
  buttons that lean toward the pointer.
- `deploy --all`, which builds the skills diagram piece by piece, and a
  view-source mode for the whole site.
- Project windows whose traffic-light buttons work, with a full-size view.
- Cross-highlighting between each job in Experience and the skills it used.
- A CRT mode behind the Konami code, a `demo` tour that runs only when asked
  for, and a hidden `/arcade` with Connect Four and Snake.
- A palette narrator that suggests what to look at next in each section, and
  a footer that counts the sections you have seen.

### Changed

- The boot screen became a BIOS-style start-up that prints the measured size
  of each route.
- The first-load JavaScript budget for `/` moved once, from the measured
  166 KB to 178 KB gzipped, itemised for smooth scrolling and the new parts.

### Fixed

- Four accessibility issues from 1.0.0; Lighthouse accessibility is 100.

## [1.0.0] - 2026-09-23

The terminal-styled rebuild: the site rewritten from the ground up on Next.js
15, React 19 and Tailwind CSS 4. (#1)

### Added

- A hero with a WebGL glyph field (and simpler fallbacks where WebGL is slow
  or missing), a skills system diagram with an inspector, projects with live
  demos, and Experience drawn as a commit graph while you scroll.
- Connect Four against a Minimax engine and an A* path-finder, both in a web
  worker.
- A ⌘K command palette; the palette, the console and the navigation share one
  list of actions.
- A short boot screen and an editor-style top bar with file-name tabs.
- A contact console with a small command set.
- `/cv`, a résumé page with no JavaScript of its own, and a case file for each
  project at `/work/<slug>`.
- A footer that reports the measured build.
- CI that runs the typecheck, lint, unit tests and the build with its bundle
  budget on every pull request.

### Changed

- The résumé is the current one, published under a neutral file name.

### Removed

- The first version of the site (October–November 2025), including its
  contact form and the old résumé files.

[Unreleased]: https://github.com/darshanrk18/darshan-eportfolio/compare/v3.0.0...main
[3.0.0]: https://github.com/darshanrk18/darshan-eportfolio/compare/v2.0.0...v3.0.0
[2.0.0]: https://github.com/darshanrk18/darshan-eportfolio/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/darshanrk18/darshan-eportfolio/releases/tag/v1.0.0
