/**
 * v3 Experience — S5 "CREDITS" / P5 "CH. IV THE FIELD YEARS". RSC shell,
 * ONE DOM, two skins (styles/v3/experience.css):
 *
 * - the career graph, newest first: the NEXT marker (SCREEN: dashed
 *   champagne ring + "SDE @ Amazon Web Services · Jan 2027"; PRINT: the
 *   blue-pencil NEXT ISSUE box), the three jobs (SCREEN: node, heading,
 *   dates · place, role, bullets, outcome, the SURGE Award chip; PRINT: the
 *   inked panels with a halftone photo plate, narration caption, OUTCOME
 *   box, the SURGE burst), the IEEE publication (SCREEN: forked onto its
 *   own lane; PRINT: the IEEE box) with "Read the paper" and "Copy the
 *   citation";
 * - the aside: the desk photograph (SCREEN), Education, and the
 *   "See which skills each job used" panel (SkillsPerJob island).
 *
 * Content law: every string comes from lib/data (experience, profile,
 * photos) or ./copy (chrome copy). Clutter law: no hashes, commit messages,
 * lanes or year rail are rendered (they stay in data for the terminal / cv);
 * the neu-branch entry is never drawn (showBranch). Bullets carry
 * [data-skills] (./blame) and <mark data-skill> (./marks) for the highlight.
 */

import '@/styles/v3/experience.css'
import SectionHead from '@/components/skills/SectionHead'
import { cityOf, commits, nextMarker, showBranch, type CommitEntry } from '@/lib/data/experience'
import { PHOTOS } from '@/lib/data/photos'
import { commitBlame, isBlameJobId } from './blame'
import CareerDraw from './CareerDagIsland'
import { buildCitation } from './citation'
import CopyCitation from './CopyCitation.client'
import { PRINT_PLATES, XP_COPY } from './copy'
import EducationCard from './EducationCard'
import SkillsPerJob from './SkillsPerJobIsland'
import { Bullet, Figures } from './Text'

/** The slant of each PRINT panel's rail-side edge (P5 §5 "Panel geometry"). */
const PANEL_SLANT: Record<string, { a: number; b: number }> = {
  'aws-intern': { a: 12, b: 0 },
  'neu-ta': { a: 0, b: 9 },
  schneider: { a: 11, b: 0 },
}

function JobBullets({
  bullets,
  skills,
  className,
}: {
  bullets: readonly string[]
  skills: readonly (readonly string[])[]
  className?: string
}) {
  return (
    <ul className={className ? `xp-bullets ${className}` : 'xp-bullets'}>
      {bullets.map((b, i) => {
        const ids = skills[i] ?? []
        return (
          <li key={b} data-skills={ids.length > 0 ? ids.join(',') : undefined}>
            <Bullet text={b} skills={ids} />
          </li>
        )
      })}
    </ul>
  )
}

