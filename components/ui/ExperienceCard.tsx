'use client'

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { FiCalendar, FiMapPin, FiBriefcase } from 'react-icons/fi'
import type { Experience } from '@/lib/types'

export type ExperienceCardVariant = 'default' | 'compact' | 'detailed'
export type TimelineDotColor = 'primary' | 'secondary' | 'success' | 'info'

interface ExperienceCardProps {
  readonly experience: Experience
  readonly delay?: number
  readonly inView: boolean
  readonly variant?: ExperienceCardVariant
  readonly timelineDotColor?: TimelineDotColor
  readonly className?: string
  readonly showIcon?: boolean
  readonly showTimeline?: boolean
}

const dotColorClasses: Record<TimelineDotColor, string> = {
  primary: 'bg-primary-600',
  secondary: 'bg-gray-600',
  success: 'bg-green-600',
  info: 'bg-blue-600',
}

const dotGlowColors: Record<TimelineDotColor, string> = {
  primary: 'rgba(14, 165, 233, 0.6)',
  secondary: 'rgba(107, 114, 128, 0.6)',
  success: 'rgba(34, 197, 94, 0.6)',
  info: 'rgba(59, 130, 246, 0.6)',
}

interface TimelineDotProps {
  readonly timelineDotColor: TimelineDotColor
  readonly inView: boolean
  readonly delay: number
}

function TimelineDot({ timelineDotColor, inView, delay }: TimelineDotProps) {
  return (
    <>
      <motion.div
        className={`absolute left-6 top-2 w-4 h-4 ${dotColorClasses[timelineDotColor]} rounded-full border-4 border-white dark:border-gray-900 z-10`}
        initial={{ scale: 0 }}
        animate={inView ? { scale: 1 } : {}}
        transition={{ duration: 0.5, delay: delay + 0.3 }}
        whileHover={{
          scale: 1.5,
          boxShadow: `0 0 20px ${dotGlowColors[timelineDotColor]}`,
        }}
      />
      <motion.div
        className={`absolute left-6 top-2 w-4 h-4 ${dotColorClasses[timelineDotColor]} rounded-full opacity-0 group-hover:opacity-30`}
        animate={
          inView
            ? {
                scale: [1, 2, 2.5],
                opacity: [0.3, 0.1, 0],
              }
            : {}
        }
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: delay + 1,
        }}
      />
    </>
  )
}

interface ExperienceInfoProps {
  readonly experience: Experience
  readonly variant: ExperienceCardVariant
  readonly showIcon: boolean
}

function ExperienceInfo({ experience, variant, showIcon }: ExperienceInfoProps) {
  const titleClass = variant === 'compact' ? 'text-xl' : 'text-2xl'
  const gapClass = variant === 'compact' ? 'gap-2' : 'gap-4'
  const listClass = variant === 'compact' ? 'space-y-1 text-sm' : 'space-y-2'
  const marginLeft = showIcon ? 'ml-14' : ''

  return (
    <>
      <div className="flex items-start mb-4">
        {showIcon && <span className="text-3xl mr-4">{experience.icon}</span>}
        <div className="flex-1">
          <h3 className={`font-semibold mb-2 text-gray-900 dark:text-white ${titleClass}`}>
            {experience.title}
          </h3>
          <div className={`flex flex-wrap items-center ${gapClass} mb-3 text-sm text-gray-600 dark:text-gray-400`}>
            <span className="flex items-center gap-1">
              <FiBriefcase className="w-4 h-4" />
              {experience.organization}
            </span>
            <span className="flex items-center gap-1">
              <FiMapPin className="w-4 h-4" />
              {experience.location}
            </span>
            <span className="flex items-center gap-1">
              <FiCalendar className="w-4 h-4" />
              {experience.period}
            </span>
          </div>
        </div>
      </div>
      <ul className={`${listClass} ${marginLeft}`}>
        {experience.description.map((item) => (
          <li key={item} className="text-gray-600 dark:text-gray-400 flex items-start">
            <span className="text-primary-600 dark:text-primary-400 mr-2">&#9655;</span>
            {item}
          </li>
        ))}
      </ul>
    </>
  )
}

/**
 * ExperienceCard component displays work/education experience in timeline format
 * Fully extensible with variants and customization options
 * 
 * @param experience - Experience data object
 * @param delay - Animation delay in seconds
 * @param inView - Whether component is in viewport
 * @param variant - Visual variant (default, compact, detailed)
 * @param timelineDotColor - Color of the timeline dot (primary, secondary, success, info)
 * @param className - Additional CSS classes
 * @param showIcon - Whether to show the emoji icon (default: true)
 * @param showTimeline - Whether to show timeline line and dot (default: true)
 */
function ExperienceCard({
  experience,
  delay = 0,
  inView,
  variant = 'default',
  timelineDotColor = 'primary',
  className = '',
  showIcon = true,
  showTimeline = true,
}: ExperienceCardProps) {
  const paddingLeft = useMemo(() => (showTimeline ? 'pl-20' : 'pl-0'), [showTimeline])
  const cardPadding = useMemo(() => (variant === 'compact' ? 'p-4' : 'p-6'), [variant])
  const initialX = useMemo(() => (showTimeline ? -50 : 0), [showTimeline])
  const hoverX = useMemo(() => (showTimeline ? 10 : 0), [showTimeline])
  const whileHoverProps = useMemo(
    () =>
      variant === 'compact'
        ? {}
        : {
            scale: 1.02,
            x: hoverX,
            transition: { duration: 0.2 },
          },
    [variant, hoverX]
  )
  const animationDelay = useMemo(() => delay + 0.2, [delay])

  return (
    <motion.div
      initial={{ opacity: 0, x: initialX }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{
        duration: 0.8,
        delay,
        type: 'spring',
        stiffness: 100,
      }}
      whileHover={whileHoverProps}
      className={`relative mb-12 ${paddingLeft} group ${className}`}
    >
      {showTimeline && <TimelineDot timelineDotColor={timelineDotColor} inView={inView} delay={delay} />}

      <motion.div
        className={`bg-white dark:bg-gray-800 rounded-xl ${cardPadding} shadow-lg border-2 border-transparent group-hover:border-primary-500/50 transition-all duration-300`}
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: animationDelay }}
      >
        <ExperienceInfo experience={experience} variant={variant} showIcon={showIcon} />
      </motion.div>
    </motion.div>
  )
}

export default memo(ExperienceCard)
