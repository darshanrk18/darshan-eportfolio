'use client'

import { useRef, useEffect, type ReactNode } from 'react'
import { FiX } from 'react-icons/fi'

interface ModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly title?: string
  readonly children: ReactNode
  readonly size?: 'sm' | 'md' | 'lg' | 'xl'
  readonly className?: string
  readonly showCloseButton?: boolean
  readonly closeOnBackdropClick?: boolean
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

  if (!isOpen) return null

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      onCancel={(e) => {
        if (closeOnEscape) {
          e.preventDefault()
          onClose()
        }
      }}
    >
      <div
        className="fixed inset-0 -z-10"
        aria-hidden="true"
        onClick={handleBackdropClick}
      />
      <div
        className={`bg-white dark:bg-gray-800 rounded-2xl p-8 ${sizeClasses[size]} w-full mx-4 shadow-2xl relative ${className}`}
      >
        {(title || showCloseButton) && (
          <div className="flex justify-between items-center mb-6">
            {title && (
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {title}
              </h3>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ml-auto"
                aria-label="Close modal"
              >
                <FiX className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </dialog>
  )
}

