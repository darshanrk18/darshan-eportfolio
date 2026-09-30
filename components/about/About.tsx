/**
 * About — v3 S2 (SCREEN "ORIGIN") / P2 (PRINT "Ch. I — The Origin Story").
 * RSC shell, one DOM, two skins (styles/v3/about.css):
 *
 *   SCREEN (S2): the big lit portrait (the Decompiled Portrait island, with
 *   "Replay the portrait") beside the kicker → ORIGIN → lede → two
 *   paragraphs → the three facts (Jan 2027 / 10,000+ / 300+), then the
 *   six-photograph filmstrip Bengaluru 2021 – 2023 → Boston since 2025
 *   with captions, and "Next: Skills".
 *   PRINT (P2): the chapter head, then the seven-panel comic grid — the
 *   portrait panel (narration + "Try: Reveal the portrait"), Bengaluru,
 *   EXORA, Boston, Day one, the Seaport (with three logo stickers), the
 *   Amazon door with the outcome box, and the closing quote — then the
 *   folio and "Continued in Ch. II".
 *
 * Every string is lib/data/about.ts (CONTENT_FINAL verbatim or its approved
 * frame edits) or lib/data/photos.ts; nothing here is a literal fact. The
 * v2 markdown source pane, wormhole and stat chips are retired (the clutter
 * law; the facts live in the facts row / the panels).
 */

import { about } from '@/lib/data/about'
import { FILMSTRIP_ORDER, PHOTOS, type PhotoKey } from '@/lib/data/photos'
import Logo from '@/components/skills/Logo'
import Filmstrip from './FilmstripIsland'
import PortraitIsland from './PortraitIsland'
import RichText from './RichText'
import '@/styles/v3/about.css'

