import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SIGNAL — Darshan Konnur',
    short_name: 'SIGNAL',
    description: 'Darshan Konnur — Software Engineer. The portfolio that compiles.',
    start_url: '/',
    display: 'browser',
    background_color: '#050607',
    theme_color: '#050607',
    icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
  }
}
