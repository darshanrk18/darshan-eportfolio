/**
 * Home Page
 * 
 * Main page component that orchestrates all portfolio sections.
 * Uses Next.js App Router structure.
 * 
 * @module app/page
 */

import dynamic from 'next/dynamic'
import Hero from '@/components/features/Hero'

// Dynamically import below-the-fold sections to reduce initial bundle size
// This improves First Contentful Paint and reduces unused JavaScript
const About = dynamic(() => import('@/components/features/About'), {
  ssr: true,
})
const Skills = dynamic(() => import('@/components/features/Skills'), {
  ssr: true,
})
const Projects = dynamic(() => import('@/components/features/Projects'), {
  ssr: true,
})
const Experience = dynamic(() => import('@/components/features/Experience'), {
  ssr: true,
})
const Contact = dynamic(() => import('@/components/features/Contact'), {
  ssr: true,
})

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

