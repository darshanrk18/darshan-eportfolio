'use client'

/**
 * §2.1 client-boundary wrapper for the Decompiled Portrait: `dynamic()` only
 * code-splits from inside the client graph (in an RSC it stays in the route
 * entry), so this tiny island owns the split — the portrait logic + the ASCII
 * module (§2.4) load as their own IO-tier chunk (§12.1). `ssr: true` (default)
 * keeps the finished-state markup — duotone visible, caption shown — in the
 * server HTML, so no-JS and reduced-motion visitors see the photo untouched.
 */

import dynamic from 'next/dynamic'

const PortraitIsland = dynamic(() => import('./Portrait.client'))

export default PortraitIsland
