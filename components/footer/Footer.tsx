/**
 * Footer — the quiet closing line in both editions (V3_SPEC §1.8, §3
 * "Footer"; frames S6 bottom / P1 imprint). RSC, zero JS of its own; the
 * "Back to top" link is a ~0.3 KB island so it rides scrollToAnchor (Lenis
 * glide + focus) instead of a native jump.
 *
 *   SCREEN: seal · "Darshan Konnur · Boston, MA"          "Back to top ↑"
 *   PRINT:  seal · "KONNUR COMICS · FIRST PRINTING · 2026" "Back to top" · CMYK
 *
 * One DOM: both signature strings render and CSS shows one per edition
 * (.ed-screen-only / .ed-print-only). Build evidence (SHA, KB, fps, the
 * `N/6` payoff) left this footer for the palette's Build info panel
 * (components/palette/BuildInfo.client.tsx) — nothing here imports
 * lib/build/inject, so the manifest JSON stays out of the first-load bundle.
 * Skin: styles/v3/chrome.css (`.sig-foot*`), imported by the Navbar.
 */

import { profile } from '@/lib/data/profile'
import DkSeal from '@/components/chrome/DkSeal'
import BackToTop from './BackToTop.client'

export default function Footer() {
  return (
    <footer
      className="sig-foot relative"
      style={{ zIndex: 'var(--z-content)', ['--vs-i' as string]: 6 }}
      data-component="Footer"
      data-island="RSC"
    >
      <div className="container-site sig-foot-row">
        <p className="sig-foot-sig">
          <DkSeal variant="mark" size={24} />
          <span className="ed-screen-only">
            {profile.displayName} · {profile.location}
          </span>
          <span className="ed-print-only">Konnur Comics · First printing · 2026</span>
        </p>
        <p className="sig-foot-right">
          <BackToTop>
            Back to top
            <span aria-hidden="true" className="ed-screen-only">
              ↑
            </span>
          </BackToTop>
          {/* PRINT press furniture — the four ink chips (decorative). */}
          <span className="ed-cmyk ed-print-only" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
        </p>
      </div>
    </footer>
  )
}
