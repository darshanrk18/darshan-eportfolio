'use client'

/**
 * v3 S1 / P1 — a hero card or CTA that goes somewhere AND starts a feature
 * there (spec §3 Hero: the Work card opens Ticket-Forge, the Skills card
 * lights up the toolkit, the Play card starts Connect Four). It renders a
 * real anchor (the no-JS path is the plain scroll), and on click:
 *
 *  1. scrolls to the section (Lenis glide when mounted);
 *  2. waits for the target island to be in the DOM (director call m: the
 *     islands are lazy; an event fired before they mount is lost) and then
 *     dispatches the SIGNAL_EVENTS event ONCE — polling every 100 ms for up
 *     to ~1.5 s, never re-dispatching to a listener that already exists.
 *
 * Mirrors the registry commands so the palette and the hero agree:
 * `open-<slug>` = ctx.openProject, `play-connect-four` = openProject +
 * runProject, `deploy-all` = deployAll (SystemDiagram tolerates the event
 * off-screen).
 */

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react'
import { SIGNAL_EVENTS, scrollToAnchor } from '@/lib/commands/context'
import type { ProjectSlug } from '@/lib/data/projects'
import { useSignalStore } from '@/lib/state/store'
import { trackProjectOpened } from '@/lib/utils/analytics'

export type HeroActionKind =
  | { kind: 'open-project'; slug: ProjectSlug }
  | { kind: 'run-project'; slug: ProjectSlug }
  | { kind: 'deploy-all' }
  | { kind: 'scroll' }

export interface HeroActionProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  action: HeroActionKind
  children: ReactNode
}

const RETRY_MS = 100
const RETRY_MAX_MS = 1500

/** Which mounted island proves a listener for the event exists. */
const ISLAND_SELECTOR: Record<Exclude<HeroActionKind['kind'], 'scroll'>, string> = {
  'open-project': '[data-component="ProjectWindow"]',
  'run-project': '[data-component="ProjectWindow"]',
  'deploy-all': '[data-component="SystemDiagram"]',
}

/** Poll for the island, then dispatch exactly once (or give up quietly). */
export function dispatchWhenMounted(selector: string, dispatch: () => void, maxMs = RETRY_MAX_MS): void {
  const started = performance.now()
  const attempt = () => {
    if (document.querySelector(selector)) {
      dispatch()
      return
    }
    if (performance.now() - started < maxMs) window.setTimeout(attempt, RETRY_MS)
  }
  attempt()
}

function perform(action: HeroActionKind): void {
  if (action.kind === 'scroll') return
  const selector = ISLAND_SELECTOR[action.kind]
  if (action.kind === 'deploy-all') {
    dispatchWhenMounted(selector, () => window.dispatchEvent(new CustomEvent(SIGNAL_EVENTS.deployAll)))
    return
  }
  const { slug } = action
  useSignalStore.getState().setActiveProject(slug)
  trackProjectOpened(slug)
  dispatchWhenMounted(selector, () => {
    window.dispatchEvent(new CustomEvent(SIGNAL_EVENTS.openProject, { detail: { slug } }))
    if (action.kind === 'run-project') {
      window.dispatchEvent(new CustomEvent(SIGNAL_EVENTS.runProject, { detail: { slug } }))
    }
  })
}

export default function HeroAction({ href, action, children, onClick, ...rest }: HeroActionProps) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    if (!href.startsWith('#')) return
    e.preventDefault()
    scrollToAnchor(href)
    perform(action)
  }
  return (
    <a href={href} onClick={handleClick} data-component="HeroAction" data-island="client" {...rest}>
      {children}
    </a>
  )
}
