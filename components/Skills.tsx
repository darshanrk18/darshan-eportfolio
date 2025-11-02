'use client'

import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function Skills() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const skillCategories = [
    {
      title: 'Languages',
      skills: [
        { name: 'Python', icon: 'python' },
        { name: 'Java', icon: 'java' },
        { name: 'C/C++', icon: 'cpp' },
        { name: 'JavaScript', icon: 'javascript' },
        { name: 'TypeScript', icon: 'typescript' },
        { name: 'SQL', icon: 'mysql' },
      ],
    },
    {
      title: 'Frontend & Frameworks',
      skills: [
        { name: 'React', icon: 'react' },
        { name: 'Redux', icon: 'redux' },
        { name: 'Next.js', icon: 'nextjs' },
        { name: 'Node.js', icon: 'nodejs' },
        { name: 'Express', icon: 'expressjs' },
        { name: 'Flask', icon: 'flask' },
        { name: 'Django', icon: 'django' },
      ],
    },
    {
      title: 'Cloud & DevOps',
      skills: [
        { name: 'AWS', icon: 'aws' },
        { name: 'Docker', icon: 'docker' },
        { name: 'Kubernetes', icon: 'kubernetes' },
        { name: 'Terraform', icon: 'terraform' },
        { name: 'Jenkins', icon: 'jenkins' },
        { name: 'GitHub Actions', icon: 'githubactions' },
        { name: 'Prometheus', icon: 'prometheus' },
        { name: 'Grafana', icon: 'grafana' },
      ],
    },
    {
      title: 'Databases',
      skills: [
        { name: 'MySQL', icon: 'mysql' },
        { name: 'PostgreSQL', icon: 'postgresql' },
        { name: 'MongoDB', icon: 'mongodb' },
        { name: 'Redis', icon: 'redis' },
        { name: 'Kafka', icon: 'kafka' },
      ],
    },
    {
      title: 'Tools',
      skills: [
        { name: 'Git', icon: 'git' },
        { name: 'Linux', icon: 'linux' },
        { name: 'Jira', icon: 'jira' },
        { name: 'Confluence', icon: 'confluence' },
      ],
    },
  ]

  return (
    <section id="skills" ref={ref} className="py-20 px-4 sm:px-6 lg:px-8 overflow-x-hidden w-full">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white font-mono">
            {'// Skills'}
          </h2>
          <div className="w-24 h-1 bg-primary-600 mx-auto mb-8"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            A collection of technologies and tools I work with to build amazing applications
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {skillCategories.map((category, categoryIndex) => (
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
                  <motion.div
                    key={skill.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{
                      duration: 0.4,
                      delay: categoryIndex * 0.2 + skillIndex * 0.05,
                    }}
                    className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors group cursor-pointer"
                  >
                    <div className="w-10 h-10 mb-2 flex items-center justify-center bg-transparent rounded-lg transition-all group-hover:scale-110">
                      <Image
                        src={`/skill-icons/${skill.icon}.svg`}
                        alt={skill.name}
                        width={40}
                        height={40}
                        className="object-contain"
                        unoptimized
                        onError={(e) => {
                          // Fallback: try with -auto suffix
                          const target = e.target as HTMLImageElement;
                          target.src = `/skill-icons/${skill.icon}-auto.svg`;
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                      {skill.name}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

