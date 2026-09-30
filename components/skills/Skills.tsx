/**
 * v3 Skills — S3 "INSTRUMENTS" / P3 "CH. II THE TOOLKIT". RSC shell: the
 * section head (both skins), the SCREEN atmosphere and PRINT print-shop
 * furniture (always rendered, aria-hidden, shown per edition by CSS), and the
 * SystemDiagram island (SSR'd complete: the diagram, the inspector and the
 * "Where I've used them" map exist as semantic HTML without JS). All facts
 * come from '@/lib/data/skills'; skins live in styles/v3/skills.css.
 */

import '@/styles/v3/skills.css'
import SectionHead from './SectionHead'
import SystemDiagram from './SystemDiagramIsland'
import { SKILLS_COPY } from './copy'

export default function Skills() {
  return (
    <section
      id="skills"
      aria-labelledby="skills-heading"
      className="section-pad sk-root"
      data-component="Skills"
      data-island="RSC"
      style={{ ['--vs-i' as string]: 2 }}
    >
      {/* SCREEN atmosphere (S3 §6) — hidden under PRINT by print.css. */}
      <div aria-hidden="true" className="ed-light sk-atmo-light" />
      <div aria-hidden="true" className="ed-beam sk-atmo-beam" />
      <span aria-hidden="true" className="ed-ember sk-atmo-ember" />
      <span aria-hidden="true" className="ed-ember sk-atmo-ember is-b" />
      <div aria-hidden="true" className="ed-grain sk-atmo-grain" />
      {/* PRINT registration targets — hidden under SCREEN by screen.css. */}
      <span aria-hidden="true" className="ed-regmark sk-regmark is-top" />
      <span aria-hidden="true" className="ed-regmark sk-regmark is-left" />
      <span aria-hidden="true" className="ed-regmark sk-regmark is-right" />

      <div className="container-site sk-inner">
        <SectionHead
          headingId="skills-heading"
          kicker={SKILLS_COPY.kicker}
          title={SKILLS_COPY.title}
          chapter={SKILLS_COPY.chapter}
          printTitle={SKILLS_COPY.printTitle}
          lede={SKILLS_COPY.lede}
        />
        <SystemDiagram />
      </div>
    </section>
  )
}
