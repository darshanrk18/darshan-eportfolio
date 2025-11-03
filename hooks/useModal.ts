import { useState, useEffect, useRef } from 'react'

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

