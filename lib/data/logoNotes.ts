/**
 * v3 §2.8 — why a logo entry departs from the plain colour / mono pair
 * (the four declared exceptions and the colour-only files). Documentation
 * for the tests and the reader; kept out of lib/data/logos.ts so the notes
 * never ride the first-load bundle with the index (§7).
 */

import type { LogoId } from './logos'

export const LOGO_NOTES: Partial<Record<LogoId, string>> = {
  'rest-apis': 'No logo (a protocol, not a product) — text chip in the same size box (S3 §5).',
  pgvector: 'No official logo — the PostgreSQL logo with the visible "pgvector" name.',
  azure: 'Colour file only; SCREEN whitens it with the mono filter.',
  cloudwatch: 'Mono only — no colour art; PRINT shows it as ink.',
  mockito: 'No official logo — text chip in the same size box.',
  playwright: 'Colour file only; SCREEN whitens it with the mono filter.',
  java: 'The mono file is the OpenJDK mark — prefer the colour logo (whitened in SCREEN).',
  sql: 'No logo — text chip in the same size box.',
  linkedin: 'Colour file only; SCREEN whitens it with the mono filter.',
}
