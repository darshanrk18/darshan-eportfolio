/**
 * v2 §9.1 (required) — the git-blame mapping is structurally incapable of
 * asserting an unverified claim: every id in every bullet's skills array must
 * resolve via getSkillNode() AND that node's `usedIn` must include the
 * commit's employer.
 */

import { describe, expect, it } from 'vitest'
import { commitBlame, type BlameEntry } from '@/components/experience/blame'
import { commits } from '@/lib/data/experience'
import { getSkillNode } from '@/lib/data/skills'

const entries = Object.entries(commitBlame) as [string, BlameEntry][]

describe('git-blame mapping (spec §9.1)', () => {
  it('blames exactly the commits with verified diagram-node claims', () => {
    // neu-ta has no verified node claim (JUnit's usedIn names the AWS
    // internship, not the TA role) — it must NOT appear here.
    expect(Object.keys(commitBlame).sort()).toEqual(['aws-intern', 'schneider'])
  })

  it('maps real commits, with one skills array per bullet', () => {
    for (const [id, entry] of entries) {
      const commit = commits.find((c) => c.id === id)
      expect(commit, `commit '${id}' exists`).toBeDefined()
      expect(entry.bulletSkills.length, `'${id}' bullet arity`).toBe(commit!.bullets.length)
    }
  })

  it('every blamed id resolves via getSkillNode()', () => {
    for (const [commitId, entry] of entries) {
      for (const bullet of entry.bulletSkills) {
        for (const id of bullet) {
          expect(getSkillNode(id), `'${id}' (${commitId}) is a diagram node`).toBeDefined()
        }
      }
    }
  })

  it("every blamed node's usedIn includes the commit's employer", () => {
    for (const [commitId, entry] of entries) {
      for (const bullet of entry.bulletSkills) {
        for (const id of bullet) {
          const node = getSkillNode(id)!
          expect(
            node.usedIn.some((u) => u.where === entry.where),
            `'${id}' is verified for '${entry.where}' (${commitId})`,
          ).toBe(true)
        }
      }
    }
  })

  it('has no duplicate ids within a bullet, and each commit blames something', () => {
    for (const [commitId, entry] of entries) {
      expect(
        entry.bulletSkills.some((b) => b.length > 0),
        `'${commitId}' has at least one blamed bullet`,
      ).toBe(true)
      for (const bullet of entry.bulletSkills) {
        expect(new Set(bullet).size, `no duplicates (${commitId})`).toBe(bullet.length)
      }
    }
  })
})
