/**
 * §4.6 Projects — the monorepo. RSC shell: section header + a 12-col
 * explorer/stage split. ExplorerTree (cols 1–3 desktop; tab-chips on
 * tablet/mobile) selects into the shared store; ProjectWindow (cols 4–12)
 * renders the terminal-chrome window. Both islands SSR their initial
 * (triplay-ai) state; a <noscript> index links every case file at
 * /work/<slug> so the section stays navigable without JavaScript.
 */

import SectionHeader from '@/components/chrome/SectionHeader'
import { projects } from '@/lib/data/projects'
import ExplorerTree from './ExplorerTreeIsland'
import ProjectWindow from './ProjectWindowIsland'

export default function Projects() {
  return (
    <section
      id="projects"
      aria-labelledby="projects-heading"
      className="section-pad"
      data-component="Projects"
    >
      <div className="container-site">
        <SectionHeader
          index="03"
          name="PROJECTS"
          file="projects/"
          headingId="projects-heading"
          headline="Selected work. Every one of them runs."
        />
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-3">
            <ExplorerTree />
          </div>
          <div className="lg:col-span-9">
            <ProjectWindow />
          </div>
        </div>
        <noscript>
          <ul className="type-code mt-10 space-y-1">
            {projects.map((p) => (
              <li key={p.slug}>
                <a href={`/work/${p.slug}`} className="text-secondary underline">
                  {p.dir}/{p.slug}/
                </a>{' '}
                <span className="text-secondary">— {p.oneLiner}</span>
              </li>
            ))}
          </ul>
        </noscript>
      </div>
    </section>
  )
}
