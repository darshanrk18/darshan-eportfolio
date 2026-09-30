'use client'

/**
 * Résumé ↓ · GitHub ↗ · LinkedIn ↗ (S6 §2 C4 / P6 §B5). One markup, two
 * skins (styles/v3/contact.css `.ct-links*`): SCREEN sets them as hairline
 * links inside the letter beside "Write to me"; PRINT draws them as three
 * ink buttons under the console. Contact.tsx renders the row twice (one
 * copy per edition, the other hidden by CSS) because the two frames put it
 * in different boxes. The résumé link is a real download and reports
 * `resume_downloaded`; the logos are official marks beside their names.
 */

import Logo from '@/components/skills/Logo'
import { profile } from '@/lib/data/profile'
import { trackResumeDownloaded } from '@/lib/utils/analytics'
import { contactCopy } from './copy'

function Arrow({ kind }: { kind: 'down' | 'out' }) {
  return kind === 'down' ? (
    <svg className="ct-lk-arrow" width="9" height="11" viewBox="0 0 9 11" aria-hidden="true">
      <path d="M4.5 1v8.5M1 6l3.5 3.5L8 6" fill="none" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  ) : (
    <svg className="ct-lk-arrow" width="9" height="9" viewBox="0 0 9 9" aria-hidden="true">
      <path d="M1.5 7.5L7.5 1.5M3 1.5h4.5V6" fill="none" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  )
}

export default function ContactLinks({ className }: { className?: string }) {
  return (
    <ul className={['ct-links', className].filter(Boolean).join(' ')}>
      <li>
        <a
          className="ct-lk is-resume"
          href={profile.resumePdf}
          download="darshan-konnur.pdf"
          aria-label={contactCopy.shared.resumeAria}
          onClick={() => trackResumeDownloaded('contact')}
        >
          <svg className="ct-lk-ic" width="12" height="15" viewBox="0 0 12 15" aria-hidden="true">
            <path
              d="M1 1h6.5L11 4.5V14H1zM7.5 1v3.5H11M3.5 7.5h5M3.5 10.5h5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinejoin="round"
            />
          </svg>
          <span>{contactCopy.shared.resume}</span>
          <Arrow kind="down" />
        </a>
      </li>
      <li>
        <a className="ct-lk" href={profile.githubUrl} target="_blank" rel="noopener noreferrer">
          <Logo id="github" size={16} />
          <span>{contactCopy.shared.github}</span>
          <Arrow kind="out" />
        </a>
      </li>
      <li>
        <a className="ct-lk" href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer">
          <Logo id="linkedin" size={16} />
          <span>{contactCopy.shared.linkedin}</span>
          <Arrow kind="out" />
        </a>
      </li>
    </ul>
  )
}
