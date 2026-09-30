'use client'

/**
 * Client-boundary wrapper for the S2 filmstrip's interaction layer: as with
 * PortraitIsland, `dynamic()` only code-splits from inside the client graph
 * (in an RSC it stays in the route entry), so this island owns the split —
 * the entrance / photo-viewer logic and lib/data/photos load as their own
 * chunk (§7). `ssr: true` (default) keeps the server-rendered strip (the
 * six frames and their captions) in the HTML untouched; the children pass
 * straight through from About.tsx.
 */

import dynamic from 'next/dynamic'
import { islandUnavailable } from '@/lib/utils/island'

const FilmstripIsland = dynamic(() => import('./Filmstrip.client').catch(islandUnavailable<typeof import('./Filmstrip.client')>))

export default FilmstripIsland
