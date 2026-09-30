/**
 * "See which skills each job used" — the per-bullet skill map behind the
 * cross-highlight (v2 §9.1 git-blame, renamed in v3 to visitor language).
 *
 * VERIFICATION RULE (binding): a bullet may name ONLY skill ids that resolve
 * via getSkill() (a diagram node OR a language — v3 extends the model to the
 * Languages row so Python / Java tiles are legal) AND whose `usedIn`
 * (lib/data/skills.ts) names this job's usage place. tests/blame.test.ts
 * enforces it, so the feature is structurally incapable of asserting an
 * unverified claim.
 *
 * What the job's TILE SHEET shows is not this table: it is
 * skillsUsedAt(place) — every skill the verified map ties to the job, in
 * chip order. This table only says which bullet each skill belongs to (the
 * hover narrows the highlight to that bullet's skills, and the bullet marks
 * come from it — see ./marks.ts).
 *
 * Deviations from a naive reading of the bullets, forced by the map:
 * - `cloudwatch` has an empty usedIn — never blamed.
 * - `github-actions` is verified for Ticket-Forge only, not Schneider.
 * - `neu-ta` blames Java only (Java → CS5010 TA is verified; JUnit / JaCoCo
 *   appear in the bullet but junit.usedIn names the AWS internship).
 * - Schneider bullet 2 (Microsoft 365 automation) is deliberately unmarked,
 *   as the approved P5 frame draws it.
 */

import type { CommitId } from '@/lib/data/experience'
import { skillsUsedAt, type UsagePlaceId, type Skill } from '@/lib/data/skills'

export type BlameJobId = Extract<CommitId, 'aws-intern' | 'neu-ta' | 'schneider'>

export interface BlameEntry {
  /** The usage place (lib/data/skills USAGE_PLACES) that verifies this job's claims. */
  place: UsagePlaceId
  /** Parallel to CommitEntry.bullets — skill ids per bullet ([] = none). */
  bulletSkills: readonly (readonly string[])[]
}

export const commitBlame: Record<BlameJobId, BlameEntry> = {
  'aws-intern': {
    place: 'aws-intern',
    bulletSkills: [
      // serverless evidence-capture prototype (Java, Python, Lambda/S3 + browser automation)
      ['java', 'python', 'aws', 'playwright'],
      // CDK/IAM infrastructure-as-code + Docker hardening
      ['aws', 'docker'],
      // Java 100% coverage (JUnit) + Python Lambda unit tests + e2e validation
      ['java', 'junit', 'python', 'playwright'],
    ],
  },
  'neu-ta': {
    place: 'neu-ta',
    bulletSkills: [
      // labs and office hours on Java OOP, SOLID, UML, patterns, testing
      ['java'],
    ],
  },
  schneider: {
    place: 'schneider',
    bulletSkills: [
      // workflow apps for 10k+ employees
      ['python', 'flask', 'react', 'nodejs', 'mysql'],
      // M365 automation is Python/PowerShell/Graph — drawn unmarked (P5)
      [],
      // containers + CI/CD + monitoring
      ['docker', 'kubernetes', 'jenkins', 'prometheus', 'grafana'],
    ],
  },
}

export const blameJobIds = Object.keys(commitBlame) as readonly BlameJobId[]

export function isBlameJobId(id: string): id is BlameJobId {
  return Object.prototype.hasOwnProperty.call(commitBlame, id)
}

/** The tile sheet for a job: every verified skill of its place, chip order. */
export function jobSkills(id: BlameJobId): readonly Skill[] {
  return skillsUsedAt(commitBlame[id].place)
}
