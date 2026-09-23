/**
 * §2.3 section header pattern — identical for every section.
 * Row 0: hairline rule with coordinate ticks. Row 1: `NN / NAME · file`.
 * Row 2: plain-language headline (h2). Optional row 3: one big true number.
 * RSC — no client JS.
 */

const NUM_ACCENT: Record<string, string> = {
  signal: 'text-signal',
  electron: 'text-electron',
  amber: 'text-amber',
  magenta: 'text-magenta',
}

export interface SectionHeaderProps {
  /** '01' … '05' */
  index: string
  /** 'ABOUT' */
  name: string
  /** 'about.md' */
  file: string
  /** id for the h2, referenced by <section aria-labelledby>. */
  headingId: string
  headline: string
  /** Contact renders its headline in the serif display voice. */
  serif?: boolean
  /** Optional third row: one true number (e.g. '300+'). */
  bigNumber?: string
  bigNumberAccent?: 'signal' | 'electron' | 'amber' | 'magenta'
  /** Accessible label for the big number (real value for screen readers). */
  bigNumberLabel?: string
}

export default function SectionHeader({
  index,
  name,
  file,
  headingId,
  headline,
  serif = false,
  bigNumber,
  bigNumberAccent = 'signal',
  bigNumberLabel,
}: SectionHeaderProps) {
  return (
    <div className="mb-12">
      <div className="header-rule mb-6" aria-hidden="true" />
      <p className="type-label-xs text-secondary mb-4">
        {index} / {name} · {file}
      </p>
      <h2 id={headingId} className={serif ? 'type-display-quote' : 'type-h2'}>
        {headline}
      </h2>
      {bigNumber ? (
        <p
          className={`type-display-num mt-6 ${NUM_ACCENT[bigNumberAccent]}`}
          aria-label={bigNumberLabel ?? bigNumber}
        >
          <span aria-hidden="true">{bigNumber}</span>
        </p>
      ) : null}
    </div>
  )
}
