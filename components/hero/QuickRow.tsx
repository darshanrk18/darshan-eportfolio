'use client'

/**
 * Recruiter quick row (spec §4.3): copy email · resume.pdf ↓ · github ↗ ·
 * linkedin ↗. One click each, no cleverness. The resume link keeps its native
 * download behavior (works without JS after SSR) and only adds analytics.
 */

import { profile } from '@/lib/data/profile'
import { trackResumeDownloaded } from '@/lib/utils/analytics'
import CopyEmailInline from './CopyEmailInline'

const LINK_CLASS =
  'text-secondary transition-colors hover:text-primary underline-offset-4 hover:underline'

export default function QuickRow() {
  return (
    <ul className="type-label-sm flex flex-wrap gap-x-6 gap-y-2">
      <li>
        <CopyEmailInline />
      </li>
      <li>
        <a
          href={profile.resumePdf}
          download="darshan-konnur.pdf"
          className={LINK_CLASS}
          onClick={() => trackResumeDownloaded('hero')}
        >
          resume.pdf ↓
        </a>
      </li>
      <li>
        <a
          href={profile.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={LINK_CLASS}
        >
          github ↗
        </a>
      </li>
      <li>
        <a
          href={profile.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={LINK_CLASS}
        >
          linkedin ↗
        </a>
      </li>
    </ul>
  )
}
