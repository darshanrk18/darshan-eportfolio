/**
 * Hero parts (v3 S1 / P1) — server-safe, zero client JS. Pure markup the
 * Hero RSC composes: the shared arrow glyph, the Play card's static mini
 * Connect Four board (S1 §5), the PRINT cover's hero group (the head
 * breaking out of a cracked ink panel + the one speech balloon, P1 §2/§5)
 * and the three teaser-card artworks (P1 §5). Everything decorative is
 * aria-hidden; the two portraits carry their alt text. Skin: hero.css.
 */

import { HERO_MINI_BOARD, hero } from '@/lib/data/hero'
import { PHOTOS } from '@/lib/data/photos'
import Logo from '@/components/skills/Logo'
import { resolveLogo } from '@/lib/data/logos'

/** The one arrow every "→" link uses (S1 §5): 14×10, stroke 1.2. */
export function Arrow({ className }: { className?: string }) {
  return (
    <svg
      className={className ? `hero-arr ${className}` : 'hero-arr'}
      viewBox="0 0 14 10"
      width="14"
      height="10"
      fill="none"
      aria-hidden="true"
    >
      <path d="M0 5h12M8 1l4 4-4 4" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * The Play card's mini board: 7×6 cells from HERO_MINI_BOARD. Disc colours
 * are the edition's --ed-disc-you / --ed-disc-engine tokens (director call d).
 */
export function MiniBoard() {
  return (
    <span className="hero-board" aria-hidden="true">
      {HERO_MINI_BOARD.map((row, r) =>
        Array.from(row).map((cell, c) => (
          <i key={`${r}-${c}`} className={cell === 'y' ? 'y' : cell === 'e' ? 'e' : undefined} />
        )),
      )}
    </span>
  )
}

/* The P1 cutout: traced from the Sep 29 studio portrait (option A) as
   portrait-paper.webp at 475×475 (−112, −50) inside a 330×440 box; the head
   rises above the panel top (y 172). Source: design-workshop/photos/options. */
const CUTOUT =
  'polygon(22px 425px, 22px 172px, 25.6px 171.8px, 26.2px 168.6px, 26.2px 165.4px, 26.7px 162.1px, 26.7px 158.9px, 26.7px 155.7px, 26.7px 152.4px, 27.3px 149.2px, 27.8px 145.9px, 27.8px 142.7px, 27.8px 139.5px, 27.8px 136.2px, 27.8px 133px, 27.8px 129.7px, 27.3px 126.5px, 28.3px 123.3px, 26.2px 120px, 26.2px 116.8px, 25.6px 113.6px, 25.6px 110.3px, 26.2px 107.1px, 26.7px 103.8px, 25.1px 100.6px, 23.5px 97.4px, 22.9px 94.1px, 23.5px 90.9px, 23.5px 87.6px, 23.5px 84.4px, 23.5px 81.2px, 21.9px 77.9px, 23.5px 74.7px, 21.3px 71.4px, 21.9px 68.2px, 24.6px 65px, 25.6px 61.7px, 25.6px 58.5px, 26.7px 55.3px, 28.3px 52px, 33.2px 48.8px, 34.8px 45.5px, 37px 42.3px, 38.6px 39.1px, 41.3px 35.8px, 44px 32.6px, 46.7px 29.3px, 52.6px 26.1px, 55.9px 22.9px, 74.8px 19.6px, 88.8px 16.4px, 96.9px 13.2px, 100.7px 9.9px, 109.8px 6.7px, 126px 6.7px, 134.1px 9.9px, 149.8px 13.2px, 155.7px 16.4px, 159px 19.6px, 164.4px 22.9px, 169.8px 26.1px, 174.1px 29.3px, 180.6px 32.6px, 183.3px 35.8px, 186px 39.1px, 187px 42.3px, 188.7px 45.5px, 190.8px 48.8px, 200px 52px, 207px 55.3px, 208.1px 58.5px, 209.2px 61.7px, 208.6px 65px, 208.1px 68.2px, 207px 71.4px, 205.4px 74.7px, 203.8px 77.9px, 203.2px 81.2px, 201.1px 84.4px, 197.8px 87.6px, 198.4px 90.9px, 197.3px 94.1px, 197.8px 97.4px, 196.8px 100.6px, 197.8px 103.8px, 189.7px 107.1px, 184.3px 110.3px, 184.3px 113.6px, 183.8px 116.8px, 182.2px 120px, 182.2px 123.3px, 182.2px 126.5px, 182.2px 129.7px, 180.6px 133px, 180.6px 136.2px, 180.6px 139.5px, 180px 142.7px, 180px 145.9px, 180px 149.2px, 179.5px 152.4px, 190.3px 155.7px, 191.9px 158.9px, 193px 162.1px, 193px 165.4px, 193.5px 168.6px, 193px 171.8px, 300px 172px, 300px 425px)'

const KEYLINE =
  'M25.6 171.8 L26.2 168.6 L26.2 165.4 L26.7 162.1 L26.7 158.9 L26.7 155.7 L26.7 152.4 L27.3 149.2 L27.8 145.9 L27.8 142.7 L27.8 139.5 L27.8 136.2 L27.8 133 L27.8 129.7 L27.3 126.5 L28.3 123.3 L26.2 120 L26.2 116.8 L25.6 113.6 L25.6 110.3 L26.2 107.1 L26.7 103.8 L25.1 100.6 L23.5 97.4 L22.9 94.1 L23.5 90.9 L23.5 87.6 L23.5 84.4 L23.5 81.2 L21.9 77.9 L23.5 74.7 L21.3 71.4 L21.9 68.2 L24.6 65 L25.6 61.7 L25.6 58.5 L26.7 55.3 L28.3 52 L33.2 48.8 L34.8 45.5 L37 42.3 L38.6 39.1 L41.3 35.8 L44 32.6 L46.7 29.3 L52.6 26.1 L55.9 22.9 L74.8 19.6 L88.8 16.4 L96.9 13.2 L100.7 9.9 L109.8 6.7 L126 6.7 L134.1 9.9 L149.8 13.2 L155.7 16.4 L159 19.6 L164.4 22.9 L169.8 26.1 L174.1 29.3 L180.6 32.6 L183.3 35.8 L186 39.1 L187 42.3 L188.7 45.5 L190.8 48.8 L200 52 L207 55.3 L208.1 58.5 L209.2 61.7 L208.6 65 L208.1 68.2 L207 71.4 L205.4 74.7 L203.8 77.9 L203.2 81.2 L201.1 84.4 L197.8 87.6 L198.4 90.9 L197.3 94.1 L197.8 97.4 L196.8 100.6 L197.8 103.8 L189.7 107.1 L184.3 110.3 L184.3 113.6 L183.8 116.8 L182.2 120 L182.2 123.3 L182.2 126.5 L182.2 129.7 L180.6 133 L180.6 136.2 L180.6 139.5 L180 142.7 L180 145.9 L180 149.2 L179.5 152.4 L190.3 155.7 L191.9 158.9 L193 162.1 L193 165.4 L193.5 168.6 L193 171.8'

const BALLOON =
  'M1080.3 110.2A76 54 0 1 1 1101.9 120.9Q1070 140 1034 150Q1062 130 1080.3 110.2Z'

/**
 * P1's hero group (370×468): the cracked ink panel, the halftone portrait
 * whose head breaks out through the top, the torn keyline, the paper
 * shards, and the balloon with its tail to his mouth. PRINT only (the
 * wrapper is .ed-print-only); phones scale the whole group uniformly.
 */
export function CoverArt() {
  const portrait = PHOTOS.portrait
  return (
    <div className="hero-cover ed-print-only">
      <div className="hero-cover-in">
      <div className="hero-cover-rot">
        <span aria-hidden="true" className="hero-cover-panel hero-in" />
        <div className="hero-cover-cut" style={{ clipPath: CUTOUT }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="hero-cover-photo"
            src={portrait.print}
            alt={hero.coverPortraitAlt}
            width={475}
            height={475}
            loading="lazy"
            decoding="async"
          />
          <div className="ed-ht is-soft hero-cover-ht" aria-hidden="true">
            <div className="ed-ht-in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={portrait.print} alt="" width={475} height={475} loading="lazy" decoding="async" />
              <i className="ed-ht-scr" />
            </div>
          </div>
        </div>
        <svg className="hero-cover-lines" viewBox="0 0 330 440" width="330" height="440" aria-hidden="true">
          <path
            className="hero-cover-key"
            d={KEYLINE}
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path d="M24 167 L27 158 L31 163 L35 153 L38 167 Z" fill="currentColor" />
          <path d="M194 167 L198 155 L202 162 L206 152 L209 160 L214 167 Z" fill="currentColor" />
          <path d="M28 160 L20 150 L24 145 L13 134 L16 128 L6 120" fill="none" stroke="currentColor" strokeWidth="2.4" />
          <path d="M22 166 L12 158 L6 161 L-4 151" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M210 162 L222 156 L226 160 L240 152 L246 155" fill="none" stroke="currentColor" strokeWidth="2.4" />
          <g className="hero-cover-shards" fill="var(--ed-white)" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
            <polygon className="hero-shard hero-shard-a" points="2,150 17,130 22,147" />
            <polygon className="hero-shard hero-shard-b" points="8,116 12,99 24,108" />
            <polygon className="hero-shard hero-shard-c" points="256,150 272,137 270,156" />
            <polygon className="hero-shard hero-shard-d" points="290,146 302,133 305,146" />
          </g>
        </svg>
      </div>
      <svg className="hero-cover-balloon" viewBox="1030 8 200 160" width="200" height="160" aria-hidden="true">
        <path transform="translate(4 4)" d={BALLOON} fill="currentColor" />
        <path d={BALLOON} fill="var(--ed-white)" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      </svg>
      <p className="hero-speech ed-bang">{hero.cover.speech}</p>
      </div>
    </div>
  )
}

/** Toolkit teaser art: wires + three named stickers (P1 card 1). */
function ToolkitArt() {
  return (
    <>
      <span className="ed-halftone-blue hero-prev-screen" />
      <svg viewBox="0 0 196 154" width="196" height="154" className="hero-prev-wires">
        <path d="M46 48V80H80" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M79 75L86 80L79 85Z" fill="currentColor" />
        <path d="M158 102V128H140" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="5 4" strokeLinejoin="round" />
        <path d="M141 123L134 128L141 133Z" fill="currentColor" />
      </svg>
      {hero.cover.toolkitStickers.map((s, i) => {
        const label = resolveLogo(s.id, false)?.label ?? s.id
        return (
          <span key={s.id} className={`hero-stk hero-stk-${i}${s.state ? ` is-${s.state}` : ''}`}>
            <Logo id={s.id} size={18} />
            {label}
          </span>
        )
      })}
    </>
  )
}

/** Connect Four teaser art: the blue board, a dropping yellow disc, the engine's bubble (P1 card 2). */
function BoardArt() {
  const rows = [50.5, 67.5, 84.5, 101.5, 118.5, 135.5]
  const cols = [30.5, 47.5, 64.5, 81.5, 98.5, 115.5, 132.5]
  // Filled cells from the frame: red (engine) and yellow (you); the rest empty ivory.
  const red = new Set(['1-5', '2-4', '3-3', '3-5', '5-5'])
  const yellow = new Set(['2-5', '3-4', '4-4', '4-5'])
  return (
    <>
      <span className="ed-halftone-red hero-prev-screen" />
      <svg viewBox="0 0 196 154" width="196" height="154" className="hero-prev-board">
        <rect x="22" y="42" width="127" height="110" rx="4" fill="currentColor" />
        <rect x="18" y="38" width="127" height="110" rx="4" fill="var(--accent-electron)" stroke="currentColor" strokeWidth="2.5" />
        {rows.map((cy, r) =>
          cols.map((cx, c) => {
            const k = `${c}-${r}`
            const fill = red.has(k) ? 'var(--ed-disc-engine, #d7262d)' : yellow.has(k) ? 'var(--ed-disc-you, #f6c21c)' : 'var(--ed-white)'
            return <circle key={k} cx={cx} cy={cy} r={red.has(k) || yellow.has(k) ? 6.4 : 6.2} fill={fill} stroke="currentColor" strokeWidth="1.1" />
          }),
        )}
        <path d="M42.5 4V10M47.5 2V9M52.5 4V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle className="hero-prev-disc" cx="47.5" cy="22" r="7.6" fill="var(--ed-disc-you, #f6c21c)" stroke="currentColor" strokeWidth="2" />
        <circle className="hero-prev-disc" cx="47.5" cy="22" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".6" />
        <path transform="translate(3 3)" d="M112 4H174A13 13 0 0 1 174 30H144L132 42L133 30H112A13 13 0 0 1 112 4Z" fill="currentColor" />
        <path d="M112 4H174A13 13 0 0 1 174 30H144L132 42L133 30H112A13 13 0 0 1 112 4Z" fill="var(--ed-white)" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        <text x="143" y="22.5" textAnchor="middle" className="hero-prev-bubble-text" fontSize="15" letterSpacing=".9" fill="currentColor">
          {hero.cover.yourMove.toUpperCase()}
        </text>
      </svg>
    </>
  )
}

/** Console teaser art: a small drawn terminal with the prompt (P1 card 3). */
function ConsoleArt() {
  return (
    <>
      <span className="hero-prev-screen hero-prev-screen-yellow" />
      <span className="hero-prev-term">
        <span className="hero-prev-term-bar">
          <i />
          <i />
          <i />
        </span>
        <span className="hero-prev-term-line">
          <span className="hero-prev-prompt">~$</span> whoami
          <i className="hero-prev-caret" />
        </span>
        <span className="hero-prev-scan" />
      </span>
    </>
  )
}

export function PreviewArt({ kind }: { kind: 'toolkit' | 'board' | 'console' }) {
  return (
    <span className="hero-prev-artin">
      {kind === 'toolkit' ? <ToolkitArt /> : kind === 'board' ? <BoardArt /> : <ConsoleArt />}
    </span>
  )
}
