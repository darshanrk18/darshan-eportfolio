/**
 * Root layout (spec §4/§6) — RSC only. Fonts, pre-paint inline scripts
 * (theme / motion / boot eligibility), GA4, skip link, metadata, JSON-LD.
 * No client components here: /cv shares this layout and must stay zero-JS.
 */

import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono, Instrument_Serif } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { profile, siteUrl } from '@/lib/data/profile'

/** The machine voice — labels, nav, terminal, code, metadata, numbers. */
const jbMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jbmono',
  display: 'swap',
})

/** Body prose. */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

/** The human voice — hero name + one line per section (≤6 uses sitewide). */
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument',
  display: 'swap',
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

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#050607' },
    { media: '(prefers-color-scheme: light)', color: '#050607' },
  ],
  colorScheme: 'dark light',
}

/**
 * Pre-paint boot script (runs as the first element in <body>, before any
 * content paints):
 *  - theme:  localStorage['signal.theme']  → html[data-theme]  (fallback dark)
 *  - motion: localStorage['signal.motion'] → html[data-motion] (else system)
 *  - boot:   html[data-boot='1'] only when eligible (§4.1): motion not
 *            reduced AND sessionStorage['signal.boot'] absent.
 */
const prePaintScript = `(function(){var d=document.documentElement;try{var t=localStorage.getItem('signal.theme');d.setAttribute('data-theme',t==='light'?'light':'dark');}catch(e){d.setAttribute('data-theme','dark');}var r=false;try{var m=localStorage.getItem('signal.motion');r=m?m==='reduced':matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){}d.setAttribute('data-motion',r?'reduced':'full');try{if(!r&&!sessionStorage.getItem('signal.boot')){d.setAttribute('data-boot','1');}}catch(e){}})();`

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
      className={`${jbMono.variable} ${inter.variable} ${instrumentSerif.variable}`}
      // data-theme / data-motion / data-boot are written pre-paint by the
      // inline script below; the server intentionally renders none of them.
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: prePaintScript }} />
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
