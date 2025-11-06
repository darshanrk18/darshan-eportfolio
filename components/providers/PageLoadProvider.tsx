/**
 * Page Load Provider
 * 
 * Client-side provider that tracks initial page load and displays
 * a loading screen until the page is fully loaded.
 * 
 * @module components/providers/PageLoadProvider
 */

'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import LoadingScreen from '@/components/ui/LoadingScreen'

/**
 * Page Load Provider Component
 * 
 * Tracks page load state and displays loading screen during initial load.
 * 
 * @param children - Child components
 * @returns Provider with loading screen overlay
 */
export default function PageLoadProvider({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (globalThis.window === undefined) {
      setIsLoading(false)
      return
    }

    // Hide the initial HTML loading screen immediately
    const initialLoader = document.getElementById('initial-loading-screen')
    if (initialLoader) {
      initialLoader.classList.add('hidden')
      // Remove it after transition completes
      setTimeout(() => {
        initialLoader.remove()
      }, 300)
    }

    const startTime = Date.now()
    const minDisplayTime = 1000 // Minimum 1s to show loading screen

    // Start with initial progress
    setProgress(10)

    // Track loading progress
    const updateProgress = () => {
      if (document.readyState === 'complete') {
        setProgress(95)
      } else if (document.readyState === 'interactive') {
        setProgress(60)
      } else {
        setProgress(30)
      }
    }

    // Handle image load event
    const createImageLoadHandler = (img: Element, resolve: () => void) => {
      const handleLoad = () => {
        resolve()
        img.removeEventListener('load', handleLoad)
        img.removeEventListener('error', handleLoad)
      }
      img.addEventListener('load', handleLoad)
      img.addEventListener('error', handleLoad)
    }

    // Create promise for single image load
    const createImageLoadPromise = (img: Element): Promise<void> => {
      const htmlImg = img as HTMLImageElement
      if (htmlImg.complete) {
        return Promise.resolve()
      }
      
      return new Promise<void>((resolve) => {
        createImageLoadHandler(img, resolve)
      })
    }

    // Check for images and fonts still loading
    const checkResourcesLoaded = async () => {
      const images = document.querySelectorAll('img')
      const fonts = document.fonts

      // Wait for images to load
      if (images.length > 0) {
        const imagePromises = Array.from(images).map(createImageLoadPromise)
        await Promise.all(imagePromises)
      }

      // Wait for fonts if available
      if (fonts && 'ready' in fonts) {
        try {
          await fonts.ready
        } catch {
          // Font loading failed, continue anyway
        }
      }
      
      setProgress(100)
    }

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          return prev
        }
        // Faster progress initially, slower as we approach completion
        let increment = 1
        if (prev < 50) {
          increment = 5
        } else if (prev < 80) {
          increment = 3
        }
        return Math.min(prev + increment + Math.random() * 2, 95)
      })
    }, 150)

    // Listen for load events
    const handleLoadComplete = async () => {
      clearInterval(progressInterval)
      setProgress(95)
      
      // Wait for resources to fully load
      await checkResourcesLoaded()
      
      // Ensure minimum display time
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, minDisplayTime - elapsed)
      
      const hideLoadingScreen = () => {
        setIsLoading(false)
      }
      
      const completeLoading = () => {
        setProgress(100)
        setTimeout(hideLoadingScreen, 300) // Small delay for smooth fade
      }
      
      setTimeout(completeLoading, remaining)
    }

    const handleProgress = () => {
      updateProgress()
    }

    // Always wait for window load event, even if readyState is complete
    // This ensures we catch all resources loading
    globalThis.window.addEventListener('load', handleLoadComplete, { once: true })
    document.addEventListener('readystatechange', handleProgress)
    
    // If already loaded, still wait minimum time for better UX
    if (document.readyState === 'complete') {
      // Small delay to ensure loading screen is visible
      setTimeout(() => {
        handleLoadComplete()
      }, 100)
    }

    // Fallback: Hide loading screen after maximum wait time
    const timeout = setTimeout(() => {
      clearInterval(progressInterval)
      setProgress(100)
      setTimeout(() => {
        setIsLoading(false)
      }, 300)
    }, 5000)

    return () => {
      clearInterval(progressInterval)
      globalThis.window?.removeEventListener('load', handleLoadComplete)
      document.removeEventListener('readystatechange', handleProgress)
      clearTimeout(timeout)
    }
  }, [])

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && (
          <LoadingScreen 
            message="Loading portfolio..." 
            showProgress={true}
            progress={progress}
          />
        )}
      </AnimatePresence>
      {children}
    </>
  )
}