function Plate({ id }: { id: keyof typeof PRINT_PLATES }) {
  const plate = PRINT_PLATES[id]
  const photo = PHOTOS[plate.photo]
  return (
    <figure className="xp-plate ed-print-only" data-photo={plate.photo}>
      <div className="xp-ht">
        {/* Plain <img>: the PRINT paper grade, sized by the plate; lazy so SCREEN never fetches it. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.print}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          loading="lazy"
          decoding="async"
        />
        <span aria-hidden="true" className="xp-scr" />
      </div>
      <span aria-hidden="true" className="xp-tint" data-tint={plate.tint} />
      <figcaption className="xp-cap">{plate.caption}</figcaption>
    </figure>
  )
}

function Job({ c, index, last }: { c: CommitEntry; index: number; last: boolean }) {
  const blame = isBlameJobId(c.id) ? commitBlame[c.id] : undefined
  const skills = blame?.bulletSkills ?? []
  const slant = PANEL_SLANT[c.id] ?? { a: 0, b: 0 }
  const printOutcome = c.printOutcome ?? c.outcome?.replace(/\.$/, '')
  return (
    <li
      className="xp-job"
      data-job={c.id}
      data-node={`n${index + 1}`}
      data-last={last ? 'true' : undefined}
      style={{
        ['--k' as string]: index + 1,
        ['--a' as string]: `${slant.a}px`,
        ['--b' as string]: `${slant.b}px`,
      }}
    >
      <span aria-hidden="true" className="xp-node" />
      {last ? (
        <>
          {/* SCREEN: the IEEE branch forks off this node onto its own lane. */}
          <svg
            className="xp-fork ed-screen-only"
            width="22"
            height="28"
            viewBox="0 0 22 28"
            aria-hidden="true"
            focusable="false"
            fill="none"
          >
            <path d="M20.5 0C20.5 15 0.5 11 0.5 28" stroke="#454c56" strokeWidth="1" />
          </svg>
          <span aria-hidden="true" className="xp-fork-lane ed-screen-only" />
        </>
      ) : null}
      {/* PRINT: the letterer's caption — place and time, once (the PRINT date line; SCREEN's is .xp-dt). */}
      <span className="xp-narr ed-print-only">
        {cityOf(c.location)} · {c.periodShort}
      </span>
      {/* PRINT: the red leader from the chosen panel into the sheet. */}
      <span aria-hidden="true" className="xp-leader ed-print-only" />
      {/* PRINT: the award burst on the panel's corner — outside the clipped face. */}
      {c.award ? (
        <span className="xp-burst ed-print-only" role="img" aria-label={c.award}>
          <span aria-hidden="true" className="xp-burst-text">
            {c.award.split(' ').map((w, i) => (
              <span key={i}>{w}</span>
            ))}
          </span>
        </span>
      ) : null}
      <div className="xp-face">
        {isBlameJobId(c.id) ? <Plate id={c.id} /> : null}
        <div className="xp-text">
          <div className="xp-hd">
            <h3 className="xp-org">
              <span className="ed-screen-only">{c.company}</span>
              <span className="ed-print-only">{c.printCompany ?? c.company}</span>
            </h3>
            {/* SCREEN: the award as an inline chip beside the employer. */}
            {c.award ? (
              <span className="xp-award ed-screen-only">
                <span aria-hidden="true" className="xp-award-dm" />
                {c.award}
              </span>
            ) : null}
            <span className="xp-dt ed-screen-only">
              <Figures text={`${c.periodShort} · ${c.location}`} />
            </span>
          </div>
          <p className="xp-role">
            <span className="ed-screen-only">
              <Figures text={c.role} />
            </span>
            <span className="ed-print-only">
              {(c.printRoleLines ?? [c.role]).map((line, i) => (
                <span key={i} className="xp-role-line">
                  {line}
                </span>
              ))}
            </span>
          </p>
          {c.printBullets ? (
            <>
              <JobBullets bullets={c.bullets} skills={skills} className="ed-screen-only" />
              <JobBullets bullets={c.printBullets} skills={skills} className="ed-print-only" />
            </>
          ) : (
            <JobBullets bullets={c.bullets} skills={skills} />
          )}
          {c.outcome ? (
            <p className="xp-out ed-screen-only">
              <Figures text={c.outcome} />
            </p>
          ) : null}
          {printOutcome ? (
            <p className="xp-outcome ed-print-only">
              <span className="xp-outcome-tag">{XP_COPY.outcomeTag}</span>
              <span aria-hidden="true" className="xp-outcome-bar" />
              <span className="xp-outcome-text">{printOutcome}</span>
            </p>
          ) : null}
        </div>
      </div>
    </li>
  )
}

