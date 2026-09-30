/**
 * The case file of one project (V3_SPEC §3 Work; S4 §F3, P4 §C2b). One DOM,
 * two skins (styles/v3/work.css): SCREEN reads title → one-liner → the two
 * numbers → rule → problem → build → stack; PRINT reads title → one-liner →
 * PROBLEM / BUILD / RESULT rows with coloured tabs → stat boxes → stickers →
 * the foot row. The order difference is CSS `order` on `.cf-row[data-col]`.
 * Copy comes ONLY from lib/data/projects (metrics are structured, the build
 * line is the approved short form, link labels are visitor language).
 * Server-safe (no hooks): ProjectWindow (client) and /work/[slug] (RSC)
 * both render it; `nav` is the optional page-turn slot for the foot row.
 */

import type { ReactNode } from 'react'
import Logo from '@/components/skills/Logo'
import { logoIdForName } from '@/lib/data/logos'
import { profile } from '@/lib/data/profile'
import { workCopy, type Project } from '@/lib/data/projects'

interface CaseLink {
  label: string
  href: string
  /** Logo id for the link's mark (github); undefined ⇒ a plain arrow. */
  logo?: string
}

/** Every outbound link of a project, most specific first. */
export function caseLinks(project: Project): CaseLink[] {
  const links: CaseLink[] = []
  if (project.repoUrl) links.push({ label: workCopy.caseFile.codeLink, href: project.repoUrl, logo: 'github' })
  if (project.demoUrl) {
    links.push({
      label: project.live ? workCopy.caseFile.appLink : workCopy.caseFile.demoLink,
      href: project.demoUrl,
    })
  }
  if (project.paperUrl) links.push({ label: workCopy.caseFile.paperLink, href: project.paperUrl })
  return links
}

function ExtArrow() {
  return (
    <svg className="cf-arrow" width="9" height="9" viewBox="0 0 9 9" aria-hidden="true">
      <path d="M1.5 7.5L7.5 1.5M3 1.5h4.5V6" fill="none" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  )
}

export interface CaseFileProps {
  project: Project
  /** Heading element for the project name (h3 inside the window, h1 on /work). */
  as?: 'h1' | 'h2' | 'h3'
  /** Optional page-turn controls (PRINT foot row). */
  nav?: ReactNode
}

export default function CaseFile({ project, as = 'h3', nav }: CaseFileProps) {
  const Heading = as
  const links = caseLinks(project)
  const [primary, ...rest] = links
  const head: CaseLink = primary ?? {
    label: workCopy.caseFile.profileLink,
    href: profile.githubUrl,
    logo: 'github',
  }
  const award = project.award?.split(' — ') ?? null

  return (
    <article className="cf" aria-label={`About ${project.name}`}>
      <div className="cf-head">
        <Heading className="cf-title ed-disp">{project.name}</Heading>
        <a className="cf-src" href={head.href} target="_blank" rel="noreferrer">
          {head.logo ? <Logo id={head.logo} size={14} /> : null}
          <span>{head.label}</span>
          <ExtArrow />
        </a>
      </div>

      {(award || project.live) && (
        <p className="cf-badges">
          {award ? (
            <span className="cf-award">
              <b>{award[0]}</b>
              {award[1] ? <span>{award[1]}</span> : null}
            </span>
          ) : null}
          {project.live ? (
            <span className="cf-live ed-live">
              <i aria-hidden="true" />
              {workCopy.caseFile.live}
            </span>
          ) : null}
        </p>
      )}

      <p className="cf-one">{project.oneLiner}</p>

      <div className="cf-rows">
        <div className="cf-row" data-col="problem">
          <span className="cf-tab ed-print-only">{workCopy.caseFile.problem}</span>
          <p className="cf-text cf-p1">{project.problem}</p>
        </div>
        <div className="cf-row" data-col="build">
          <span className="cf-tab ed-print-only">{workCopy.caseFile.build}</span>
          <p className="cf-text cf-p2">{project.buildShort ?? project.build}</p>
        </div>
        <div className="cf-row" data-col="result">
          <span className="cf-tab ed-print-only">{workCopy.caseFile.result}</span>
          {project.metrics ? (
            <div className="cf-result">
              <dl className="cf-stats">
                {project.metrics.map((metric) => (
                  <div key={metric.label} className="cf-stat">
                    <dt className="cf-stat-value">{metric.value}</dt>
                    <dd className="cf-stat-label">
                      {metric.label}
                      {metric.sub ? <span className="cf-stat-sub">{metric.sub}</span> : null}
                    </dd>
                  </div>
                ))}
              </dl>
              {project.metricsNote ? <p className="cf-note">{project.metricsNote}</p> : null}
            </div>
          ) : (
            <p className="cf-text cf-p2">{project.result}</p>
          )}
        </div>
      </div>

      {project.stack.length > 0 ? (
        <ul className="cf-stack" aria-label={workCopy.caseFile.builtWith}>
          {project.stack.map((item, i) => {
            const id = logoIdForName(item)
            return (
              <li
                key={item}
                className="cf-chip"
                data-logo={id ? '' : undefined}
                style={{ ['--tilt' as string]: `${[-1.5, 1, -0.8, 1.2, -1][i % 5]}deg` }}
              >
                {id ? <Logo id={id} size={15} /> : null}
                <span>{item}</span>
              </li>
            )
          })}
        </ul>
      ) : null}

      <div className="cf-foot">
        {rest.map((link) => (
          <a key={link.href} className="cf-src cf-src-more" href={link.href} target="_blank" rel="noreferrer">
            <span>{link.label}</span>
            <ExtArrow />
          </a>
        ))}
        {!project.repoUrl ? (
          <span className="cf-private ed-print-only">{workCopy.caseFile.privateCode}</span>
        ) : null}
        {nav}
      </div>
    </article>
  )
}
