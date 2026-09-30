import type { Metadata } from 'next'
import Link from 'next/link'

/* Next already marks this page noindex; the title stops the tab and the
   history entry reading as the homepage. */
export const metadata: Metadata = {
  title: 'Page not found',
}

/* Visitor language only (clutter law): no shell syntax or build words here —
   the terminal lives in the Contact section. */
export default function NotFound() {
  return (
    <main id="main" className="container-site relative flex min-h-svh flex-col justify-center">
      <p className="type-label-xs text-secondary mb-4">404 · Page not found</p>
      <h1 className="type-h2">This page doesn&rsquo;t exist.</h1>
      <p className="text-secondary mt-6">The link may be old or mistyped.</p>
      <p className="type-label-sm mt-6 flex flex-wrap gap-5">
        <Link href="/" className="text-signal hover:underline">
          Back to the home page
        </Link>
        <Link href="/cv" className="text-secondary hover:text-primary">
          Read the CV
        </Link>
      </p>
      {/* v2 §10.5 — the 404 dead-end stays the arcade's third door. */}
      <p className="type-label-sm mt-3">
        <Link href="/arcade" className="text-magenta hover:underline">
          While you&rsquo;re here, there&rsquo;s an arcade →
        </Link>
      </p>
    </main>
  )
}
