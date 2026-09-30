/**
 * Hero — v3 S1 (SCREEN stage) / P1 (PRINT cover). RSC shell, one DOM.
 *
 * Invariant (§7): the <h1> is server-rendered text and the LCP element;
 * nothing gates it. Edition differences are CSS (styles/v3/hero.css, keyed
 * on html[data-edition]) plus always-rendered decorative nodes that the
 * other edition hides (`.ed-screen-only` / `.ed-print-only`, README §4):
 *
 *   SCREEN (S1): kicker with the live dot · metal name (Cinzel, 11 s sheen,
 *   cursor-following highlight) · lede · "Get in touch" + "Selected work" ·
 *   the -41 portrait lit on the right · four chapter cards (Work / Skills /
 *   Experience / Play with the static mini board) · blurred photo floats,
 *   the volumetric light, halo, gate, embers, grain · "Press ⌘K to go anywhere".
 *   PRINT (P1): the cover — caption box, the Bangers name lockup with the
 *   red drop, role banners, education line, WRITE HIM / RESUME / GitHub /
 *   LinkedIn, "In this issue", the hero group with the speech balloon,
 *   sunburst + dot screens, three teaser cards, "Replay the intro".
 *
 * Entry choreography is declarative CSS (`.hero-in` + `--d`); the HeroEntry
 * island only holds it while the picker / intro cover the page and pauses
 * the resting loops off-screen. The GlyphField mounts in SCREEN only
 * (its island renders null under PRINT). Copy: lib/data/hero.ts + profile.
 */

import type { CSSProperties } from 'react'
import { profile } from '@/lib/data/profile'
import { hero } from '@/lib/data/hero'
import { PHOTOS, portraitSrcSet } from '@/lib/data/photos'
import { resolveLogo } from '@/lib/data/logos'
import Logo from '@/components/skills/Logo'
import GlyphField from './GlyphField'
import HeroAction from './HeroAction.client'
import HeroEntry from './HeroEntry.client'
import PalettePill from './PalettePill'
import QuickRow from './QuickRow'
import ReplayIntro from './ReplayIntro.client'
import { Arrow, CoverArt, MiniBoard, PreviewArt } from './parts'
import '@/styles/v3/hero.css'

/** Entry stagger: `--d` is the delay of one `.hero-in` node. */
const d = (ms: number): CSSProperties => ({ '--d': `${ms}ms` }) as CSSProperties

/**
 * The cursor drift (S1 motion note): on fine pointers the name's highlight
 * band and the key cone drift ±3% / ±24px with the pointer over the stage.
 * ~10 lines inline (zero bundle bytes), rAF-throttled, writes ONE custom
 * property (`--hero-mx`, −1…1) on the section; CSS does the rest.
 */
const HERO_DRIFT_SCRIPT = `(function(){try{
if(!matchMedia('(hover: hover) and (pointer: fine)').matches)return;
var s=document.getElementById('hero'),g=s&&s.querySelector('.hero-stage');if(!g)return;
var raf=0,x=0;
function apply(){raf=0;s.style.setProperty('--hero-mx',x.toFixed(3))}
g.addEventListener('pointermove',function(e){var r=g.getBoundingClientRect();x=Math.max(-1,Math.min(1,((e.clientX-r.left)/r.width-.5)*2));if(!raf)raf=requestAnimationFrame(apply)},{passive:true});
g.addEventListener('pointerleave',function(){x=0;if(!raf)raf=requestAnimationFrame(apply)});
}catch(e){}})()`

/** The S1 portrait grade (design 41): shadows to black, highlights held at ≈.87. */
const GRADE_R = '0.020 0.070 0.146 0.222 0.316 0.412 0.506 0.598 0.700 0.800 0.876'
const GRADE_G = '0.020 0.068 0.142 0.216 0.308 0.402 0.494 0.586 0.688 0.788 0.862'
const GRADE_B = '0.020 0.066 0.138 0.210 0.300 0.392 0.482 0.572 0.672 0.770 0.842'

function Lede() {
  const text = profile.heroLede
  const em = profile.heroLedeEmphasis
  const i = text.indexOf(em)
  if (i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <b>{em}</b>
      {text.slice(i + em.length)}
    </>
  )
}