export default function Experience() {
  const jobs = commits.filter(
    (c) => c.kind === 'commit' || (c.kind === 'branch' && showBranch.screen)
  )
  const ieee = commits.find((c) => c.kind === 'tag')
  const citation = buildCitation()

  return (
    <section
      id="experience"
      aria-labelledby="experience-heading"
      className="section-pad xp-root"
      data-component="Experience"
      data-island="RSC"
      style={{ ['--vs-i' as string]: 4 }}
    >
      {/* SCREEN atmosphere (S5 §6) — hidden under PRINT by print.css. */}
      <div aria-hidden="true" className="ed-light xp-atmo-light" />
      <div aria-hidden="true" className="ed-grain xp-atmo-grain" />
      {/* PRINT registration targets — hidden under SCREEN by screen.css. */}
      <span aria-hidden="true" className="ed-regmark xp-regmark is-top" />
      <span aria-hidden="true" className="ed-regmark xp-regmark is-left" />
      <span aria-hidden="true" className="ed-regmark xp-regmark is-right" />

      <div className="container-site xp-inner">
        <div className="xp-stage" data-surface="stage">
          {/* SCREEN stage decor: beam, crown, floor, vignette, rim, two embers. */}
          <div aria-hidden="true" className="ed-beam xp-beam" />
          <div aria-hidden="true" className="xp-crown ed-screen-only" />
          <div aria-hidden="true" className="xp-floor ed-screen-only" />
          <div aria-hidden="true" className="xp-vignette ed-screen-only" />
          <div aria-hidden="true" className="xp-rim ed-screen-only" />
          <span aria-hidden="true" className="ed-ember xp-ember" />
          <span aria-hidden="true" className="ed-ember xp-ember is-b" />

          <div className="xp-grid">
            {/* The head lives in the left column (both frames); the SCREEN photo rises beside it. */}
            <div className="xp-head">
              <SectionHead
                headingId="experience-heading"
                kicker={XP_COPY.kicker}
                title={XP_COPY.title}
                chapter={XP_COPY.chapter}
                printTitle={XP_COPY.printTitle}
              />
            </div>
            <div className="xp-main">
              <div className="xp-graph" data-dag-root>
                <CareerDraw />

                {/* The NEXT marker: the one stretch of rail still to come. */}
                <article className="xp-next" aria-label={nextMarker.ariaLabel}>
                  <span aria-hidden="true" className="xp-node xp-node--next" />
                  <div className="xp-next-row">
                    <span className="xp-next-k ed-screen-only">{nextMarker.label}</span>
                    <span className="xp-next-v ed-screen-only">
                      <Figures text={nextMarker.line} />
                    </span>
                    <span className="xp-next-w ed-screen-only">{nextMarker.location}</span>

                    <span className="xp-next-bang ed-print-only">
                      {XP_COPY.nextIssue[0]}
                      <br />
                      {XP_COPY.nextIssue[1]}
                    </span>
                    <span className="xp-next-co ed-print-only">
                      <span className="xp-next-company">{nextMarker.company}</span>
                      <span className="xp-next-role">
                        {nextMarker.role} · {nextMarker.location}
                      </span>
                    </span>
                    <span className="xp-next-starts ed-print-only">
                      <span className="xp-next-starts-k">{XP_COPY.starts}</span>
                      <span className="xp-next-date">{nextMarker.start}</span>
                    </span>
                  </div>
                </article>

                <ol className="xp-entries" aria-label={XP_COPY.graphLabel}>
                  {jobs.map((c, i) => (
                    <Job key={c.id} c={c} index={i} last={i === jobs.length - 1} />
                  ))}
                  {ieee ? (
                    <li
                      className="xp-ieee"
                      data-job={ieee.id}
                      style={{ ['--k' as string]: jobs.length + 1 }}
                    >
                      <span aria-hidden="true" className="xp-node xp-node--tag" />
                      <div className="xp-ieee-hd">
                        <span className="xp-ieee-tag">
                          <span className="xp-org xp-org--sm">{ieee.company}</span>
                          <span className="xp-kind">
                            <span className="ed-screen-only">{ieee.role} · </span>
                            <span className="ed-print-only">· </span>
                            <Figures text={ieee.period} />
                          </span>
                        </span>
                        <p className="xp-ieee-title">“{ieee.meta}”</p>
                        <span className="xp-ieee-actions">
                          {ieee.paperUrl ? (
                            <a
                              className="xp-lnk"
                              href={ieee.paperUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {XP_COPY.readPaper}
                              <svg
                                width="11"
                                height="11"
                                viewBox="0 0 11 11"
                                aria-hidden="true"
                                focusable="false"
                              >
                                <path
                                  d="M2 9L9 2M4 2h5v5"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.2"
                                />
                              </svg>
                            </a>
                          ) : null}
                          <CopyCitation citation={citation} />
                        </span>
                      </div>
                    </li>
                  ) : null}
                </ol>
              </div>
            </div>

            <aside className="xp-aside" aria-label={XP_COPY.asideLabel}>
              {/* SCREEN: the view from the AWS desk (S5 §5), decorative. */}
              <figure className="xp-photo ed-screen-only" aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={PHOTOS.desk.screen}
                  alt=""
                  width={PHOTOS.desk.width}
                  height={PHOTOS.desk.height}
                  loading="lazy"
                  decoding="async"
                />
                <span className="xp-photo-key" />
                <span className="xp-photo-low" />
              </figure>
              <EducationCard />
              <SkillsPerJob />
            </aside>
          </div>
        </div>
      </div>
    </section>
  )
}
