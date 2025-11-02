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
      type: 'ta',
      title: 'Graduate Teaching Assistant – CS5010: Programming Design Paradigm',
      organization: 'Khoury College of Computer Sciences, Northeastern University',
      location: 'Boston, MA',
      period: 'Sep 2025 -- Present',
      description: [
        'Led weekly labs and office hours for 300+ MSCS students, mentoring in Java OOP, UML, testing (JUnit, JaCoCo), and design patterns (Visitor, Strategy, Adapter).',
        'Conducted code reviews and rubric-based grading, reinforcing best practices in debugging, scalability, and maintainability.',
      ],
      icon: '🎓',
    },
    {
      type: 'engineer',
      title: 'Digital Workplace Engineer',
      organization: 'Schneider Electric',
      location: 'Bengaluru, India',
      period: 'Feb 2021 -- Nov 2023',
      description: [
        'Developed and deployed internal full-stack apps using React, Node.js, Flask, and MySQL, serving 10k+ enterprise users.',
        'Containerized applications with Docker & Kubernetes (Rancher), integrated CI/CD pipelines for automated builds and deployments.',
        'Automated O365 group migrations with Python + Microsoft Graph API, cutting manual workload by 60%.',
        'Architected backend APIs with RESTful design and OAuth2; optimized SQL queries and schemas for 30% lower latency.',
        'Hosted technical workshops on Python automation and Azure scripting; onboarded and mentored new engineers.',
      ],
      icon: '💼',
    },
  ]

  return (
    <section id="experience" ref={ref} className="py-20 px-4 sm:px-6 lg:px-8 overflow-x-hidden w-full">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white font-mono">
            {'// Experience'}
          </h2>
          <div className="w-24 h-1 bg-primary-600 mx-auto mb-8"></div>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

            {experiences.map((exp, index) => (
              <motion.div
                key={exp.type}
                initial={{ opacity: 0, x: -50 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{
                  duration: 0.8,
                  delay: index * 0.3,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{
                  scale: 1.02,
                  x: 10,
                  transition: { duration: 0.2 }
                }}
                className="relative mb-12 pl-20 group"
              >
                {/* Timeline dot with animation */}
                <motion.div
                  className="absolute left-6 top-2 w-4 h-4 bg-primary-600 rounded-full border-4 border-white dark:border-gray-900 z-10"
                  initial={{ scale: 0 }}
                  animate={inView ? { scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.3 + 0.3 }}
                  whileHover={{ scale: 1.5, boxShadow: "0 0 20px rgba(14, 165, 233, 0.6)" }}
                />
                {/* Animated pulse ring */}
                <motion.div
                  className="absolute left-6 top-2 w-4 h-4 bg-primary-600 rounded-full opacity-0 group-hover:opacity-30"
                  animate={inView ? {
                    scale: [1, 2, 2.5],
                    opacity: [0.3, 0.1, 0]
                  } : {}}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.3 + 1
                  }}
                />

                <motion.div
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-transparent group-hover:border-primary-500/50 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.3 + 0.2 }}
                >
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
                    {exp.description.map((item) => (
                      <li
                        key={item}
                        className="text-gray-600 dark:text-gray-400 flex items-start"
                      >
                        <span className="text-primary-600 dark:text-primary-400 mr-2">&#9655;</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
