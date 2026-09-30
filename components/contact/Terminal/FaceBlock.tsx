'use client'

/**
 * The console's answer to `whoami --face` (director call (e)), rendered per
 * edition from the interpreter's art rows:
 *   SCREEN  the ASCII rows (lib/data/photoAscii via the interpreter) set in
 *           the frame's 9-step steel ramp, printing row by row, with the
 *           photograph (portrait-41) resolving from the centre of the face
 *           outward through a growing radial mask — hair fringe and
 *           shoulders stay characters (S6 §5).
 *   PRINT   a static halftone bust (portrait-paper through a CSS dot screen,
 *           P6 §5) printed top to bottom; the rows are not drawn.
 * Beside it, the four readout rows (name / role / location / education)
 * from lib/data/profile print one after another. The `<pre>` is aria-hidden;
 * the figure carries the description (the interpreter's sr-only sentence is
 * announced by the log). Never the words "ascii" / "halftone" in visible
 * text. Skin: styles/v3/contact.css (`.ct-face*`, `.ct-info`).
 */

import { photoSrc } from '@/lib/data/photos'
import type { Edition } from '@/lib/edition/prepaint'
import { contactCopy } from '../copy'

/** The 9-step ramp: darkest glyph → brightest (S6 §6 g-1 … g-9). */
const RAMP: Record<string, number> = {
  '.': 1,
  ':': 2,
  '-': 3,
  '=': 4,
  '+': 5,
  '*': 6,
  '#': 7,
  '%': 8,
  '@': 9,
}

export interface RampRun {
  /** 0 = blank run (no tone), 1–9 = the ramp step. */
  step: number
  text: string
}

/** Group a row's characters into runs of one ramp step (pure). */
export function rampRuns(row: string): RampRun[] {
  const runs: RampRun[] = []
  for (const ch of row) {
    const step = RAMP[ch] ?? 0
    const last = runs[runs.length - 1]
    if (last && last.step === step) last.text += ch
    else runs.push({ step, text: ch })
  }
  return runs
}

/** The role line wraps at its em dash (P6 §9 #1) — one data string, two lines. */
export function splitAtDash(value: string): string[] {
  const idx = value.indexOf(' — ')
  if (idx === -1) return [value]
  return [value.slice(0, idx + 2).trimEnd(), value.slice(idx + 3)]
}

export interface FaceBlockProps {
  rows: readonly string[]
  edition: Edition
}

export default function FaceBlock({ rows, edition }: FaceBlockProps) {
  const alt = contactCopy.shared.faceAlt[edition]
  return (
    <div className="ct-answer" data-edition={edition}>
      {edition === 'print' ? (
        <figure className="ct-face-print" role="img" aria-label={alt}>
          <span className="ct-fp-in" aria-hidden="true">
            <span className="ct-fp-src">
              {/* Plain <img>: sized by CSS, graded by the dot screen — not next/image. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoSrc('portrait', 'print')} width={247} height={247} alt="" loading="lazy" decoding="async" />
            </span>
            <span className="ct-fp-scr" />
            <span className="ct-fp-tint" />
            <span className="ct-fp-lift" />
          </span>
        </figure>
      ) : (
        <div className="ct-face" role="img" aria-label={alt}>
          <pre className="ct-face-pre" aria-hidden="true">
            {rows.map((row, i) => (
              <span key={i} className="ct-row" style={{ ['--i' as string]: i }}>
                {rampRuns(row).map((run, j) =>
                  run.step === 0 ? run.text : <b key={j} className={`g${run.step}`}>{run.text}</b>,
                )}
                {'\n'}
              </span>
            ))}
          </pre>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="ct-face-photo"
            src={photoSrc('portrait', 'screen')}
            width={880}
            height={880}
            alt=""
            loading="lazy"
            decoding="async"
            aria-hidden="true"
          />
        </div>
      )}

      <dl className="ct-info">
        {contactCopy.shared.info.map((row, i) => (
          <div key={row.key} className="ct-info-row" style={{ ['--i' as string]: i }}>
            <dt>{row.key}</dt>
            <dd>
              {row.key === 'role'
                ? splitAtDash(row.value).map((part, j) => (
                    <span key={j} className="ct-info-part">
                      {part}
                    </span>
                  ))
                : row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
