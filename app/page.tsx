/**
 * Home Page
 * 
 * Main page component that orchestrates all portfolio sections.
 * Uses Next.js App Router structure.
 * 
 * @module app/page
 */

import Hero from '@/components/features/Hero'
import About from '@/components/features/About'
import Skills from '@/components/features/Skills'
import Projects from '@/components/features/Projects'
import Experience from '@/components/features/Experience'
import Contact from '@/components/features/Contact'

/**
 * Home page component
 * 
 * Renders all portfolio sections in order:
 * - Hero (landing section)
 * - About (background and education)
 * - Skills (technical skills)
 * - Projects (portfolio projects)
 * - Experience (work and teaching)
 * - Contact (contact form and information)
 * 
 * @returns Home page with all portfolio sections
 */
export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <Skills />
      <Projects />
      <Experience />
      <Contact />
    </>
  )
}

