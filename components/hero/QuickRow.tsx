'use client'

/**
 * The hero's quick actions (v3 S1, under the CTAs): copy the email · the
 * résumé. Visitor language only (no file names — the clutter law); the
 * résumé link keeps its native download behaviour (works without JS after
 * SSR) and only adds analytics. v2 §6.5: the résumé link is magnetic and
 * uses `.link-draw` for the underline draw-in (chrome.css); both degrade to
 * plain links on coarse pointers / reduced motion. GitHub and LinkedIn moved
 * to the top bar (C1) and the PRINT cover's CTAs.
 */

import { useRef } from 'react'
import { useMagnetic } from '@/lib/motion/useMagnetic'
import { profile } from '@/lib/data/profile'
import { trackResumeDownloaded } from '@/lib/utils/analytics'
import CopyEmailInline from './CopyEmailInline'

export default function QuickRow() {
  const ref = useRef<HTMLAnchorElement>(null)
  useMagnetic(ref, { strength: 0.25, radius: 80 })

  return (
    <ul className="hero-quick" data-component="QuickRow" data-island="client">
      <li>
        <CopyEmailInline />
      </li>
      <li>
        <a
          ref={ref}
          className="link-draw"
          href={profile.resumePdf}
          download="darshan-konnur.pdf"
          onClick={() => trackResumeDownloaded('hero')}
        >
          <span data-mag-label>Résumé</span>
        </a>
      </li>
    </ul>
  )
}