function Arrow() {
  return (
    <svg
      className="ab-arr"
      viewBox="0 0 14 10"
      width="14"
      height="10"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M0 5h12M8 1l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** A PRINT panel's halftone photograph (the shared .ed-ht recipe, hero.css). */
function Halftone({
  photo,
  variant,
  className,
}: {
  photo: PhotoKey
  variant?: 'coarse' | 'bare'
  className?: string
}) {
  const p = PHOTOS[photo]
  const cls = ['ed-ht', variant ? `is-${variant}` : '', className ?? ''].filter(Boolean).join(' ')
  return (
    <div className={cls} aria-hidden="true">
      <div className="ed-ht-in">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.print}
          alt=""
          width={p.width}
          height={p.height}
          loading="lazy"
          decoding="async"
        />
        <i className="ed-ht-scr" />
      </div>
    </div>
  )
}

export default function About() {
  const { screen, print } = about
  const { panels } = print
  const portrait = PHOTOS.portrait

  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="about"
      data-component="About"
      data-island="RSC"
      style={{ ['--vs-i' as string]: 1 }}
    >
      {/* SCREEN atmosphere (aria-hidden; hidden under PRINT). */}
      <div aria-hidden="true" className="ed-light ab-light" />
      <div aria-hidden="true" className="ed-beam ab-beam" />
      <i aria-hidden="true" className="ed-screen-only ab-leak ab-leak-a" />
      <i aria-hidden="true" className="ed-screen-only ab-leak ab-leak-b" />
      <i aria-hidden="true" className="ed-screen-only ab-leak ab-leak-c" />
      <i aria-hidden="true" className="ed-screen-only ab-leak ab-leak-d" />
      <i aria-hidden="true" className="ed-ember ab-ember ab-ember-a" />
      <i aria-hidden="true" className="ed-ember ab-ember ab-ember-b" />
      <div aria-hidden="true" className="ed-grain ab-grain" />
      {/* PRINT sheet: registration targets. */}
      <i aria-hidden="true" className="ed-regmark ab-reg ab-reg-tl" />
      <i aria-hidden="true" className="ed-regmark ab-reg ab-reg-tr" />

      <div className="container-site ab-wrap">
        <div className="ab-grid">
          {/* Section head: SCREEN kicker + ORIGIN / PRINT CH. I + THE ORIGIN STORY. */}
          <header className="ab-top">
            <p className="ab-kicker ed-label ed-screen-only" data-surface="kicker">
              <i aria-hidden="true" className="ab-kicker-rule" />
              {about.kicker}
            </p>
            <p className="ab-chapter ed-print-only">{print.chapter.numeral}</p>
            <h2 id="about-title" className="ab-title ed-disp" data-surface="title">
              <span className="ed-screen-only">{about.title}</span>
              <span className="ed-print-only">{print.chapter.title}</span>
            </h2>
          </header>

          {/* The portrait: SCREEN's lit photograph / PRINT's panel 01. */}
          <i aria-hidden="true" className="ed-screen-only ab-leak ab-leak-f" />
          <PortraitIsland
            className="ab-portrait"
            label={panels.portrait.label}
            alt={portrait.alt}
            replayLabel={screen.replayLabel}
            tryPrefix={panels.portrait.tryPrefix}
            tryLabel={panels.portrait.tryLabel}
            narration={<RichText rich={panels.portrait.narration} />}
          />

          {/* SCREEN copy column. */}
          <div className="ab-copy ed-screen-only">
            <p className="ab-lede">{screen.lede}</p>
            <div className="ab-body">
              <p>{screen.p1}</p>
              <p>{screen.p2}</p>
            </div>
            <ul className="ab-facts">
              {screen.facts.map((f) => (
                <li key={f.label} className="ab-fact">
                  <b className="ab-fact-v ab-num">{f.value}</b>
                  <span className="ab-fact-l">{f.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* PRINT panels 02–04: Bengaluru · EXORA · Boston. */}
          <div className="ab-tier ab-tier-1 ed-print-only">
            <figure
              className="ab-pnl ab-pnl-bengaluru"
              aria-label={PHOTOS[panels.bengaluru.photo].alt}
            >
              <Halftone photo={panels.bengaluru.photo} />
              <figcaption className="ab-nar">
                <RichText rich={panels.bengaluru.narration} />
              </figcaption>
              <span className="ab-tag ed-red">{panels.bengaluru.tag}</span>
            </figure>
            <figure className="ab-pnl ab-pnl-exora" aria-label={PHOTOS[panels.exora.photo].alt}>
              <Halftone photo={panels.exora.photo} />
              <figcaption className="ab-award">
                <span className="ab-award-lead">{panels.exora.lead}</span>
                <b className="ab-award-h ed-h">{panels.exora.award}</b>
              </figcaption>
            </figure>
            <figure className="ab-pnl ab-pnl-boston" aria-label={PHOTOS[panels.boston.photo].alt}>
              <Halftone photo={panels.boston.photo} />
              <span className="ab-corner">{panels.boston.corner}</span>
              <figcaption className="ab-nar is-flush">
                <RichText rich={panels.boston.narration} />
              </figcaption>
              <span className="ab-tag ed-blue">{panels.boston.tag}</span>
            </figure>
          </div>

          {/* PRINT panels 05–06: Day one · the Seaport. */}
          <div className="ab-tier ab-tier-2 ed-print-only">
            <figure className="ab-pnl ab-pnl-dayone" aria-label={PHOTOS[panels.dayOne.photo].alt}>
              <Halftone photo={panels.dayOne.photo} variant="bare" />
              <span className="ab-burst ed-sfx is-red" aria-hidden="true">
                {panels.dayOne.burst[0]}
                <br />
                {panels.dayOne.burst[1]}
              </span>
              <span className="sr-only">{panels.dayOne.burst.join(' ')}</span>
              <span className="ab-tag ed-ink ab-num">{panels.dayOne.tag}</span>
            </figure>
            <figure className="ab-pnl ab-pnl-seaport" aria-label={PHOTOS[panels.seaport.photo].alt}>
              <Halftone photo={panels.seaport.photo} variant="coarse" />
              <span className="ab-lab">{panels.seaport.label}</span>
              <figcaption className="ab-nar">
                <RichText rich={panels.seaport.narration} />
              </figcaption>
              <span className="ab-stickers">
                {panels.seaport.stickers.map((s, i) => (
                  <span key={s.id} className={`ab-stk ab-stk-${i}`}>
                    <Logo id={s.id} size={22} />
                    {s.label}
                  </span>
                ))}
              </span>
            </figure>
          </div>

          {/* PRINT panels 07–08: the door · the last word. */}
          <div className="ab-tier ab-tier-3 ed-print-only">
            <figure className="ab-pnl ab-pnl-door" aria-label={PHOTOS[panels.door.photo].alt}>
              <i aria-hidden="true" className="ed-halftone-red ab-door-dots" />
              <Halftone photo={panels.door.photo} className="ab-door-ht" />
              <i aria-hidden="true" className="ab-door-rule" />
              <figcaption className="ab-nar">
                <RichText rich={panels.door.narration} />
              </figcaption>
              <p className="ab-outcome">
                <span className="ab-outcome-lead">{panels.door.outcome.lead}</span>
                <b className="ab-outcome-h ed-h">{panels.door.outcome.rest}</b>
              </p>
            </figure>
            <figure className="ab-pnl ab-pnl-quote ed-blue" aria-label={panels.quote.label}>
              <div className="ed-ht is-bare ab-benday" aria-hidden="true">
                <div className="ed-ht-in">
                  <i className="ab-benday-src" />
                  <i className="ed-ht-scr" />
                </div>
              </div>
              <span aria-hidden="true" className="ab-quote-mark ed-h">
                &ldquo;
              </span>
              <blockquote className="ab-quote ed-h">{about.pullQuote}</blockquote>
              <figcaption className="ab-sig ed-bang">— {about.signature}</figcaption>
            </figure>
          </div>
        </div>

        {/* SCREEN: Bengaluru → Boston, in six photographs. */}
        <div className="ab-reel ed-screen-only" role="region" aria-label={screen.filmstripLabel}>
          <Filmstrip order={FILMSTRIP_ORDER} closeLabel={screen.viewerClose}>
            {screen.legs.map((leg, li) => (
              <div
                key={leg.city}
                className={`ab-leg ab-leg-${li}`}
                style={{ ['--n' as string]: leg.photos.length }}
              >
                <p className="ab-leg-head">
                  <span className="ab-pl">{leg.city}</span>
                  <span className="ab-yr ab-num">{leg.years}</span>
                </p>
                <i aria-hidden="true" className="ab-rail" />
                <ul className="ab-frames">
                  {leg.photos.map((key) => {
                    const p = PHOTOS[key]
                    const index = FILMSTRIP_ORDER.indexOf(key)
                    return (
                      <li key={key} className="ab-frame" style={{ ['--i' as string]: index }}>
                        <a
                          className={`ab-fr ab-fr-${key}`}
                          href={p.screen}
                          data-photo={key}
                          aria-label={`View photo: ${p.alt}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.screen}
                            alt=""
                            width={p.width}
                            height={p.height}
                            loading="lazy"
                            decoding="async"
                          />
                          <span className="ab-view" aria-hidden="true">
                            View
                          </span>
                        </a>
                        <span className="ab-cap">{p.caption}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </Filmstrip>
        </div>

        <div className="ab-foot">
          <a className="ab-next ed-screen-only" href="#skills">
            {screen.nextLabel}
            <Arrow />
          </a>
          <span className="ab-folio ed-print-only ab-num">{print.folioPage}</span>
          <a className="ab-continued ed-print-only ed-bang" href="#skills">
            {print.continued}
            <span aria-hidden="true"> →</span>
          </a>
        </div>
      </div>
    </section>
  )
}
