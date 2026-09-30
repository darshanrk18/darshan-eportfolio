/**
 * The console's `whoami --face` batch, in log order (interpreter contract
 * §2.2): a batch that carries an sr-only sentence is the portrait. Its
 * aria-hidden art rows collapse into ONE `face` entry placed where the first
 * row was; every other line (the echoed prompt before it, the sr-only
 * sentence and the link line after it) keeps its own position. Pure and
 * node-testable — Terminal/index.tsx stamps the ids.
 */

import type { TermLine } from './interpreter'

export interface FaceBatchEntry extends TermLine {
  /** The art rows of a `whoami --face` answer, drawn by FaceBlock. */
  face?: readonly string[]
}

export function groupFaceBatch(lines: readonly TermLine[]): FaceBatchEntry[] {
  if (!lines.some((l) => l.srOnly)) return [...lines]
  const rows = lines.filter((l) => l.ariaHidden).map((l) => l.text)
  const out: FaceBatchEntry[] = []
  let placed = false
  for (const l of lines) {
    if (!l.ariaHidden) {
      out.push(l)
    } else if (!placed) {
      placed = true
      out.push({ text: '', face: rows })
    }
  }
  return out
}
