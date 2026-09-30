/**
 * v3 §2.8 — the Studio Seal ident (Phase B). Inline SVG of the M4 mark
 * (design-workshop/screen-print/r2/assets/brand/mark-M4.svg; board
 * r2/frames/M4-StudioSeal.dc.html), server-safe (no client hooks beyond
 * `useId` for the text-path ids). Everything is `currentColor`, so each
 * edition colours it via CSS on the host (SCREEN: silver on black, PRINT:
 * ink); the few fixed comic colours of the `bug` are the bug's own.
 *
 * Variants
 *   mark      — the DK + ring (public/brand/dk-seal.svg). Navbar ident,
 *               footer mark, stamps.
 *   knockout  — the disc with the DK cut out, strokes tuned to read at 16 px
 *               (public/brand/dk-seal-knockout.svg; app/icon.svg is this).
 *   roundel   — SCREEN's film-studio roundel: halo, two rings, the ring text
 *               "DARSHAN · KONNUR / SOFTWARE · ENGINEER" in the display face
 *               (public/brand/dk-seal-roundel-screen.svg).
 *   bug       — PRINT's publisher bug: red offset disc, yellow disc, white
 *               centre, "KONNUR ✶ COMICS / No. 1 ✶ BOSTON" in the slab face
 *               (public/brand/dk-seal-bug-print.svg).
 *
 * Accessibility: decorative by default (`aria-hidden`). Pass `title` when the
 * seal is a link's only content: the SVG becomes role="img" with a <title>.
 * Sizing: `size` is the rendered box in px (min 24 — spec); clear space =
 * stroke × 4 is the caller's margin. CSS hooks: `.dk-seal[data-seal=<variant>]`
 * and `[data-part=mark|glint|ring|ring-text|halo|disc-red|disc-yellow|disc-white]`.
 * The `glint` is the K's upper-arm edge, drawn at stroke-opacity 0; SCREEN's
 * CSS lights it in champagne (`[data-part=glint]{stroke:…;stroke-opacity:1}`).
 * Budget: ≤ 1 KB gz in the first-load bundle (§7).
 */

import { useId } from 'react'

export type DkSealVariant = 'mark' | 'knockout' | 'roundel' | 'bug'

export interface DkSealProps {
  variant?: DkSealVariant
  /** Rendered box in CSS px (width = height). Default 32; never below 24. */
  size?: number
  className?: string
  /** Accessible name. Set ⇒ role="img" + <title>; unset ⇒ aria-hidden. */
  title?: string
}

/** M4: outer ring (two counter-wound circles) + the D and the K. */
export const DK_SEAL_MARK_PATH =
  'M50 0A50 50 0 1 1 50 100A50 50 0 1 1 50 0ZM50 4.85A45.15 45.15 0 1 0 50 95.15A45.15 45.15 0 1 0 50 4.85ZM59.74 25.33L52.6 30.69A21 21 0 0 0 44.35 29H29V71H44.35A21 21 0 0 0 63.92 42.39L70.55 37.41A29.07 29.07 0 0 1 44.35 79.07H20.93V20.93H44.35A29.07 29.07 0 0 1 59.74 25.33ZM81.8 23.93L47.04 50L58.82 58.84A16.96 16.96 0 0 1 53.01 64.58L44.35 58.08V66.96H36.27V33.04H44.35V41.92L76.02 18.17A41.12 41.12 0 0 1 81.8 23.93ZM76.02 81.83L66.45 74.65A33.11 33.11 0 0 0 71.77 68.55L81.8 76.07A41.12 41.12 0 0 1 76.02 81.83Z'

/** Icon cut: a filled disc with the DK knocked out, heavier strokes for 16 px. */
export const DK_SEAL_KNOCKOUT_PATH =
  'M50 0A50 50 0 1 1 50 100A50 50 0 1 1 50 0ZM60.59 23.17A31.63 31.63 0 0 0 43.85 18.37H18.37V81.63H43.85A31.63 31.63 0 0 0 72.36 36.31L65.14 41.72A22.84 22.84 0 0 1 43.85 72.84H27.16V27.16H43.85A22.84 22.84 0 0 1 52.82 28.99ZM84.59 21.64A44.73 44.73 0 0 0 78.31 15.37L43.85 41.21V31.55H35.06V68.45H43.85V58.79L53.28 65.86A18.45 18.45 0 0 0 59.6 59.61L46.78 50ZM78.31 84.63A44.73 44.73 0 0 0 84.59 78.36L73.69 70.18A36.02 36.02 0 0 1 67.9 76.82Z'

/** The K's upper-arm edge — the champagne glint line in SCREEN. */
const GLINT_PATH = 'M44.35 41.92L76.02 18.17'

