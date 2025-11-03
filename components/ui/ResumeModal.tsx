'use client'

import { memo } from 'react'
import Image from 'next/image'
import { FiDownload } from 'react-icons/fi'
import Modal from './Modal'
import { RESUME } from '@/lib/resume'

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
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-lg">
          <Image
            src={RESUME.qrCode}
            alt={RESUME.qrAlt}
            width={200}
            height={200}
            className="w-50 h-50"
          />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          {RESUME.description}
        </p>

        <div className="w-full flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
          <span className="text-sm text-gray-500 dark:text-gray-400">OR</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
        </div>

        <a
          href={RESUME.pdfPath}
          download={RESUME.downloadFilename}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
          onClick={onClose}
        >
          <FiDownload className="w-5 h-5" />
          Download PDF
        </a>
      </div>
    </Modal>
  )
}

export default memo(ResumeModal)
