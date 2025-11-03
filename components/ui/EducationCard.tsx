'use client'

import { memo } from 'react'
import { FiCalendar } from 'react-icons/fi'
import BaseCard from './BaseCard'
import type { Education } from '@/lib/types'

type IconType = React.ComponentType<{ className?: string }>

interface EducationCardProps {
  readonly education: Education
  readonly icon: IconType
  readonly delay?: number
  readonly inView?: boolean
  readonly variant?: 'default' | 'primary' | 'secondary'
  readonly className?: string
}

/**
 * EducationCard component displays education information in a styled card
 * Built on BaseCard for consistent styling and extensibility
 * 
 * @param education - Education data object
 * @param icon - Icon component to display
 * @param delay - Animation delay in seconds
 * @param inView - Whether component is in viewport
 * @param variant - Visual variant for card styling
 * @param className - Additional CSS classes
 */
function EducationCard({
  education,
  icon: Icon,
  delay = 0,
  inView = true,
  variant = 'primary',
  className = '',
}: EducationCardProps) {
  const isCurrent = education.status === 'current'
  const cardVariant = isCurrent ? variant : 'secondary'

  return (
    <BaseCard
      variant={cardVariant}
      delay={delay}
      inView={inView}
      className={className}
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div
            className={`w-16 h-16 bg-gradient-to-br ${
              isCurrent
                ? 'from-primary-500 to-primary-700'
                : 'from-gray-500 to-gray-700'
            } rounded-xl flex items-center justify-center shadow-lg`}
          >
            <Icon className="w-8 h-8 text-white" />
          </div>
          <div>
            <div
              className={`px-3 py-1 rounded-full inline-block mb-1 ${
                isCurrent
                  ? 'bg-primary-100 dark:bg-primary-900/30'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}
            >
              <span
                className={`text-xs font-bold uppercase tracking-wide ${
                  isCurrent
                    ? 'text-primary-700 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {education.status === 'current' ? 'Current' : 'Completed'}
              </span>
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
            {education.degree}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            {education.institution}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {education.location}
          </p>
        </div>
        <div
          className={`flex items-center gap-2 pt-4 border-t-2 ${
            isCurrent
              ? 'border-primary-200 dark:border-primary-800'
              : 'border-gray-200 dark:border-gray-700'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isCurrent
                ? 'bg-primary-50 dark:bg-primary-900/20'
                : 'bg-gray-100 dark:bg-gray-700'
            }`}
          >
            <FiCalendar
              className={`w-5 h-5 ${
                isCurrent
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {education.period}
            </p>
            {education.periodLabel && (
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {education.periodLabel}
              </p>
            )}
          </div>
        </div>
        <div className="pt-2">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
              isCurrent
                ? 'bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30'
                : 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50'
            }`}
          >
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              GPA:
            </span>
            <span
              className={`text-lg font-bold font-mono ${
                isCurrent
                  ? 'text-primary-700 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {education.gpa}
            </span>
          </div>
        </div>
      </div>
    </BaseCard>
  )
}

export default memo(EducationCard)
