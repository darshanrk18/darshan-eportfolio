/**
 * Modal Component
 * 
 * Generic, reusable modal/dialog component built on HTMLDialogElement.
 * Supports multiple sizes, customizable close behavior, and backdrop interactions.
 * 
 * Features:
 * - Multiple size variants
 * - Keyboard (Escape) and backdrop click closing
 * - Body scroll locking when open
 * - Customizable close button
 * 
 * @component
 * @module components/ui/Modal
 */

'use client'

import { useRef, useEffect, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX } from 'react-icons/fi'
import { ANIMATION_DURATIONS, ANIMATION_EASING } from '@/lib/config'

/**
 * Props for Modal component
 */
interface ModalProps {
  /** Whether the modal is currently open */
  readonly isOpen: boolean
  /** Callback function called when modal should close */
  readonly onClose: () => void
  /** Optional title displayed in modal header */
  readonly title?: string
  /** Modal content */
  readonly children: ReactNode
  /** Modal size variant */
  readonly size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Additional CSS classes for modal container */
  readonly className?: string
  /** Whether to show close button (default: true) */
  readonly showCloseButton?: boolean
  /** Whether clicking backdrop closes modal (default: true) */
  readonly closeOnBackdropClick?: boolean
  /** Whether Escape key closes modal (default: true) */
  readonly closeOnEscape?: boolean
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

/**
 * Generic Modal component for displaying dialogs
 * Fully extensible with customizable size, close behavior, and content
 * 
 * @param isOpen - Whether the modal is currently open
 * @param onClose - Callback function when modal should close
 * @param title - Optional title to display in modal header
 * @param children - Content to display in modal body
 * @param size - Modal size (sm, md, lg, xl)
 * @param className - Additional CSS classes for the modal container
 * @param showCloseButton - Whether to show the close button (default: true)
 * @param closeOnBackdropClick - Whether clicking backdrop closes modal (default: true)
 * @param closeOnEscape - Whether Escape key closes modal (default: true)
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className = '',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal()
      document.body.style.overflow = 'hidden'
    } else {
      dialogRef.current?.close()
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleBackdropClick = () => {
    if (closeOnBackdropClick) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <dialog
          ref={dialogRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop:bg-transparent"
          onCancel={(e) => {
            if (closeOnEscape) {
              e.preventDefault()
              onClose()
            }
          }}
        >
          {/* Animated Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
            onClick={handleBackdropClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: ANIMATION_DURATIONS.normal,
              ease: ANIMATION_EASING.smooth,
            }}
          />

          {/* Animated Modal Content */}
          <motion.div
            className={`bg-white dark:bg-gray-800 rounded-2xl p-8 ${sizeClasses[size]} w-full mx-4 shadow-2xl relative ${className}`}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{
              duration: ANIMATION_DURATIONS.medium,
              ease: ANIMATION_EASING.default,
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {(title || showCloseButton) && (
              <motion.div
                className="flex justify-between items-center mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: ANIMATION_DURATIONS.normal,
                  delay: ANIMATION_DURATIONS.fast,
                  ease: ANIMATION_EASING.smooth,
                }}
              >
                {title && (
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {title}
                  </h3>
                )}
                {showCloseButton && (
                  <motion.button
                    onClick={onClose}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ml-4 flex items-center justify-center"
                    aria-label="Close modal"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: ANIMATION_DURATIONS.fast }}
                  >
                    <FiX className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </motion.button>
                )}
              </motion.div>
            )}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: ANIMATION_DURATIONS.medium,
                delay: ANIMATION_DURATIONS.normal,
                ease: ANIMATION_EASING.smooth,
              }}
            >
              {children}
            </motion.div>
          </motion.div>
        </dialog>
      )}
    </AnimatePresence>
  )
}

