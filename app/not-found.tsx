import Link from 'next/link'

export default function NotFound() {
  return (
    <main id="main" className="container-site relative flex min-h-svh flex-col justify-center">
      <p className="type-label-xs text-secondary mb-4">exit code 404</p>
      <h1 className="type-h2">
        route not found<span className="caret" aria-hidden="true" />
      </h1>
      <p className="type-code text-secondary mt-6">
        the requested path did not compile — try one of these:
      </p>
      <p className="type-label-sm mt-4 flex gap-5">
        <Link href="/" className="text-signal hover:underline">
          cd ~/
        </Link>
        <Link href="/cv" className="text-secondary hover:text-primary">
          /cv
        </Link>
      </p>
    </main>
  )
}
