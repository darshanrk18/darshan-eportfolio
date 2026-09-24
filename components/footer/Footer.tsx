/**
 * Footer — build metadata strip (spec §4.9) + self-verifying readout (§5.9).
 * RSC: every figure here is a measured fact — SHA + date injected at build
 * (lib/build/inject), per-route gz sizes from the CI-written manifest
 * (scripts/measure-bundle.mjs). Only the fps figure is live (FpsMeter island).
 */

import { profile } from '@/lib/data/profile'
import { buildInfo, bundleManifest } from '@/lib/build/inject'
import FpsMeter from '@/components/footer/FpsMeter.client'
import BuildCompleteIsland from '@/components/footer/BuildCompleteIsland'

const SPARK_BAR_W = 5
const SPARK_GAP = 2
const SPARK_H = 14

/**
 * Tiny per-route bundle sparkline — static SVG rendered on the server from
 * the measured manifest (desktop only). Decorative rendering of real data:
 * the SVG is aria-hidden with an sr-only text equivalent beside it.
 */
function RouteBundleSparkline() {
  const routes = bundleManifest.routes
  if (routes.length === 0) return null
  const max = Math.max(...routes.map((r) => r.firstLoadGzKb))
  if (!Number.isFinite(max) || max <= 0) return null

  const width = routes.length * (SPARK_BAR_W + SPARK_GAP) - SPARK_GAP
  const summary = routes.map((r) => `${r.route} ${r.firstLoadGzKb} KB gz`).join(', ')

  return (
    <span
      className="hidden items-end md:inline-flex"
      title={`first-load js per route: ${summary}`}
      data-component="RouteBundleSparkline"
    >
      <span className="sr-only">first-load js per route: {summary}</span>
      <svg
        aria-hidden="true"
        width={width}
        height={SPARK_H}
        viewBox={`0 0 ${width} ${SPARK_H}`}
        className="shrink-0"
      >
        {routes.map((r, i) => {
          const barH = Math.max(2, Math.round((r.firstLoadGzKb / max) * SPARK_H))
          return (
            <rect
              key={r.route}
              x={i * (SPARK_BAR_W + SPARK_GAP)}
              y={SPARK_H - barH}
              width={SPARK_BAR_W}
              height={barH}
              rx={1}
              fill={r.route === '/' ? 'var(--accent-signal)' : 'var(--text-tertiary)'}
            />
          )
        })}
      </svg>
    </span>
  )
}

function Dot() {
  return (
    <span aria-hidden="true" className="hidden text-tertiary md:inline">
      ·
    </span>
  )
}

export default function Footer() {
  const js =
    bundleManifest.totalFirstLoadGzKb !== null
      ? `js ${bundleManifest.totalFirstLoadGzKb} KB gz`
      : 'js — KB gz'

  return (
    <footer
      className="relative border-t border-hairline"
      style={{ zIndex: 'var(--z-content)', ['--vs-i' as string]: 6 }}
      data-component="Footer"
      data-island="RSC"
    >
      <div className="container-site py-8">
        {/* Row 1 — copyright / source / back to top */}
        <div className="type-label-sm flex flex-col gap-2 text-secondary md:flex-row md:items-center md:justify-between">
          <p>© 2026 {profile.name}</p>
          <p className="flex gap-6">
            <a
              href={profile.siteRepoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="link-draw transition-colors hover:text-primary"
            >
              view source ↗
            </a>
            {/* '#top' scrolls to document top; html{scroll-behavior:smooth} makes
                it smooth, and the reduced-motion CSS forces it instant. */}
            <a href="#top" className="link-draw transition-colors hover:text-primary">
              back to top ↑
            </a>
          </p>
        </div>

        {/* v2 §10.3 — build-complete payoff (IO-lazy island; absent no-JS).
            It types the summary, draws the rule, then releases Row 2 below
            (data-footer-artifacts) with the shared fade-up entrance. */}
        <BuildCompleteIsland />

        {/* Row 2 — the self-verifying readout (§5.9); v2 §10.3 "the artifacts" */}
        <div
          data-footer-artifacts
          className="type-label-sm mt-4 flex flex-col items-start gap-2 text-secondary md:flex-row md:flex-wrap md:items-center md:gap-3"
        >
          <span>built with next 15 · react 19 · three.js · vercel</span>
          <Dot />
          <RouteBundleSparkline />
          <Dot />
          <span>
            deploy {buildInfo.shortSha} {buildInfo.buildDate}
          </span>
          <Dot />
          <span>{js}</span>
          <Dot />
          <FpsMeter />
        </div>
      </div>
    </footer>
  )
}
