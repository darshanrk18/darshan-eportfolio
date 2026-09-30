/**
 * /cv — design A with the owner's résumé (lib/data/resume.ts). Content
 * rules (every project has bullets and the right links, the résumé's
 * wording, no phone number, no grade figure), the zero-JS contract (no
 * 'use client' anywhere in the page's import graph, the résumé data never
 * reaches a client module) and the paper contract (every width query in
 * cv.css is screen-only, paper forces a light page).
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import CvPage from '@/app/cv/page'
import { commits } from '@/lib/data/experience'
import { profile } from '@/lib/data/profile'
import { projects } from '@/lib/data/projects'
import { publicationRecord } from '@/lib/data/publication'
import {
  plainText,
  printAddress,
  projectLinks,
  resumeContact,
  resumeEducation,
  resumeExperience,
  resumeProjects,
  resumeSkills,
  richSegments,
  roleLine,
} from '@/lib/data/resume'

const ROOT = path.resolve(__dirname, '..')
const read = (rel: string) => readFileSync(path.join(ROOT, rel), 'utf8')

const html = renderToStaticMarkup(createElement(CvPage))
/** What a reader sees: tags dropped, entities decoded enough for matching. */
const visible = html
  .replace(/<script[\s\S]*?<\/script>/g, ' ')
  .replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&')
  .replace(/&#x27;/g, "'")
  .replace(/&quot;/g, '"')

/** Any US/intl phone shape (555-010-0199, (555) 010 0199, +1 555.010.0199, a bare 10-digit run) or a tel: link. */
const PHONE = /(?:\+?\d{1,2}[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}|tel:|\b\d{10}\b/
/** Grade figures: GPA / CGPA or an "x.xx / 4" style score. */
const GRADE = /\bC?GPA\b|\b\d\.\d{1,2}\s*\/\s*(?:4|10)(?:\.0+)?\b/i

describe('résumé content', () => {
  it('lists all seven projects newest first, each with at least one bullet', () => {
    expect(resumeProjects.map((p) => p.slug)).toEqual([
      'ticket-forge',
      'trackfolio',
      'triplay-ai',
      'expense-share',
      'calendar-java',
      'box-archive',
      'ieee-mip-optimizer',
    ])
    const years = resumeProjects.map((p) => Number(p.year))
    expect([...years].sort((a, b) => b - a)).toEqual(years)
    for (const p of resumeProjects) {
      expect(p.bullets.length, p.slug).toBeGreaterThan(0)
      expect(p.stack.length, p.slug).toBeGreaterThan(0)
      for (const b of p.bullets) expect(plainText(b).trim().length, p.slug).toBeGreaterThan(20)
    }
  })

  it('uses the résumé titles and stacks', () => {
    const bySlug = Object.fromEntries(resumeProjects.map((p) => [p.slug, p]))
    expect(bySlug['calendar-java'].title).toBe('Calendar Application')
    // one spelling on the page: the publisher's, as the Publication section has it
    expect(bySlug['ieee-mip-optimizer'].title).toBe(profile.publication.title)
    expect(profile.publication.title).toBe(
      'Allocation Optimization of Medical Samples For Distributed Testing'
    )
    expect(bySlug['triplay-ai'].stack).toEqual([
      'Python',
      'OpenCV',
      'MediaPipe',
      'NumPy',
      'Pandas',
      'Pygame',
    ])
    expect(bySlug['ticket-forge'].tag).toEqual({
      kind: 'award',
      text: '3rd Place, Google – MLOps Project Expo',
    })
  })

  it("Trackfolio's bullets are the site's own build and result lines, with the Live tag", () => {
    const site = projects.find((p) => p.slug === 'trackfolio')!
    const cv = resumeProjects.find((p) => p.slug === 'trackfolio')!
    expect(cv.bullets).toEqual([site.build, site.result])
    expect(cv.stack).toEqual(site.stack)
    expect(cv.tag).toEqual({ kind: 'live', text: 'Live' })
  })

  it('links every project to its case file; source only where the repository is public', () => {
    for (const p of resumeProjects) {
      const site = projects.find((s) => s.slug === p.slug)!
      const links = projectLinks(p.slug)
      expect(links[0]).toMatchObject({ kind: 'case', label: 'case file', href: `/work/${p.slug}` })
      const source = links.find((l) => l.kind === 'source')
      if (site.repoUrl) expect(source?.href, p.slug).toBe(site.repoUrl)
      else expect(source, p.slug).toBeUndefined()
      expect(links.some((l) => l.kind === 'paper'), p.slug).toBe(p.slug === 'ieee-mip-optimizer')
    }
    const withSource = resumeProjects
      .filter((p) => projectLinks(p.slug).some((l) => l.kind === 'source'))
      .map((p) => p.slug)
    expect(withSource).toEqual(['ticket-forge', 'trackfolio'])
    expect(projectLinks('trackfolio').map((l) => l.label)).toEqual(['case file', 'source', 'live'])
    expect(projectLinks('ticket-forge').map((l) => l.label)).toEqual(['case file', 'source', 'demo'])
    expect(projectLinks('ieee-mip-optimizer').map((l) => l.label)).toEqual(['case file', 'paper'])
  })

  it('prints addresses without protocol or www', () => {
    expect(printAddress('https://www.youtube.com/watch?v=vs2jPlST66A')).toBe(
      'youtube.com/watch?v=vs2jPlST66A'
    )
    expect(printAddress('/work/box-archive')).toMatch(/^[a-z0-9.-]+\/work\/box-archive$/)
  })

  it('names the jobs and roles in the résumé’s words, with the two kept site facts', () => {
    expect(resumeExperience.map((j) => j.company)).toEqual([
      'Amazon Web Services (AWS)',
      'Khoury College of Computer Sciences, Northeastern University',
      'Schneider Electric',
    ])
    expect(resumeExperience.map(roleLine)).toEqual([
      'Software Development Engineer Intern',
      'Graduate Teaching Assistant, CS5010 Programming Design Paradigm',
      'Digital Workplace Engineer',
    ])
    expect(resumeExperience.map((j) => j.period)).toEqual([
      'Jun 2026 – Aug 2026',
      'Sep 2025 – Dec 2025',
      'Feb 2021 – Nov 2023',
    ])
    expect(resumeExperience.map((j) => j.bullets.length)).toEqual([3, 1, 3])
    const aws = resumeExperience[0]
    expect(aws.outcome).toBe('Returned with a full-time SDE offer.')
    expect(aws.outcome).toBe(commits.find((c) => c.id === 'aws-intern')?.outcome)
    expect(resumeExperience[2].award).toBe('SURGE Award')
    // The incoming role is the status line, not an experience row.
    expect(resumeExperience.some((j) => /starts/i.test(j.period))).toBe(false)
  })

  it('keeps the résumé’s bold metrics as bold runs', () => {
    const bold = resumeExperience
      .flatMap((j) => j.bullets)
      .flatMap((b) => richSegments(b).filter((s) => s.bold).map((s) => s.text))
    expect(bold).toEqual(['100% test coverage', '300+ graduate students', '10,000+ employees', '30%', '60%'])
    expect(richSegments('a **b** c')).toEqual([
      { text: 'a ', bold: false },
      { text: 'b', bold: true },
      { text: ' c', bold: false },
    ])
    expect(plainText('a **b** c')).toBe('a b c')
  })

  it('reads the education and skills as the résumé does', () => {
    expect(resumeEducation[0]).toEqual({
      school: 'Northeastern University',
      degree: 'Master of Science in Computer Science',
      period: 'Jan 2025 – Dec 2026 (Expected)',
      location: 'Boston, MA',
    })
    expect(resumeEducation[1].degree).toBe('Bachelor of Engineering in Computer Science')
    expect(resumeSkills.map((r) => r.label)).toEqual([
      'Languages',
      'Backend',
      'Frontend & Databases',
      'Cloud',
      'DevOps',
      'Tools & Testing',
    ])
  })

  it('offers email, GitHub and LinkedIn — and no phone number', () => {
    expect(resumeContact.filter((c) => !c.paperOnly).map((c) => c.label)).toEqual([
      'Email',
      'GitHub',
      'LinkedIn',
    ])
    for (const c of resumeContact) expect(c.href).not.toMatch(/^tel:/)
  })
})

describe('the rendered page', () => {
  it('has one h1 (the full name), an h2 per section and an h3 per entry', () => {
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1)
    expect(html).toMatch(/<h1 class="cv-name">.*Darshan.*Ravindra.*Konnur.*<\/h1>/)
    expect(html.match(/<h2[\s>]/g)).toHaveLength(5)
    const entries = resumeExperience.length + resumeProjects.length + 1
    const rail = resumeSkills.length + resumeEducation.length
    expect(html.match(/<h3[\s>]/g)).toHaveLength(entries + rail)
  })

  it('carries the deep links', () => {
    for (const id of ['experience', 'projects', 'skills', 'education', 'publication']) {
      expect(html).toContain(`id="${id}"`)
      expect(html).toContain(`href="#${id}"`)
    }
  })

  it('shows the status line, the MS date and the downloads', () => {
    expect(visible).toContain(profile.status)
    expect(visible).toContain('Dec 2026 (Expected)')
    expect(html).toContain(`href="${profile.resumePdf}"`)
    expect(visible).toContain('Download résumé (PDF)')
    expect(visible).toContain('← back to site')
    expect(html).toContain('<b>100% test coverage</b>')
  })

  it('spells the paper’s title one way, the publisher’s, in both places', () => {
    const title = profile.publication.title
    expect(visible.split(title).length - 1).toBe(2) // the project entry and the Publication section
    expect(visible).not.toMatch(/Samples for Distributed Testing/)
  })

  it('drops the first-person lede and the duplicate "starts Jan 2027" row', () => {
    expect(visible).not.toContain(profile.heroLede)
    expect(visible).not.toMatch(/starts Jan 2027/i)
  })

  it('cites the paper with every author in the publisher’s order', () => {
    const cite = visible.slice(visible.indexOf(publicationRecord.authors[0]))
    let at = 0
    for (const a of publicationRecord.authors) {
      const i = cite.indexOf(a, at)
      expect(i, a).toBeGreaterThanOrEqual(at)
      at = i + a.length
    }
    expect(visible).toContain('pp. 27–32')
    expect(visible).toContain(`DOI: ${profile.publication.doi}`)
    expect(visible).toContain('read paper')
  })

  it('loads the photo as one edition-keyed background, never two images', () => {
    expect(html).not.toMatch(/<img\b/)
    expect(html).toMatch(/class="cv-photo" role="img" aria-label="Darshan Konnur"/)
    const css = read('styles/v3/cv.css')
    expect(css).toContain("url('/photo/portrait-41-660.webp')")
    expect(css).toMatch(/html\[data-edition='print'\] \.cv-photo \{\s*background-image: url\('\/photo\/portrait-paper-660\.webp'\)/)
  })

  it('keeps the ScholarlyArticle structured data', () => {
    const ld = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)
    expect(ld).not.toBeNull()
    const data = JSON.parse(ld![1])
    expect(data['@type']).toBe('ScholarlyArticle')
    expect(data.author).toHaveLength(publicationRecord.authors.length)
  })

  it('has no phone number and no grade figure anywhere', () => {
    expect(html).not.toMatch(PHONE)
    expect(html).not.toMatch(GRADE)
    for (const file of ['app/cv/page.tsx', 'lib/data/resume.ts', 'styles/v3/cv.css']) {
      expect(read(file), file).not.toMatch(PHONE)
      expect(read(file), file).not.toMatch(/\bC?GPA\b/)
    }
  })

  it('sets digits as plain text: SCREEN’s body stack draws them, no figure wrapper', () => {
    expect(html).not.toMatch(/class="cv-n"/)
    expect(read('app/cv/page.tsx')).not.toMatch(/\bfigures\(|experience\/marks/)
    expect(read('styles/v3/cv.css')).not.toMatch(/\.cv-n\b/)
    // the handle reads as one run of text in the body face
    expect(html).toContain('>github.com/darshanrk18</a>')
    expect(html).toContain('<span class="cv-course">CS5010 Programming Design Paradigm</span>')
  })

  it('fetches the SCREEN digits face with the HTML, so a late swap never moves a deep link', () => {
    const face = read('app/globals.css').match(
      /font-family: 'Screen Digits';\s*src: url\('([^']+)'\)/
    )![1]
    const src = read('app/cv/page.tsx')
    expect(src).toContain(`const DIGITS_FACE = '${face}'`)
    expect(src).toMatch(
      /preload\(DIGITS_FACE, \{ as: 'font', type: 'font\/woff2', crossOrigin: 'anonymous' \}\)/
    )
  })

  it('keeps every skill item whole; the AWS list breaks only after its commas', () => {
    const items = [...html.matchAll(/<ul class="cv-items">(.*?)<\/ul>/g)].flatMap((m) =>
      [...m[1].matchAll(/<li( class="is-list")?>(.*?)<\/li>/g)].map((li) => ({
        list: Boolean(li[1]),
        inner: li[2],
      }))
    )
    expect(items.map((i) => i.inner.replace(/<[^>]+>/g, ''))).toEqual(
      resumeSkills.flatMap((r) => r.items)
    )
    for (const i of items) {
      if (i.list) {
        const runs = [...i.inner.matchAll(/<span>(.*?)<\/span>/g)].map((m) => m[1])
        for (const r of runs.slice(0, -1)) expect(r).toMatch(/,$/)
        expect(runs.join(' ')).toBe(i.inner.replace(/<[^>]+>/g, ''))
      } else expect(i.inner).not.toContain('<')
    }
    expect(items.filter((i) => i.list).map((i) => i.inner.replace(/<[^>]+>/g, ''))).toEqual([
      'AWS (Lambda, S3, EC2, ECS, ECR, IAM, CDK)',
    ])
  })

  it('keeps every date range whole', () => {
    const periods = [
      ...resumeExperience.map((j) => j.period),
      ...resumeEducation.map((e) => e.period),
    ]
    for (const p of periods) expect(html).toContain(`<span class="cv-date">${p}</span>`)
    // every margin date is wrapped, and the education line never breaks before its dot
    for (const m of html.matchAll(/<p class="cv-when">(.*?)<\/p>/g)) {
      expect(m[1]).toMatch(/^<span class="cv-date">/)
    }
    expect(html).toContain('Boston, MA\u00a0· <span class="cv-date">')
  })

  it('reads (and tabs) in visual order: header, story, reference, running head', () => {
    const at = (cls: string) => {
      const i = html.indexOf(`class="${cls}`)
      expect(i, cls).toBeGreaterThan(-1)
      return i
    }
    const order = ['cv-id', 'cv-jump', 'cv-story', 'cv-ref', 'cv-toc', 'cv-foot'].map(at)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
    expect(html).not.toMatch(/tabindex=/i)
    // both section navs carry all five links; CSS shows one per width
    for (const nav of ['cv-jump', 'cv-toc']) {
      const block = html.slice(at(nav), html.indexOf('</nav>', at(nav)))
      for (const id of ['experience', 'projects', 'publication', 'skills', 'education']) {
        expect(block, `${nav} #${id}`).toContain(`href="#${id}"`)
      }
    }
  })

  it('keeps the TA role’s comma on every width', () => {
    expect(html).toContain(
      'Graduate Teaching Assistant<span class="cv-sep">, </span><span class="cv-course">'
    )
  })

  it('shows no internals', () => {
    expect(visible).not.toMatch(/\.webp|\.json|\.tsx?\b|\bgz\b|\bSHA\b|fps|localhost|lib\/data/i)
  })
})

/* -------------------------------------------------------------------------- */
/* Zero client JS                                                             */
/* -------------------------------------------------------------------------- */

function resolveImport(from: string, spec: string): string | null {
  let base: string
  if (spec.startsWith('@/')) base = path.join(ROOT, spec.slice(2))
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(from), spec)
  else return null
  for (const ext of ['', '.ts', '.tsx', '/index.ts', '/index.tsx']) {
    const f = base + ext
    if (existsSync(f) && statSync(f).isFile()) return f
  }
  return null
}

