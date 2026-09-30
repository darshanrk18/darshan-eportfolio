/**
 * v3 §2.7 — the intro's art bank: the drawn comic panels (a1–a13), the six
 * real-photo plates (p1–p6, public/intro/*.webp) and the three post cards
 * (c1–c3), ported 1:1 from design-workshop/intro-FINAL.html's `#artbank`.
 * Imported ONLY by Intro.client.tsx, so it rides the intro chunk.
 *
 * Every visible string comes from lib/data/introAssets.ts (INTRO_COPY /
 * INTRO_ASSETS) — the §1.9 corrections live there: the real IEEE title, no
 * post counts, no test / pod / throughput numbers, no file names, no
 * developer plate (`pdev`). The panels' genre labels (ORIGIN STORY, TTY,
 * MEANWHILE…, FWIP!, PUSH!) are texture, not claims. Layout classes are
 * the source's (styles/v3/intro.css .art / .pnl / .cap / .pho / .post …);
 * the panel is parametric on --artw (set by the runner's .pan / .cell).
 */

import type { JSX, ReactNode } from 'react'
import {
  INTRO_COPY,
  getIntroPlate,
  type IntroPlate,
  type IntroPostCard,
  type IntroTextRun,
} from '@/lib/data/introAssets'
import type { ArtId } from '@/lib/intro/timeline'

const P = INTRO_COPY.panels

/** `text` with its `strong` part set in the plate's red `<b>` (when present). */
function emphasize(text: string, strong?: string): ReactNode {
  if (!strong) return text
  const at = text.indexOf(strong)
  if (at < 0) return text
  return (
    <>
      {text.slice(0, at)}
      <b>{strong}</b>
      {text.slice(at + strong.length)}
    </>
  )
}

function runs(parts: readonly IntroTextRun[]): ReactNode {
  return parts.map((part, i) =>
    typeof part === 'string' ? <span key={i}>{part}</span> : <b key={i}>{part.b}</b>,
  )
}

/* ------------------------------------------------------------- a1–a13 */

function A1() {
  return (
    <div className="art a1">
      <div className="cap">{P.a1.cap}</div>
      <div className="pnl sk">
        <svg viewBox="0 0 200 80" aria-hidden="true">
          <path
            fill="#160a0d"
            d="M0 80 V46 h14 v-8 h10 v8 h8 V30 h16 v16 h6 v-22 h4 v-6 h3 v6 h4 v22 h9 V38 h14 v42 z"
          />
          <path fill="#160a0d" d="M92 80 V34 h18 v-10 h3 v-5 h2 v5 h3 v10 h12 v46 z" />
          <path fill="#160a0d" d="M134 80 V50 h16 V34 h12 v16 h9 v30 z" />
          <path fill="#160a0d" d="M175 80 V42 h11 v-6 h8 v6 h6 v38 z" />
          <rect x="146" y="22" width="14" height="8" rx="2" fill="#160a0d" />
          <path d="M149 30 v4 M159 30 v4" stroke="#160a0d" strokeWidth="2" />
          <path d="M59 6 V18 M55 9 h8 M56.5 13 h5" stroke="#160a0d" strokeWidth="1.6" />
          <g fill="#ffe4d8">
            <rect x="36" y="36" width="4" height="4" />
            <rect x="16" y="52" width="4" height="4" />
            <rect x="98" y="42" width="4" height="4" />
            <rect x="118" y="50" width="4" height="4" />
            <rect x="140" y="58" width="4" height="4" />
          </g>
          <rect x="180" y="52" width="4" height="4" fill="#d4af37" />
        </svg>
      </div>
      <div className="pnl cbx cb">
        {P.a1.place}
        {'\n'}
        <b>{P.a1.line}</b>
      </div>
      <div className="pnl lm">
        <i className="cone" />
        <i className="desk" />
        <i className="mon" />
        <i className="mug" />
      </div>
      <div className="pn">{P.a1.no}</div>
    </div>
  )
}

