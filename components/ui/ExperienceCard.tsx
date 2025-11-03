'use client'

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { FiCalendar, FiMapPin, FiBriefcase, FiArrowRight } from 'react-icons/fi'
import { ANIMATION_DURATIONS, ANIMATION_EASING } from '@/lib/config'
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
  const gapClass = variant === 'compact' ? 'gap-2' : 'gap-3'
  const listClass = variant === 'compact' ? 'space-y-2 text-sm' : 'space-y-3'

  return (
    <>
      <div className="flex items-start mb-6">
        {showIcon && (
          <motion.div
            className="flex-shrink-0 mr-5"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.1,
            }}
          >
            <div className="text-5xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 p-4 rounded-2xl shadow-lg">
              {experience.icon}
            </div>
          </motion.div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold mb-4 text-gray-900 dark:text-white ${titleClass} leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300`}>
            {experience.title}
          </h3>
          <div className={`flex flex-wrap items-center ${gapClass} mb-5`}>
            <motion.span
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20 text-primary-700 dark:text-primary-300 rounded-lg font-medium text-sm shadow-sm"
              whileHover={{ scale: 1.05, y: -2 }}
              transition={{ duration: ANIMATION_DURATIONS.fast }}
            >
              <FiBriefcase className="w-4 h-4" />
              <span className="font-semibold">{experience.organization}</span>
            </motion.span>
            <motion.span
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium shadow-sm"
              whileHover={{ scale: 1.05, y: -2 }}
              transition={{ duration: ANIMATION_DURATIONS.fast }}
            >
              <FiMapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              {experience.location}
            </motion.span>
            <motion.span
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium shadow-sm"
              whileHover={{ scale: 1.05, y: -2 }}
              transition={{ duration: ANIMATION_DURATIONS.fast }}
            >
              <FiCalendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              {experience.period}
            </motion.span>
          </div>
        </div>
      </div>
      <ul className={listClass}>
        {experience.description.map((item, index) => (
          <motion.li
            key={item}
            className="text-gray-700 dark:text-gray-300 flex items-start group/item"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: ANIMATION_DURATIONS.medium,
              delay: 0.3 + index * 0.1,
              ease: ANIMATION_EASING.smooth,
            }}
          >
            <motion.span
              className="text-primary-600 dark:text-primary-400 mr-3 mt-1 flex-shrink-0"
              whileHover={{ scale: 1.2, rotate: 90 }}
              transition={{ duration: ANIMATION_DURATIONS.fast }}
            >
              <FiArrowRight className="w-5 h-5" />
            </motion.span>
            <span className="leading-relaxed text-base">{item}</span>
          </motion.li>
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
  const paddingLeft = useMemo(() => (showTimeline ? 'pl-20 md:pl-24' : 'pl-0'), [showTimeline])
  const cardPadding = useMemo(() => (variant === 'compact' ? 'p-5' : 'p-8 md:p-10'), [variant])
  const initialX = useMemo(() => (showTimeline ? -60 : 0), [showTimeline])
  const hoverX = useMemo(() => (showTimeline ? 8 : 0), [showTimeline])
  const whileHoverProps = useMemo(
    () =>
      variant === 'compact'
        ? {}
        : {
            scale: 1.015,
            x: hoverX,
            transition: {
              duration: ANIMATION_DURATIONS.normal,
              ease: ANIMATION_EASING.smooth,
            },
          },
    [variant, hoverX]
  )
  const animationDelay = useMemo(() => delay + 0.15, [delay])

  return (
    <div className={`relative mb-16 ${paddingLeft} ${className}`}>
      {/* Timeline dot - outside motion context to stay static */}
      {showTimeline && <TimelineDot timelineDotColor={timelineDotColor} inView={inView} delay={delay} />}

      <motion.div
        initial={{ opacity: 0, x: initialX, scale: 0.95 }}
        animate={inView ? { opacity: 1, x: 0, scale: 1 } : {}}
        transition={{
          duration: ANIMATION_DURATIONS.slower,
          delay,
          type: 'spring',
          stiffness: 120,
          damping: 20,
          ease: ANIMATION_EASING.default,
        }}
        whileHover={whileHoverProps}
        className="group"
      >
        <motion.div
          className={`relative bg-white dark:bg-gray-800 rounded-2xl ${cardPadding} shadow-xl border-2 border-gray-100 dark:border-gray-700 group-hover:border-primary-400/60 dark:group-hover:border-primary-500/60 group-hover:shadow-2xl group-hover:shadow-primary-500/20 dark:group-hover:shadow-primary-500/30 transition-all duration-500 overflow-hidden backdrop-blur-sm`}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{
            duration: ANIMATION_DURATIONS.slow,
            delay: animationDelay,
            ease: ANIMATION_EASING.smooth,
          }}
        >
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 via-primary-50/0 to-primary-50/0 dark:from-primary-900/0 dark:via-primary-900/0 dark:to-primary-900/0 group-hover:from-primary-50/5 group-hover:via-primary-50/3 group-hover:to-primary-50/0 dark:group-hover:from-primary-900/10 dark:group-hover:via-primary-900/5 dark:group-hover:to-primary-900/0 rounded-2xl pointer-events-none transition-all duration-500" />
          
          {/* Content */}
          <div className="relative z-10">
            <ExperienceInfo experience={experience} variant={variant} showIcon={showIcon} />
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default memo(ExperienceCard)
