'use client'

/**
 * §6.4 client-boundary wrapper: `dynamic()` only code-splits from inside the
 * client graph, so this tiny island owns the split. `ssr: true` keeps the
 * window's full initial case-file markup in the server HTML; the chunk loads
 * async after hydration starts (demos split further, on first ▶ run).
 */

import dynamic from 'next/dynamic'
import type { ProjectWindowProps } from './ProjectWindow'

const ProjectWindowIsland = dynamic(() => import('./ProjectWindow'))

export default ProjectWindowIsland
export type { ProjectWindowProps }
