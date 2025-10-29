'use client'

import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import { FiCode, FiGraduationCap, FiTarget } from 'react-icons/fi'

export default function About() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const highlights = [
    {
      icon: FiCode,
      title: 'Full-Stack Developer',
      description: 'Passionate about building scalable, efficient, and user-friendly applications.',
    },
    {
      icon: FiGraduationCap,
      title: 'Master\'s Student',
      description: 'Pursuing advanced education in Computer Science at Northeastern University.',
    },
    {
      icon: FiTarget,
      title: 'Seeking Coop Opportunities',
      description: 'Eager to apply my skills in real-world projects and contribute to innovative teams.',
    },
  ]

  return (
    <section id="about" ref={ref} className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            About Me
          </h2>
          <div className="w-24 h-1 bg-primary-600 mx-auto mb-8"></div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              Hello! I'm Darshan
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
              I'm a dedicated software developer and master's student at{' '}
              <span className="font-semibold text-primary-600 dark:text-primary-400">
                Northeastern University, Boston
              </span>
              . My journey in software development has been driven by a passion for creating
              impactful solutions and continuously learning new technologies.
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
              Currently, I'm actively seeking{' '}
              <span className="font-semibold text-primary-600 dark:text-primary-400">
                coop opportunities
              </span>
              {' '}that will allow me to apply my technical skills in a professional environment,
              collaborate with experienced teams, and contribute to meaningful projects.
            </p>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              When I'm not coding, I enjoy exploring new technologies, contributing to open-source
              projects, and staying updated with the latest trends in software engineering.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-8 text-white shadow-2xl"
          >
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Education</h4>
                <p className="opacity-90">Master's in Computer Science</p>
                <p className="opacity-90">Northeastern University, Boston</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Status</h4>
                <p className="opacity-90">Actively seeking coop opportunities</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Location</h4>
                <p className="opacity-90">Boston, Massachusetts</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {highlights.map((highlight, index) => (
            <motion.div
              key={highlight.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-4">
                <highlight.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                {highlight.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{highlight.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

