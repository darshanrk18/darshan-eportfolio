/**
 * Renders a lib/data/about `Rich` paragraph: plain segments as text, `{ em }`
 * segments as <em> (SCREEN: the body face, PRINT: bold with the yellow
 * highlighter — both in CSS). Server-safe; used by About.tsx and passed as
 * a node into the portrait island so the island never imports the About data.
 */

import type { Rich } from '@/lib/data/about'

export default function RichText({ rich }: { rich: Rich }) {
  return (
    <>
      {rich.map((seg, i) =>
        typeof seg === 'string' ? <span key={i}>{seg}</span> : <em key={i}>{seg.em}</em>,
      )}
    </>
  )
}
