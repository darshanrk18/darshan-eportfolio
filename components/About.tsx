'use client'

import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import { FiCode, FiBook, FiTarget, FiMapPin, FiAward, FiCalendar } from 'react-icons/fi'
import Image from 'next/image'
import { FULL_NAME } from '@/lib/constants'

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
      icon: FiBook,
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
    <section
      id="about"
      ref={ref}
      className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900/50 overflow-x-hidden w-full"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white font-mono">
            {"// AboutMe"}
          </h2>
          <div className="w-24 h-1 bg-primary-600 mx-auto mb-8"></div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-0 items-center mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-left"
          >
            <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              Hello! I&apos;m{" "}
              <span className="relative inline-block group">
                <span className="relative z-10 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 bg-clip-text text-transparent font-bold cursor-pointer">
                  {FULL_NAME.split(" ")[0]}
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 opacity-0 group-hover:opacity-30 blur-xl transition-all duration-300 -z-10">
                  {FULL_NAME.split(" ")[0]}
                </span>
                <motion.span
                  className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary-500 to-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
                  whileHover={{ scaleX: 1 }}
                />
              </span>
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
              I&apos;m a dedicated software developer and master&apos;s student
              at{" "}
              <span className="font-semibold text-primary-600 dark:text-primary-400">
                Northeastern University, Boston
              </span>{" "}
              (GPA: 3.78/4.0). With experience as a Digital Workplace Engineer
              at Schneider Electric, I&apos;ve developed full-stack applications
              serving 10k+ users and automated processes that reduced manual
              workload by 60%.
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
              Currently, I serve as a Graduate Teaching Assistant for CS5010:
              Programming Design Paradigm, mentoring 300+ MSCS students in Java
              OOP, design patterns, and software engineering best practices.
              I&apos;m actively seeking{" "}
              <span className="font-semibold text-primary-600 dark:text-primary-400">
                coop opportunities
              </span>{" "}
              to further apply my technical skills in cloud computing, DevOps,
              and full-stack development.
            </p>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              My expertise spans Python, Java, JavaScript/TypeScript, React,
              Node.js, Docker, Kubernetes, AWS, and various databases. I&apos;m
              passionate about building scalable systems and contributing to
              meaningful projects.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex justify-center"
          >
            {/* Professional Photo */}
            <div className="relative w-full max-w-xs sm:max-w-sm aspect-square sm:aspect-[4/5] animated-frame">
              <div className="relative w-full h-full overflow-hidden">
                <Image
                  src="/professional-photo/professional_pic.jpg"
                  alt={`${FULL_NAME.split(" ")[0]} - Professional Photo`}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 640px) 250px, (max-width: 768px) 280px, 320px"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Education & Location Info - Premium Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-16"
        >
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {/* Current Education */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="relative group flex flex-col"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-blue-500/20 dark:from-primary-500/10 dark:to-blue-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 shadow-2xl border-2 border-primary-200 dark:border-primary-900/30 hover:border-primary-400 dark:hover:border-primary-600 transition-all transform hover:-translate-y-1 flex flex-col h-full">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
                      <FiAward className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 rounded-full inline-block mb-1">
                        <span className="text-xs font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wide">Current</span>
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                        Education
                      </h4>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      MS in Computer Science
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      Northeastern University
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Boston, Massachusetts
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-4 border-t-2 border-primary-200 dark:border-primary-800">
                    <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                      <FiCalendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Jan 2025 - Present</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">Currently Enrolled</p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-lg">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">GPA:</span>
                      <span className="text-lg font-bold font-mono text-primary-700 dark:text-primary-400">3.78/4.0</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Previous Education */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="relative group flex flex-col"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-blue-500/20 dark:from-primary-500/10 dark:to-blue-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 shadow-2xl border-2 border-primary-200 dark:border-primary-900/30 hover:border-primary-400 dark:hover:border-primary-600 transition-all transform hover:-translate-y-1 flex flex-col h-full">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-700 rounded-xl flex items-center justify-center shadow-lg">
                      <FiBook className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full inline-block mb-1">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Completed</span>
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                        Education
                      </h4>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      BE in Computer Science
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      MS Ramaiah Institute of Technology
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Bengaluru, India
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <FiCalendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Aug 2017 - Jul 2021</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">4 Years</p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-lg">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">GPA:</span>
                      <span className="text-lg font-bold font-mono text-gray-700 dark:text-gray-300">8.78/10.0</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Location */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="relative group flex flex-col"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-blue-500/20 dark:from-primary-500/10 dark:to-blue-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 shadow-2xl border-2 border-primary-200 dark:border-primary-900/30 hover:border-primary-400 dark:hover:border-primary-600 transition-all transform hover:-translate-y-1 flex flex-col h-full">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <FiMapPin className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full inline-block mb-1">
                        <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">Base</span>
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                        Location
                      </h4>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      Boston
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      Massachusetts, USA
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      United States of America
                    </p>
                  </div>
                  <div className="pt-4 border-t-2 border-primary-200 dark:border-primary-800">
                    <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-primary-50/50 to-blue-50/50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-xl border border-primary-200 dark:border-primary-800">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 animate-pulse"></div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Available Now</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">Open to on-site & remote opportunities</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

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
              <p className="text-gray-600 dark:text-gray-400">
                {highlight.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

