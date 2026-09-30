/**
 * Home — composes the v3 page order (V3_SPEC §3):
 *   EditionPicker · IntroGate · LenisProvider · Navbar · ReducedMotionBanner
 *   · main [Hero About Skills Projects Experience Contact] · Footer
 *   · CommandPalette · Guide · BuildInfo · CursorHalo
 * RSC shell; every island is a client component that hydrates on its own
 * terms. The `#top` sentinel is the scroll-to-top target for the ident and
 * the footer's "Back to top" (scrollToAnchor needs a real element; C2 must
 * not add another id="top").
 *
 * v3: the v2 BootOverlay (BIOS POST) is retired (§1.6). SCREEN's entry is
 * the hero's own on-load motion; PRINT's boot is the intro island (C6,
 * next/dynamic behind IntroGate). Build evidence lives only behind the
 * palette's Build info (§1.8).
 */

import EditionPicker from '@/components/edition/EditionPicker.client'
import IntroGate from '@/components/intro/IntroGate.client'
import LenisProvider from '@/components/chrome/LenisProvider'
import Navbar from '@/components/chrome/Navbar'
import ReducedMotionBanner from '@/components/chrome/ReducedMotionBanner'
import CursorHalo from '@/components/chrome/CursorHalo'
import Hero from '@/components/hero/Hero'
import About from '@/components/about/About'
import Skills from '@/components/skills/Skills'
import Projects from '@/components/projects/Projects'
import Experience from '@/components/experience/Experience'
import Contact from '@/components/contact/Contact'
import Footer from '@/components/footer/Footer'
import CommandPalette from '@/components/palette/CommandPalette'
import Guide from '@/components/guide/Guide.client'
import BuildInfo from '@/components/palette/BuildInfo.client'

export default function HomePage() {
  return (
    <>
      {/* Scroll-to-top sentinel (styles/v3/chrome.css .sig-top). */}
      <div id="top" className="sig-top" />
      <EditionPicker />
      <IntroGate />
      {/* v2 §5.1 — Lenis mounts on '/' ONLY (never layout: /cv stays zero-JS). */}
      <LenisProvider />
      <Navbar />
      <ReducedMotionBanner />
      <main id="main" className="relative" style={{ zIndex: 'var(--z-content)' }}>
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Experience />
        <Contact />
      </main>
      <Footer />
      <CommandPalette />
      <Guide />
      <BuildInfo />
      <CursorHalo />
    </>
  )
}
