'use client'

/**
 * §6.4 client-boundary wrapper: `dynamic()` only code-splits from inside the
 * client graph (in an RSC it stays in the route entry), so this tiny island
 * owns the split. `ssr: true` keeps the diagram's complete semantic markup in
 * the server HTML; the interactivity chunk (diagram + inspector) loads async
 * after hydration starts and attaches to the existing DOM.
 */

import dynamic from 'next/dynamic'

const SystemDiagramIsland = dynamic(() => import('./SystemDiagram.client'))

export default SystemDiagramIsland
