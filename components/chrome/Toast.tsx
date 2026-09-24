'use client'

/**
 * The site's single mono toast (V2_SPEC §10.1 / §10.4) — imperative, tiny,
 * framework-free so non-React code (demoRunner) can call it too.
 *
 * One fixed element at --z-toast, bottom-center, mono label styling, polite
 * aria-live. Self-contained: styles are inline (no global CSS dependency),
 * every token is a CSS var so themes/CRT re-color it for free. Repeat calls
 * reuse the element and restart the timer. Reduced motion: no slide, just
 * appear/disappear.
 *
 * Keep this module dependency-free and lazily imported from the immediate
 * chunk (CommandPalette does `import('@/components/chrome/Toast')`).
 */

const TOAST_MS = 3200

let el: HTMLDivElement | null = null
let hideTimer: number | null = null
let removeTimer: number | null = null

function reducedNow(): boolean {
  return document.documentElement.dataset.motion === 'reduced'
}

function ensureEl(): HTMLDivElement {
  if (el && el.isConnected) return el
  const node = document.createElement('div')
  node.setAttribute('role', 'status')
  node.setAttribute('aria-live', 'polite')
  node.className = 'type-label-sm'
  Object.assign(node.style, {
    position: 'fixed',
    left: '50%',
    bottom: '24px',
    transform: 'translateX(-50%) translateY(8px)',
    zIndex: 'var(--z-toast)',
    maxWidth: 'min(92vw, 560px)',
    padding: '8px 14px',
    background: 'var(--bg-raised)',
    border: '1px solid var(--border-strong)',
    borderRadius: 'var(--radius-btn)',
    color: 'var(--text-primary)',
    boxShadow: 'var(--elev-window)',
    opacity: '0',
    pointerEvents: 'none',
    textAlign: 'center',
    transition: reducedNow()
      ? 'none'
      : 'opacity 180ms var(--ease-swift), transform 180ms var(--ease-swift)',
  } satisfies Partial<CSSStyleDeclaration>)
  document.body.appendChild(node)
  el = node
  return node
}

/** Show (or replace) the toast. Auto-dismisses after ~3.2s. */
export function showToast(message: string, durationMs: number = TOAST_MS): void {
  if (typeof document === 'undefined') return
  const node = ensureEl()
  if (hideTimer !== null) window.clearTimeout(hideTimer)
  if (removeTimer !== null) window.clearTimeout(removeTimer)
  node.textContent = message
  // Force a style flush so the enter transition plays on re-show.
  void node.offsetHeight
  node.style.opacity = '1'
  node.style.transform = 'translateX(-50%) translateY(0)'
  hideTimer = window.setTimeout(() => {
    hideTimer = null
    node.style.opacity = '0'
    node.style.transform = 'translateX(-50%) translateY(8px)'
    removeTimer = window.setTimeout(() => {
      removeTimer = null
      node.remove()
      if (el === node) el = null
    }, 240)
  }, durationMs)
}
