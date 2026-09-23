/**
 * §4.5 Skills — `skills.json`, but alive.
 * RSC shell: section header, languages chip row (verified-context tooltips),
 * and the system diagram (SystemDiagram.client SSRs the complete markup, so
 * the full diagram exists as semantic HTML without JS). All facts come from
 * '@/lib/data/skills'; the component CSS below uses design tokens only.
 */

import SectionHeader from '@/components/chrome/SectionHeader'
import { languages } from '@/lib/data/skills'
import SystemDiagram from './SystemDiagramIsland'

const skillsCss = `
/* §4.5 languages row — editor-tab chips with verified-context tooltips */
.skills-lang { position: relative; }
.skills-lang-chip {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 0 12px;
  color: var(--text-secondary);
  transition: color var(--dur-micro) var(--ease-swift), border-color var(--dur-micro) var(--ease-swift);
}
.skills-lang-chip:hover,
.skills-lang-chip:focus-visible {
  color: var(--text-primary);
  border-color: var(--border-strong);
}
.skills-lang-tip {
  position: absolute;
  left: 0;
  bottom: calc(100% + 8px);
  z-index: 5;
  white-space: nowrap;
  padding: 4px 8px;
  background: var(--bg-raised);
  border: 1px solid var(--border-hairline);
  color: var(--text-secondary);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--dur-micro) var(--ease-swift);
}
.skills-lang:hover .skills-lang-tip,
.skills-lang:focus-within .skills-lang-tip { opacity: 1; }
/* Long verified-context lines wrap on small screens instead of overflowing */
@media (max-width: 767px) {
  .skills-lang-tip {
    white-space: normal;
    width: max-content;
    max-width: min(320px, calc(100vw - 40px));
  }
}

/* Cluster panels (terminal-chrome grouping outlines) */
.skills-cluster {
  border: 1px dashed var(--border-hairline);
  padding: 12px;
  background: transparent;
}
.skills-cluster--abs { position: absolute; }
.skills-cluster-label {
  color: var(--cluster-accent);
  margin-bottom: 8px;
}

/* Node chips: 0 radius, hairline, --bg-panel, cluster-tinted 3px left border */
.skills-node {
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  min-height: 40px;
  padding: 0 10px;
  background: var(--bg-panel);
  border: 1px solid var(--border-hairline);
  border-left: 3px solid var(--cluster-accent);
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
  transition:
    background-color var(--dur-micro) var(--ease-swift),
    border-color var(--dur-micro) var(--ease-swift),
    opacity var(--dur-micro) var(--ease-swift);
}
.skills-node:hover {
  background: var(--bg-raised);
  border-color: var(--border-strong);
  border-left-color: var(--cluster-accent);
}
.skills-node[data-selected='true'] {
  background: var(--bg-raised);
  border-color: var(--cluster-accent);
}
/* Focus state: unrelated nodes dim to 30% */
.skills-diagram[data-focused='true'] .skills-node:not([data-selected='true']) { opacity: 0.3; }
@media (max-width: 767px) {
  .skills-node { min-height: 44px; }
}

/* Edges: 1px dashed hairline; 2px packet dots flow via stroke-dashoffset */
.skills-edge-base {
  fill: none;
  stroke: var(--border-hairline);
  stroke-width: 1;
  stroke-dasharray: 4 4;
  transition: stroke var(--dur-micro) var(--ease-swift);
}
.skills-edge.is-hot .skills-edge-base { stroke: var(--edge-accent); }
.skills-packet {
  fill: none;
  stroke: var(--edge-accent);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-dasharray: 2 98;
  animation: skills-packet-flow 6s linear infinite;
  animation-play-state: paused;
}
.skills-diagram[data-live='true'] .skills-packet { animation-play-state: running; }
@keyframes skills-packet-flow {
  to { stroke-dashoffset: -100; }
}
/* §3.4 packets are absent (not merely frozen) under reduced motion */
html[data-motion='reduced'] .skills-packet { display: none; }
@media (prefers-reduced-motion: reduce) {
  html:not([data-motion='full']) .skills-packet { display: none; }
}

/* Mobile vertical pipeline connectors */
.skills-pipe-connector {
  display: flex;
  justify-content: center;
  height: 32px;
}

/* kubectl-describe grid inside the inspector */
.skills-describe {
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr);
  column-gap: 8px;
  row-gap: 8px;
  margin: 0;
}
.skills-describe dt { color: var(--text-secondary); }
.skills-describe dd {
  margin: 0;
  color: var(--text-primary);
  overflow-wrap: anywhere;
}
`

export default function Skills() {
  return (
    <section
      id="skills"
      aria-labelledby="skills-heading"
      className="section-pad"
      data-component="Skills"
    >
      <div className="container-site">
        <SectionHeader
          index="02"
          name="SKILLS"
          file="skills.json"
          headingId="skills-heading"
          headline="The toolchain, as a running system."
        />
        <ul className="mb-12 flex flex-wrap gap-2" aria-label="Languages">
          {languages.map((lang) => (
            <li key={lang.id} className="skills-lang">
              <span
                tabIndex={lang.context ? 0 : undefined}
                aria-describedby={lang.context ? `skills-lang-tip-${lang.id}` : undefined}
                className="skills-lang-chip type-label-sm hairline rounded-chip"
              >
                {lang.label}
              </span>
              {lang.context ? (
                <span
                  id={`skills-lang-tip-${lang.id}`}
                  role="tooltip"
                  className="skills-lang-tip type-label-sm rounded-chip"
                >
                  {lang.context}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
        <SystemDiagram />
      </div>
      <style dangerouslySetInnerHTML={{ __html: skillsCss }} />
    </section>
  )
}
