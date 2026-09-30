/**
 * V3_SPEC §2.6 — "Try it": the guide's eight actions (C5). One function,
 * runGuideAction(id, ctx), shared by the guide surface, the coach mark and
 * the palette's Next row — all lazy chunks, so this module (and the
 * registry it reaches into) never rides the first-load bundle.
 *
 * Each action performs the feature through the SAME machinery the palette
 * and terminal use (the registry / CommandCtx / SIGNAL_EVENTS), so the
 * feature's own island fires `signal:guide-tried` when it really runs —
 * nothing here marks an item tried by itself.
 *
 * Director call (m): actions that target LAZY islands scroll first, then
 * wait (≤ ~1.5 s, polling) until the island's element exists before
 * dispatching, so an event never fires into an unmounted listener. The
 * wait resolves early when the element is already there.
 *
 * Events this module dispatches beyond SIGNAL_EVENTS (window CustomEvents).
 * The literals mirror the owning areas' own constants (they never import
 * this lib, and this lib never imports their chunks); tests/guide.test.ts
 * reads those files and asserts the strings still agree:
 *   'signal:reveal-portrait'   — run the About portrait reveal
 *                                (components/about/portrait.ts PORTRAIT_REVEAL_EVENT)
 *   'signal:maximize-project'  — detail { slug } — open a project window
 *                                full size (components/projects/ProjectWindow.tsx)
 *   'signal:blame-on'          — switch "See which skills each job used" on
 *                                (components/experience/events.ts; the
 *                                always-mounted island wrapper queues it)
 *   'signal:terminal-run'      — detail { command } — run a console command
 *                                (components/contact/Terminal/index.tsx)
 */

import {
  SIGNAL_EVENTS,
  scrollToAnchor,
  type CommandCtx,
} from '@/lib/commands/context'
import { useSignalStore } from '@/lib/state/store'
import { trackEvent } from '@/lib/utils/analytics'
import { GUIDE_SECTION, type GuideId } from './core'

export const PORTRAIT_REVEAL_EVENT = 'signal:reveal-portrait'
export const MAXIMIZE_PROJECT_EVENT = 'signal:maximize-project'
export const BLAME_ON_EVENT = 'signal:blame-on'
export const TERMINAL_RUN_EVENT = 'signal:terminal-run'
/** The console command the guide asks for (runs inside the terminal window). */
export const CONSOLE_COMMAND = 'whoami --face'

/** How long an action waits for a lazy island to mount before giving up. */
export const ISLAND_WAIT_MS = 1500
const ISLAND_POLL_MS = 100

/**
 * The element whose presence means the island has mounted, per action.
 */
export const ISLAND_SELECTOR: Partial<Record<GuideId, string>> = {
  'reveal-portrait': '#about [data-component="Portrait"]',
  'light-toolkit': '#skills [data-component="SystemDiagram"]',
  'play-c4': '#projects [data-component="ProjectWindow"]',
  'open-project': '#projects [data-component="ProjectWindow"]',
  'skills-per-job': '#experience [data-component="SkillsPerJob"]',
  'ask-console': '#contact [data-component="Terminal"] input',
}

/**
 * Where the coach mark sits (components/guide/GuideCoach.client.tsx): the
 * CONTROL each item names, most specific first — the first visible match
 * wins. A section may mark its control with `data-guide-anchor="<id>"`
 * (the toolkit button and the skills-per-job switch do; findCoachAnchor
 * looks for that first); these are the fallbacks into the other areas'
 * markup, checked against their source in tests/guide.test.ts. The two
 * chrome items never get a mark.
 */
export const COACH_ANCHORS: Record<GuideId, readonly string[]> = {
  'go-anywhere': [],
  'other-edition': [],
  /* SCREEN: the replay control under the portrait; PRINT: the panel itself is the control. */
  'reveal-portrait': ['#about .pf-replay', '#about [data-component="Portrait"]'],
  'light-toolkit': ['#skills [data-component="SystemDiagram"]'],
  /* the board when Connect Four is open, else the window's tabs */
  'play-c4': ['#projects .c4-board', '#projects [data-component="ProjectWindow"] [role="tablist"]'],
  /* the Maximize control, else the window */
  'open-project': ['#projects .pw-btn-max', '#projects [data-component="ProjectWindow"]'],
  'skills-per-job': ['#experience [data-component="SkillsPerJob"]'],
  'ask-console': ['#contact [data-component="Terminal"] input'],
}

