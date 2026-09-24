/**
 * Section anchors + nav-tab metadata (spec §4.2) — split out of registry.ts
 * so the always-mounted chrome (Navbar scrollspy/tabs, MobileMenu, store
 * types) can import these few constants WITHOUT pulling the full command
 * registry (and its projects/skills data graph) into the immediate `/`
 * chunk (§12.1: only the itemized v2 glue rides first-load). registry.ts
 * re-exports everything here, so lazy surfaces and tests are unaffected.
 */

/** The five section anchors, in page order. Every scrollTo target must be one. */
export const SECTION_ANCHORS = [
  '#about',
  '#skills',
  '#projects',
  '#experience',
  '#contact',
] as const

export type SectionAnchor = (typeof SECTION_ANCHORS)[number]

/** Nav-tab metadata (§4.2): filename-styled tabs ↔ anchors ↔ header rows. */
export const sectionTabs: readonly {
  anchor: SectionAnchor
  /** Nav tab label, e.g. 'about.md'. */
  tab: string
  /** Section header index, e.g. '01'. */
  index: string
  /** Section header name, e.g. 'ABOUT'. */
  name: string
}[] = [
  { anchor: '#about', tab: 'about.md', index: '01', name: 'ABOUT' },
  { anchor: '#skills', tab: 'skills.json', index: '02', name: 'SKILLS' },
  { anchor: '#projects', tab: 'projects/', index: '03', name: 'PROJECTS' },
  { anchor: '#experience', tab: 'experience.log', index: '04', name: 'EXPERIENCE' },
  { anchor: '#contact', tab: 'contact.sh', index: '05', name: 'CONTACT' },
]
