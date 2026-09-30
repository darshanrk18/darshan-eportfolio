## What and why

<!-- What changes for a visitor, and why. Link the issue if there is one. -->

## Screenshots

<!-- For a visual change: before and after, in BOTH editions, at desktop (1280 px) and phone (375 px) width. Delete this section if nothing visible changed. -->

|         | SCREEN | PRINT |
| ------- | ------ | ----- |
| Desktop |        |       |
| Phone   |        |       |

## Checklist

- [ ] `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` pass
- [ ] `/` first-load JavaScript is at most 178 KB gz, and `/cv` still has no JavaScript of its own (the build prints both)
- [ ] `npm run smoke` passes against a local production build (`npm run build && npm start`)
- [ ] Nothing internal is drawn on the page: no file names, sizes (KB), timings (ms) or command syntax outside the console
- [ ] Every fact comes from `lib/data/`; no phone number and no GPA anywhere
- [ ] Reduced motion still works: no entry motion, no intro, a crossfade for the edition switch
- [ ] Anything new works with the keyboard alone, with a visible focus ring, and its accessible name contains its visible text
- [ ] `CHANGELOG.md` has a line under Unreleased
