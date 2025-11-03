/**
 * Section Header Component
 * 
 * Reusable component for consistent section titles across the portfolio.
 * Features customizable size, alignment, and decorative underline.
 * 
 * @component
 * @module components/ui/SectionHeader
 */

'use client'

import { motion, type Variants } from 'framer-motion'

/**
 * Header size variants
 */
export type HeaderSize = 'sm' | 'md' | 'lg' | 'xl'

interface SectionHeaderProps {
  readonly title: string
  readonly description?: string
  readonly className?: string
  readonly size?: HeaderSize
  readonly underlineColor?: string
  readonly underlineWidth?: string
  readonly showUnderline?: boolean
  readonly align?: 'left' | 'center' | 'right'
}

const sizeClasses: Record<HeaderSize, { title: string; description: string }> = {
  sm: {
    title: 'text-2xl md:text-3xl',
    description: 'text-base',
  },
  md: {
    title: 'text-3xl md:text-4xl',
    description: 'text-lg',
  },
  lg: {
    title: 'text-4xl md:text-5xl',
    description: 'text-lg',
  },
  xl: {
    title: 'text-5xl md:text-6xl',
    description: 'text-xl',
  },
}

const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

const fadeInVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

/**
 * SectionHeader component for consistent section titles across the site
 * Fully customizable with size, alignment, and styling options
 * 
 * @param title - Section title text
 * @param description - Optional description text below title
 * @param className - Additional CSS classes
 * @param size - Header size variant (sm, md, lg, xl)
 * @param underlineColor - Tailwind color class for underline (default: primary-600)
 * @param underlineWidth - Tailwind width class for underline (default: w-24)
 * @param showUnderline - Whether to show decorative underline (default: true)
 * @param align - Text alignment (left, center, right)
 */
export default function SectionHeader({
  title,
  description,
  className = '',
  size = 'lg',
  underlineColor = 'bg-primary-600',
  underlineWidth = 'w-24',
  showUnderline = true,
  align = 'center',
}: SectionHeaderProps) {
  const sizes = sizeClasses[size]

  return (
    <motion.div
      variants={fadeInVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.6 }}
      className={`mb-16 ${alignClasses[align]} ${className}`}
    >
      <h2
        className={`${sizes.title} font-bold mb-4 text-gray-900 dark:text-white font-mono`}
      >
        {title}
      </h2>
      {showUnderline && (
        <div
          className={`${underlineWidth} h-1 ${underlineColor} ${align === 'center' ? 'mx-auto' : align === 'right' ? 'ml-auto' : ''} mb-8`}
        />
      )}
      {description && (
        <p
          className={`${sizes.description} text-gray-600 dark:text-gray-400 ${align === 'center' ? 'max-w-2xl mx-auto' : 'max-w-2xl'} ${align === 'right' ? 'ml-auto' : ''}`}
        >
          {description}
        </p>
      )}
    </motion.div>
  )
}
