/**
 * v2 §9.1 git-blame cross-highlight data — per-bullet skill ids for the
 * commit entries in lib/data/experience. VERIFICATION RULE (binding, §9.1):
 * a bullet may name ONLY skill ids that resolve via getSkillNode() AND whose
 * `usedIn` (lib/data/skills.ts) includes this commit's employer — enforced by
 * tests/blame.test.ts, so the blame feature is structurally incapable of
 * asserting an unverified claim.
 *
 * Deviations from the spec's §9.1 table, forced by lib/data/skills.ts:
 * - `java` / `python` are languages (editor-tab chips), not diagram nodes —
 *   getSkillNode() cannot resolve them, so they are excluded everywhere.
 * - `cloudwatch` has an empty usedIn — excluded from aws-intern bullet 2.
 * - `github-actions` is verified for Ticket-Forge only, not Schneider —
 *   excluded from schneider bullet 3.
 * - `neu-ta` has no verified diagram-node claim (JUnit's usedIn names the
 *   AWS internship, not the TA role) — the commit has no blame entry and its
 *   bullet simply does not participate in blame.
 */

import type { CommitEntry } from '@/lib/data/experience'

export interface BlameEntry {
  /** The `usedIn.where` string that verifies this commit's skill claims. */
  where: string
  /** Parallel to CommitEntry.bullets — skill node ids per bullet ([] = none). */
  bulletSkills: readonly (readonly string[])[]
}

export const commitBlame: Partial<Record<CommitEntry['id'], BlameEntry>> = {
  'aws-intern': {
    where: 'AWS internship',
    bulletSkills: [
      // serverless evidence-capture prototype (Lambda/S3 + browser automation)
      ['aws', 'playwright'],
      // CDK/IAM infrastructure-as-code + Docker hardening
      ['aws', 'docker'],
      // Java 100% coverage + e2e validation suite
      ['junit', 'playwright'],
    ],
  },
  schneider: {
    where: 'Schneider Electric',
    bulletSkills: [
      // workflow apps for 10k+ employees
      ['flask', 'react', 'nodejs', 'mysql'],
      // M365 automation is Python/PowerShell/Graph — no verified diagram node
      [],
      // containers + CI/CD + monitoring
      ['docker', 'kubernetes', 'jenkins', 'prometheus', 'grafana'],
    ],
  },
}