function A2() {
  return (
    <div className="art a2">
      <div className="cap">{P.a2.cap}</div>
      <div className="pnl rk">
        <svg viewBox="0 0 80 150" aria-hidden="true">
          <rect x="3" y="3" width="74" height="144" rx="4" fill="none" stroke="#3d0a10" strokeWidth="3" />
          <g fill="#2a1013">
            {[10, 25, 40, 55, 70, 85, 100, 115, 130].map((y) => (
              <rect key={y} x="9" y={y} width="62" height="11" rx="1.5" />
            ))}
          </g>
          <g>
            <rect x="63" y="13" width="4" height="4" fill="#e0263c" />
            <rect x="63" y="43" width="4" height="4" fill="#d4af37" />
            <rect x="63" y="58" width="4" height="4" fill="#e0263c" />
            <rect x="63" y="88" width="4" height="4" fill="#ffe4d8" />
            <rect x="63" y="118" width="4" height="4" fill="#e0263c" />
            <rect x="63" y="133" width="4" height="4" fill="#ffe4d8" />
          </g>
        </svg>
      </div>
      <div className="pnl pods">
        <div className="pg9">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i className="sc" />
        </div>
        <div className="kl">{P.a2.pods}</div>
      </div>
      <div className="pnl led">
        <div className="lbl">{P.a2.ledger}</div>
        <svg viewBox="0 0 100 22" aria-hidden="true">
          <path d="M2 18 L18 15 34 16 50 11 66 12 82 7 98 6" stroke="#9e1420" strokeWidth="2" fill="none" />
        </svg>
      </div>
      <div className="pn">{P.a2.no}</div>
    </div>
  )
}

function A3() {
  const [cmd, ...out] = P.a3.lines
  return (
    <div className="art a3">
      <div className="cap">{P.a3.cap}</div>
      <div className="term">
        <div className="tbar">
          <i />
          <i />
          <i />
        </div>
        <pre className="tl">
          <span className="pr">$</span> {cmd}
          {'\n'}
          {out.join('\n')}
          {'\n'}
          <span className="ok">{P.a3.pass}</span>
          {'\n'}
          <span className="pr">$</span> {P.a3.ship}
          <span className="cur" />
        </pre>
      </div>
      <div className="pnl st">{P.a3.status}</div>
      <div className="pn">{P.a3.no}</div>
    </div>
  )
}

function A4() {
  return (
    <div className="art a4">
      <div className="cap">{P.a4.cap}</div>
      <div className="pnl cmd">
        <span className="pr">$</span>&nbsp;{P.a4.cmd}
      </div>
      <div className="pnl gp">
        <svg viewBox="0 0 200 252" aria-hidden="true">
          <path d="M70 236 V16" stroke="#1d0e12" strokeWidth="3" fill="none" />
          <path
            d="M70 192 C70 168 130 178 130 152 V84 C130 58 70 64 70 44"
            stroke="#c8102e"
            strokeWidth="3"
            fill="none"
          />
          <g fill="#1d0e12">
            <circle cx="70" cy="222" r="5" />
            <circle cx="70" cy="192" r="5" />
            <circle cx="70" cy="44" r="5" />
          </g>
          <g fill="#c8102e">
            <circle cx="130" cy="152" r="5" />
            <circle cx="130" cy="118" r="5" />
            <circle cx="130" cy="84" r="5" />
          </g>
          <circle cx="70" cy="16" r="5" fill="#1d0e12" />
          <circle cx="70" cy="16" r="9" fill="none" stroke="#e0263c" strokeWidth="2" />
          <g fontSize="10" style={{ fontFamily: 'var(--i-mono)' }}>
            <text x="52" y="20" textAnchor="end" fill="#1d0e12">
              {P.a4.main}
            </text>
            <text transform="rotate(90 142 118)" x="142" y="118" textAnchor="middle" fill="#9e1420">
              {P.a4.branch}
            </text>
          </g>
        </svg>
        <div className="stamp">{P.a4.stamp}</div>
      </div>
      <div className="pn">{P.a4.no}</div>
    </div>
  )
}

