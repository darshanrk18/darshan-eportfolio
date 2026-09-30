/**
 * v3 §1.7 / §3 — the top bar's visitor-language items (C1 chrome).
 *
 * Director call (a): the anchors stay `#about #skills #projects #experience
 * #contact`; the LABELS are section names (About · Skills · Work · Experience
 * · Contact), never file names (clutter law, BRIEF-R2 §1). Shared by the
 * Navbar (both skins), the MobileMenu and tests/chrome.test.ts. The anchors
 * are the same tuple as lib/commands/sections.ts SECTION_ANCHORS so the
 * scrollspy, the registry `go-*` commands and this list can never disagree.
 *
 * Pure data, dependency-free beyond the anchor type: safe to import from the
 * immediate bundle (it is a handful of strings).
 */

import { SECTION_ANCHORS, type SectionAnchor } from '@/lib/commands/sections'
import { profile } from '@/lib/data/profile'

export interface NavItem {
  anchor: SectionAnchor
  /** Visible label, visitor language ('Work' links to #projects). */
  label: string
}

const NAV_LABELS: Record<SectionAnchor, string> = {
  '#about': 'About',
  '#skills': 'Skills',
  '#projects': 'Work',
  '#experience': 'Experience',
  '#contact': 'Contact',
}

/** The five top-bar links, in page order. */
export const NAV_ITEMS: readonly NavItem[] = SECTION_ANCHORS.map((anchor) => ({
  anchor,
  label: NAV_LABELS[anchor],
}))

export interface SocialLink {
  /** Logo id in lib/data/logos.ts. */
  id: 'github' | 'linkedin'
  label: string
  href: string
}

/** The two icon links in the top bar's right cluster (real profile links only). */
export const SOCIAL_LINKS: readonly SocialLink[] = [
  { id: 'github', label: 'GitHub', href: profile.githubUrl },
  { id: 'linkedin', label: 'LinkedIn', href: profile.linkedinUrl },
]

/**
 * The scroll-to-top target. app/page.tsx renders a zero-height
 * `<div id="top">` sentinel as the first thing on the home page so
 * scrollToAnchor('#top') (Lenis-aware, focus-managed) has a real element;
 * plain `href="#top"` still works without JS (the HTML spec special-cases
 * the `top` fragment).
 */
export const TOP_ANCHOR = '#top'
