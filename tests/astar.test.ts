import { describe, expect, it } from 'vitest'
import { astar, cellKey } from '@/lib/ai/astar'

describe('astar', () => {
  it('finds a shortest path on an empty grid', () => {
    const { path, closed } = astar({ width: 10, height: 8, start: [0, 0], goal: [4, 3] })
    expect(path).not.toBeNull()
    // Shortest 4-neighbor path length = manhattan distance + 1 cells.
    expect(path).toHaveLength(4 + 3 + 1)
    expect(path?.[0]).toEqual([0, 0])
    expect(path?.at(-1)).toEqual([4, 3])
    expect(closed[0]).toEqual([0, 0])
  })

  it('routes around a wall', () => {
    // Vertical wall at x=3 with a single gap at y=5.
    const blocked = (x: number, y: number) => x === 3 && y !== 5
    const { path } = astar({ width: 8, height: 6, start: [0, 0], goal: [6, 0], blocked })
    expect(path).not.toBeNull()
    expect(path?.some(([x, y]) => x === 3 && y === 5)).toBe(true)
    // Never passes through a blocked cell.
    expect(path?.every(([x, y]) => !blocked(x, y))).toBe(true)
  })

  it('returns null when the goal is unreachable', () => {
    const blocked = (x: number) => x === 3 // full wall
    const { path, closed } = astar({ width: 8, height: 6, start: [0, 0], goal: [6, 0], blocked })
    expect(path).toBeNull()
    expect(closed.length).toBeGreaterThan(0)
  })

  it('start equal to goal returns the single-cell path', () => {
    const { path } = astar({ width: 4, height: 4, start: [2, 2], goal: [2, 2] })
    expect(path).toEqual([[2, 2]])
  })

  it('is deterministic for identical inputs', () => {
    const run = () => astar({ width: 12, height: 12, start: [1, 1], goal: [10, 9] })
    expect(run()).toEqual(run())
  })

  it('cellKey is collision-free within grid bounds', () => {
    const seen = new Set<number>()
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 20; x++) seen.add(cellKey(x, y))
    }
    expect(seen.size).toBe(12 * 20)
  })
})
