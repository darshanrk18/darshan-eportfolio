/**
 * v3 section head for the Skills and Experience sections (V3_SPEC §3
 * "Section headers"): SCREEN = small steel kicker + the big Cinzel title
 * (+ one lede line); PRINT = the "CH. n" ink box + the Bangers title. One
 * DOM: both titles are rendered, the edition CSS hides the other one
 * (display:none also removes it from the accessible name of the h2).
 * RSC, no motion. Styles: styles/v3/section-head.css.
 *
 * C1 owns the site-wide SectionHeader replacement; this local head can be
 * swapped for it once its API lands (hand-off note).
 */

import '@/styles/v3/section-head.css'

export interface SectionHeadProps {
  /** id for the h2, referenced by <section aria-labelledby>. */
  headingId: string
  /** SCREEN eyebrow, e.g. 'Skills'. */
  kicker: string
  /** SCREEN title in title case (CSS uppercases it), e.g. 'Instruments'. */
  title: string
  /** PRINT chapter tag, e.g. 'CH. II'. */
  chapter: string
  /** PRINT title, e.g. 'The Toolkit'. */
  printTitle: string
  /** SCREEN one-line lede under the title. */
  lede?: string
}

export default function SectionHead({
  headingId,
  kicker,
  title,
  chapter,
  printTitle,
  lede,
}: SectionHeadProps) {
  return (
    <header className="ed-head" data-component="SectionHead">
      <p className="ed-head-kicker ed-label ed-screen-only" data-surface="kicker">
        <span aria-hidden="true" className="ed-head-rule" />
        {kicker}
      </p>
      <div className="ed-head-row">
        <p className="ed-head-chapter ed-print-only">{chapter}</p>
        <h2 id={headingId} className="ed-head-title ed-disp" data-surface="title">
          <span className="ed-screen-only">{title}</span>
          <span className="ed-print-only">{printTitle}</span>
        </h2>
      </div>
      {lede ? <p className="ed-head-lede ed-screen-only">{lede}</p> : null}
    </header>
  )
}
