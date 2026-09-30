import type { Metadata } from 'next'
import { profile } from '@/lib/data/profile'

/** The homepage's title and description — also the layout's defaults. */
export const siteTitle = `${profile.displayName} — ${profile.role}`
export const siteDescription =
  'Software engineer. Incoming SDE @ AWS (Jan 2027). MS CS @ Northeastern, IEEE-published. Boston, MA.'

/** The share card (app/opengraph-image.tsx), served at this path. A page
 *  that sets its own `openGraph`/`twitter` loses the inherited card, so the
 *  helper names it explicitly. Keep in step with the card file's name. */
export const shareImage = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  alt: `${profile.displayName} — ${profile.role}`,
}

/**
 * A page's own share tags (Open Graph + X card). When a page sets
 * `openGraph` or `twitter`, Next replaces the layout's object wholesale, so
 * the page builds the full set here — otherwise every page would share the
 * homepage's url and title. `path` resolves against `metadataBase`.
 */
export function shareMeta(
  path: string,
  title: string,
  description: string
): Pick<Metadata, 'openGraph' | 'twitter'> {
  return {
    openGraph: {
      type: 'website',
      url: path,
      siteName: profile.displayName,
      title,
      description,
      images: [shareImage],
    },
    twitter: { card: 'summary_large_image', title, description, images: [shareImage] },
  }
}
