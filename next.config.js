/** @type {import('next').NextConfig} */
const securityHeaders = [
  // Site must never be framed (clickjacking).
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Minimal permissions — the site uses none of these.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
]

const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  compiler: {
    // Strip console.* in production, keep errors/warnings.
    removeConsole:
      process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  async headers() {
    const rules = [{ source: '/:path*', headers: securityHeaders }]
    // Immutable caching is correct only for production's content-hashed
    // chunk URLs. `next dev` serves STABLE urls (e.g. chunks/app/page.js),
    // so this header there makes browsers execute stale JS across dev-server
    // restarts — never ship it outside a production build.
    if (process.env.NODE_ENV === 'production') {
      rules.push({
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      })
    }
    return rules
  },
}

module.exports = nextConfig
