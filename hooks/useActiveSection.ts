/**
 * Active Section Detection Hook
 * 
 * Tracks which section is currently in view using scroll position.
 * More reliable than Intersection Observer for single-page navigation.
 * 
 * @module hooks/useActiveSection
 */

import { useState, useEffect, useCallback } from 'react'
import { DELAYS } from '@/lib/config'

/**
 * Hook to detect the currently active section based on scroll position
 * 
 * Uses scroll position and element bounding rectangles to determine which section
 * is most visible. More reliable than Intersection Observer for this use case.
 * 
 * @param sectionIds - Array of section IDs to observe (e.g., ['home', 'about', 'skills'])
 * @returns Object containing activeSection and setActiveSection function
 * 
 * @example
 * ```tsx
 * const { activeSection, setActiveSection } = useActiveSection(['home', 'about', 'skills'])
 * ```
 */
export function useActiveSection(
  sectionIds: readonly string[]
): { activeSection: string | null; setActiveSection: (section: string | null) => void } {
  const [activeSection, setActiveSection] = useState<string | null>(null)

  // Function to determine active section based on scroll position
  const updateActiveSection = useCallback(() => {
    if (globalThis.window === undefined) return
    
    const scrollPosition = globalThis.window.scrollY + globalThis.window.innerHeight / 3 // Check point in upper third of viewport
    const sections = sectionIds.map((id) => {
      const element = document.getElementById(id)
      if (!element) return null
      
      const rect = element.getBoundingClientRect()
      const elementTop = rect.top + globalThis.window.scrollY
      const elementBottom = elementTop + rect.height
      
      return {
        id,
        top: elementTop,
        bottom: elementBottom,
        distance: Math.abs(elementTop - scrollPosition),
      }
    }).filter((section): section is { id: string; top: number; bottom: number; distance: number } => section !== null)

    if (sections.length === 0) return

    // Find the section that contains the scroll position or is closest to it
    let active: string | null = null
    
    // First, try to find a section that contains the scroll position
    for (const section of sections) {
      if (scrollPosition >= section.top && scrollPosition < section.bottom) {
        active = section.id
        break
      }
    }

    // If no section contains the position, find the closest one
    if (!active) {
      sections.sort((a, b) => a.distance - b.distance)
      active = sections[0]?.id || null
    }

    if (active && active !== activeSection) {
      setActiveSection(active)
    }
  }, [sectionIds, activeSection])

  useEffect(() => {
    // Initial check
    updateActiveSection()

    let scrollTimeout: NodeJS.Timeout
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        globalThis.window.requestAnimationFrame(() => {
          updateActiveSection()
          ticking = false
        })
        ticking = true
      }

      clearTimeout(scrollTimeout)
      
      scrollTimeout = setTimeout(() => {
        // Final check after scrolling stops
        updateActiveSection()
      }, DELAYS.scrollTimeout)
    }

    globalThis.window.addEventListener('scroll', handleScroll, { passive: true })
    
    // Also listen for hash changes (browser back/forward)
    const handleHashChange = () => {
      const hash = globalThis.window.location.hash.slice(1)
      if (hash && sectionIds.includes(hash)) {
        setActiveSection(hash)
      }
    }
    
    globalThis.window.addEventListener('hashchange', handleHashChange)

    return () => {
      globalThis.window.removeEventListener('scroll', handleScroll)
      globalThis.window.removeEventListener('hashchange', handleHashChange)
      clearTimeout(scrollTimeout)
    }
  }, [updateActiveSection, sectionIds])

  return { activeSection, setActiveSection }
}