function A5() {
  return (
    <div className="art a5">
      <div className="cap">{P.a5.cap}</div>
      <div className="pnl bs">
        <svg viewBox="0 0 200 90" aria-hidden="true">
          <g fill="#160a0d">
            <path d="M6 90 V32 h44 v58 z" />
            <rect x="3" y="27" width="50" height="6" rx="1" />
            <path d="M58 90 V24 h44 v66 z" />
            <rect x="55" y="19" width="50" height="6" rx="1" />
            <path d="M110 90 V34 h44 v56 z" />
            <rect x="107" y="29" width="50" height="6" rx="1" />
            <path d="M162 90 V40 h34 v50 z" />
            <rect x="159" y="35" width="40" height="6" rx="1" />
          </g>
          <g fill="#2a1013">
            <rect x="12" y="40" width="8" height="10" rx="1" />
            <rect x="28" y="40" width="8" height="10" rx="1" />
            <rect x="12" y="56" width="8" height="10" rx="1" />
            <rect x="28" y="56" width="8" height="10" rx="1" />
            <rect x="64" y="32" width="8" height="10" rx="1" />
            <rect x="80" y="32" width="8" height="10" rx="1" />
            <rect x="64" y="48" width="8" height="10" rx="1" />
            <rect x="80" y="48" width="8" height="10" rx="1" />
            <rect x="64" y="64" width="8" height="10" rx="1" />
            <rect x="116" y="42" width="8" height="10" rx="1" />
            <rect x="132" y="42" width="8" height="10" rx="1" />
            <rect x="116" y="58" width="8" height="10" rx="1" />
            <rect x="182" y="48" width="8" height="10" rx="1" />
          </g>
          <g fill="#ffe4d8">
            <rect x="80" y="64" width="8" height="10" rx="1" />
            <rect x="12" y="72" width="8" height="10" rx="1" />
            <rect x="132" y="58" width="8" height="10" rx="1" />
          </g>
          <rect x="168" y="64" width="8" height="10" rx="1" fill="#d4af37" />
        </svg>
      </div>
      <div className="pnl lap">
        <i className="glw" />
        <i className="scr" />
        <i className="kbd" />
      </div>
      <div className="pnl cbx cb">
        {P.a5.place}
        {'\n'}
        <b>{P.a5.line}</b>
      </div>
      <div className="pn">{P.a5.no}</div>
    </div>
  )
}

function A6() {
  return (
    <div className="art a6">
      <div className="cap">{P.a6.cap}</div>
      <div className="hd">{P.a6.head}</div>
      <div className="dt">{P.a6.title}</div>
      <div className="dsub">{P.a6.author}</div>
      <div className="dr" />
      <div className="cols">
        <i className="tx" />
        <i className="tx" />
      </div>
      <div className="fig">
        <svg viewBox="0 0 120 46" aria-hidden="true">
          <path d="M4 40 H116" stroke="#a5837b" strokeWidth="1" fill="none" />
          <path
            d="M4 23 Q14 4 24 23 T44 23 T64 23 T84 23 T104 23 T116 21"
            stroke="#241014"
            strokeWidth="2"
            fill="none"
          />
        </svg>
        <span>{P.a6.fig}</span>
      </div>
      <div className="pn">{P.a6.no}</div>
    </div>
  )
}

const C4_DISCS: readonly { c: number; r: number; you: boolean }[] = [
  { c: 2, r: 6, you: true },
  { c: 3, r: 6, you: false },
  { c: 4, r: 6, you: false },
  { c: 5, r: 6, you: true },
  { c: 2, r: 5, you: false },
  { c: 3, r: 5, you: true },
  { c: 4, r: 5, you: false },
  { c: 5, r: 5, you: true },
  { c: 4, r: 4, you: false },
]

function A7() {
  return (
    <div className="art a7">
      <div className="cap">{P.a7.cap}</div>
      <div className="c4">
        {C4_DISCS.map((d) => (
          <i
            key={`${d.c}-${d.r}`}
            className={d.you ? 'd chy' : 'd chr'}
            style={{ '--c': d.c, '--r': d.r } as React.CSSProperties}
          />
        ))}
      </div>
      <div className="pnl mv">
        {P.a7.move} <b>{P.a7.tick}</b>
      </div>
      <div className="pn">{P.a7.no}</div>
    </div>
  )
}

