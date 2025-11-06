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
import LoadingScreen from '@/components/ui/LoadingScreen'

// Dynamically import below-the-fold sections to reduce initial bundle size
// This improves First Contentful Paint and reduces unused JavaScript
// Loading screens will show during lazy loading on slow connections
const About = dynamic(() => import('@/components/features/About'), {
  ssr: true,
  loading: () => <LoadingScreen message="Loading about section..." showProgress={false} />,
})
const Skills = dynamic(() => import('@/components/features/Skills'), {
  ssr: true,
  loading: () => <LoadingScreen message="Loading skills..." showProgress={false} />,
})
const Projects = dynamic(() => import('@/components/features/Projects'), {
  ssr: true,
  loading: () => <LoadingScreen message="Loading projects..." showProgress={false} />,
})
const Experience = dynamic(() => import('@/components/features/Experience'), {
  ssr: true,
  loading: () => <LoadingScreen message="Loading experience..." showProgress={false} />,
})
const Contact = dynamic(() => import('@/components/features/Contact'), {
  ssr: true,
  loading: () => <LoadingScreen message="Loading contact..." showProgress={false} />,
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
 * Sections use dynamic imports with loading screens that display
 * during lazy loading on slow connections.
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

