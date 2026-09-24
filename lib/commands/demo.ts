/**
 * `demo` — the registry-driven tour, script as DATA (V2_SPEC §10.4).
 *
 * This module is pure data + types: no DOM, no React — unit-testable in node
 * (tests/demo.test.ts asserts every `run` step's commandId resolves in the
 * registry). Execution lives in ./demoRunner, which is dynamically imported
 * on invocation ONLY. There is NO idle timer and NO auto-start predicate
 * anywhere (adjudication §0.2.1) — the demo runs only when a person types
 * `demo` / picks "Run the demo".
 */

export interface DemoStep {
  kind: 'toast' | 'palette-type' | 'run' | 'wait' | 'terminal-type'
  /** For 'run': a registry command id — executed via the REAL registry. */
  commandId?: string
  /** For 'toast' / 'palette-type' / 'terminal-type': the text involved. */
  text?: string
  /** For 'wait': dwell in milliseconds. */
  ms?: number
}

export const DEMO_SCRIPT: readonly DemoStep[] = [
  { kind: 'toast', text: 'demo — press any key to take over' },
  // Palette opens; chars typed at 24ms into the real cmdk input (real filtering).
  { kind: 'palette-type', text: 'ticket' },
  { kind: 'run', commandId: 'open-ticket-forge' },
  { kind: 'wait', ms: 1200 },
  // Scrolls + ▶ runs the flagship via the real runProject event.
  { kind: 'run', commandId: 'play-connect-four' },
  { kind: 'wait', ms: 4000 },
  // Real inspector opens.
  { kind: 'run', commandId: 'skill-docker' },
  { kind: 'wait', ms: 2500 },
  { kind: 'run', commandId: 'go-contact' },
  // Finale: typed into the real terminal ('whoami --face' under html[data-crt="1"]).
  { kind: 'terminal-type', text: 'whoami' },
]
