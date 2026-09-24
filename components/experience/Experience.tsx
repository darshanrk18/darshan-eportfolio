/**
 * §4.7 Experience — `git log --graph`. RSC shell: semantic commit entries with
 * native <details>/<summary> diff panels, node markers on the DAG gutter, the
 * amber 300+ big number, and the quiet-zone EducationCard 96px below.
 * CareerDag (client island) draws the scroll-linked SVG rail + year rail over
 * the gutter; a static hairline is the no-JS fallback.
 *
 * v2 §9.1: bullet rows carry data-blame + data-skills (verified map in
 * ./blame) and a CSS-revealed `jump to diagram ↑` chip; the lazy GitBlame
 * island (reserved 24px row above the DAG) wires hover/focus →
 * store.focusedSkills. v2 §9.2: the aws-future HEAD marker's dashed ring is
 * an SVG circle so its outline can march while the section is in view
 * (styles/v2/experience.css).
 */

import SectionHeader from '@/components/chrome/SectionHeader'
import { commits, type CommitEntry } from '@/lib/data/experience'
import BigNumber from './BigNumber.client'
import { commitBlame } from './blame'
import CareerDag from './CareerDagIsland'
import EducationCard from './EducationCard'
import GitBlameIsland from './GitBlameIsland'

/**
 * Gutter geometry (must stay in sync with CareerDag lane detection, which
 * measures these markers): entries are padded pl-10 (40px) / lg:pl-28 (112px);
 * the `main` lane runs at x=12px (mobile) / 64px (desktop), the `feat/ms-cs`
 * branch lane at x=24px / 84px.
 */
function markerClass(c: CommitEntry): string {
  if (c.kind === 'tag') {
    // 16px amber ring with the sanctioned amber glow (IEEE tag node).
    return 'absolute left-[-36px] top-[2px] h-4 w-4 rounded-full border border-amber bg-page glow-amber lg:left-[-56px]'
  }
  // 'future' is rendered inline as an SVG dashed ring (§9.2 dash march).
  const lane =
    c.lane === 'main'
      ? 'left-[-32px] lg:left-[-52px] bg-signal'
      : 'left-[-20px] lg:left-[-32px] bg-electron'
  return `absolute top-1.5 h-2 w-2 rounded-full ${lane}`
}

