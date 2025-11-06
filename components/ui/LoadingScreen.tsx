/**
 * Loading Screen Component
 * 
 * A fancy, animated loading screen displayed during initial page load
 * and when lazy-loaded components are loading.
 * 
 * Features:
 * - Animated gradient logo
 * - Smooth progress indicator
 * - Elegant fade animations
 * - Matches portfolio theme
 * 
 * @module components/ui/LoadingScreen
 */

'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { PRIMARY_COLORS } from '@/lib/config/colors'
import { ANIMATION_DURATIONS, ANIMATION_EASING } from '@/lib/config/animations'

/**
 * Loading screen component props
 */
interface LoadingScreenProps {
  /**
   * Optional loading message to display
   */
  message?: string
  /**
   * Whether to show progress indicator
   */
  showProgress?: boolean
  /**
   * External progress value (0-100)
   * If provided, overrides internal progress simulation
   */
  progress?: number
}

/**
 * Loading Screen Component
 * 
 * Displays an elegant loading screen with animated logo and progress indicator.
 * 
 * @param props - Component props
 * @returns Loading screen JSX
 */
export default function LoadingScreen({ 
  message = 'Loading...',
  showProgress = true,
  progress: externalProgress,
}: Readonly<LoadingScreenProps>) {
  const [internalProgress, setInternalProgress] = useState(0)

  // Use external progress if provided, otherwise use internal simulation
  const progress = externalProgress ?? internalProgress

  useEffect(() => {
    if (!showProgress || externalProgress !== undefined) return

    // Simulate progress when external progress is not provided
    const interval = setInterval(() => {
      setInternalProgress((prev) => {
        if (prev >= 90) return prev
        return prev + Math.random() * 15
      })
    }, 200)

    return () => clearInterval(interval)
  }, [showProgress, externalProgress])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-gray-900"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: ANIMATION_DURATIONS.normal, ease: ANIMATION_EASING.smooth }}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full opacity-20 blur-3xl"
          style={{
            background: `radial-gradient(circle, ${PRIMARY_COLORS[500]}, transparent)`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: ANIMATION_DURATIONS.logoGradient,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        <motion.div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full opacity-20 blur-3xl"
          style={{
            background: `radial-gradient(circle, ${PRIMARY_COLORS[400]}, transparent)`,
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0],
          }}
          transition={{
            duration: ANIMATION_DURATIONS.logoGradient,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Animated DK Logo */}
        <motion.div
          className="relative"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: ANIMATION_DURATIONS.medium,
            ease: ANIMATION_EASING.bounce,
          }}
        >
          {/* Outer glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(from 0deg, ${PRIMARY_COLORS[500]}, ${PRIMARY_COLORS[400]}, ${PRIMARY_COLORS[500]})`,
              filter: 'blur(20px)',
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
          
          {/* Logo container */}
          <div className="relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 shadow-2xl">
            {/* Inner pulse */}
            <motion.div
              className="absolute inset-0 rounded-full bg-primary-400"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            
            {/* DK Text */}
            <motion.span
              className="relative z-10 text-4xl md:text-5xl font-bold text-white"
              style={{ fontFamily: 'var(--font-heading)' }}
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              DK
            </motion.span>
          </div>
        </motion.div>

        {/* Loading message */}
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: ANIMATION_DURATIONS.fast,
            duration: ANIMATION_DURATIONS.normal,
          }}
        >
          <motion.p
            className="text-lg md:text-xl font-medium text-gray-700 dark:text-gray-300"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {message}
          </motion.p>

          {/* Progress bar */}
          {showProgress && (
            <div className="w-64 md:w-80 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary-500 via-primary-400 to-primary-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 90)}%` }}
                transition={{
                  duration: 0.3,
                  ease: ANIMATION_EASING.smooth,
                }}
                style={{
                  boxShadow: `0 0 10px ${PRIMARY_COLORS[500]}`,
                }}
              />
            </div>
          )}

          {/* Animated dots */}
          <motion.div className="flex gap-2">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-2 h-2 rounded-full bg-primary-500"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}

