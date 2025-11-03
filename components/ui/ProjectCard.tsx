'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { FiGithub, FiExternalLink } from 'react-icons/fi'
import type { Project } from '@/lib/types'

export type ProjectCardVariant = 'default' | 'compact' | 'detailed'

interface ProjectCardProps {
  readonly project: Project
  readonly delay?: number
  readonly inView: boolean
  readonly variant?: ProjectCardVariant
  readonly className?: string
  readonly showYear?: boolean
  readonly showTechnologies?: boolean
}

/**
 * ProjectCard component displays a project with details and links
 * Optimized with React.memo and extensible with variants
 * 
 * @param project - Project data object
 * @param delay - Animation delay in seconds
 * @param inView - Whether the component is currently in view
 * @param variant - Visual variant (default, compact, detailed)
 * @param className - Additional CSS classes
 * @param showYear - Whether to display the year badge (default: true)
 * @param showTechnologies - Whether to display technology tags (default: true)
 */
function ProjectCard({
  project,
  delay = 0,
  inView,
  variant = 'default',
  className = '',
  showYear = true,
  showTechnologies = true,
}: ProjectCardProps) {
  const headerHeight = variant === 'compact' ? 'h-32' : 'h-48'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden group ${className}`}
    >
      <div className={`${headerHeight} bg-gradient-to-br from-primary-500 to-primary-700 relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-4xl font-bold opacity-50">
            {project.title.charAt(0)}
          </div>
        </div>
        {showYear && project.year && (
          <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-semibold">
            {project.year}
          </div>
        )}
      </div>
      <div className={`p-6 ${variant === 'compact' ? 'p-4' : ''}`}>
        <h3 className={`font-semibold mb-3 text-gray-900 dark:text-white ${variant === 'compact' ? 'text-xl' : 'text-2xl'}`}>
          {project.title}
          {project.isPaper && (
            <span className="ml-2 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-1 rounded-full">
              Published Paper
            </span>
          )}
        </h3>
        <p className={`text-gray-600 dark:text-gray-400 mb-4 leading-relaxed ${variant === 'compact' ? 'text-sm mb-2' : ''}`}>
          {project.description}
        </p>
        {showTechnologies && (
          <div className={`flex flex-wrap gap-2 mb-6 ${variant === 'compact' ? 'mb-4' : ''}`}>
            {project.technologies.map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm rounded-full"
              >
                {tech}
              </span>
            ))}
          </div>
        )}
        <div className="flex space-x-4">
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            aria-label={`View ${project.title} on GitHub`}
          >
            <FiGithub className="w-5 h-5" />
            <span>Code</span>
          </a>
          {project.demo && (
            <a
              href={project.demo}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              aria-label={project.isPaper ? `View ${project.title} paper` : `View ${project.title} live demo`}
            >
              <FiExternalLink className="w-5 h-5" />
              <span>{project.isPaper ? 'View Paper' : 'Live Demo'}</span>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default memo(ProjectCard)
