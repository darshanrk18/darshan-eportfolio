'use client'

import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import { FiCalendar, FiMapPin, FiBriefcase } from 'react-icons/fi'

export default function Experience() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const experiences = [
    {
      type: 'education',
      title: 'Master of Science in Computer Science',
      organization: 'Northeastern University',
      location: 'Boston, MA',
      period: '2023 - Present',
      description: [
        'Pursuing advanced coursework in algorithms, software engineering, and distributed systems',
        'Maintaining strong academic performance while developing practical software development skills',
        'Engaged in various projects covering full-stack development, machine learning, and cloud computing',
      ],
      icon: '🎓',
    },
    {
      type: 'status',
      title: 'Seeking Coop Opportunities',
      organization: 'Open to Opportunities',
      location: 'Boston, MA & Remote',
      period: '2024 - Present',
      description: [
        'Actively seeking coop positions in software development, web development, or software engineering',
        'Looking for opportunities to apply technical skills in real-world projects',
        'Interested in contributing to innovative teams and learning from experienced professionals',
      ],
      icon: '💼',
    },
  ]

  const achievements = [
    {
      title: 'Academic Excellence',
      description: 'Strong performance in graduate-level computer science courses',
    },
    {
      title: 'Project Portfolio',
      description: 'Developed multiple full-stack applications and software projects',
    },
    {
      title: 'Technical Skills',
      description: 'Proficient in modern web technologies and software development practices',
    },
    {
      title: 'Continuous Learning',
      description: 'Committed to staying updated with latest technologies and best practices',
    },
  ]

  return (
    <section id="experience" ref={ref} className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            Experience & Education
          </h2>
          <div className="w-24 h-1 bg-primary-600 mx-auto mb-8"></div>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

            {experiences.map((exp, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative mb-12 pl-20"
              >
                {/* Timeline dot */}
                <div className="absolute left-6 top-2 w-4 h-4 bg-primary-600 rounded-full border-4 border-white dark:border-gray-900"></div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                  <div className="flex items-start mb-4">
                    <span className="text-3xl mr-4">{exp.icon}</span>
                    <div className="flex-1">
                      <h3 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">
                        {exp.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 mb-3 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <FiBriefcase className="w-4 h-4" />
                          {exp.organization}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiMapPin className="w-4 h-4" />
                          {exp.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiCalendar className="w-4 h-4" />
                          {exp.period}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ul className="space-y-2 ml-14">
                    {exp.description.map((item, i) => (
                      <li
                        key={i}
                        className="text-gray-600 dark:text-gray-400 flex items-start"
                      >
                        <span className="text-primary-600 dark:text-primary-400 mr-2">▹</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16"
        >
          <h3 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Key Highlights
          </h3>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.title}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg"
              >
                <h4 className="text-xl font-semibold mb-2 text-primary-600 dark:text-primary-400">
                  {achievement.title}
                </h4>
                <p className="text-gray-600 dark:text-gray-400">{achievement.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

