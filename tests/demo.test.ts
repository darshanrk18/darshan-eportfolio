import { describe, expect, it } from 'vitest'
import { DEMO_SCRIPT } from '@/lib/commands/demo'
import { getCommand } from '@/lib/commands/registry'

/**
 * V2_SPEC §10.4 — the demo is script-as-data driven through the REAL
 * registry; this suite makes the tour structurally incapable of invoking a
 * command that does not exist, and pins the no-auto-arm shape (the script
 * itself carries no arming metadata — only explicit steps).
 */
describe('demo script (V2_SPEC §10.4)', () => {
  it("every 'run' step's commandId resolves in the registry", () => {
    const runSteps = DEMO_SCRIPT.filter((s) => s.kind === 'run')
    expect(runSteps.length).toBeGreaterThan(0)
    for (const step of runSteps) {
      expect(step.commandId, `run step missing commandId`).toBeDefined()
      expect(getCommand(step.commandId!), step.commandId).toBeDefined()
    }
  })

  it('every step carries the payload its kind requires', () => {
    for (const step of DEMO_SCRIPT) {
      switch (step.kind) {
        case 'run':
          expect(step.commandId).toBeTruthy()
          break
        case 'wait':
          expect(step.ms).toBeGreaterThan(0)
          break
        case 'toast':
        case 'palette-type':
        case 'terminal-type':
          expect(step.text).toBeTruthy()
          break
      }
    }
  })

  it('opens with the takeover toast and ends typing into the real terminal', () => {
    expect(DEMO_SCRIPT[0]).toEqual({ kind: 'toast', text: 'demo — press any key to take over' })
    const last = DEMO_SCRIPT[DEMO_SCRIPT.length - 1]
    expect(last.kind).toBe('terminal-type')
    expect(last.text).toBe('whoami')
  })
})
