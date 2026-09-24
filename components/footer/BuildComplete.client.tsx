'use client'

/**
 * v2 §10.3 — the footer build-complete payoff.
 *
 * When the footer first enters view, a build summary types in above the
 * existing metadata strip (12ms/char, caret motif, --type-code):
 *
 *   $ next build --career [--incremental]
 *   ✓ compiled N/6 sections
 *   ✓ 0 errors · 0 warnings
 *   ✓ tests passing — see the repo
 *
 * then a 1px signal rule draws left→right (300ms --ease-out-expo) and the
 * existing self-verifying row (SHA · bundle · fps) fades up beneath as
 * "the artifacts".
 *
 * Honesty rails: N is the live count of store.sectionsSeen ('hero' + the
 * five anchors, written by the Navbar scrollspy) — a deep-linked visitor who
 * read two sections sees 2/6. "0 errors · 0 warnings" is a true claim about
 * the shipped build (a failing build never deploys). `--incremental` only
 * shows when localStorage[SEEN] preceded this visit (captured at module-eval
 * time by the island wrapper).
 *
 * The typing animation plays once per session (sessionStorage[FOOTER]);
 * later loads render the settled state. Reduced motion: final state
 * instantly. Every line renders its full text from mount with the untyped
 * remainder visibility:hidden — the block's height never changes, zero CLS.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { FOOTER_SESSION_KEY } from '@/lib/commands/context'
import { profile } from '@/lib/data/profile'
import { useInViewOnce } from '@/lib/motion/useInViewOnce'
import { usePrefersReducedMotion } from '@/lib/motion/useReducedMotion'
import { useSignalStore } from '@/lib/state/store'

const TYPE_MS_PER_CHAR = 12
const RULE_MS = 300
const SECTION_TOTAL = 6

interface Segment {
  text: string
  cls?: string
  href?: string
}

type Phase = 'idle' | 'typing' | 'rule' | 'done'

function sessionPlayed(): boolean {
  try {
    return sessionStorage.getItem(FOOTER_SESSION_KEY) === '1'
  } catch {
    return false
  }
}

export default function BuildComplete({ incremental }: { incremental: boolean }) {
  const reduced = usePrefersReducedMotion()
  const seenCount = useSignalStore((s) => Object.keys(s.sectionsSeen).length)
  const { ref, inView } = useInViewOnce<HTMLDivElement>()

  const [phase, setPhase] = useState<Phase>('idle')
  const [typed, setTyped] = useState(0)
  const heldRef = useRef<HTMLElement | null>(null)

  const lines: Segment[][] = useMemo(
    () => [
      [{ text: `$ next build --career${incremental ? ' --incremental' : ''}` }],
      [
        { text: '✓ ', cls: 'text-signal' },
        { text: `compiled ${seenCount}/${SECTION_TOTAL} sections` },
      ],
      [{ text: '✓ ', cls: 'text-signal' }, { text: '0 errors · 0 warnings' }],
      [
        { text: '✓ ', cls: 'text-signal' },
        { text: 'tests passing — ' },
        { text: 'see the repo', href: profile.siteRepoUrl },
      ],
    ],
    [incremental, seenCount]
  )

  const lineLengths = useMemo(
    () => lines.map((segs) => segs.reduce((sum, s) => sum + s.text.length, 0)),
    [lines]
  )
  const totalChars = lineLengths.reduce((a, b) => a + b, 0)

  // Hold the artifacts row (opacity 0) from mount when an animated run is
  // still ahead — the island mounts ~200px before view, so the hold lands
  // while the row is off-screen (no visible pop).
  useEffect(() => {
    if (reduced || sessionPlayed()) return undefined
    const el = document.querySelector<HTMLElement>('[data-footer-artifacts]')
    if (el === null) return undefined
    el.classList.add('bc-hold')
    heldRef.current = el
    return () => {
      el.classList.remove('bc-hold')
      heldRef.current = null
    }
    // Mount-time decision by design; a mid-session reduced-motion switch is
    // resolved by the arm effect below (straight to 'done', hold released).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Arm on first view: session-once typing, else settle instantly.
  useEffect(() => {
    if (!inView || phase !== 'idle') return
    const animate = !reduced && !sessionPlayed()
    try {
      sessionStorage.setItem(FOOTER_SESSION_KEY, '1')
    } catch {
      /* storage unavailable — the payoff simply replays next load */
    }
    if (animate) {
      setPhase('typing')
    } else {
      setTyped(totalChars)
      setPhase('done')
    }
  }, [inView, phase, reduced, totalChars])

  // The typewriter: one interval, 12ms/char across the four lines.
  useEffect(() => {
    if (phase !== 'typing') return undefined
    const id = window.setInterval(() => {
      setTyped((t) => Math.min(t + 1, totalChars))
    }, TYPE_MS_PER_CHAR)
    return () => window.clearInterval(id)
  }, [phase, totalChars])

  // Typing finished → draw the rule → reveal the artifacts.
  useEffect(() => {
    if (phase === 'typing' && typed >= totalChars) setPhase('rule')
  }, [phase, typed, totalChars])
  useEffect(() => {
    if (phase !== 'rule') return undefined
    const id = window.setTimeout(() => setPhase('done'), RULE_MS)
    return () => window.clearTimeout(id)
  }, [phase])

  // 'done' releases the held artifacts row with the shared fade-up entrance
  // (globals.css collapses fade-up to instant under reduced motion).
  useEffect(() => {
    if (phase !== 'done') return
    const el = heldRef.current
    if (el === null) return
    heldRef.current = null
    el.classList.remove('bc-hold')
    el.classList.add('fade-up')
  }, [phase])

  const ruleOn = phase === 'rule' || phase === 'done'

  // Which line the caret sits on while typing.
  let caretLine = -1
  if (phase === 'typing') {
    let offset = 0
    for (let i = 0; i < lineLengths.length; i += 1) {
      if (typed < offset + lineLengths[i]) {
        caretLine = i
        break
      }
      offset += lineLengths[i]
    }
  }

  let lineOffset = 0
  const renderedLines = lines.map((segs, i) => {
    const revealed = Math.min(Math.max(typed - lineOffset, 0), lineLengths[i])
    lineOffset += lineLengths[i]
    const showCaretHere = caretLine === i

    let consumed = 0
    const parts = segs.map((seg, j) => {
      const start = consumed
      consumed += seg.text.length
      const visN = Math.min(Math.max(revealed - start, 0), seg.text.length)
      const vis = seg.text.slice(0, visN)
      const hid = seg.text.slice(visN)
      const caret =
        showCaretHere && revealed >= start && revealed < start + seg.text.length ? (
          <span className="caret" aria-hidden="true" />
        ) : null

      if (seg.href !== undefined && visN > 0) {
        return (
          <a
            key={j}
            href={seg.href}
            target="_blank"
            rel="noopener noreferrer"
            className="link-draw transition-colors hover:text-primary"
          >
            {vis}
            {caret}
            {hid !== '' ? <span className="bc-hidden">{hid}</span> : null}
          </a>
        )
      }
      return (
        <span key={j} className={seg.cls}>
          {vis}
          {caret}
          {hid !== '' ? <span className="bc-hidden">{hid}</span> : null}
        </span>
      )
    })

    return (
      <div key={i} className="whitespace-pre">
        {parts}
      </div>
    )
  })

  return (
    <div ref={ref} className="type-code mt-6 text-secondary">
      <style>{buildCompleteCss}</style>
      {renderedLines}
      <div className="bc-rule" data-on={ruleOn ? '1' : '0'} aria-hidden="true" />
      <p className="sr-only" role="status">
        {phase === 'done'
          ? `build complete — ${seenCount} of ${SECTION_TOTAL} sections compiled, 0 errors, 0 warnings`
          : ''}
      </p>
    </div>
  )
}

/** Payoff skin — kept beside the component so the lazy chunk carries it. */
const buildCompleteCss = `
.bc-hidden {
  visibility: hidden;
}
.bc-hold {
  opacity: 0 !important;
}
.bc-rule {
  height: 1px;
  margin-top: 12px;
  background: var(--accent-signal);
  transform: scaleX(0);
  transform-origin: left;
}
.bc-rule[data-on='1'] {
  transform: scaleX(1);
  transition: transform 300ms var(--ease-out-expo);
}
html[data-motion='reduced'] .bc-rule {
  transform: scaleX(1);
  transition: none;
}
`
