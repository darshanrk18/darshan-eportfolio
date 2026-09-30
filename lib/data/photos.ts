/**
 * v3 §2.8 — graded photo manifest (Phase B).
 * Every photo ships in two grades under public/photo/: `-41.webp` (SCREEN,
 * design 41's cinema grade) and `-paper.webp` (PRINT, the comic paper grade).
 * Both grades of a key share one pixel size. Alt text and captions come from
 * the approved frames (S2 filmstrip captions; P2 alt descriptions). The
 * schneider_office / schneider_exora files are the CROPPED versions — the
 * uncropped originals never ship (V3_SPEC §5).
 *
 * Use with a plain <img> (explicit width/height) or next/image; pick the
 * grade with `photoSrc(key, edition)`. Budget: ≈710 KB per edition for all
 * seven (§7: ≤ 900 KB home images per edition).
 */

export type PhotoKey =
  | 'portrait'
  | 'desk'
  | 'door'
  | 'badge'
  | 'neu_quad'
  | 'schneider_exora'
  | 'schneider_office'

export type PhotoEdition = 'screen' | 'print'

export interface Photo {
  key: PhotoKey
  /** SCREEN grade: /photo/<key>-41.webp */
  screen: string
  /** PRINT grade: /photo/<key>-paper.webp */
  print: string
  /** Intrinsic pixel size (same for both grades). */
  width: number
  height: number
  /** Describes the picture (P2 frame alt text). */
  alt: string
  /** Visible caption the frames print under it (S2 filmstrip). */
  caption: string
}

const photo = (
  key: PhotoKey,
  width: number,
  height: number,
  alt: string,
  caption: string,
): Photo => ({
  key,
  screen: `/photo/${key}-41.webp`,
  print: `/photo/${key}-paper.webp`,
  width,
  height,
  alt,
  caption,
})

export const PHOTOS: Record<PhotoKey, Photo> = {
  portrait: photo(
    'portrait',
    880,
    880,
    'Darshan Konnur, smiling, in a checked blazer',
    'Darshan Konnur',
  ),
  schneider_office: photo(
    'schneider_office',
    675,
    1032,
    'The team at Schneider Electric, Bengaluru',
    'First crew at Schneider',
  ),
  schneider_exora: photo(
    'schneider_exora',
    675,
    996,
    'The team on the EXORA campus, Bengaluru',
    'The team, EXORA campus',
  ),
  neu_quad: photo(
    'neu_quad',
    960,
    1200,
    'Darshan at Krentzman Quadrangle, Northeastern University',
    'Northeastern, the Quad',
  ),
  badge: photo(
    'badge',
    675,
    1200,
    "Darshan's AWS badge, held up in the Amazon lobby on day one",
    'Day one at AWS',
  ),
  desk: photo('desk', 675, 1200, 'The Seaport, seen from the desk at AWS', 'The view from my desk'),
  door: photo('door', 900, 1200, 'The Amazon door in Boston', 'Back through this door'),
}

export const photoKeys = Object.keys(PHOTOS) as readonly PhotoKey[]

/** S2 filmstrip / P2 comic-grid order: Bengaluru → Boston. */
export const FILMSTRIP_ORDER: readonly PhotoKey[] = [
  'schneider_office',
  'schneider_exora',
  'neu_quad',
  'badge',
  'desk',
  'door',
]

export function isPhotoKey(value: string): value is PhotoKey {
  return Object.prototype.hasOwnProperty.call(PHOTOS, value)
}

/** The grade for an edition: SCREEN → `-41`, PRINT → `-paper`. */
export function photoSrc(key: PhotoKey, edition: PhotoEdition): string {
  return edition === 'print' ? PHOTOS[key].print : PHOTOS[key].screen
}