export default function Hero() {
  const portrait = PHOTOS.portrait
  const floats = [PHOTOS.schneider_office, PHOTOS.desk, PHOTOS.door] as const
  const { cards, cover, screen } = hero

  return (
    <section
      id="hero"
      aria-label="Introduction"
      className="hero"
      data-component="Hero"
      data-island="RSC"
      style={{ ['--vs-i' as string]: 0 }}
    >
      <HeroEntry />
      {/* SCREEN: the living glyph field behind the stage (null under PRINT). */}
      <GlyphField />

      {/* SCREEN atmosphere (aria-hidden, pointer-events none; hidden under PRINT). */}
      <div aria-hidden="true" className="ed-light hero-light hero-loop" />
      <div aria-hidden="true" className="ed-screen-only hero-leak hero-leak-a" />
      <div aria-hidden="true" className="ed-screen-only hero-leak hero-leak-b" />
      <div aria-hidden="true" className="ed-screen-only hero-leak hero-leak-c" />
      {floats.map((p, i) => (
        <div
          key={p.key}
          aria-hidden="true"
          className={`ed-float hero-float hero-float-${'abc'[i]} hero-loop${i === 1 ? ' b' : i === 2 ? ' c' : ''}`}
        >
          {/* The floats draw ≈ 130 × 180 px, blurred and dimmed: a 280 px encode
              (`-float`) is sharper than they need at 2×, ~10 KB instead of ~70. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.screen.replace(/\.webp$/, '-float.webp')}
            alt=""
            width={p.width}
            height={p.height}
            loading="lazy"
            decoding="async"
          />
        </div>
      ))}
      <div aria-hidden="true" className="ed-gate hero-gate" />
      <i aria-hidden="true" className="ed-ember hero-ember hero-ember-a hero-loop" />
      <i aria-hidden="true" className="ed-ember hero-ember hero-ember-b hero-loop" />
      <i aria-hidden="true" className="ed-ember hero-ember hero-ember-c hero-loop" />
      <div aria-hidden="true" className="ed-grain hero-grain" />
      {/* PRINT sheet furniture: registration targets (hidden under SCREEN). */}
      <i aria-hidden="true" className="ed-regmark hero-reg hero-reg-t" />
      <i aria-hidden="true" className="ed-regmark hero-reg hero-reg-l" />
      <i aria-hidden="true" className="ed-regmark hero-reg hero-reg-r" />

      <div className="container-site hero-wrap">
        {/* SCREEN: the glass edge catching the key (above the stage top). */}
        <i aria-hidden="true" className="ed-screen-only hero-rimhalo hero-in" style={d(120)} />
        <i aria-hidden="true" className="ed-screen-only hero-rim hero-in" style={d(120)} />

        <div className="hero-stage ed-stage hero-in" data-surface="stage" style={d(0)}>
          {/* SCREEN: key cone, rim bloom, portrait, vignette, halo. */}
          <i aria-hidden="true" className="ed-screen-only hero-cone hero-in" style={d(0)} />
          <i aria-hidden="true" className="ed-screen-only hero-rimbloom" />
          {/* PRINT: sunburst under the hero group, red + black dot screens. */}
          <i aria-hidden="true" className="ed-sunburst hero-sunburst" />
          <i aria-hidden="true" className="ed-halftone-red ed-print-only hero-reddots" />
          <i aria-hidden="true" className="ed-halftone ed-print-only hero-dots" />

          <div className="hero-pt ed-screen-only">
            <div className="hero-pt-x">
              <div className="hero-pt-z">
                <div className="hero-pt-y">
                  {/* The LCP image: eager, high priority, sized (§7). Phones get the
                      440 / 660 px encodes: `sizes` understates the phone width a
                      little (66vw) so 2× and 3× screens take the 660 px file — still
                      ~2× the drawn width for this soft-masked portrait — instead of
                      the 880 px master; desktop draws the master at 600 px. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="hero-pt-img"
                    src={portrait.screen}
                    srcSet={portraitSrcSet('screen')}
                    sizes="(max-width: 767px) 66vw, 600px"
                    alt={hero.portraitAlt}
                    width={600}
                    height={600}
                    fetchPriority="high"
                    decoding="async"
                  />
                  <i aria-hidden="true" className="hero-pt-cool" />
                  <i aria-hidden="true" className="hero-pt-leak hero-in" style={d(1400)} />
                </div>
              </div>
            </div>
          </div>
          <svg width="0" height="0" aria-hidden="true" className="hero-defs" focusable="false">
            <filter id="hero-grade" x="0" y="0" width="1" height="1" colorInterpolationFilters="sRGB">
              <feColorMatrix type="saturate" values="0.9" />
              <feComponentTransfer>
                <feFuncR type="table" tableValues={GRADE_R} />
                <feFuncG type="table" tableValues={GRADE_G} />
                <feFuncB type="table" tableValues={GRADE_B} />
              </feComponentTransfer>
            </filter>
          </svg>
          <i aria-hidden="true" className="ed-screen-only hero-vignette" />
          <i aria-hidden="true" className="ed-halo hero-halo" />

          <div className="hero-copy">
            {/* SCREEN kicker with the live dot / PRINT caption box. */}
            <p className="hero-kicker ed-label ed-screen-only hero-in" data-surface="kicker" style={d(80)}>
              <i aria-hidden="true" className="hero-dot hero-loop" />
              {profile.eyebrow}
            </p>
            <p className="hero-caption ed-cap ed-print-only hero-in" style={d(120)}>
              {cover.caption}
            </p>

            {/* The name: metal + sheen in SCREEN, the Bangers lockup in PRINT. */}
            <h1 className="hero-name ed-disp ed-metal hero-in" data-cover-name style={d(160)}>
              <span className="hero-name-w">{hero.name.first}</span>{' '}
              <span className="hero-name-w hero-name-last">{hero.name.last}</span>
            </h1>

            <p className="hero-lede ed-screen-only hero-in" style={d(320)}>
              <Lede />
            </p>

            {/* PRINT: role banners + the education line. */}
            <p className="hero-banners ed-print-only hero-in" style={d(260)}>
              <span className="hero-banner ed-bang ed-red">{cover.roleBanner}</span>
              <span className="hero-banner ed-bang ed-blue hero-num">{cover.statusBanner}</span>
            </p>
            <p className="hero-edu ed-print-only hero-in" style={d(320)}>
              {cover.education} <span className="hero-edu-date">· {cover.educationDate}</span>
            </p>

            <div className="hero-ctas hero-in" style={d(440)}>
              {/* SCREEN: one primary + one ghost. */}
              <a
                className="ed-btn ed-btn-primary ed-screen-only hero-btn"
                data-surface="btn-primary"
                href={`mailto:${profile.email}`}
              >
                {screen.getInTouch}
              </a>
              <HeroAction className="ed-btn ed-screen-only hero-btn hero-btn-ghost" href="#projects" action={{ kind: 'scroll' }}>
                {screen.selectedWork}
                <Arrow />
              </HeroAction>
              {/* PRINT: WRITE HIM · RESUME · GitHub · LinkedIn. */}
              <a className="ed-btn ed-btn-primary ed-print-only hero-cta hero-cta-write" href={`mailto:${profile.email}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m2 7 10 6 10-6" />
                </svg>
                <span className="hero-cta-stack">
                  <span className="hero-cta-big">{cover.writeHim}</span>
                  <span className="hero-cta-mail">{profile.email}</span>
                </span>
              </a>
              <a className="ed-btn ed-btn-live ed-print-only hero-cta" href={profile.resumePdf} download="darshan-konnur.pdf">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M8 13h8M8 17h8" />
                </svg>
                {cover.resume}
              </a>
              <a className="ed-btn ed-print-only hero-cta hero-cta-icon" href={profile.githubUrl} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <Logo id="github" size={24} />
              </a>
              <a className="ed-btn ed-print-only hero-cta hero-cta-icon" href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <Logo id="linkedin" size={23} />
              </a>
            </div>

            {/* SCREEN quick actions: copy email · résumé (visitor language). */}
            <div className="hero-quickrow ed-screen-only hero-in" style={d(520)}>
              <QuickRow />
            </div>
          </div>

          {/* PRINT: the contents. */}
          <nav aria-label={cover.issueTitle} className="hero-toc ed-print-only hero-in" style={d(350)}>
            <p className="hero-toc-head ed-bang">{cover.issueTitle}</p>
            <ol className="hero-toc-list">
              {cover.toc.map((item) => (
                <li key={item.anchor}>
                  <a className="hero-toc-item" href={item.anchor}>
                    <span className="hero-toc-row">
                      <span className="hero-toc-title">{item.title}</span>
                      <span className="hero-toc-lead" aria-hidden="true" />
                      <span className="hero-toc-pg hero-num">{item.page}</span>
                    </span>
                    <span className="hero-toc-deck">{item.deck}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* PRINT: the head breaking out of the panel + the balloon. */}
          <CoverArt />
        </div>

        {/* SCREEN: the four chapter cards. */}
        <div className="hero-cards ed-screen-only">
          <HeroAction className="hero-card ed-card hero-in" href="#projects" action={{ kind: 'open-project', slug: cards.work.slug }} style={d(560)}>
            <span className="hero-ch">
              {cards.work.heading}
              <i aria-hidden="true" />
            </span>
            <span className="hero-ct">{cards.work.title}</span>
            {cards.work.meta ? (
              <span className="hero-cm">
                <i aria-hidden="true" className="hero-dia" />
                {cards.work.meta}
              </span>
            ) : null}
            <span className="hero-cb">{cards.work.body}</span>
            <span className="hero-cl">
              {cards.work.link}
              <Arrow />
            </span>
          </HeroAction>

          <HeroAction className="hero-card ed-card hero-in" href="#skills" action={{ kind: 'deploy-all' }} style={d(620)}>
            <span className="hero-ch">
              {cards.skills.heading}
              <i aria-hidden="true" />
            </span>
            <span className="hero-chips">
              {cards.skills.chips.map((id) => (
                <span key={id} className="hero-chip ed-chip" data-surface="chip">
                  <Logo id={id} size={14} mono />
                  {resolveLogo(id)?.label ?? id}
                </span>
              ))}
            </span>
            <span className="hero-cl">
              {cards.skills.link}
              <Arrow />
            </span>
          </HeroAction>

          <HeroAction className="hero-card ed-card hero-in" href="#experience" action={{ kind: 'scroll' }} style={d(680)}>
            <span className="hero-ch">
              {cards.experience.heading}
              <i aria-hidden="true" />
            </span>
            <span className="hero-cg">
              <i aria-hidden="true" className="hero-stem" />
              <i aria-hidden="true" className="hero-fut" />
              {cards.experience.rows.map((row) => (
                <span key={row.id} className="hero-row">
                  <i aria-hidden="true" className={row.lit ? 'hero-nd on' : 'hero-nd'} />
                  <span className="hero-n">{row.name}</span>
                  <span className="hero-m hero-num">{row.meta}</span>
                </span>
              ))}
            </span>
            <span className="hero-cl">
              {cards.experience.link}
              <Arrow />
            </span>
          </HeroAction>

          <HeroAction className="hero-card ed-card hero-in" href="#projects" action={{ kind: 'run-project', slug: cards.play.slug }} style={d(740)}>
            <span className="hero-ch">
              {cards.play.heading}
              <i aria-hidden="true" />
            </span>
            <span className="hero-ct">{cards.play.title}</span>
            <span className="hero-cb hero-cb-narrow">{cards.play.body}</span>
            <MiniBoard />
            <span className="hero-cl">
              {cards.play.link}
              <Arrow />
            </span>
          </HeroAction>
        </div>

        {/* PRINT: three sneak previews. */}
        <div className="hero-previews ed-print-only">
          {cover.previews.map((p, i) => (
            <HeroAction
              key={p.anchor}
              className="hero-prev ed-card hero-in"
              href={p.anchor}
              action={p.action}
              aria-label={p.aria}
              style={d(520 + i * 90)}
            >
              <span className="hero-prev-art" aria-hidden="true">
                <PreviewArt kind={p.art} />
              </span>
              <span className="hero-prev-cap">
                <span className="hero-prev-ttl ed-bang">{p.title}</span>
                <span className="hero-prev-ch">
                  {p.chapter}
                  <Arrow />
                </span>
              </span>
            </HeroAction>
          ))}
        </div>

        <div className="hero-foot hero-in" style={d(900)}>
          <div className="hero-foot-l ed-screen-only">
            <PalettePill />
          </div>
          <a className="hero-next ed-screen-only" href="#about">
            {screen.nextLabel}
            <Arrow />
          </a>
          <div className="hero-imprint ed-print-only">
            <ReplayIntro label={cover.replayIntro} />
            <span className="ed-cmyk" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
          </div>
        </div>
      </div>

      {/* Cursor drift — end of the section so the stage exists. */}
      <script dangerouslySetInnerHTML={{ __html: HERO_DRIFT_SCRIPT }} />
    </section>
  )
}