function isVisible(el: Element): boolean {
  const r = el.getBoundingClientRect()
  return r.width > 0 && r.height > 0
}

/**
 * The element the coach mark for `id` should sit beside right now: the
 * section's own `[data-guide-anchor="<id>"]` when visible, else the first
 * visible COACH_ANCHORS fallback, else null (the caller waits or gives up).
 */
export function findCoachAnchor(id: GuideId): HTMLElement | null {
  if (typeof document === 'undefined') return null
  const section = GUIDE_SECTION[id]
  const scope: ParentNode = (section && document.getElementById(section.slice(1))) || document
  const own = scope.querySelector<HTMLElement>(`[data-guide-anchor="${id}"]`)
  if (own && isVisible(own)) return own
  for (const selector of COACH_ANCHORS[id]) {
    const el = document.querySelector<HTMLElement>(selector)
    if (el && isVisible(el)) return el
  }
  return null
}

/**
 * Resolve with the first element matching `selector`, polling every 100 ms
 * up to `timeoutMs`; null when it never appears (the caller dispatches
 * anyway — a mounted-later island simply misses one event).
 */
export function waitForIsland(
  selector: string,
  timeoutMs: number = ISLAND_WAIT_MS
): Promise<Element | null> {
  if (typeof document === 'undefined') return Promise.resolve(null)
  const now = document.querySelector(selector)
  if (now) return Promise.resolve(now)
  return new Promise((resolve) => {
    const started = Date.now()
    const tick = () => {
      const el = document.querySelector(selector)
      if (el) return resolve(el)
      if (Date.now() - started >= timeoutMs) return resolve(null)
      window.setTimeout(tick, ISLAND_POLL_MS)
    }
    window.setTimeout(tick, ISLAND_POLL_MS)
  })
}

function dispatch(name: string, detail?: unknown): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(detail === undefined ? new CustomEvent(name) : new CustomEvent(name, { detail }))
}

async function scrollAndWait(id: GuideId, anchor: string): Promise<Element | null> {
  scrollToAnchor(anchor)
  const selector = ISLAND_SELECTOR[id]
  return selector ? waitForIsland(selector) : null
}

/** Perform the guide item's action; resolves when the action has been handed off. */
export async function runGuideAction(id: GuideId, ctx: CommandCtx): Promise<void> {
  trackEvent('guide_try', { id })
  const store = useSignalStore.getState()
  switch (id) {
    case 'go-anywhere':
      store.setPaletteOpen(true)
      return
    case 'other-edition':
      await ctx.setEdition('toggle', 'palette')
      return
    case 'reveal-portrait':
      await scrollAndWait(id, '#about')
      dispatch(PORTRAIT_REVEAL_EVENT)
      return
    case 'light-toolkit':
      await scrollAndWait(id, '#skills')
      dispatch(SIGNAL_EVENTS.deployAll)
      return
    case 'play-c4':
      ctx.openProject('triplay-ai')
      await waitForIsland(ISLAND_SELECTOR['play-c4'] as string)
      dispatch(SIGNAL_EVENTS.runProject, { slug: 'triplay-ai' })
      return
    case 'open-project': {
      // The window's own maximize (keeps its slot height, tracks, and
      // reports the completion); the store write is the fallback when no
      // window has mounted to hear it.
      const slug = useSignalStore.getState().activeProject
      ctx.openProject(slug)
      const island = await waitForIsland(ISLAND_SELECTOR['open-project'] as string)
      if (island) dispatch(MAXIMIZE_PROJECT_EVENT, { slug })
      else useSignalStore.getState().setMaximizedProject(slug)
      return
    }
    case 'skills-per-job':
      await scrollAndWait(id, '#experience')
      dispatch(BLAME_ON_EVENT)
      return
    case 'ask-console':
      await scrollAndWait(id, '#contact')
      dispatch(TERMINAL_RUN_EVENT, { command: CONSOLE_COMMAND })
      return
    default:
  }
}
