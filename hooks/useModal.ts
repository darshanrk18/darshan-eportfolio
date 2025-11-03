/**
 * Modal Hook
 * 
 * Custom React hook for managing modal/dialog state and behavior.
 * Handles opening/closing, body scroll locking, and backdrop interactions.
 * 
 * @module hooks/useModal
 */

import { useState, useEffect, useRef } from 'react'

/**
 * Custom hook for managing modal state and behavior
 * 
 * Provides:
 * - Open/close/toggle functionality
 * - Automatic body scroll locking when open
 * - Dialog ref for HTMLDialogElement integration
 * - Backdrop click handler
 * 
 * @returns Object containing modal state and control functions
 * 
 * @example
 * ```tsx
 * const { isOpen, open, close, dialogRef } = useModal()
 * 
 * return (
 *   <dialog ref={dialogRef}>
 *     <button onClick={close}>Close</button>
 *   </dialog>
 * )
 * ```
 */
export function useModal() {
  const [isOpen, setIsOpen] = useState(false)
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

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)
  const toggle = () => setIsOpen((prev) => !prev)

  const handleBackdropClick = () => {
    close()
  }

  return {
    isOpen,
    dialogRef,
    open,
    close,
    toggle,
    handleBackdropClick,
  }
}

