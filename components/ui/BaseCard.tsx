'use client'

import { memo, type ReactNode } from 'react'
import { motion, type Variants } from 'framer-motion'

export type CardVariant = 'default' | 'primary' | 'secondary' | 'success' | 'info'

interface BaseCardProps {
  readonly children: ReactNode
  readonly variant?: CardVariant
  readonly delay?: number
  readonly inView?: boolean
  readonly className?: string
  readonly glowEffect?: boolean
  readonly hoverEffect?: boolean
}

const cardVariants: Record<CardVariant, string> = {
  default: 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
  primary: 'border-primary-200 dark:border-primary-900/30 hover:border-primary-400 dark:hover:border-primary-600',
  secondary: 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600',
  success: 'border-green-200 dark:border-green-900/30 hover:border-green-400 dark:hover:border-green-600',
  info: 'border-blue-200 dark:border-blue-900/30 hover:border-blue-400 dark:hover:border-blue-600',
}

const glowVariants: Record<CardVariant, string> = {
  default: 'from-gray-500/20 to-gray-500/20 dark:from-gray-500/10 dark:to-gray-500/10',
  primary: 'from-primary-500/20 to-blue-500/20 dark:from-primary-500/10 dark:to-blue-500/10',
  secondary: 'from-gray-500/20 to-gray-500/20 dark:from-gray-500/10 dark:to-gray-500/10',
  success: 'from-green-500/20 to-green-500/20 dark:from-green-500/10 dark:to-green-500/10',
  info: 'from-blue-500/20 to-blue-500/20 dark:from-blue-500/10 dark:to-blue-500/10',
}

const motionVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

/**
 * BaseCard is a foundational card component with consistent styling and behavior
 * Provides glow effects, hover animations, and variant support for extensibility
 * 
 * @param children - Content to display inside the card
 * @param variant - Visual variant (default, primary, secondary, success, info)
 * @param delay - Animation delay in seconds
 * @param inView - Whether the card is currently in viewport (for animations)
 * @param className - Additional CSS classes to apply
 * @param glowEffect - Whether to show background glow effect
 * @param hoverEffect - Whether to enable hover transform effect
 */
function BaseCard({
  children,
  variant = 'default',
  delay = 0,
  inView = true,
  className = '',
  glowEffect = true,
  hoverEffect = true,
}: BaseCardProps) {
  return (
    <motion.div
      variants={motionVariants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      transition={{ duration: 0.6, delay }}
      className={`relative group flex flex-col ${className}`}
    >
      {glowEffect && (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${glowVariants[variant]} rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300`}
        />
      )}
      <div
        className={`relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 shadow-2xl border-2 ${cardVariants[variant]} transition-all ${hoverEffect ? 'transform hover:-translate-y-1' : ''} flex flex-col h-full`}
      >
        {children}
      </div>
    </motion.div>
  )
}

export default memo(BaseCard)

