/**
 * The edition picker's SHELL (V3_SPEC §2.5, §7) — the picker's face as
 * server HTML, mounted on '/' (app/page.tsx) right before the gate, for
 * EVERY visit. picker.css shows it only under html[data-pick='1'] (the
 * pre-paint script writes that attribute when nothing is stored, so a
 * first visit paints the whole picker at first paint, no JavaScript in the
 * way) and keeps it display:none otherwise — a return visit never sees it
 * and never fetches its portraits (they are CSS backgrounds gated by the
 * same attribute). When the lazy surface has hydrated and its images are
 * decoded, it writes html[data-picker-live='1'] and the shell leaves in
 * the same frame the surface appears (components/edition/
 * EditionPickerSurface.client.tsx). Its two halves are real buttons from
 * the first paint: the inline script rendered right after the markup
 * (PICKER_SHELL_SCRIPT, ≤ 1.4 KB) queues a tap / Enter / 1 / 2 on
 * html[data-pick-queued] for the surface to honour the moment it is live,
 * traps Tab between the two halves and starts the PRINT half's fonts.
 * picker.css locks the page's scroll under data-pick from the first paint.
 * Not a client component: no hooks, no chunk, no hydration.
 */

import PickerFace from './PickerFace'
import { PICKER_SHELL_SCRIPT_RESOLVED } from './picker.shared'

export default function PickerShell() {
  return (
    <>
      <PickerFace variant="shell" ids="pks" />
      <script dangerouslySetInnerHTML={{ __html: PICKER_SHELL_SCRIPT_RESOLVED }} />
    </>
  )
}
