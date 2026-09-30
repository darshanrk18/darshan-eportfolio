# Security policy

## Reporting a problem

Please report security problems privately, not in an issue or a pull request:
use GitHub's **Report a vulnerability** button on the repository's Security tab
(private vulnerability reporting), or email **konnur.d@northeastern.edu**.

A useful report includes:

- the page or address affected,
- what you found and the steps to reproduce it,
- what someone could do with it, if you know.

## What happens next

- You get a reply within 3 working days saying the report arrived.
- Within 10 working days you hear whether it is confirmed and what will be
  done about it.
- A confirmed problem is fixed and deployed as soon as practical, and you are
  told when the fix is live. With your permission, the fix is credited to you
  in `CHANGELOG.md`.

## Scope

In scope:

- the live site, <https://www.darshankonnur.com>, and every page on it
  (`/`, `/cv`, `/work/*`, `/arcade`),
- the code in this repository, including its GitHub Actions workflows.

Out of scope:

- services the site links to or loads (GitHub, LinkedIn, YouTube, Google
  Analytics, and the hosting platform itself); please report those to their
  owners,
- automated scanner output without a demonstrated impact,
- denial of service, spam and social engineering.

For context: the site is a set of pages with no accounts, no sign-in and no
forms that send or store anything. What a visitor chooses (the edition, the
guide's progress) stays in that browser's own storage. The hand-tracking demo
replays a recording and never opens the camera.

## How dependencies and workflows are kept safe

- **Dependabot alerts** and **Dependabot security updates** are switched on.
  Version updates run weekly for npm and monthly for GitHub Actions
  (`.github/dependabot.yml`).
- Every pull request runs the typecheck, lint, unit tests, the production build
  with its bundle budget, and a browser smoke test (`.github/workflows/ci.yml`).
- Workflow tokens are read-only by default; each action is pinned to a full
  commit SHA.

- **Secret scanning** and **push protection** are on: a push that contains a
  key or token is blocked.
- **Code scanning** runs CodeQL (GitHub's default setup) on the TypeScript and
  the workflows.
- **Dependency review** fails a pull request that adds a dependency with a
  known high-severity vulnerability.
- A **ruleset** protects `main`: no force pushes or deletion, and changes
  arrive through pull requests that pass `verify`.

## Supported versions

Only what is live, built from the `main` branch, is supported. Earlier versions
are not patched.
