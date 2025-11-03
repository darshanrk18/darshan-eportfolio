'use client'

import { useInView } from 'react-intersection-observer'
import { inViewConfig } from '@/lib/styles/animations'
import SectionHeader from '@/components/ui/SectionHeader'
import ProjectCard from '@/components/ui/ProjectCard'
import { PROJECTS_DATA } from '@/lib/data'

export default function Projects() {
  const [ref, inView] = useInView(inViewConfig)

  return (
    <section id="projects" ref={ref} className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900/50 overflow-x-hidden w-full">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          title="// Projects"
          description="A selection of projects that showcase my skills and experience in software development"
        />

        <div className="grid md:grid-cols-2 gap-8">
          {PROJECTS_DATA.map((project, index) => (
            <ProjectCard
              key={project.title}
              project={project}
              delay={index * 0.1}
              inView={inView}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
