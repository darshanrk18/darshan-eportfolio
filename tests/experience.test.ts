/**
 * v3 C3 — the structured experience data (director call (b)) and the pure
 * text helpers behind the Experience section.
 */

import { describe, expect, it } from 'vitest'
import { figures, markSkills } from '@/components/experience/marks'
import { PRINT_PLATES } from '@/components/experience/copy'
import { cityOf, commits, jobIds, nextMarker, showBranch } from '@/lib/data/experience'
import { PHOTOS } from '@/lib/data/photos'
import { profile } from '@/lib/data/profile'
import { buildCitation } from '@/components/experience/citation'

describe('experience data (director call (b))', () => {
  it('every entry carries the structured fields', () => {
    for (const c of commits) {
      expect(c.company, c.id).toBeTruthy()
      expect(c.companyShort, c.id).toBeTruthy()
      expect(c.period, c.id).toBeTruthy()
      expect(c.periodShort, c.id).toBeTruthy()
      expect(c.years, c.id).toBeTruthy()
      if (c.kind === 'commit') {
        expect(c.role, c.id).toBeTruthy()
        expect(c.location, c.id).toBeTruthy()
        expect(c.bullets.length, c.id).toBeGreaterThan(0)
      }
    }
  })

  it('the three jobs are the blame tabs, newest first', () => {
    expect([...jobIds]).toEqual(['aws-intern', 'neu-ta', 'schneider'])
    expect(commits.map((c) => c.id)).toEqual([
      'aws-future',
      'aws-intern',
      'neu-ta',
      'neu-branch',
      'schneider',
      'ieee-tag',
    ])
  })

  it('keeps the AWS internship to its three bullets and the allowed outcome', () => {
    const aws = commits.find((c) => c.id === 'aws-intern')!
    expect(aws.bullets).toHaveLength(3)
    expect(aws.outcome).toBe('Returned with a full-time SDE offer.')
    expect(aws.periodShort).toBe('Jun – Aug 2026')
    expect(aws.roleShort).toBe('SDE intern')
  })

  it('splits the TA bullet for PRINT without string surgery at runtime', () => {
    const ta = commits.find((c) => c.id === 'neu-ta')!
    expect(ta.printBullets).toHaveLength(ta.bullets.length)
    expect(ta.printOutcome).toBe(`${profile.education.ta.students} graduate students mentored`)
    expect(ta.printCompany).toBe('Northeastern University, Khoury College')
    expect(ta.printRoleLines).toEqual([
      'Graduate Teaching Assistant',
      'CS5010 Programming Design Paradigm',
    ])
  })

  it('degree strings follow CONTENT_FINAL', () => {
    expect(profile.education.degree).toBe('MS in Computer Science')
    expect(profile.educationPrior.degree).toBe('BE in Computer Science')
  })

  it('neither edition draws the neu-branch node; the NEXT marker derives from the future entry', () => {
    expect(showBranch).toEqual({ screen: false, print: false })
    expect(nextMarker.line).toBe('SDE @ Amazon Web Services · Jan 2027')
    expect(nextMarker.location).toBe('Boston, MA')
    expect(nextMarker.ariaLabel).toContain('Amazon Web Services')
  })

  it('cityOf and the PRINT narration captions', () => {
    expect(cityOf('Boston, MA')).toBe('Boston')
    expect(cityOf('Bengaluru, India')).toBe('Bengaluru')
    for (const id of jobIds) {
      const plate = PRINT_PLATES[id]
      expect(PHOTOS[plate.photo], `${id} plate photo`).toBeDefined()
      expect(plate.caption).toBeTruthy()
    }
  })

  it('never lets a hash, commit message or lane reach the rendered fields', () => {
    for (const c of commits) {
      for (const field of [c.company, c.role, c.period, c.periodShort, c.years, ...c.bullets]) {
        expect(field).not.toContain(c.hash)
        expect(field).not.toMatch(/^feat\(/)
        expect(field).not.toContain('feat/ms-cs')
      }
    }
  })
})

describe('markSkills (the bullet highlight)', () => {
  const schneider = commits.find((c) => c.id === 'schneider')!

  it('marks every verified label in the bullet, in order, and nothing else', () => {
    const segs = markSkills(schneider.bullets[0], ['python', 'flask', 'react', 'nodejs', 'mysql'])
    expect(segs.filter((s) => s.skill).map((s) => s.skill)).toEqual([
      'python',
      'flask',
      'react',
      'nodejs',
      'mysql',
    ])
    expect(segs.map((s) => s.text).join('')).toBe(schneider.bullets[0])
    expect(segs.find((s) => s.skill === 'nodejs')?.text).toBe('Node.js')
  })

  it('marks Prometheus/Grafana around the slash and leaves GitHub Actions alone', () => {
    const segs = markSkills(schneider.bullets[2], [
      'docker',
      'kubernetes',
      'jenkins',
      'prometheus',
      'grafana',
    ])
    expect(segs.filter((s) => s.skill).map((s) => s.text)).toEqual([
      'Docker',
      'Kubernetes',
      'Jenkins',
      'Prometheus',
      'Grafana',
    ])
    expect(segs.some((s) => s.text.includes('GitHub Actions') && !s.skill)).toBe(true)
  })

  it('returns the bullet untouched without skills or matches', () => {
    expect(markSkills('Nothing here.', [])).toEqual([{ text: 'Nothing here.' }])
    expect(markSkills('Nothing here.', ['grafana'])).toEqual([{ text: 'Nothing here.' }])
  })

  it('respects word boundaries', () => {
    expect(markSkills('Cloud and CloudWatch', ['cloudwatch']).filter((s) => s.skill)).toHaveLength(
      1
    )
    expect(
      markSkills('Reactive React', ['react'])
        .filter((s) => s.skill)
        .map((s) => s.text)
    ).toEqual(['React'])
  })
})

describe('figures (Cinzel lining numerals)', () => {
  it('splits digit runs with their suffixes', () => {
    expect(figures('Mentored 300+ students by 60%.')).toEqual([
      { text: 'Mentored ', figure: false },
      { text: '300+', figure: true },
      { text: ' students by ', figure: false },
      { text: '60%', figure: true },
      { text: '.', figure: false },
    ])
    expect(figures('used by 10,000+ employees').find((s) => s.figure)?.text).toBe('10,000+')
    expect(figures('no digits')).toEqual([{ text: 'no digits', figure: false }])
    // a list comma after a figure stays outside it
    expect(figures('S3, EC2, React 19,').filter((s) => s.figure).map((s) => s.text)).toEqual([
      '3',
      '2',
      '19',
    ])
  })
})

describe('Copy the citation (the IEEE paper)', () => {
  it('credits every author in the publisher\'s order, not the owner alone', () => {
    const bib = buildCitation()
    expect(bib).toContain(
      'author    = {D S Jayalakshmi and J Geetha and Abhishek Sen and Amit Kumar Dubey and Darshan R Konnur and S Priya}'
    )
    expect(bib).not.toContain(`author    = {${profile.name}}`)
    expect(bib).toContain('year      = {2021}')
    expect(bib).toContain(`doi       = {${profile.publication.doi}}`)
    expect(bib).toMatch(/^@inproceedings\{[a-z0-9]+,\n/)
    expect(bib.endsWith('\n}')).toBe(true)
  })
})
