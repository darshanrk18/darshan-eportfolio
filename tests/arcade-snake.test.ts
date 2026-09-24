import { describe, expect, it } from 'vitest'
import { cellKey } from '@/lib/ai/astar'
import { createSeededRandom } from '@/lib/utils/seeded'
import {
  H,
  W,
  createSim,
  keyToDir,
  stepAutopilot,
  stepManual,
} from '@/components/arcade/arcadeSnakeSim'

/** V2_SPEC §10.5 — the /arcade snake sim, headless. */
describe('arcade snake sim (V2_SPEC §10.5)', () => {
  it('autopilot eats and grows over a long run, staying in bounds and unclipped', () => {
    const sim = createSim(createSeededRandom('arcade-snake-test'))
    let maxLen = sim.frame.snake.length
    for (let i = 0; i < 600; i++) {
      sim.frame = stepAutopilot(sim)
      maxLen = Math.max(maxLen, sim.frame.snake.length)
      for (const [x, y] of sim.frame.snake) {
        expect(x).toBeGreaterThanOrEqual(0)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(x).toBeLessThan(W)
        expect(y).toBeLessThan(H)
      }
      // No self-overlap.
      const keys = sim.frame.snake.map(([x, y]) => cellKey(x, y))
      expect(new Set(keys).size).toBe(keys.length)
    }
    expect(maxLen).toBeGreaterThan(6)
  })

  it('counts replans as A* invocations, not ticks (path is cached)', () => {
    const sim = createSim(createSeededRandom('arcade-snake-test'))
    for (let i = 0; i < 200; i++) sim.frame = stepAutopilot(sim)
    expect(sim.frame.replans).toBeGreaterThan(0)
    expect(sim.frame.replans).toBeLessThan(100) // far fewer than the 200 ticks
  })

  it('manual play moves by direction, ignores reversal, respawns on the wall', () => {
    const sim = createSim(createSeededRandom('arcade-snake-test'))
    const [hx, hy] = sim.frame.snake[0]
    // Reversal (left while moving right) is ignored by the component guard;
    // the sim itself just advances in dir. Move right one tick:
    sim.frame = stepManual(sim)
    expect(sim.frame.snake[0]).toEqual([hx + 1, hy])
    // Drive into the right wall — must respawn, not throw.
    for (let i = 0; i < W; i++) sim.frame = stepManual(sim)
    expect(sim.frame.snake[0][0]).toBeLessThan(W)
    expect(sim.frame.snake.length).toBeGreaterThanOrEqual(3)
  })

  it('maps arrows and wasd to directions', () => {
    expect(keyToDir('ArrowUp')).toBe('up')
    expect(keyToDir('w')).toBe('up')
    expect(keyToDir('S')).toBe('down')
    expect(keyToDir('ArrowLeft')).toBe('left')
    expect(keyToDir('d')).toBe('right')
    expect(keyToDir('x')).toBeNull()
  })
})
