/**
 * Root Layout
 * 
 * Next.js App Router root layout component.
 * Sets up fonts, metadata, and global providers.
 * 
 * Features:
 * - Font optimization with next/font
 * - SEO metadata configuration
 * - Theme provider for dark/light mode
 * - Error boundary for error handling
 * - Global navigation and footer
 * 
 * @module app/layout
 */

import type { Metadata } from 'next'
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google'
import './globals.css'
import ThemeProvider from '@/components/providers/ThemeProvider'
import ErrorBoundary from '@/components/providers/ErrorBoundary'
import Navbar from '@/components/features/Navbar'
import Footer from '@/components/features/Footer'

/**
 * Inter font configuration
 * Primary sans-serif font for body text
 */
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

/**
 * JetBrains Mono font configuration
 * Monospace font for code and terminal displays
 */
const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

/**
 * Space Grotesk font configuration
 * Heading font for titles and headings
 */
const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

/**
 * SEO metadata for the portfolio
 */
export const metadata: Metadata = {
  title: 'Darshan Konnur | Software Developer & Graduate Student',
  description: 'Portfolio of Darshan Konnur, a software developer and master\'s student at Northeastern University Boston, currently seeking coop opportunities.',
  keywords: ['software developer', 'portfolio', 'Northeastern University', 'coop', 'web development'],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Darshan Konnur | Software Developer & Graduate Student',
    description: 'Portfolio of Darshan Konnur, a software developer and master\'s student at Northeastern University Boston, currently seeking coop opportunities.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Darshan Konnur | Software Developer & Graduate Student',
    description: 'Portfolio of Darshan Konnur, a software developer and master\'s student at Northeastern University Boston, currently seeking coop opportunities.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

/**
 * Root layout component
 * 
 * Wraps the entire application with:
 * - Font CSS variables
 * - Theme provider
 * - Error boundary
 * - Navigation and footer
 * 
 * @param children - Page content
 * @returns Root layout with all providers and global elements
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
              <body className={`${inter.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} font-sans overflow-x-hidden`}>
                <ErrorBoundary>
                  <ThemeProvider>
                    <a
                      href="#main-content"
                      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:font-semibold"
                    >
                      Skip to main content
                    </a>
                    <Navbar />
                    <main id="main-content" className="min-h-screen">
                      {children}
                    </main>
                    <Footer />
                  </ThemeProvider>
                </ErrorBoundary>
              </body>
    </html>
  )
}

