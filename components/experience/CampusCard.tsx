/**
 * v3 campus block (Nov 2026 résumé, Leadership & Campus Involvement): the
 * Education card's anatomy — rule header, then one entry per role (role +
 * organisation, the résumé's one-liner, "period") — so both editions' .xp-edu
 * skins style it unchanged. RSC; facts verbatim from @/lib/data/experience.
 */

import { campusRoles } from '@/lib/data/experience'
import { XP_COPY } from './copy'
import { Figures } from './Text'

export default function CampusCard() {
  return (
    <div className="xp-edu" data-component="CampusCard">
      <p className="xp-edu-h">
        <span>{XP_COPY.campusLabel}</span>
        <i aria-hidden="true" />
      </p>
      {campusRoles.map((r) => (
        <div key={r.role} className="xp-edu-entry">
          <p className="xp-edu-s">{r.role}</p>
          <p className="xp-edu-g">{r.line}</p>
          <p className="xp-edu-m">
            <Figures text={r.period} />
          </p>
        </div>
      ))}
    </div>
  )
}