function A8() {
  return (
    <div className="art a8">
      <div className="ht2" />
      <div className="cap">{P.a8.cap}</div>
      <div className="head" />
      <div className="bust" />
      <div className="cap br">{P.a8.capBr}</div>
    </div>
  )
}

function A9() {
  return (
    <div className="art a9">
      <div className="cap bang">{P.a9.cap}</div>
      <div className="pow">{P.a9.pow}</div>
    </div>
  )
}

const STAR_POINTS =
  '188,100 150.2,113.5 176.2,144 136.8,136.8 144,176.2 113.5,150.2 100,188 86.5,150.2 56,176.2 63.2,136.8 23.8,144 49.8,113.5 12,100 49.8,86.5 23.8,56 63.2,63.2 56,23.8 86.5,49.8 100,12 113.5,49.8 144,23.8 136.8,63.2 176.2,56 150.2,86.5'

function A10() {
  return (
    <div className="art a10">
      <div className="ht" />
      <svg className="star" viewBox="0 0 200 200" aria-hidden="true">
        <polygon transform="translate(7 7)" fill="#3d0a10" opacity=".55" points={STAR_POINTS} />
        <polygon fill="#c8102e" stroke="#160a0d" strokeWidth="5" points={STAR_POINTS} />
      </svg>
      <div className="pow">{P.a10.pow}</div>
    </div>
  )
}

function A11() {
  return (
    <div className="art a11">
      <div className="pow">{P.a11.pow}</div>
    </div>
  )
}

function A12() {
  return <div className="art a12" />
}

function A13() {
  return (
    <div className="art a13">
      <pre className="ct">
        {P.a13.prompt}
        {'\n'}
        {P.a13.loading}
        <span className="cur" />
      </pre>
      <div className="scan" />
      <div className="crtv" />
    </div>
  )
}

/* -------------------------------------------------------------- p1–p6 */

function Plate({ plate }: { plate: IntroPlate }) {
  const a = getIntroPlate(plate)
  return (
    <div className="art pho">
      <div className="cap">{a.title}</div>
      <div className="frame">
        {/* plain <img> with dimensions (§2.8 allows it; the plates are already ≤ 760 px WebP) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.src} width={a.width} height={a.height} alt="" decoding="async" />
        <i className="dots" />
      </div>
      <div className="pcap">
        <span>{emphasize(a.subtitle, a.strong)}</span>
        <span className="no">{a.no}</span>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------- c1–c3 */

function Post({ id }: { id: 'c1' | 'c2' | 'c3' }) {
  const c: IntroPostCard = INTRO_COPY.posts[id]
  return (
    <div className={id === 'c3' ? 'art post mini' : 'art post'} style={{ '--tilt': c.tilt } as React.CSSProperties}>
      <div className={id === 'c3' ? 'cap bang' : 'cap'}>{c.cap}</div>
      <div className="card">
        <div className="who">
          <span className="av">
            <b>{c.avatar}</b>
          </span>
          <span className="idb">
            <span className="nm">{c.name}</span>
            {c.meta ? <span className="mt">{c.meta}</span> : null}
          </span>
        </div>
        <p className="tx2">{runs(c.text)}</p>
      </div>
      <div className="pn">{c.no}</div>
    </div>
  )
}

/* ---------------------------------------------------------------- bank */

const DRAWN: Record<Exclude<ArtId, IntroPlate | 'c1' | 'c2' | 'c3'>, () => JSX.Element> = {
  a1: A1,
  a2: A2,
  a3: A3,
  a4: A4,
  a5: A5,
  a6: A6,
  a7: A7,
  a8: A8,
  a9: A9,
  a10: A10,
  a11: A11,
  a12: A12,
  a13: A13,
}

/** One panel of the bank by id. Each use is an independent render (the source cloned nodes). */
export default function Art({ id }: { id: ArtId }) {
  if (id.startsWith('p')) return <Plate plate={id as IntroPlate} />
  if (id.startsWith('c')) return <Post id={id as 'c1' | 'c2' | 'c3'} />
  const Panel = DRAWN[id as keyof typeof DRAWN]
  return <Panel />
}
