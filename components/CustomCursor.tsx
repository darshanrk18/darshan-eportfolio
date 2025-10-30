'use client'

import { useEffect, useState } from 'react'

export default function CustomCursor() {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    // Check if on mobile/tablet
    const isMobile = globalThis.window.innerWidth < 768
    if (isMobile) return

    const updateCursor = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY })
    }

    const handleMouseEnter = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.closest('a, button')) {
        setIsHovering(true)
      }
    }

    const handleMouseLeave = () => {
      setIsHovering(false)
    }

    // Track cursor position
    globalThis.window.addEventListener('mousemove', updateCursor)

    // Track hover on interactive elements
    const interactiveElements = document.querySelectorAll('a, button')
    for (const el of interactiveElements) {
      el.addEventListener('mouseenter', handleMouseEnter)
      el.addEventListener('mouseleave', handleMouseLeave)
    }

    return () => {
      globalThis.window.removeEventListener('mousemove', updateCursor)
      for (const el of interactiveElements) {
        el.removeEventListener('mouseenter', handleMouseEnter)
        el.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [])

  return (
    <>
      {/* Main cursor */}
      <div
        className="fixed pointer-events-none z-[9999] hidden md:block"
        style={{
          left: `${cursorPosition.x}px`,
          top: `${cursorPosition.y}px`,
          transform: 'translate(-50%, -50%)',
          transition: 'transform 0.1s ease-out',
        }}
      >
        <div
          className={`rounded-full bg-primary-500 transition-all duration-300 ${
            isHovering ? 'w-6 h-6 bg-primary-400' : 'w-4 h-4'
          }`}
          style={{
            boxShadow: isHovering ? '0 0 20px rgba(14, 165, 233, 0.6)' : '0 0 10px rgba(14, 165, 233, 0.4)',
          }}
        />
      </div>

      {/* Outer ring */}
      <div
        className="fixed pointer-events-none z-[9998] hidden md:block"
        style={{
          left: `${cursorPosition.x}px`,
          top: `${cursorPosition.y}px`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div
          className={`rounded-full border border-primary-400/50 transition-all duration-300 ${
            isHovering ? 'w-12 h-12' : 'w-6 h-6'
          }`}
        />
      </div>
    </>
  )
}

