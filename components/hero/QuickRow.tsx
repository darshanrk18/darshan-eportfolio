'use client'

/**
 * Recruiter quick row (spec §4.3): copy email · resume.pdf ↓ · github ↗ ·
 * linkedin ↗. One click each, no cleverness. The resume link keeps its native
 * download behavior (works without JS after SSR) and only adds analytics.
 * v2 §6.5: the three links are magnetic (named in the ~10-element scope) and
 * use `.link-draw` for the underline draw-in (chrome.css); both degrade to
 * plain links on coarse pointers / reduced motion.
 */

import { useRef, type AnchorHTMLAttributes, type ReactNode } from 'react'
import { useMagnetic } from '@/lib/motion/useMagnetic'
import { profile } from '@/lib/data/profile'
import { trackResumeDownloaded } from '@/lib/utils/analytics'
import CopyEmailInline from './CopyEmailInline'

const LINK_CLASS = 'link-draw text-secondary transition-colors hover:text-primary'

function MagneticLink({
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) {
  const ref = useRef<HTMLAnchorElement>(null)
  useMagnetic(ref, { strength: 0.25, radius: 80 })
  return (
    <a ref={ref} className={LINK_CLASS} {...rest}>
      <span data-mag-label>{children}</span>
    </a>
  )
}

export default function QuickRow() {
  return (
    <ul
      className="type-label-sm flex flex-wrap gap-x-6 gap-y-2"
      data-component="QuickRow"
      data-island="client"
    >
      <li>
        <CopyEmailInline />
      </li>
      <li>
        <MagneticLink
          href={profile.resumePdf}
          download="darshan-konnur.pdf"
          onClick={() => trackResumeDownloaded('hero')}
        >
          resume.pdf ↓
        </MagneticLink>
      </li>
      <li>
        <MagneticLink href={profile.githubUrl} target="_blank" rel="noopener noreferrer">
          github ↗
        </MagneticLink>
      </li>
      <li>
        <MagneticLink href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer">
          linkedin ↗
        </MagneticLink>
      </li>
    </ul>
  )
}
