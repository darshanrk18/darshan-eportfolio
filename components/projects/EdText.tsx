/**
 * One DOM, two labels (README §4): renders both editions' wording and lets
 * the edition CSS show one — `.ed-screen-only` is `display:none` under
 * PRINT and `.ed-print-only` under SCREEN, so the accessible name of the
 * parent control is exactly the visible label (hidden text is excluded from
 * the name computation). Server-safe; no hooks.
 */

export interface EdTextProps {
  screen: string
  print: string
}

export default function EdText({ screen, print }: EdTextProps) {
  return (
    <>
      <span className="ed-screen-only">{screen}</span>
      <span className="ed-print-only">{print}</span>
    </>
  )
}
