'use client'

/**
 * §6.4 client-boundary wrapper: `dynamic()` only code-splits from inside the
 * client graph, so this tiny island owns the split. `ssr: true` keeps the
 * terminal's banner + prompt in the server HTML (zero CLS); the shell chunk
 * loads async after hydration starts, and the interpreter/snake chunk defers
 * further until the section is near view (see Terminal/index.tsx).
 */

import dynamic from 'next/dynamic'
import { islandUnavailable } from '@/lib/utils/island'

const TerminalIsland = dynamic(() => import('@/components/contact/Terminal').catch(islandUnavailable<typeof import('@/components/contact/Terminal')>))

export default TerminalIsland