const VIEWBOX: Record<DkSealVariant, string> = {
  mark: '0 0 100 100',
  knockout: '0 0 100 100',
  roundel: '-34 -34 168 168',
  bug: '-40 -40 184 184',
}

function Glint() {
  return (
    <path
      data-part="glint"
      d={GLINT_PATH}
      fill="none"
      stroke="currentColor"
      strokeWidth=".9"
      strokeLinecap="round"
      strokeOpacity="0"
    />
  )
}

export default function DkSeal({
  variant = 'mark',
  size = 32,
  className,
  title,
}: DkSealProps) {
  const uid = useId().replace(/[^A-Za-z0-9_-]/g, '')
  const id = (part: string) => `dk-${uid}-${part}`
  const titleId = id('title')
  const classes = ['dk-seal', className].filter(Boolean).join(' ')
  const a11y = title
    ? { role: 'img' as const, 'aria-labelledby': titleId }
    : { 'aria-hidden': true as const }

  return (
    <svg
      className={classes}
      data-seal={variant}
      width={size}
      height={size}
      viewBox={VIEWBOX[variant]}
      fill="currentColor"
      focusable="false"
      {...a11y}
    >
      {title ? <title id={titleId}>{title}</title> : null}

      {variant === 'roundel' ? (
        <>
          <defs>
            <radialGradient id={id('halo')} cx=".5" cy=".42" r=".6">
              <stop offset="0" stopColor="currentColor" stopOpacity=".09" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </radialGradient>
            <path id={id('top')} d="M-14.2 50A64.2 64.2 0 0 1 114.2 50" />
            <path id={id('bottom')} d="M-21.2 50A71.2 71.2 0 0 0 121.2 50" />
          </defs>
          <circle data-part="halo" cx="50" cy="50" r="84" fill={`url(#${id('halo')})`} />
          <circle
            data-part="ring"
            cx="50"
            cy="50"
            r="79"
            fill="none"
            stroke="currentColor"
            strokeOpacity=".28"
            strokeWidth=".7"
          />
          <circle
            data-part="ring"
            cx="50"
            cy="50"
            r="56"
            fill="none"
            stroke="currentColor"
            strokeOpacity=".18"
            strokeWidth=".5"
          />
          <g
            data-part="ring-text"
            fontWeight="600"
            fontSize="7.4"
            letterSpacing="3.1"
            fillOpacity=".8"
            style={{ fontFamily: 'var(--font-cinzel, Cinzel), serif' }}
          >
            <text>
              <textPath href={`#${id('top')}`} startOffset="50%" textAnchor="middle">
                DARSHAN · KONNUR
              </textPath>
            </text>
            <text>
              <textPath href={`#${id('bottom')}`} startOffset="50%" textAnchor="middle">
                SOFTWARE · ENGINEER
              </textPath>
            </text>
          </g>
          <circle cx="-17.5" cy="50" r="1.5" fillOpacity=".9" />
          <circle cx="117.5" cy="50" r="1.5" fillOpacity=".9" />
        </>
      ) : null}

      {variant === 'bug' ? (
        <>
          <defs>
            <path id={id('top')} d="M-15.5 50A65.5 65.5 0 0 1 115.5 50" />
            <path id={id('bottom')} d="M-25.5 50A75.5 75.5 0 0 0 125.5 50" />
          </defs>
          <circle data-part="disc-red" cx="56" cy="56" r="86" fill="#d7262d" />
          <circle
            data-part="disc-yellow"
            cx="50"
            cy="50"
            r="86"
            fill="#f6c21c"
            stroke="currentColor"
            strokeWidth="4.5"
          />
          <circle
            data-part="disc-white"
            cx="50"
            cy="50"
            r="58"
            fill="#fffaf0"
            stroke="currentColor"
            strokeWidth="3"
          />
          <g
            data-part="ring-text"
            fontSize="11.2"
            letterSpacing="1.8"
            style={{ fontFamily: "var(--font-alfa, 'Alfa Slab One'), serif" }}
          >
            <text>
              <textPath href={`#${id('top')}`} startOffset="50%" textAnchor="middle">
                KONNUR ✶ COMICS
              </textPath>
            </text>
            <text>
              <textPath href={`#${id('bottom')}`} startOffset="50%" textAnchor="middle">
                No. 1 ✶ BOSTON
              </textPath>
            </text>
          </g>
        </>
      ) : null}

      <path
        data-part="mark"
        d={variant === 'knockout' ? DK_SEAL_KNOCKOUT_PATH : DK_SEAL_MARK_PATH}
      />
      {variant === 'mark' || variant === 'roundel' ? <Glint /> : null}
    </svg>
  )
}