/** Every local module the page reaches, and every package it names. */
function importGraph(entry: string) {
  const files = new Set<string>()
  const packages = new Set<string>()
  const queue = [entry]
  while (queue.length) {
    const file = queue.pop()!
    if (files.has(file)) continue
    files.add(file)
    if (!/\.tsx?$/.test(file)) continue
    const src = readFileSync(file, 'utf8')
    for (const m of src.matchAll(/^\s*import\s+(type\s+)?(?:[^'"]*?from\s+)?['"]([^'"]+)['"]/gm)) {
      if (m[1]) continue // type-only imports vanish at build time
      const next = resolveImport(file, m[2])
      if (next) queue.push(next)
      else packages.add(m[2])
    }
  }
  return { files: [...files], packages: [...packages] }
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const f = path.join(dir, name)
    return statSync(f).isDirectory() ? walk(f) : [f]
  })
}

describe('zero client JS', () => {
  const graph = importGraph(path.join(ROOT, 'app/cv/page.tsx'))

  it("no module the page imports is a client module", () => {
    expect(graph.files.length).toBeGreaterThan(3)
    for (const f of graph.files.filter((x) => /\.tsx?$/.test(x))) {
      expect(readFileSync(f, 'utf8'), path.relative(ROOT, f)).not.toMatch(/^\s*['"]use client['"]/m)
    }
    for (const f of walk(path.join(ROOT, 'app/cv'))) {
      expect(readFileSync(f, 'utf8'), path.relative(ROOT, f)).not.toMatch(/^\s*['"]use client['"]/m)
    }
  })

  it('pulls in no client runtime (next/link, next/dynamic, next/image, next/script)', () => {
    for (const p of ['next/link', 'next/dynamic', 'next/image', 'next/script']) {
      expect(graph.packages).not.toContain(p)
    }
  })

  it('keeps the résumé data and the /cv stylesheet on /cv alone', () => {
    const importers = (needle: RegExp) =>
      ['app', 'components', 'lib']
        .flatMap((d) => walk(path.join(ROOT, d)))
        .filter((f) => /\.tsx?$/.test(f) && needle.test(readFileSync(f, 'utf8')))
        .map((f) => path.relative(ROOT, f))
    expect(importers(/from ['"]@\/lib\/data\/resume['"]|from ['"]\.\/resume['"]/)).toEqual([
      'app/cv/page.tsx',
    ])
    expect(importers(/styles\/v3\/cv\.css/)).toEqual(['app/cv/page.tsx'])
  })
})

/* -------------------------------------------------------------------------- */
/* Paper                                                                      */
/* -------------------------------------------------------------------------- */

describe('cv.css', () => {
  const css = read('styles/v3/cv.css').replace(/\/\*[\s\S]*?\*\//g, '')

  it('scopes every width query to screen, so paper never takes a phone layout', () => {
    const queries = [...css.matchAll(/@media([^{]+)\{/g)].map((m) => m[1].trim())
    const widthQueries = queries.filter((q) => /width/.test(q))
    expect(widthQueries.length).toBeGreaterThan(3)
    for (const q of widthQueries) expect(q, q).toMatch(/^screen and /)
  })

  it('prints on a light page whatever the edition, with page numbers', () => {
    const paper = css.slice(css.indexOf('@media print'))
    expect(paper).toMatch(/color-scheme:\s*light\s*!important/)
    expect(paper).toMatch(/background:\s*#fff\s*!important/)
    expect(css).toMatch(/@bottom-right\s*\{\s*content:\s*counter\(page\)/)
    // the running footer names the owner exactly as the data does
    expect(css).toContain(`content: '${profile.name}'`)
  })

  it('lets the running head stick in both editions: no skin rule positions the glass', () => {
    // An edition-scoped `.cv-glass { position: … }` outranks the desktop
    // `.cv-toc { position: sticky }` (the toc is glass in SCREEN).
    const rules = [...css.matchAll(/([^{};]*\.cv-(?:glass|toc))\s*\{([^{}]*)\}/g)]
    const sticky = rules.filter((m) => /position:\s*sticky/.test(m[2]))
    expect(sticky.length).toBe(1)
    for (const m of rules) expect(m[2], m[1]).not.toMatch(/position:\s*(relative|static|absolute)/)
  })

  it('shows the running head from 1100 px and the jump row below it, never both', () => {
    const block = (query: string) => {
      const i = css.indexOf(`@media ${query} {`)
      expect(i, query).toBeGreaterThan(-1)
      return css.slice(i, css.indexOf('\n}', i))
    }
    expect(block('screen')).toMatch(/\.cv-jump\s*\{\s*display:\s*none;/)
    const below = block('screen and (max-width: 1099px)')
    expect(below).toMatch(/\.cv-toc\s*\{\s*display:\s*none;/)
    expect(below).toMatch(/\.cv-jump\s*\{\s*display:\s*block;/)
    expect(css.slice(css.indexOf('@media print'))).toMatch(/\.cv-toc,\s*\.cv-jump,/)
  })

  it('never breaks a skill item or a date range, on screen or paper', () => {
    // top level (every medium), not inside an @media block
    const topLevel = (needle: string) => {
      const i = css.indexOf(needle)
      expect(i, needle).toBeGreaterThan(-1)
      const before = css.slice(0, i)
      return (before.match(/\{/g)?.length ?? 0) === (before.match(/\}/g)?.length ?? 0)
    }
    expect(css).toMatch(
      /\.cv-items li,\s*\.cv-stack li,\s*\.cv-items li\.is-list > span\s*\{\s*white-space:\s*nowrap;/
    )
    expect(topLevel('.cv-items li,\n.cv-stack li,\n.cv-items li.is-list > span')).toBe(true)
    expect(css).toMatch(/\.cv-date\s*\{\s*white-space:\s*nowrap;/)
    expect(topLevel('.cv-date {')).toBe(true)
  })

  it('keeps the TA comma and the one-line download button in the stylesheet', () => {
    expect(css).not.toMatch(/\.cv-sep\s*\{[^}]*display:\s*none/)
    expect(css).toMatch(/\.cv-btn\s*\{[^}]*white-space:\s*nowrap;/)
  })

  it('makes the SCREEN bold runs heavier and brighter, never champagne', () => {
    const skin = css.slice(css.indexOf("html:not([data-edition='print']) {"))
    const rule = skin.match(/\.cv b\s*\{([^}]*)\}/)![1]
    expect(rule).toMatch(/font-weight:\s*700/)
    expect(rule).not.toMatch(/champ|accent-signal|d8c49a/i)
  })

  it('sends phones the 440 px portrait, one grade per edition', () => {
    const phone = css.slice(css.indexOf('@media screen and (max-width: 719px) {'))
    expect(phone.slice(0, phone.indexOf('\n}'))).toMatch(
      /\.cv-photo\s*\{\s*background-image: url\('\/photo\/portrait-41-440\.webp'\);\s*\}\s*html\[data-edition='print'\] \.cv-photo\s*\{\s*background-image: url\('\/photo\/portrait-paper-440\.webp'\);/
    )
  })

  it('keeps its page rules on the named page cv, so they never reach a print of /', () => {
    const pages = [...css.matchAll(/@page([^{]*)\{/g)].map((m) => m[1].trim())
    expect(pages).toEqual(['cv', 'cv:first'])
    const paper = css.slice(css.indexOf('@media print'))
    expect(paper).toMatch(/\n  \.cv \{[^}]*\bpage:\s*cv;/)
    expect(css).toMatch(/@page cv \{\s*size:\s*Letter;/)
    // print-only hiding of site chrome is scoped to /cv
    expect(paper).not.toMatch(/\n  \.skip-link[,\s{]/)
  })

  it('never opens a paper page with a rule, prints the paper address once, sets text near 10 pt', () => {
    const paper = css.slice(css.indexOf('@media print'))
    expect(paper).not.toMatch(/\.cv-entry \+ \.cv-entry/)
    expect(paper).toMatch(/\.cv-entry:not\(:last-child\)\s*\{\s*border-bottom:/)
    expect(paper).toMatch(/\.cv-proj \.cv-links \.is-paper/)
    const body = Number(paper.match(/\n  \.cv \{[^}]*font: 400 ([\d.]+)pt/)![1])
    expect(body).toBeGreaterThanOrEqual(9.5)
    expect(body).toBeLessThanOrEqual(10)
    // the project links carry the paper, the Publication entry prints its address
    expect(projectLinks('ieee-mip-optimizer').map((l) => l.kind)).toContain('paper')
    expect(html).toMatch(/class="cv-entry cv-pub"[\s\S]*class="is-paper" href="[^"]+" data-print="ieeexplore/)
  })

  it('sets paper text in Archivo and Plex Mono, never the SCREEN faces', () => {
    const paper = css.slice(css.indexOf('@media print'))
    expect(paper).toContain('--cv-sans: var(--font-archivo)')
    expect(paper).toContain('--cv-mono: var(--font-plexmono)')
    expect(paper).not.toMatch(/--font-(cinzel|marcellus|display|body|slab)\b/)
  })
})
