/**
 * The edition picker's FACE (V3_SPEC §2.5, X1) — the whole drawing, as one
 * presentational component with no hooks and no 'use client', so it renders
 * twice from the same source:
 *
 *  - the SHELL (./PickerShell.tsx): server HTML in every page, shown by CSS
 *    only under html[data-pick='1'] (written pre-paint), so a first visit
 *    paints the complete picker at first paint with zero JavaScript;
 *  - the SURFACE (./EditionPickerSurface.client.tsx): the lazy island that
 *    takes over — same DOM, same box, same pixels — once it has hydrated.
 *
 * The two coexist for a moment, so every SVG id (silhouette, seal clips,
 * gradients, filters, masks) is namespaced by `ids` ('pks' / 'pk'): a
 * `url(#…)` must never resolve into the other copy's defs (a display:none
 * def does not clip).
 *
 * Portrait: the shell draws the two grades as CSS backgrounds (`--pk-src`
 * / `--pk-src-sm`, applied by picker.css only under html[data-pick='1'],
 * so return visits fetch nothing); the surface draws real <img>s with the
 * same URLs (cache hits) — object-fit cover ≡ background-size cover for a
 * square file in a square box.
 *
 * Both halves are real <button>s named by their visible title, line and
 * call to action (no aria-label overriding what a visitor sees — WCAG
 * 2.5.3; the decorative words inside them are aria-hidden): the
 * shell's are driven by its inline script (a choice is queued for the
 * surface, Tab is trapped) until the surface hydrates, and the
 * accessibility tree is right from the first paint. Interactive props
 * (refs, handlers, data attributes) are passed in by the surface; the
 * shell passes none. The question is a <p>, not a heading: the dialog is
 * named by aria-label and the page keeps its one <h1> (the hero's name).
 */

import type { ButtonHTMLAttributes, CSSProperties, HTMLAttributes, Ref } from 'react'
import { profile } from '@/lib/data/profile'
import { DK_SEAL_MARK_PATH } from '@/components/chrome/DkSeal'
import {
  PICKER_COPY,
  PICKER_SHELL_ATTR,
  SILHOUETTE,
  pickerPortraitSources,
  type PickerPortraitSources,
} from './picker.shared'

export interface PickerFaceProps {
  /** SVG id namespace — 'pks' for the shell, 'pk' for the surface. */
  ids: string
  /** Extra attributes on the root (role and aria are set here already). */
  rootProps?: HTMLAttributes<HTMLDivElement> & Record<`data-${string}`, string | undefined>
  screenProps?: ButtonHTMLAttributes<HTMLButtonElement>
  printProps?: ButtonHTMLAttributes<HTMLButtonElement>
  rootRef?: Ref<HTMLDivElement>
  screenRef?: Ref<HTMLButtonElement>
  printRef?: Ref<HTMLButtonElement>
}

export type PickerFaceVariant =
  | { variant: 'shell' }
  | { variant: 'surface'; portrait: PickerPortraitSources }

function RegMark({ className }: { className: string }) {
  return (
    <svg className={`pk-reg ${className}`} aria-hidden="true" width="26" height="26" viewBox="0 0 26 26">
      <circle cx="13" cy="13" r="6" fill="none" stroke="#17141b" strokeWidth="1.2" />
      <path d="M13 0V26M0 13H26" stroke="#17141b" strokeWidth="1.2" />
    </svg>
  )
}

