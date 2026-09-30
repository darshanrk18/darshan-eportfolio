/**
 * RSC text helpers for the Experience section (see ./marks.ts for the pure
 * splitters, unit-tested).
 *
 * <Figures>: wraps every digit run in `.xp-n` so SCREEN sets it in Cinzel's
 * lining numerals (S5 §3); PRINT leaves the span alone.
 * <Bullet>: a résumé bullet with the job's verified skills wrapped in
 * `<mark data-skill>` (the "See which skills each job used" highlight —
 * inert until the island turns the switch on).
 */

import { figures, markSkills } from './marks'

export function Figures({ text }: { text: string }) {
  return (
    <>
      {figures(text).map((seg, i) =>
        seg.figure ? (
          <span key={i} className="xp-n">
            {seg.text}
          </span>
        ) : (
          seg.text
        )
      )}
    </>
  )
}

export function Bullet({ text, skills }: { text: string; skills: readonly string[] }) {
  return (
    <>
      {markSkills(text, skills).map((seg, i) =>
        seg.skill ? (
          <mark key={i} data-skill={seg.skill}>
            <Figures text={seg.text} />
          </mark>
        ) : (
          <Figures key={i} text={seg.text} />
        )
      )}
    </>
  )
}
