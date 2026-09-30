/**
 * Where focus lands when the control holding it leaves the page with no
 * better place to return to: the edition picker's buttons after a choice,
 * the intro's Skip after the hand-off. Without this, focus fell to <body>
 * and a keyboard or screen-reader user lost their place (the next Tab
 * started wherever the browser guessed).
 *
 * The landing point is the page's main landmark, `#main` — the skip link's
 * target — so the next Tab reaches the hero, the way "Skip to content"
 * would. preventScroll keeps the page where it is, and globals.css keeps
 * the landmark ringless: it takes focus but is not a control.
 *
 * main is focusable (tabindex=-1) only while it holds this landing focus:
 * the attribute goes as soon as focus moves on or the next pointer press
 * starts, so a later click on text inside main never focuses the landmark
 * (which would send the next Tab back to the top of main instead of on
 * from where the visitor clicked).
 *
 * Imported only by lazy islands (the picker surface, the intro), so it never
 * rides the first-load bundle.
 */
export const MAIN_LANDMARK_ID = 'main'

export function focusMain(): void {
  if (typeof document === 'undefined') return
  const main = document.getElementById(MAIN_LANDMARK_ID)
  if (!main) return
  if (!main.hasAttribute('tabindex')) {
    main.setAttribute('tabindex', '-1')
    const release = () => {
      main.removeAttribute('tabindex')
      main.removeEventListener('blur', onBlur)
      document.removeEventListener('pointerdown', release, true)
    }
    // The window losing focus blurs main too, but main keeps focus then.
    const onBlur = () => {
      if (document.activeElement !== main) release()
    }
    main.addEventListener('blur', onBlur)
    document.addEventListener('pointerdown', release, true)
  }
  main.focus({ preventScroll: true })
}
