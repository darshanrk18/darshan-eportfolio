/**
 * The console's suggestion rail (S6 "Click one — or type your own", P6
 * "TRY") — visitor-language labels for real terminal commands. The label
 * is what a visitor reads; the command is typed INSIDE the window when
 * pressed (command syntax is allowed there and nowhere else, BRIEF-R2 §1).
 * `screenOnly` rows are hidden by the PRINT skin (the comic strip has room
 * for three). Pure and node-testable: tests/contact.test.ts runs every
 * command through the interpreter.
 */

import type { Edition } from '@/lib/edition/prepaint'

export interface Suggestion {
  id: string
  label: Record<Edition, string>
  /** The real command, typed at the prompt. */
  command: string
  /** Rendered in SCREEN's five-row rail only. */
  screenOnly?: boolean
}

const both = (s: string): Record<Edition, string> => ({ screen: s, print: s })

export const SUGGESTIONS: readonly Suggestion[] = [
  { id: 'who', label: both('Ask who I am'), command: 'whoami --face' },
  {
    id: 'hire',
    label: { screen: 'Try to hire me', print: "Ask if I'm available" },
    command: 'sudo hire darshan',
  },
  { id: 'projects', label: both('Browse my projects'), command: 'ls projects', screenOnly: true },
  { id: 'snake', label: both('Let Snake play itself'), command: 'snake --autopilot' },
  { id: 'help', label: both('See everything it can do'), command: 'help', screenOnly: true },
]

/** The command the console types by itself on scroll-in (both frames). */
export const AUTO_COMMAND = 'whoami --face'
/** sessionStorage flag — the self-typed answer plays once per session. */
export const CONSOLE_SESSION_KEY = 'signal.console'
/** Typing speed of the self-typed command (S6 motion note: ~28 ms/char). */
export const AUTO_TYPE_MS = 28

/** Which suggestion a typed command corresponds to (for the rail's active row). */
export function suggestionFor(command: string): Suggestion | undefined {
  const q = command.trim().toLowerCase()
  return SUGGESTIONS.find((s) => s.command === q)
}
