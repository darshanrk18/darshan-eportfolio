import type { Metadata } from 'next'
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google'
import './globals.css'
import ThemeProvider from '@/components/providers/ThemeProvider'
import ErrorBoundary from '@/components/providers/ErrorBoundary'
import Navbar from '@/components/features/Navbar'
import Footer from '@/components/features/Footer'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Darshan Konnur | Software Developer & Graduate Student',
  description: 'Portfolio of Darshan Konnur, a software developer and master\'s student at Northeastern University Boston, currently seeking coop opportunities.',
  keywords: ['software developer', 'portfolio', 'Northeastern University', 'coop', 'web development'],
}

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
                    <Navbar />
                    <main className="min-h-screen">
                      {children}
                    </main>
                    <Footer />
                  </ThemeProvider>
                </ErrorBoundary>
              </body>
    </html>
  )
}

