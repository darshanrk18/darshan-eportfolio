/**
 * v3 education block (S5 §2 C5 / P5 §2 B4a): a rule header and two entries —
 * school, degree, "location · period". No grade figures (CONTENT_FINAL), no
 * motion (the quiet zone). RSC; facts verbatim from @/lib/data/profile.
 * The IEEE citation copy action moved next to "Read the paper" (Experience).
 */

import { profile } from '@/lib/data/profile'
import { XP_COPY } from './copy'
import { Figures } from './Text'

export default function EducationCard() {
  const { education, educationPrior } = profile
  const entries = [education, educationPrior]
  return (
    <div className="xp-edu" data-component="EducationCard">
      <p className="xp-edu-h">
        <span>{XP_COPY.educationLabel}</span>
        <i aria-hidden="true" />
      </p>
      {entries.map((e) => (
        <div key={e.school} className="xp-edu-entry">
          <p className="xp-edu-s">{e.school}</p>
          <p className="xp-edu-g">{e.degree}</p>
          <p className="xp-edu-m">
            <Figures text={`${e.location} · ${e.period}`} />
          </p>
        </div>
      ))}
    </div>
  )
}
