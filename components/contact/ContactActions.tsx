'use client'

/**
 * Contact primary actions (spec §4.8) — the 30-second path.
 * Email button copies the address and swaps to `[ copied ✓ — open mail ↗ ]`
 * (a real mailto: link) for 3s, with a 12-particle signal micro-burst from
 * the click point (600ms, once per session, skipped under reduced motion).
 * GitHub / LinkedIn / resume are plain links with large hit areas.
 */

import {
  useEffect,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'
import { copyEmailAction } from '@/lib/commands/context'
import { useMagnetic } from '@/lib/motion/useMagnetic'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'
import { EASE_OUT_EXPO } from '@/lib/motion/tokens'
import { trackResumeDownloaded } from '@/lib/utils/analytics'
import { profile } from '@/lib/data/profile'

const BTN =
  'hairline rounded-btn inline-flex min-h-12 items-center px-5 type-label-sm ' +
  'hover:border-hairline-strong hover:[box-shadow:var(--glow-signal)] ' +
  'transition-[border-color,box-shadow] duration-(--dur-micro)'

/* v2 §6.5 — the section's THREE primary buttons (email · github · linkedin)
   are magnetic; the resume link stays plain so the named ~10-element scope
   holds exactly. The hook is inert on coarse pointers / reduced motion. */

function MagneticButton({
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  const ref = useRef<HTMLButtonElement>(null)
  useMagnetic(ref, { strength: 0.25, radius: 80 })
  return (
    <button ref={ref} type="button" className={BTN} {...rest}>
      <span data-mag-label>{children}</span>
    </button>
  )
}

function MagneticA({
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) {
  const ref = useRef<HTMLAnchorElement>(null)
  useMagnetic(ref, { strength: 0.25, radius: 80 })
  return (
    <a ref={ref} className={BTN} {...rest}>
      <span data-mag-label>{children}</span>
    </a>
  )
}

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
      { duration: 600, easing, fill: 'forwards' }
    )
  }
  window.setTimeout(() => host.remove(), 650)
}

export default function ContactActions() {
  const [copied, setCopied] = useState(false)
  const reduced = usePrefersReducedMotion()
  const mailRef = useRef<HTMLAnchorElement>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (copied) mailRef.current?.focus()
  }, [copied])

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    },
    []
  )

  async function onCopyEmail(e: React.MouseEvent<HTMLButtonElement>) {
    // Keyboard activation reports (0,0); burst from the button center instead.
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX || rect.left + rect.width / 2
    const y = e.clientY || rect.top + rect.height / 2
    await copyEmailAction(profile.email)
    if (!reduced) fireBurst(x, y)
    setCopied(true)
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setCopied(false), 3000)
  }

  return (
    <ul
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap"
      data-component="ContactActions"
      data-island="client"
    >
      <li>
        {copied ? (
          /* Transient 3s confirm state — unmagnetized on purpose (the swap
             replaces the element; the magnet re-attaches on swap-back). */
          <a ref={mailRef} href={`mailto:${profile.email}`} className={BTN}>
            [ copied&nbsp;<span className="text-signal">✓</span>&nbsp;— open mail ↗ ]
          </a>
        ) : (
          <MagneticButton onClick={onCopyEmail}>[ email — {profile.email} ]</MagneticButton>
        )}
      </li>
      <li>
        <MagneticA href={profile.githubUrl} target="_blank" rel="noopener noreferrer">
          [ github ↗ ]
        </MagneticA>
      </li>
      <li>
        <MagneticA href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer">
          [ linkedin ↗ ]
        </MagneticA>
      </li>
      <li>
        <a
          href={profile.resumePdf}
          download="darshan-konnur.pdf"
          onClick={() => trackResumeDownloaded('contact')}
          className={BTN}
        >
          [ resume.pdf ↓ ]
        </a>
      </li>
    </ul>
  )
}
