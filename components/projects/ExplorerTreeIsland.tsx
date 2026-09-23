'use client'

/**
 * §6.4 client-boundary wrapper: `dynamic()` only code-splits from inside the
 * client graph, so this tiny island owns the split. `ssr: true` keeps the
 * tree's full initial (flagship-selection) markup in the server HTML; the
 * chunk loads async after hydration starts and attaches to the existing DOM.
 */

import dynamic from 'next/dynamic'

const ExplorerTreeIsland = dynamic(() => import('./ExplorerTree'))

export default ExplorerTreeIsland
