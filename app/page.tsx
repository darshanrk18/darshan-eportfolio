/**
 * Home — composes the §4 page order:
 * Boot overlay → Nav → Hero → About → Skills → Projects → Experience+Education
 * → Contact → Footer, plus the palette, reduced-motion banner, and cursor halo.
 * RSC shell; every island is a client component that hydrates on its own terms.
 */

import BootOverlay from '@/components/chrome/BootOverlay'
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

export default function HomePage() {
  return (
    <>
      <BootOverlay />
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
      <CursorHalo />
    </>
  )
}