function EntryHeader({ c }: { c: CommitEntry }) {
  return (
    <>
      <p className="type-code">
        <span className="text-secondary">{c.hash}</span>{' '}
        <span className="text-primary">{c.message}</span>
        {c.kind === 'future' ? (
          <span className="type-label-sm text-signal rounded-chip bg-raised ml-2 border border-dashed border-signal px-1.5 py-0.5 align-middle whitespace-nowrap">
            HEAD → future
          </span>
        ) : null}
        {c.award ? (
          // Award tag — kin to the IEEE tag's amber, distinct from the branch chip.
          <span className="type-label-sm text-amber rounded-chip bg-raised ml-2 border border-amber px-1.5 py-0.5 align-middle whitespace-nowrap">
            {c.award}
          </span>
        ) : null}
        {c.kind === 'branch' ? (
          <span className="type-label-sm text-electron rounded-chip border-hairline bg-raised ml-2 border px-1.5 py-0.5 align-middle whitespace-nowrap">
            {c.lane}
          </span>
        ) : null}
        {c.kind === 'tag' && c.paperUrl ? (
          <a
            href={c.paperUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="type-label-sm text-signal ml-2 whitespace-nowrap hover:underline"
          >
            [ read paper ↗ ]
          </a>
        ) : null}
      </p>
      <p className="type-code text-secondary mt-1">{c.meta}</p>
    </>
  )
}

function DiffPanel({
  bullets,
  outcome,
  blame,
}: {
  bullets: readonly string[]
  outcome?: string
  /** §9.1 — skill node ids per bullet (parallel array from ./blame). */
  blame?: readonly (readonly string[])[]
}) {
  return (
    <div className="hairline bg-panel mt-3 px-4 py-3">
      <ul className="space-y-1">
        {bullets.map((b, i) => {
          const skills = blame?.[i] ?? []
          const blamable = skills.length > 0
          return (
            <li
              key={b}
              data-blame={blamable ? '1' : undefined}
              data-skills={blamable ? skills.join(',') : undefined}
              className="type-code relative grid grid-cols-[1.25rem_1fr]"
            >
              <span aria-hidden="true" className="text-signal select-none">
                +
              </span>
              <span className="text-signal">{b}</span>
              {blamable ? (
                // §9.1 jump affordance — hidden until blame is on AND the row
                // is hovered/focused (styles/v2/experience.css); the click is
                // delegated in GitBlame.client → Lenis scrollToAnchor('#skills').
                <button type="button" data-blame-jump className="blame-jump type-label-xs">
                  jump to diagram ↑
                </button>
              ) : null}
            </li>
          )
        })}
      </ul>
      {outcome ? (
        // Allowed closing line (AWS: the offer outcome) — set apart from the
        // `+` diff lines with a merge-arrow gutter in amber.
        <p className="type-code border-hairline mt-2 grid grid-cols-[1.25rem_1fr] border-t pt-2">
          <span aria-hidden="true" className="text-amber select-none">
            →
          </span>
          <span className="text-primary">{outcome}</span>
        </p>
      ) : null}
    </div>
  )
}

export default function Experience() {
  return (
    <section
      id="experience"
      aria-labelledby="experience-heading"
      className="section-pad"
      data-component="Experience"
      data-island="RSC"
      style={{ ['--vs-i' as string]: 4 }}
    >
      <div className="container-site">
        <SectionHeader
          index="04"
          name="EXPERIENCE"
          file="experience.log"
          headingId="experience-heading"
          headline="The record, as a commit graph."
        />

        {/* §9.1 — reserved 24px row for the git-blame toggle (zero CLS when
            the lazy island mounts; empty under reduced motion / no-JS). */}
        <div className="mb-4 max-w-2xl pl-10 lg:pl-28">
          <GitBlameIsland />
        </div>

        <div className="relative" data-dag-root>
          {/* No-JS / pre-hydration fallback: static main-lane hairline. */}
          <div
            aria-hidden="true"
            className="border-hairline absolute top-2 bottom-6 left-3 border-l lg:left-16"
          />
          <CareerDag />

          <ol className="relative max-w-2xl space-y-12 pl-10 lg:space-y-16 lg:pl-28">
            {commits.map((c) => (
              <li key={c.id} className="relative">
                {c.kind === 'future' ? (
                  // Incoming/HEAD marker (§9.2): dashed signal ring as an SVG
                  // stroke so its outline can march (stroke-dashoffset, 3s
                  // linear, [data-march]-gated in styles/v2/experience.css).
                  // Same 16px box + data attrs as before — CareerDag measures
                  // the wrapper, so DAG geometry is unchanged. No-JS/reduced:
                  // a static dashed ring, exactly the v1 look.
                  <span
                    aria-hidden="true"
                    data-dag-node
                    data-dag-id={c.id}
                    data-dag-lane={c.lane}
                    className="bg-page absolute top-[2px] left-[-36px] h-4 w-4 rounded-full lg:left-[-56px]"
                  >
                    <svg
                      className="head-marker-ring absolute inset-0 h-full w-full"
                      viewBox="0 0 16 16"
                      fill="none"
                      focusable="false"
                      aria-hidden="true"
                    >
                      <circle
                        cx="8"
                        cy="8"
                        r="7.5"
                        stroke="var(--accent-signal)"
                        strokeWidth="1"
                        pathLength={48}
                        strokeDasharray="3 3"
                      />
                    </svg>
                  </span>
                ) : (
                  <span
                    aria-hidden="true"
                    data-dag-node
                    data-dag-id={c.id}
                    data-dag-lane={c.lane}
                    className={markerClass(c)}
                  />
                )}

                {c.bullets.length > 0 ? (
                  <details className="group">
                    <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                      <span
                        aria-hidden="true"
                        className="text-secondary float-right ml-3 inline-block [transition:transform_180ms_var(--ease-swift)] group-open:rotate-90"
                      >
                        ▸
                      </span>
                      <EntryHeader c={c} />
                    </summary>
                    <DiffPanel
                      bullets={c.bullets}
                      outcome={c.outcome}
                      blame={commitBlame[c.id]?.bulletSkills}
                    />
                  </details>
                ) : (
                  <EntryHeader c={c} />
                )}

                {c.bigNumber ? (
                  <div className="mt-6 lg:absolute lg:top-0 lg:left-full lg:mt-0 lg:ml-16 lg:w-max">
                    <BigNumber
                      value={c.bigNumber.value}
                      accent={c.bigNumber.accent}
                      label={`${c.bigNumber.value} students`}
                    />
                    <p className="type-label-xs text-secondary mt-2">students</p>
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        </div>

        {/* The quiet zone: 96px gap on desktop (§4.7 pacing rule). */}
        <div className="mt-16 lg:mt-24">
          <EducationCard />
        </div>
      </div>
    </section>
  )
}
