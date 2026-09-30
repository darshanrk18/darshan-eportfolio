/**
 * Work (`#projects`) — V3_SPEC §3 "Work", frames S4 (SCREEN "SELECTED
 * WORK") and P4 (PRINT "CH. III TICKET-FORGE & CO."). RSC shell, one DOM,
 * two skins (styles/v3/work.css):
 *   head       SCREEN: steel kicker "Work" + Cinzel title + the right-aligned
 *              lede "Seven projects. Open one and it runs right here."
 *              PRINT: the "CH. III" ink box + the Bangers chapter title.
 *   window     ProjectWindow (client island, SSR): the game window / the open
 *              issue — tabs, New game, Maximize, the demo, the case file.
 *   rack       ProjectRack (client island, SSR): SCREEN "More projects" —
 *              six glass posters; PRINT "Back issues" — seven comic covers.
 *              The rack replaced v2's explorer tree.
 *   noscript   a plain index of /work/<slug> so the section stays navigable
 *              without JavaScript.
 * Copy comes from lib/data/projects (`workCopy`); the count in the lede is
 * `projects.length` spelled out. Atmosphere nodes are decorative, rendered
 * for both editions and shown by one (README §4).
 */

import '@/styles/v3/work.css'
import { projects, workCopy } from '@/lib/data/projects'
import ProjectRack from './ProjectRackIsland'
import ProjectWindow from './ProjectWindowIsland'

export default function Projects() {
  return (
    <section
      id="projects"
      aria-labelledby="projects-heading"
      className="wk section-pad"
      data-component="Projects"
      data-island="RSC"
      style={{ ['--vs-i' as string]: 3 }}
    >
      {/* SCREEN light leaks (design 41) — hidden under PRINT by CSS. */}
      <span className="wk-leak a ed-screen-only" aria-hidden="true" />
      <span className="wk-leak c ed-screen-only" aria-hidden="true" />

      <div className="container-site wk-in">
        <header className="wk-head">
          <p className="wk-kicker ed-label ed-screen-only" data-surface="kicker">
            <span className="wk-rule" aria-hidden="true" />
            {workCopy.screen.kicker}
          </p>
          <div className="wk-head-row">
            <p className="wk-chapter ed-print-only">{workCopy.print.chapter}</p>
            <h2 id="projects-heading" className="wk-title ed-disp" data-surface="title">
              <span className="ed-screen-only">{workCopy.screen.title}</span>
              <span className="ed-print-only">{workCopy.print.title}</span>
            </h2>
            <p className="wk-lede ed-screen-only">
              {workCopy.screen.ledeCount} <b>{workCopy.screen.ledeAction}</b>
            </p>
          </div>
        </header>

        {/* Stage-edge key light on the window's top rim (S4 §2 E). */}
        <span className="wk-keylight ed-screen-only" aria-hidden="true" />

        <ProjectWindow />

        <div className="wk-more">
          <h3 id="projects-rack-heading" className="wk-more-label">
            <span className="ed-screen-only">{workCopy.screen.more}</span>
            <span className="ed-print-only">{workCopy.print.rackTitle}</span>
          </h3>
          <p className="wk-more-lede ed-print-only">{workCopy.print.rackLede}</p>
          <span className="wk-more-rule" aria-hidden="true" />
        </div>

        <ProjectRack />

        <noscript>
          <ul className="mt-8 space-y-1">
            {projects.map((p) => (
              <li key={p.slug}>
                <a href={`/work/${p.slug}`} className="text-secondary underline">
                  {p.name}
                </a>{' '}
                <span className="text-secondary">— {p.short}</span>
              </li>
            ))}
          </ul>
        </noscript>
      </div>
    </section>
  )
}
