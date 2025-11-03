'use client'

import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import { FiCode, FiBook, FiTarget, FiAward } from 'react-icons/fi'
import Image from 'next/image'
import { inViewConfig } from '@/lib/styles/animations'
import SectionHeader from '@/components/ui/SectionHeader'
import EducationCard from '@/components/ui/EducationCard'
import LocationCard from '@/components/ui/LocationCard'
import { FULL_NAME, EDUCATION_DATA, LOCATION_DATA } from '@/lib/constants'

export default function About() {
  const [ref, inView] = useInView(inViewConfig)

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
        <SectionHeader title="// AboutMe" />

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

        {/* Education & Location Info */}
        {inView && (
          <div className="mb-16">
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
              {EDUCATION_DATA.map((education, index) => (
                <EducationCard
                  key={education.degree}
                  education={education}
                  icon={index === 0 ? FiAward : FiBook}
                  delay={0.6 + index * 0.1}
                  inView={inView}
                />
              ))}
              <LocationCard location={LOCATION_DATA} delay={0.9} inView={inView} />
            </div>
          </div>
        )}

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
