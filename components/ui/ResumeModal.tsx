'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { FiDownload } from 'react-icons/fi'
import Modal from './Modal'
import { RESUME } from '@/lib/resume'
import { ANIMATION_DURATIONS, ANIMATION_EASING } from '@/lib/config'

interface ResumeModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly title?: string
  readonly className?: string
}

/**
 * ResumeModal component for displaying resume download options
 * Built on Modal component for consistency and extensibility
 * 
 * @param isOpen - Whether the modal is currently open
 * @param onClose - Callback function when modal should close
 * @param title - Optional custom title (defaults to RESUME.title)
 * @param className - Additional CSS classes for modal container
 */
function ResumeModal({
  isOpen,
  onClose,
  title,
  className = '',
}: ResumeModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || RESUME.title}
      size="md"
      className={className}
    >
      <div className="flex flex-col items-center space-y-6">
        {/* QR Code with animation */}
        <motion.div
          className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-lg"
          initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{
            duration: ANIMATION_DURATIONS.medium,
            delay: ANIMATION_DURATIONS.normal + 0.1,
            type: 'spring',
            stiffness: 200,
            damping: 15,
          }}
        >
          <Image
            src={RESUME.qrCode}
            alt={RESUME.qrAlt}
            width={200}
            height={200}
            className="w-50 h-50"
          />
        </motion.div>

        {/* Description text */}
        <motion.p
          className="text-sm text-gray-600 dark:text-gray-400 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: ANIMATION_DURATIONS.medium,
            delay: ANIMATION_DURATIONS.normal + 0.2,
            ease: ANIMATION_EASING.smooth,
          }}
        >
          {RESUME.description}
        </motion.p>

        {/* Divider */}
        <motion.div
          className="w-full flex items-center gap-4"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{
            duration: ANIMATION_DURATIONS.medium,
            delay: ANIMATION_DURATIONS.normal + 0.3,
            ease: ANIMATION_EASING.smooth,
          }}
        >
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
          <span className="text-sm text-gray-500 dark:text-gray-400">OR</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
        </motion.div>

        {/* Download button */}
        <motion.a
          href={RESUME.pdfPath}
          download={RESUME.downloadFilename}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mt-2"
          onClick={onClose}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: ANIMATION_DURATIONS.medium,
            delay: ANIMATION_DURATIONS.normal + 0.4,
            type: 'spring',
            stiffness: 200,
            damping: 15,
          }}
          whileHover={{ 
            scale: 1.02, 
            y: -2,
            transition: { duration: ANIMATION_DURATIONS.fast }
          }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.span
            animate={{ y: [0, -2, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <FiDownload className="w-5 h-5" />
          </motion.span>
          Download PDF
        </motion.a>
      </div>
    </Modal>
  )
}

export default memo(ResumeModal)
