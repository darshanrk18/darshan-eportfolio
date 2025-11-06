'use client'

import { useInView } from 'react-intersection-observer'
import { inViewConfig } from '@/lib/styles/animations'
import SectionHeader from '@/components/ui/SectionHeader'
import ExperienceCard from '@/components/ui/ExperienceCard'
import { EXPERIENCES_DATA } from '@/lib/data'

export default function Experience() {
  const [ref, inView] = useInView(inViewConfig)

  return (
    <section id="experience" ref={ref} className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-900/50 dark:to-gray-900 overflow-x-hidden w-full">
      <div className="max-w-7xl mx-auto">
        <SectionHeader title="// Experience" description="My professional journey and academic experience" />

        <div className="max-w-5xl mx-auto">
          <div className="relative">
            {/* Timeline line - original simple version */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

            {EXPERIENCES_DATA.map((exp, index) => (
              <ExperienceCard
                key={`${exp.title}-${exp.period}-${index}`}
                experience={exp}
                delay={index * 0.3}
                inView={inView}
                timelineDotColor="primary"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
