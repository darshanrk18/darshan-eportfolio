/**
 * Root layout (spec §4/§6; v3 §2.1–§2.3) — RSC only. Fonts for both
 * editions (only the active one's families are ever requested, because
 * font-family is switched by html[data-edition] in globals.css), the
 * pre-paint inline script (edition / picker eligibility / motion / intro
 * eligibility), GA4, skip link, metadata, JSON-LD.
 * No client components here: /cv shares this layout and must stay zero-JS.
 */

import type { Metadata, Viewport } from 'next'
import {
  Alfa_Slab_One,
  Archivo,
  Bangers,
  Cinzel,
  IBM_Plex_Mono,
  Marcellus,
} from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { PREPAINT_SCRIPT } from '@/lib/edition/prepaint'
import { profile, siteUrl } from '@/lib/data/profile'

/* v3 §2.3 — six families, latin subset, swap.
   SCREEN: Cinzel (display) · Marcellus (body) · IBM Plex Mono (labels/code).
   PRINT:  Bangers (display) · Alfa Slab One (slab) · Archivo (body) · Plex.
   globals.css maps --font-display / --font-body / --font-slab per edition.
   Only the default edition's (SCREEN) files are preloaded: a PRINT family
   is fetched by the browser the moment PRINT's font-family rules apply. */

/** SCREEN display — the metal name, section titles. */
const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-cinzel',
  display: 'swap',
})

/** SCREEN body. */
const marcellus = Marcellus({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-marcellus',
  display: 'swap',
})

/** Both editions — labels, terminal, code, numbers. */
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-plexmono',
  display: 'swap',
})

/** PRINT display — comic titles, SFX, buttons. */
const bangers = Bangers({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-bangers',
  display: 'swap',
  preload: false,
})

/** PRINT slab — headings inside panels. */
const alfaSlab = Alfa_Slab_One({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-alfa',
  display: 'swap',
  preload: false,
})

/** PRINT body. */
const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-archivo',
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Darshan Konnur — Software Engineer',
    template: '%s — Darshan Konnur',
  },
  description:
    'Software engineer. Incoming SDE @ AWS (Jan 2027). MS CS @ Northeastern, IEEE-published. Boston, MA.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'SIGNAL — Darshan Konnur',
    title: 'Darshan Konnur — Software Engineer',
    description:
      'Software engineer. Incoming SDE @ AWS (Jan 2027). MS CS @ Northeastern, IEEE-published. Boston, MA.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Darshan Konnur — Software Engineer',
    description:
      'Software engineer. Incoming SDE @ AWS (Jan 2027). MS CS @ Northeastern, IEEE-published.',
  },
  robots: { index: true, follow: true },
}

/* v3 §2.2 — the meta stays SCREEN-dark on the server; the EditionToggle
   island (and every applyEdition) rewrites it to the edition in force. */
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#050607' },
    { media: '(prefers-color-scheme: light)', color: '#050607' },
  ],
  colorScheme: 'dark light',
}

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: profile.name,
  alternateName: profile.displayName,
  jobTitle: profile.role,
  // Incoming role stated in the description only — no worksFor claim until
  // the employment actually starts (CONTENT_FINAL rule).
  description: `Software engineer in ${profile.location} — incoming ${profile.incoming.role} at ${profile.incoming.company} (${profile.incoming.start}). ${profile.education.degree} @ ${profile.education.school}, expected ${profile.education.expectedGrad}.`,
  email: `mailto:${profile.email}`,
  url: siteUrl,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Boston',
    addressRegion: 'MA',
    addressCountry: 'US',
  },
  sameAs: [profile.githubUrl, profile.linkedinUrl],
  alumniOf: [
    { '@type': 'CollegeOrUniversity', name: profile.education.school },
    { '@type': 'CollegeOrUniversity', name: profile.educationPrior.school },
  ],
}

const gaId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${marcellus.variable} ${plexMono.variable} ${bangers.variable} ${alfaSlab.variable} ${archivo.variable}`}
      // data-edition / data-pick / data-motion / data-intro are written
      // pre-paint by the inline script below (lib/edition/prepaint.ts); the
      // server intentionally renders none of them.
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: PREPAINT_SCRIPT }} />
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        {gaId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}', { page_path: window.location.pathname, send_page_view: true });`}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  )
}
