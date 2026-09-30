'use client'

/**
 * Client-boundary wrapper for the Decompiled Portrait: `dynamic()` only
 * code-splits from inside the client graph (in an RSC it stays in the route
 * entry), so this tiny island owns the split — the portrait logic + the
 * character rows load as their own chunk. `ssr: true` (default) keeps the
 * finished / resting markup (photo, halftone) in the server HTML, so no-JS
 * and reduced-motion visitors see the photograph untouched. Props (labels,
 * narration node) pass straight through from About.tsx.
 */

import dynamic from 'next/dynamic'
import { islandUnavailable } from '@/lib/utils/island'

const PortraitIsland = dynamic(() => import('./Portrait.client').catch(islandUnavailable<typeof import('./Portrait.client')>))

export default PortraitIsland
