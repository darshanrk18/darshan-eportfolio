/**
 * "See which skills each job used" (v2 §9.1, v3 C3) — the mapping is
 * structurally incapable of asserting an unverified claim: every id in every
 * bullet's skills array must resolve via getSkill() (a diagram node or a
 * language) AND that skill's `usedIn` must name the job's usage place.
 */

import { describe, expect, it } from 'vitest'
import { blameJobIds, commitBlame, jobSkills, type BlameEntry } from '@/components/experience/blame'
import { commits, jobIds } from '@/lib/data/experience'
import { getSkill, getUsagePlace, skillsUsedAt } from '@/lib/data/skills'

const entries = Object.entries(commitBlame) as [string, BlameEntry][]

describe('skills-per-job mapping (spec §9.1, v3 languages extension)', () => {
  it('blames exactly the three jobs, in data order', () => {
    expect([...blameJobIds]).toEqual([...jobIds])
    expect(Object.keys(commitBlame).sort()).toEqual(['aws-intern', 'neu-ta', 'schneider'])
  })

  it('maps real commits, with one skills array per bullet', () => {
    for (const [id, entry] of entries) {
      const commit = commits.find((c) => c.id === id)
      expect(commit, `commit '${id}' exists`).toBeDefined()
      expect(entry.bulletSkills.length, `'${id}' bullet arity`).toBe(commit!.bullets.length)
      expect(getUsagePlace(entry.place)?.commitId, `'${id}' place is its own job`).toBe(id)
    }
  })

  it('every blamed id resolves via getSkill() (node or language)', () => {
    for (const [commitId, entry] of entries) {
      for (const bullet of entry.bulletSkills) {
        for (const id of bullet) {
          expect(getSkill(id), `'${id}' (${commitId}) is a skill`).toBeDefined()
        }
      }
    }
  })

  it("every blamed skill's usedIn names the job's place", () => {
    for (const [commitId, entry] of entries) {
      for (const bullet of entry.bulletSkills) {
        for (const id of bullet) {
          const skill = getSkill(id)!
          expect(
            skill.usedIn.some((u) => u.place === entry.place),
            `'${id}' is verified for '${entry.place}' (${commitId})`
          ).toBe(true)
        }
      }
    }
  })

  it('has no duplicate ids within a bullet, and each job blames something', () => {
    for (const [commitId, entry] of entries) {
      expect(
        entry.bulletSkills.some((b) => b.length > 0),
        `'${commitId}' has at least one blamed bullet`
      ).toBe(true)
      for (const bullet of entry.bulletSkills) {
        expect(new Set(bullet).size, `no duplicates (${commitId})`).toBe(bullet.length)
      }
    }
  })

  it('the tile sheet is the verified set for the place, and every blamed id is on it', () => {
    for (const id of blameJobIds) {
      const sheet = jobSkills(id).map((s) => s.id)
      expect(sheet).toEqual(skillsUsedAt(commitBlame[id].place).map((s) => s.id))
      for (const bullet of commitBlame[id].bulletSkills) {
        for (const skill of bullet) expect(sheet, `${skill} on ${id}'s sheet`).toContain(skill)
      }
    }
    // The approved P5 sheets (CONTENT_FINAL verified map).
    expect(jobSkills('schneider').map((s) => s.id)).toEqual([
      'python',
      'react',
      'nodejs',
      'flask',
      'mysql',
      'docker',
      'kubernetes',
      'jenkins',
      'prometheus',
      'grafana',
    ])
    expect(jobSkills('aws-intern').map((s) => s.id)).toEqual([
      'python',
      'java',
      'junit',
      'playwright',
      'docker',
      'aws',
    ])
    expect(jobSkills('neu-ta').map((s) => s.id)).toEqual(['java'])
  })
})
