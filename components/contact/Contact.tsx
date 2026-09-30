/**
 * Contact (`#contact`) — V3_SPEC §3 "Contact", frames S6 (SCREEN: the
 * letter + the console) and P6 (PRINT: Ch. V The Letters Page — the
 * airmail envelope, the comic console, the links, the closing strip). RSC
 * shell, one DOM, two skins (styles/v3/contact.css):
 *   .ct-letter   SCREEN: the glass stage (eyebrow, the two-line headline,
 *                email + copy, "Write to me", Résumé / GitHub / LinkedIn,
 *                the desk photo wash). PRINT: `display: contents` — its
 *                head becomes the chapter row and its .ct-env the envelope
 *                (By air mail, stamp, postmark, TO, the addressee, email +
 *                copy, the RE: picker, WRITE HIM).
 *   .ct-console  the console island (Terminal): bar + output + rail; PRINT
 *                adds the "Meanwhile, in the console…" caption.
 *   .ct-links    the three links again under the console (PRINT only —
 *                the SCREEN copy lives inside the letter).
 *   .ct-closer   PRINT's closing strip: colophon, Replay the intro, TO BE
 *                CONTINUED…
 * Facts from lib/data/profile; labels from ./copy. Decorative nodes are
 * rendered for both editions and shown by one (README §4).
 */

import '@/styles/v3/contact.css'
import DkSeal from '@/components/chrome/DkSeal'
import { photoSrc, PHOTOS } from '@/lib/data/photos'
import ContactActions from './ContactActions'
import ContactLinks from './ContactLinks'
import ReplayIntro from './ReplayIntro.client'
import Terminal from './TerminalIsland'
import { contactCopy } from './copy'

/** P6 §5 — the postmark: two rings, the location on the lower arc, the year. */
function Postmark() {
  return (
    <svg className="ct-postmark ed-print-only" viewBox="0 0 92 92" width="92" height="92" aria-hidden="true">
      <defs>
        <path id="ct-postmark-arc" d="M7 46a39 39 0 0 0 78 0" fill="none" />
      </defs>
      <circle cx="46" cy="46" r="43" fill="none" stroke="currentColor" strokeWidth="2.8" />
      <circle cx="46" cy="46" r="27" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <text className="ct-postmark-arc" textAnchor="middle">
        <textPath href="#ct-postmark-arc" startOffset="50%">
          {contactCopy.print.postmark}
        </textPath>
      </text>
      <text className="ct-postmark-year" x="46" y="52" textAnchor="middle">
        {contactCopy.print.postmarkYear}
      </text>
    </svg>
  )
}

export default function Contact() {
  const desk = PHOTOS.desk
  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="ct section-pad"
      data-component="Contact"
      data-island="RSC"
      style={{ ['--vs-i' as string]: 5 }}
    >
      {/* SCREEN atmosphere — hidden under PRINT. */}
      <span className="ed-light ct-light ed-screen-only" aria-hidden="true" />
      <span className="ct-ember ed-ember ed-screen-only" aria-hidden="true" />

      <div className="container-site ct-in">
        <div className="ct-grid">
          <div className="ct-letter ed-stage" data-surface="stage">
            <span className="ed-corner ct-corner tl ed-screen-only" aria-hidden="true" />
            <span className="ed-corner ct-corner tr ed-screen-only" aria-hidden="true" />
            <span className="ed-corner ct-corner bl ed-screen-only" aria-hidden="true" />
            <span className="ed-corner ct-corner br ed-screen-only" aria-hidden="true" />
            <span className="ed-beam ct-beam ed-screen-only" aria-hidden="true" />
            <span className="ed-halo ct-halo ed-screen-only" aria-hidden="true" />
            {/* The dusk-graded desk photo, washed in from the right (S6 §5). */}
            <span className="ct-wash ed-screen-only" aria-hidden="true">
              <span className="ct-wash-y">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoSrc('desk', 'screen')}
                  width={desk.width}
                  height={desk.height}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              </span>
              <span className="ct-wash-shade" />
              <span className="ct-wash-dusk" />
            </span>

            <header className="ct-head">
              <p className="ct-kicker ed-label ed-screen-only" data-surface="kicker">
                <span className="ct-rule" aria-hidden="true" />
                {contactCopy.screen.kicker}
              </p>
              <div className="ct-head-row">
                <p className="ct-chapter ed-print-only">{contactCopy.print.chapter}</p>
                <h2 id="contact-heading" className="ct-title">
                  <span className="ct-title-screen ed-screen-only">
                    <span>{contactCopy.screen.headline[0]}</span>
                    <span>{contactCopy.screen.headline[1]}</span>
                  </span>
                  <span className="ct-title-print ed-disp ed-print-only" data-surface="title">
                    {contactCopy.print.title}
                  </span>
                </h2>
              </div>
              <p className="ct-lede ed-print-only">{contactCopy.print.lede}</p>
            </header>

            <div className="ct-env">
              <span className="ct-airmail ed-print-only" aria-hidden="true">
                {contactCopy.print.airmail}
              </span>
              <span className="ct-stamp ed-print-only" aria-hidden="true">
                <span className="ct-stamp-in">
                  <DkSeal variant="mark" size={44} />
                </span>
              </span>
              <Postmark />
              <p className="ct-to ed-print-only" aria-hidden="true">
                {contactCopy.print.to}
              </p>
              <p className="ct-addressee ed-print-only">{contactCopy.print.addressee}</p>
              <ContactActions />
            </div>
          </div>

          <div className="ct-console-slot">
            <p className="ct-caption ed-print-only" aria-hidden="true">
              {contactCopy.print.consoleCaption}
            </p>
            <Terminal />
          </div>

          <ContactLinks className="ct-links-print ed-print-only" />
        </div>

        {/* P6 closing strip — the issue's last panel. */}
        <footer className="ct-closer ed-print-only" aria-label={contactCopy.print.colophonTitle}>
          <div className="ct-colo">
            <span className="ct-roundel" aria-hidden="true">
              <DkSeal variant="mark" size={40} />
            </span>
            <div>
              <p className="ct-colo-title">{contactCopy.print.colophonTitle}</p>
              <p className="ct-colo-line">{contactCopy.print.colophonLine}</p>
              <ReplayIntro label={contactCopy.print.replay} />
            </div>
          </div>
          <div className="ct-tbc">
            <span className="ct-tbc-rays" aria-hidden="true" />
            <p className="ct-tbc-title ed-disp is-white">{contactCopy.print.toBeContinued}</p>
          </div>
        </footer>
      </div>
    </section>
  )
}
