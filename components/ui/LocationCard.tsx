'use client'

import { memo } from 'react'
import { FiMapPin } from 'react-icons/fi'
import BaseCard from './BaseCard'
import type { LocationInfo } from '@/lib/types'

interface LocationCardProps {
  readonly location: LocationInfo
  readonly delay?: number
  readonly inView?: boolean
  readonly variant?: 'default' | 'primary' | 'info'
  readonly className?: string
}

/**
 * LocationCard component displays location information in a styled card
 * Built on BaseCard for consistent styling and extensibility
 * 
 * @param location - Location data object
 * @param delay - Animation delay in seconds
 * @param inView - Whether component is in viewport
 * @param variant - Visual variant for card styling (default: info)
 * @param className - Additional CSS classes
 */
function LocationCard({
  location,
  delay = 0,
  inView = true,
  variant = 'info',
  className = '',
}: LocationCardProps) {
  return (
    <BaseCard variant={variant} delay={delay} inView={inView} className={className}>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <FiMapPin className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full inline-block mb-1">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                Base
              </span>
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
            {location.city}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            {location.state}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {location.country}
          </p>
        </div>
        <div className="pt-4 border-t-2 border-primary-200 dark:border-primary-800">
          <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-primary-50/50 to-blue-50/50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-xl border border-primary-200 dark:border-primary-800">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 animate-pulse"></div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                {location.availability.status}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                {location.availability.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </BaseCard>
    )
}

export default memo(LocationCard)
