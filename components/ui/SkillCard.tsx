'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import type { Skill } from '@/lib/types'

export type SkillCardVariant = 'default' | 'primary' | 'minimal'

interface SkillCardProps {
  readonly skill: Skill
  readonly delay?: number
  readonly categoryIndex: number
  readonly skillIndex: number
  readonly inView: boolean
  readonly variant?: SkillCardVariant
  readonly className?: string
  readonly iconSize?: number
}

const variantClasses: Record<SkillCardVariant, string> = {
  default:
    'bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20',
  primary:
    'bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30',
  minimal: 'bg-transparent rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900',
}

/**
 * SkillCard component displays an individual skill with icon
 * Optimized with React.memo and fully extensible with variants
 * 
 * @param skill - Skill data object containing name and icon
 * @param delay - Animation delay in seconds
 * @param categoryIndex - Index of the category for animation timing
 * @param skillIndex - Index of the skill within category for animation timing
 * @param inView - Whether the component is currently in view
 * @param variant - Visual variant (default, primary, minimal)
 * @param className - Additional CSS classes
 * @param iconSize - Size of the icon in pixels (default: 40)
 */
function SkillCard({
  skill,
  delay = 0,
  categoryIndex,
  skillIndex,
  inView,
  variant = 'default',
  className = '',
  iconSize = 40,
}: SkillCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{
        duration: 0.4,
        delay: categoryIndex * 0.2 + skillIndex * 0.05,
      }}
      className={`flex flex-col items-center p-4 ${variantClasses[variant]} transition-colors group cursor-pointer ${className}`}
    >
      <div className={`mb-2 flex items-center justify-center bg-transparent rounded-lg transition-all group-hover:scale-110`} style={{ width: iconSize, height: iconSize }}>
        <Image
          src={`/skill-icons/${skill.icon}.svg`}
          alt={skill.name}
          width={iconSize}
          height={iconSize}
          className="object-contain"
          unoptimized
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = `/skill-icons/${skill.icon}-auto.svg`
          }}
        />
      </div>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
        {skill.name}
      </span>
    </motion.div>
  )
}

export default memo(SkillCard)
