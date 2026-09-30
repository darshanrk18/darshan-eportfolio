'use client'

/**
 * Contact primary actions (spec §4.8; v3 S6 §2 C3–C4 / P6 §B3d–f) — the
 * 30-second path, one DOM, two skins (styles/v3/contact.css):
 *   the email address as a real mailto link + a copy button that swaps to
 *   a check and "Copied" for 1.6 s (aria-live), with the v2 12-dot micro-
 *   burst from the click point (once per session, never under reduced
 *   motion);
 *   PRINT's "RE:" picker (a real radio group — A role / A project / Just
 *   hello) that sets the mailto subject of the primary button; in SCREEN
 *   the picker is hidden and the subject is not applied;
 *   the primary: "Write to me" (SCREEN, champagne) / "WRITE HIM" (PRINT,
 *   red, hanging off the envelope's corner) — the ONE primary of the view;
 *   the SCREEN copy of Résumé / GitHub / LinkedIn (PRINT re-renders them
 *   under the console — Contact.tsx).
 */

import { useEffect, useRef, useState } from 'react'
import EdText from '@/components/projects/EdText'
import { useEdition } from '@/components/projects/useEdition'
import { copyEmailAction } from '@/lib/commands/context'
import { profile } from '@/lib/data/profile'
import { EASE_OUT_EXPO } from '@/lib/motion/tokens'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'
import ContactLinks from './ContactLinks'
import { contactCopy, writeHref } from './copy'

/** Page-session latch: the micro-burst fires once per session (§4.8). */
let burstFired = false

function fireBurst(x: number, y: number): void {
  if (burstFired || typeof document === 'undefined') return
  burstFired = true

  const host = document.createElement('div')
  host.setAttribute('aria-hidden', 'true')
  host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:var(--z-toast)'
  document.body.appendChild(host)

  const easing = `cubic-bezier(${EASE_OUT_EXPO.join(', ')})`
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('span')
    p.style.cssText =
      `position:absolute;left:${x}px;top:${y}px;width:4px;height:4px;` +
      'border-radius:999px;background:var(--accent-signal)'
    host.appendChild(p)
    if (typeof p.animate !== 'function') continue
    const angle = (i / 12) * Math.PI * 2
    const dist = 36 + (i % 3) * 14
    const dx = Math.cos(angle) * dist
    const dy = Math.sin(angle) * dist
    p.animate(
      [
        { transform: 'translate(-50%, -50%)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`, opacity: 0 },
      ],
      { duration: 600, easing, fill: 'forwards' },
    )
  }
  window.setTimeout(() => host.remove(), 650)
}

const COPIED_MS = 1600

export default function ContactActions() {
  const [copied, setCopied] = useState(false)
  const [subject, setSubject] = useState<string>(contactCopy.print.subjects[0].value)
  const reduced = usePrefersReducedMotion()
  const edition = useEdition()
  const timerRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    },
    [],
  )

  async function onCopyEmail(e: React.MouseEvent<HTMLButtonElement>) {
    // Keyboard activation reports (0,0); burst from the button centre instead.
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX || rect.left + rect.width / 2
    const y = e.clientY || rect.top + rect.height / 2
    await copyEmailAction(profile.email)
    if (!reduced) fireBurst(x, y)
    setCopied(true)
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setCopied(false), COPIED_MS)
  }

  const subjectLabel = contactCopy.print.subjects.find((s) => s.value === subject)?.label
  const href = writeHref(edition === 'print' ? subjectLabel : null)

  return (
    <div className="ct-actions" data-component="ContactActions" data-island="client">
      <p className="ct-addr-row">
        <a className="ct-addr" href={`mailto:${profile.email}`}>
          {profile.email}
        </a>
        <button
          type="button"
          className="ct-copy"
          data-copied={copied ? '' : undefined}
          aria-label={copied ? contactCopy.shared.copied : undefined}
          onClick={onCopyEmail}
        >
          {copied ? (
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M2.5 7.5l3 3 6-6.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <rect x="4.5" y="4.5" width="8" height="8" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.1" />
              <path d="M9.5 4.5V2.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" fill="none" stroke="currentColor" strokeWidth="1.1" />
            </svg>
          )}
          <span className="sr-only">
            <EdText screen={contactCopy.screen.copyEmail} print={contactCopy.print.copyEmail} />
          </span>
        </button>
        <span className="ct-copied" aria-live="polite">
          {copied ? contactCopy.shared.copied : ''}
        </span>
      </p>

      {/* P6 §B3e — the RE: picker (hidden in SCREEN; keyboard-real radios). */}
      <div className="ct-re ed-print-only" role="radiogroup" aria-label={contactCopy.print.reGroup}>
        <span className="ct-re-label" aria-hidden="true">
          {contactCopy.print.reLabel}
        </span>
        {contactCopy.print.subjects.map((s) => (
          <label key={s.value} className="ct-rc" data-on={subject === s.value ? '' : undefined}>
            <input
              type="radio"
              name="ct-subject"
              value={s.value}
              checked={subject === s.value}
              onChange={() => setSubject(s.value)}
            />
            <span className="ct-rc-box" aria-hidden="true" />
            <span>{s.label}</span>
          </label>
        ))}
      </div>

      <div className="ct-ctas">
        <a className="ct-write ed-btn ed-btn-primary" href={href} data-surface="btn-primary">
          <svg className="ct-write-ic is-screen" width="16" height="12" viewBox="0 0 16 12" aria-hidden="true">
            <rect x="1" y="1" width="14" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <path d="M1.5 2l6.5 5 6.5-5" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          <svg className="ct-write-ic is-print" width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            <path d="M20 2L2 9.5l7 2.5 2.5 7L20 2zM9 12l11-10" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
          <span>
            <EdText screen={contactCopy.screen.write} print={contactCopy.print.write} />
          </span>
        </a>
        <ContactLinks className="ct-links-screen ed-screen-only" />
      </div>
    </div>
  )
}
