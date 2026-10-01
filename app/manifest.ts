/**
 * Web app manifest (v3 §2.8 / §3): SCREEN colours (the default edition —
 * the theme-color meta follows the edition in the page itself: the pre-paint
 * script's lead meta, rewritten by syncEditionMeta on a switch), the Studio
 * Seal knockout as the icon (SVG + the PNG fallbacks Phase B rendered).
 */

import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Darshan Konnur — Software Engineer',
    short_name: 'Darshan Konnur',
    description:
      'Darshan Konnur, software engineer in Boston. Read it as a screen edition or as a comic.',
    start_url: '/',
    display: 'browser',
    background_color: '#050607',
    theme_color: '#050607',
    icons: [
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { src: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
  }
}