/** One portrait layer: a background span in the shell, an <img> in the surface. */
function Portrait({
  face,
  grade,
  className,
}: {
  face: PickerFaceVariant
  grade: keyof PickerPortraitSources
  className?: string
}) {
  const cls = className ? `pk-img ${className}` : 'pk-img'
  if (face.variant === 'shell') {
    const desk = pickerPortraitSources(false)[grade]
    const phone = pickerPortraitSources(true)[grade]
    const style = { '--pk-src': `url(${desk})`, '--pk-src-sm': `url(${phone})` } as CSSProperties
    return <span className={cls} style={style} />
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={cls} src={face.portrait[grade]} alt="" decoding="async" />
}

export default function PickerFace({
  ids,
  rootProps,
  screenProps,
  printProps,
  rootRef,
  screenRef,
  printRef,
  ...face
}: PickerFaceProps & PickerFaceVariant) {
  const shell = face.variant === 'shell'
  const id = (name: string) => `${ids}-${name}`
  const url = (name: string) => `url(#${id(name)})`
  const { className: rootClass, style: rootStyle, ...rootRest } = rootProps ?? {}
  const shellMark = shell ? { [PICKER_SHELL_ATTR]: '1' } : null

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={PICKER_COPY.ask}
      className={`pk ${shell ? 'pk-shell' : 'pk-live'}${rootClass ? ` ${rootClass}` : ''}`}
      data-component={shell ? 'EditionPickerShell' : 'EditionPicker'}
      data-island={shell ? 'RSC' : 'client'}
      {...shellMark}
      style={{ ['--vs-i' as string]: 7, ...rootStyle }}
      {...rootRest}
    >
      {/* shared drawing defs: ONE silhouette cut and the seal's clips */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
        <defs>
          <path id={id('silp')} d={SILHOUETTE} />
          <path id={id('mark')} d={DK_SEAL_MARK_PATH} />
          <clipPath id={id('sil')} clipPathUnits="objectBoundingBox">
            <use href={`#${id('silp')}`} transform="scale(0.00125)" />
          </clipPath>
          <clipPath id={id('cl')}>
            <rect x="0" y="0" width="60" height="120" />
          </clipPath>
          <clipPath id={id('cr')}>
            <rect x="60" y="0" width="60" height="120" />
          </clipPath>
          <clipPath id={id('ct')}>
            <rect x="0" y="0" width="120" height="60" />
          </clipPath>
          <clipPath id={id('cb')}>
            <rect x="0" y="60" width="120" height="60" />
          </clipPath>
          <radialGradient id={id('disc')} cx="46" cy="16" r="104" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#f2f3f5" />
            <stop offset=".34" stopColor="#d9dde4" />
            <stop offset=".72" stopColor="#b9bec8" />
            <stop offset="1" stopColor="#85878f" />
          </radialGradient>
          <radialGradient id={id('spec')} cx="42" cy="22" r="30" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fff" stopOpacity=".75" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <filter id={id('glow')} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <filter id={id('rimblur')} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation=".8" />
          </filter>
          <filter id={id('rimwide')} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <linearGradient id={id('rimfx')} x1="0" y1="0" x2="367" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fff" />
            <stop offset=".6" stopColor="#fff" stopOpacity=".9" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={id('rimfy')} x1="0" y1="0" x2="0" y2="800" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fff" />
            <stop offset=".62" stopColor="#fff" stopOpacity=".9" />
            <stop offset=".86" stopColor="#fff" stopOpacity=".25" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id={id('rimmy')} maskUnits="userSpaceOnUse" x="0" y="0" width="800" height="800">
            <rect width="800" height="800" fill={url('rimfy')} />
          </mask>
          <mask id={id('rimm')} maskUnits="userSpaceOnUse" x="0" y="0" width="800" height="800">
            <g mask={url('rimmy')}>
              <rect width="800" height="800" fill={url('rimfx')} />
            </g>
          </mask>
        </defs>
      </svg>

      {/* ================= SCREEN ================= */}
      <button
        ref={screenRef}
        type="button"
        className="pk-half pk-half-s"
        aria-keyshortcuts="1"
        {...screenProps}
      >
        <span className="pk-atm pk-beam" aria-hidden="true" />
        <span className="pk-atm pk-light" aria-hidden="true" />
        <span className="pk-atm pk-spot" aria-hidden="true" />
        <span className="pk-atm pk-leak" aria-hidden="true" />
        <span className="pk-atm pk-halo" aria-hidden="true" />

        <span className="pk-fig pk-fig-s" aria-hidden="true" style={{ clipPath: url('sil') }}>
          <Portrait face={face} grade="screen" />
          <span className="pk-ov pk-key" />
          <span className="pk-ov pk-turn" />
          <svg className="pk-rim" viewBox="0 0 800 800">
            <use
              href={`#${id('silp')}`}
              fill="none"
              stroke="#9aa5b3"
              strokeOpacity=".34"
              strokeWidth="18"
              strokeLinejoin="round"
              filter={url('rimwide')}
              mask={url('rimm')}
            />
            <use
              href={`#${id('silp')}`}
              fill="none"
              stroke="#e4e8ee"
              strokeOpacity=".9"
              strokeWidth="3.6"
              strokeLinejoin="round"
              filter={url('rimblur')}
              mask={url('rimm')}
            />
          </svg>
        </span>
        <span className="pk-gate" aria-hidden="true" />
        <span className="pk-filmgate" aria-hidden="true" />

        <span className="pk-abs pk-name" aria-hidden="true">
          {profile.displayName}
        </span>
        <span className="pk-abs pk-rule" aria-hidden="true" />

        <span className="pk-abs pk-blk-s">
          <span className="pk-h-s" style={{ display: 'block' }}>
            {PICKER_COPY.screen.title}
            <span className="sr-only">: </span>
          </span>
          <span className="pk-body-s" style={{ display: 'block' }}>
            {PICKER_COPY.screen.body}
            <span className="sr-only"> </span>
          </span>
          <span className="pk-cta-s">
            {PICKER_COPY.screen.cta}
            <svg width="18" height="10" viewBox="0 0 18 10" aria-hidden="true">
              <path d="M0 5H16M12 1L16.5 5L12 9" fill="none" stroke="#0b0d10" strokeWidth="1.4" />
            </svg>
          </span>
        </span>

        <span className="pk-ember" aria-hidden="true" style={{ left: '12%', bottom: '19%' }} />
        <span
          className="pk-ember is-steel"
          aria-hidden="true"
          style={{ left: '26%', bottom: '29%', animationDuration: '18s', animationDelay: '3s' }}
        />
        <span
          className="pk-ember"
          aria-hidden="true"
          style={{ left: '37%', bottom: '12%', width: 2, height: 2, animationDuration: '16s', animationDelay: '7s' }}
        />
        <span
          className="pk-ember"
          aria-hidden="true"
          style={{ left: '18%', bottom: '67%', width: 2, height: 2, animationDuration: '20s', animationDelay: '10s' }}
        />
        <span className="pk-grain" aria-hidden="true" />
      </button>

      {/* the question, on the axis: ivory on the screen, continuing in ink on the paper */}
      {/* The gap where the seal sits is a real space (not aria-hidden), so the
          question reads "Choose your edition", not "Choose youredition". */}
      <p className="pk-ask">
        <span className="pk-ask-a">Choose your</span>
        <span className="pk-ask-g"> </span>
        <span className="pk-ask-b">edition</span>
      </p>
      <p className="pk-cap">{PICKER_COPY.caption}</p>

      {/* ================= PRINT: a torn sheet lying over the screen ================= */}
      <div className="pk-sheet-wrap">
        <span className="pk-fiber" aria-hidden="true" />
        <button
          ref={printRef}
          type="button"
          className="pk-half pk-half-p pk-sheet"
          aria-keyshortcuts="2"
          {...printProps}
        >
          <span className="pk-halftone" aria-hidden="true" />
          <span className="pk-sun" aria-hidden="true" />
          <span className="pk-sun-dots" aria-hidden="true" />

          <span className="pk-fig pk-fig-p" aria-hidden="true" style={{ clipPath: url('sil') }}>
            <Portrait face={face} grade="print" className="pk-photo" />
            <span className="pk-ht">
              <Portrait face={face} grade="print" className="pk-ht-img" />
              <span className="pk-scr" />
            </span>
            <span className="pk-ov pk-tint" />
          </span>
          <svg className="pk-outline" viewBox="0 0 800 800" aria-hidden="true">
            <use href={`#${id('silp')}`} fill="none" stroke="#17141b" strokeWidth="3.4" strokeLinejoin="round" />
          </svg>
          <span className="pk-curl" aria-hidden="true" />

          <span className="pk-burst" aria-hidden="true">
            No.&nbsp;1
          </span>

          <span className="pk-abs pk-mast-rule" aria-hidden="true" />
          <span className="pk-abs pk-mast" aria-hidden="true">
            <span className="pk-price">10¢</span>
            <span className="pk-word">
              KONNUR
              <br />
              COMICS
            </span>
          </span>

          <span className="pk-ask" aria-hidden="true">
            <span className="pk-ask-a">Choose your</span>
            <span className="pk-ask-g"> </span>
            <span className="pk-ask-b">edition</span>
          </span>

          <span className="pk-abs pk-blk-p">
            <span className="pk-h-p" style={{ display: 'block' }}>
              {PICKER_COPY.print.title}
              <span className="sr-only">: </span>
            </span>
            <span className="pk-body-p" style={{ display: 'block' }}>
              {PICKER_COPY.print.body}
              <span className="sr-only"> </span>
            </span>
            <span className="pk-cta-p">{PICKER_COPY.print.cta}</span>
          </span>

          <RegMark className="is-top" />
          <RegMark className="is-bottom" />
          <span className="pk-cmyk" aria-hidden="true">
            <i style={{ background: '#1e6fd6' }} />
            <i style={{ background: '#d7262d' }} />
            <i style={{ background: '#f6c21c' }} />
            <i style={{ background: '#17141b' }} />
          </span>
        </button>
      </div>

      {/* ================= the seal presides over the seam ================= */}
      {/* The seal's halves are clipped by the defs above (picker.css picks the
          left/right or top/bottom pair per breakpoint via --pk-clip-*). */}
      <svg
        className="pk-seal"
        viewBox="0 0 120 120"
        role="img"
        aria-label="DK monogram"
        style={
          {
            '--pk-clip-l': url('cl'),
            '--pk-clip-r': url('cr'),
            '--pk-clip-t': url('ct'),
            '--pk-clip-b': url('cb'),
          } as CSSProperties
        }
      >
        {/* SCREEN half: satin silver, top-lit, a dark rim; the mark in ink */}
        {/* The M4 mark carries its own ring (r 53.5 here), which is the coin's rim. */}
        <g className="pk-seal-l">
          <circle cx="60" cy="64" r="55" fill="#000" opacity=".62" filter={url('glow')} />
          <circle cx="60" cy="60" r="55" fill={url('disc')} />
          <circle className="pk-spec" cx="60" cy="60" r="55" fill={url('spec')} />
          <circle cx="60" cy="60" r="47" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth=".8" />
          <svg x="6.5" y="6.5" width="107" height="107" viewBox="0 0 100 100" overflow="visible">
            <use href={`#${id('mark')}`} fill="#0b0d10" />
          </svg>
        </g>
        {/* PRINT half: the same mark in ink on a yellow roundel */}
        <g className="pk-seal-r">
          <circle cx="64" cy="64" r="55" fill="#17141b" />
          <circle cx="60" cy="60" r="54" fill="#f6c21c" />
          <svg x="6.5" y="6.5" width="107" height="107" viewBox="0 0 100 100" overflow="visible">
            <use href={`#${id('mark')}`} fill="#17141b" />
          </svg>
        </g>
      </svg>
    </div>
  )
}
