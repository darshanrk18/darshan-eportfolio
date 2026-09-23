'use client'

/** Minimal route error boundary — mono voice, no drama. */

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="container-site relative flex min-h-svh flex-col justify-center">
      <p className="type-label-xs text-secondary mb-4">uncaught exception</p>
      <h1 className="type-h2">something failed to compile</h1>
      {error.digest ? (
        <p className="type-code text-secondary mt-4">digest: {error.digest}</p>
      ) : null}
      <p className="type-label-sm mt-8">
        <button
          type="button"
          onClick={reset}
          className="hairline rounded-btn px-5 py-3 hover:border-hairline-strong"
        >
          [ retry ]
        </button>
      </p>
    </main>
  )
}
