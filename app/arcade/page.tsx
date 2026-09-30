/**
 * /arcade — the hidden route (V2_SPEC §10.5). A static RSC shell with two
 * claim-proving games in terminal-chrome windows:
 *   1. connect-four — the existing Minimax island, mounted running.
 *   2. snake — the A* autopilot showcase (TRIPLAY_AI's search, watchable).
 *
 * Discoverable ONLY via terminal `arcade`, palette `Open the arcade`, and
 * the 404 egg. noindex; not listed in the sitemap; loads nothing on `/`.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import ArcadeConnectFour from '@/components/arcade/ArcadeConnectFour.client'
import ArcadeSnakeIsland from '@/components/arcade/ArcadeSnakeIsland.client'

export const metadata: Metadata = {
  title: 'Arcade',
  description: 'Two AI demos at full scale — Minimax Connect Four and A* autopilot snake.',
  robots: { index: false, follow: false },
}

function ArcadeWindow({
  title,
  children,
  component,
}: {
  title: string
  children: React.ReactNode
  component: string
}) {
  return (
    <section className="arcade-window" data-component={component} aria-label={title}>
      <div className="arcade-window-titlebar">
        <span className="arcade-disc" aria-hidden="true" />
        <span className="arcade-disc" aria-hidden="true" />
        <span className="arcade-disc" aria-hidden="true" />
        <h2 className="type-label-xs text-tertiary m-0">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

export default function ArcadePage() {
  return (
    <main
      id="main"
      className="container-site relative min-h-svh py-16 md:py-20"
      style={{ zIndex: 'var(--z-content)' }}
      data-component="ArcadePage"
    >
      {/* Minimal chrome: breadcrumb + back + cv chip. */}
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <p className="type-label-sm text-secondary m-0">Darshan Konnur · Arcade</p>
        <nav className="flex items-center gap-4" aria-label="Arcade navigation">
          <Link href="/" className="type-label-sm text-secondary hover:text-primary">
            ← Back to the site
          </Link>
          <a
            href="/cv"
            className="type-label-sm hairline rounded-chip px-2.5 py-1 text-secondary hover:text-primary"
          >
            CV ↗
          </a>
        </nav>
      </header>

      <h1 className="type-h2 mb-2">
        Arcade
        <span className="caret" aria-hidden="true" />
      </h1>
      <p className="type-code text-secondary mb-10">
        Two demos at full size — the same engines that run on the home page.
      </p>

      {/* minmax(0, 1fr): the phone board must not inflate the single column past the viewport (§6, no horizontal scroll). */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-2">
        <ArcadeWindow title="Connect Four — vs. Minimax" component="ArcadeConnectFour">
          <ArcadeConnectFour />
        </ArcadeWindow>
        <ArcadeWindow title="Snake — A* autopilot" component="ArcadeSnake">
          <ArcadeSnakeIsland />
        </ArcadeWindow>
      </div>
    </main>
  )
}
