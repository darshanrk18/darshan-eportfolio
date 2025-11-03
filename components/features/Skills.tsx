'use client'

import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import { inViewConfig } from '@/lib/styles/animations'
import SectionHeader from '@/components/ui/SectionHeader'
import SkillCard from '@/components/ui/SkillCard'
import { SKILL_CATEGORIES } from '@/lib/data'

export default function Skills() {
  const [ref, inView] = useInView(inViewConfig)

  return (
    <section id="skills" ref={ref} className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900/30 overflow-x-hidden w-full">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          title="// Skills"
          description="A collection of technologies and tools I work with to build amazing applications"
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SKILL_CATEGORIES.map((category, categoryIndex) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: categoryIndex * 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <h3 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white text-center">
                {category.title}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {category.skills.map((skill, skillIndex) => (
                  <SkillCard
                    key={skill.name}
                    skill={skill}
                    categoryIndex={categoryIndex}
                    skillIndex={skillIndex}
                    inView={inView}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
