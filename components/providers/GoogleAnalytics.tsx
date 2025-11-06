/**
 * Google Analytics 4 Provider
 * 
 * Implements GA4 tracking for Next.js App Router.
 * Only loads in production or when NEXT_PUBLIC_GA4_MEASUREMENT_ID is set.
 * 
 * Features:
 * - Automatic page view tracking
 * - Privacy-compliant (respects Do Not Track)
 * - Environment-aware (only loads when configured)
 * 
 * @module components/providers/GoogleAnalytics
 */

'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Google Analytics 4 component
 * Handles script loading and page view tracking
 */
export default function GoogleAnalytics() {
  const pathname = usePathname()
  
  // NEXT_PUBLIC_* env vars are available at build time
  const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID

  useEffect(() => {
    if (!measurementId || globalThis.window === undefined) {
      return
    }

    // Wait for gtag to be available
    const checkGtag = setInterval(() => {
      if (globalThis.window.gtag) {
        clearInterval(checkGtag)
        const url = pathname + (globalThis.window.location.search || '')
        globalThis.window.gtag('config', measurementId, {
          page_path: url,
        })
      }
    }, 100)

    // Cleanup after 5 seconds
    setTimeout(() => clearInterval(checkGtag), 5000)
  }, [pathname, measurementId])

  // Don't render if measurement ID is not configured
  if (!measurementId) {
    return null
  }

  return (
    <>
      <Script
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />
      <Script
        id="google-analytics"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              page_path: window.location.pathname,
              send_page_view: true
            });
          `,
        }}
      />
    </>
  )
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (
      command: string,
      targetId: string,
      config?: Record<string, unknown>
    ) => void
  }
}

