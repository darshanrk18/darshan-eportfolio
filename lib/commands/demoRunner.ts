'use client'

/**
 * Demo tour runner (V2_SPEC §10.4) — executes DEMO_SCRIPT against the REAL
 * surfaces: it opens the actual palette and types into the real cmdk input,
 * every 'run' step is a real `getCommand(id).run(ctx)`, and the finale types
 * into the real terminal input. Nothing is faked.
 *
 * Loaded ONLY via dynamic import from the always-mounted CommandPalette
 * island when SIGNAL_EVENTS.demo fires (~3KB, on-invoke chunk). The
 * reduced-motion refusal happens surface-side BEFORE this chunk loads.
 *
 * Abort contract: ONE capture-phase listener (pointerdown/keydown/wheel/
 * touchstart, trusted events only — the runner's own synthetic input never
 * trips it) tears down instantly mid-step, closes nothing the user opened
 * themselves, does NOT restore scroll (that would itself be a hijack), and
 * toasts `demo aborted — you have the controls`. No timers exist outside a
 * running demo; nothing re-arms.
 */

import { DEMO_SCRIPT, type DemoStep } from './demo'
import { createCommandCtx, type CommandCtx } from './context'
import { getCommand } from './registry'
import { TYPE_MS_PER_CHAR } from '@/lib/motion/tokens'
import { useSignalStore } from '@/lib/state/store'
import { showToast } from '@/components/chrome/Toast'

const ABORT_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const

/** Selector for the palette's real cmdk input (PaletteDialog). */
const PALETTE_INPUT = 'input.sig-palette-input'
/** Selector for the real terminal input (components/contact/Terminal). */
const TERMINAL_INPUT = 'input[aria-label^="Terminal input"]'

class DemoRun {
  aborted = false
  private wakeups = new Set<() => void>()

  /** Abortable sleep — abort() resolves every pending sleep immediately. */
  sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      let id = 0
      const finish = () => {
        window.clearTimeout(id)
        this.wakeups.delete(finish)
        resolve()
      }
      id = window.setTimeout(finish, ms)
      this.wakeups.add(finish)
    })
  }

  abort(): void {
    if (this.aborted) return
    this.aborted = true
    for (const wake of [...this.wakeups]) wake()
  }

  /** Poll for an element (lazy chunks/IO mounts) until found, aborted, or timeout. */
  async waitFor<T extends Element>(selector: string, timeoutMs: number): Promise<T | null> {
    const deadline = performance.now() + timeoutMs
    for (;;) {
      if (this.aborted) return null
      const node = document.querySelector<T>(selector)
      if (node) return node
      if (performance.now() > deadline) return null
      await this.sleep(50)
    }
  }
}

/** Set a React-controlled input's value natively + fire the input event. */
function setNativeValue(input: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  if (setter) setter.call(input, value)
  else input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

async function typeInto(run: DemoRun, input: HTMLInputElement, text: string): Promise<void> {
  input.focus()
  for (let i = 1; i <= text.length; i++) {
    if (run.aborted) return
    setNativeValue(input, text.slice(0, i))
    await run.sleep(TYPE_MS_PER_CHAR)
  }
}

async function executeStep(run: DemoRun, step: DemoStep, ctx: CommandCtx): Promise<void> {
  switch (step.kind) {
    case 'toast': {
      if (step.text) showToast(step.text)
      return
    }
    case 'wait': {
      await run.sleep(step.ms ?? 0)
      return
    }
    case 'palette-type': {
      useSignalStore.getState().setPaletteOpen(true)
      const input = await run.waitFor<HTMLInputElement>(PALETTE_INPUT, 2000)
      if (!input || run.aborted) return
      await typeInto(run, input, step.text ?? '')
      // Let the real cmdk filtering be seen before the next step runs.
      await run.sleep(600)
      return
    }
    case 'run': {
      // The palette (if the demo opened it) closes the way a selection would.
      if (useSignalStore.getState().paletteOpen) {
        useSignalStore.getState().setPaletteOpen(false)
      }
      if (run.aborted) return
      const cmd = step.commandId ? getCommand(step.commandId) : undefined
      if (cmd) await cmd.run(ctx)
      return
    }
    case 'terminal-type': {
      // go-contact has already scrolled us down; the terminal island mounts
      // via IO + lazy chunk, so allow it a moment to appear.
      const input = await run.waitFor<HTMLInputElement>(TERMINAL_INPUT, 3000)
      if (!input || run.aborted) return
      // §10.1 crossover: on a phosphor tube the finale shows the face.
      const text =
        step.text === 'whoami' && document.documentElement.dataset.crt === '1'
          ? 'whoami --face'
          : (step.text ?? '')
      await typeInto(run, input, text)
      if (run.aborted) return
      await run.sleep(200)
      if (run.aborted) return
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
      )
      return
    }
  }
}

/**
 * Start the tour. No-op while one is already running. The demo drives the
 * page through the real registry; `demoRunning` in the store lets surfaces
 * (e.g. the hero keypress spawn) ignore the synthetic input meanwhile.
 */
export async function startDemo(): Promise<void> {
  if (typeof document === 'undefined') return
  const store = useSignalStore.getState()
  if (store.demoRunning) return
  store.setDemoRunning(true)

  const run = new DemoRun()
  const onUserInput = (e: Event) => {
    if (!e.isTrusted) return // the runner's own synthetic events never abort
    run.abort()
  }
  for (const type of ABORT_EVENTS) {
    window.addEventListener(type, onUserInput, { capture: true, passive: true })
  }

  const ctx = createCommandCtx({
    push(href) {
      window.location.href = href
    },
  })

  try {
    for (const step of DEMO_SCRIPT) {
      if (run.aborted) break
      await executeStep(run, step, ctx)
    }
  } finally {
    for (const type of ABORT_EVENTS) {
      window.removeEventListener(type, onUserInput, { capture: true })
    }
    useSignalStore.getState().setDemoRunning(false)
    if (run.aborted) showToast('demo aborted — you have the controls')
  }
}
