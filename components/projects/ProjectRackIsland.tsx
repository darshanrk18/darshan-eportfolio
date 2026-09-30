'use client'

/**
 * §6.4 client-boundary wrapper: `dynamic()` only code-splits from inside the
 * client graph, so this tiny island owns the split. `ssr: true` keeps the
 * rack's full markup (every poster / cover) in the server HTML; the chunk
 * loads async after hydration starts and attaches to the existing DOM.
 */

import dynamic from 'next/dynamic'

const ProjectRackIsland = dynamic(() => import('./ProjectRack'))

export default ProjectRackIsland
