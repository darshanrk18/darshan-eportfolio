'use client'

import { useInView } from 'react-intersection-observer'
import { inViewConfig } from '@/lib/styles/animations'
import SectionHeader from '@/components/ui/SectionHeader'
import ExperienceCard from '@/components/ui/ExperienceCard'
import { EXPERIENCES_DATA } from '@/lib/data'

export default function Experience() {
  const [ref, inView] = useInView(inViewConfig)

  return (
    <section id="experience" ref={ref} className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900/30 overflow-x-hidden w-full">
      <div className="max-w-7xl mx-auto">
        <SectionHeader title="// Experience" />

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

            {EXPERIENCES_DATA.map((exp, index) => (
              <ExperienceCard
                key={exp.type}
                experience={exp}
                delay={index * 0.3}
                inView={inView}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
