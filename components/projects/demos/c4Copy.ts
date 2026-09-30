/**
 * Connect Four copy per edition (V3_SPEC §3 Work; director call (d)).
 * Pure and node-testable: the disc colour words follow the edition's disc
 * tokens (SCREEN ivory / warm steel, PRINT yellow / red — `--ed-disc-you`
 * and `--ed-disc-engine` in styles/v3/work.css), never a colour a visitor
 * cannot see. Every string is visitor language: no depth, no "α-β", no
 * node counts (clutter law).
 */

import type { Edition } from '@/lib/edition/prepaint'

export type C4Status = 'human' | 'engine' | 'won' | 'lost' | 'draw'

export interface DiscWords {
  you: string
  engine: string
}

export const DISC_WORDS: Record<Edition, DiscWords> = {
  screen: { you: 'ivory', engine: 'steel' },
  print: { you: 'yellow', engine: 'red' },
}

export function discWords(edition: Edition): DiscWords {
  return DISC_WORDS[edition]
}

/** The status word beside the live dot. */
export function statusLabel(status: C4Status): string {
  switch (status) {
    case 'engine':
      return 'Engine is thinking'
    case 'won':
      return 'You win'
    case 'lost':
      return 'Engine wins'
    case 'draw':
      return 'Draw'
    default:
      return 'Your move'
  }
}

/** The narration line for a fresh board (the aria-live game state). */
export function newGameLine(edition: Edition): string {
  return `New game. You're ${discWords(edition).you} — drop a disc to start.`
}

/**
 * The page's one coach mark: "You're ivory. …" — the second sentence follows
 * the turn so it is never wrong (the frames captured the engine's turn).
 */
export function coachLine(edition: Edition, status: C4Status): string {
  const you = discWords(edition).you
  if (status === 'engine') return `You're ${you}. Engine's move, then yours.`
  return `You're ${you}. Click a column, or press its number.`
}

/** PRINT's engine speech balloon: "COLUMN 4." + the beat. */
export function engineBubble(
  column: number,
  outcome: 'blocked' | 'won' | 'draw' | 'played',
): { head: string; beat: string } {
  const head = `Column ${column + 1}.`
  switch (outcome) {
    case 'blocked':
      return { head, beat: 'Blocked!' }
    case 'won':
      return { head, beat: 'Four in a row!' }
    case 'draw':
      return { head, beat: 'Board full.' }
    default:
      return { head, beat: 'Your move.' }
  }
}
