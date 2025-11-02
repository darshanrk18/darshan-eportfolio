'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface LetterAnimationProps {
  readonly text: string
  readonly delay?: number
  readonly className?: string
}

export default function LetterAnimation({ text, delay = 0, className = '' }: LetterAnimationProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex])
        setCurrentIndex((prev) => prev + 1)
      }, 100 + delay)

      return () => clearTimeout(timeout)
    }
  }, [currentIndex, text, delay])

  return (
    <span className={`relative inline-block ${className}`}>
      {/* Reserve space for full text to prevent layout shift */}
      <span aria-hidden="true" className="invisible whitespace-pre inline-block">
        {text}
        {currentIndex < text.length && '|'}
      </span>
      {/* Actual animated text */}
      <span className={`absolute left-0 top-0 whitespace-pre ${className}`}>
        {displayedText.split('').map((letter, index) => (
          <motion.span
            key={`${letter}-${index}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1 }}
            className="inline-block"
          >
            {letter === ' ' ? '\u00A0' : letter}
          </motion.span>
        ))}
        {currentIndex < text.length && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
            className="inline-block ml-1"
          >
            |
          </motion.span>
        )}
      </span>
    </span>
  )
}

