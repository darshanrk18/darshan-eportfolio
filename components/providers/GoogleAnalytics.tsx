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
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

/**
 * Google Analytics 4 component
 * Handles script loading and page view tracking
 */
export default function GoogleAnalytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [measurementId, setMeasurementId] = useState<string | null>(null)

  // Get measurement ID on client side only
  useEffect(() => {
    const id = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || null
    setMeasurementId(id)
  }, [])

  useEffect(() => {
    if (!measurementId || typeof globalThis.window === 'undefined') {
      return
    }

    // Track page view on route change
    if (globalThis.window.gtag) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
      globalThis.window.gtag('config', measurementId, {
        page_path: url,
      })
    }
  }, [pathname, searchParams, measurementId])

  // Don't render if measurement ID is not configured
  if (!measurementId) {
    return null
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
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

