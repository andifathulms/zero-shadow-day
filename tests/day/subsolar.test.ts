import { describe, expect, it } from 'vitest'
import { subsolarOn } from '@/lib/day'

describe('where the sun stands overhead on a given day', () => {
  it('is near the equator and heading south at the September equinox', () => {
    const today = subsolarOn({ year: 2025, month: 9, day: 23 }, 7)
    expect(Math.abs(today.latDeg)).toBeLessThan(0.5)
    expect(today.heading).toBe('south')
    // About 0.39° a day near the equinox, the fastest the band ever moves.
    expect(today.degPerDay).toBeGreaterThan(0.37)
    expect(today.degPerDay).toBeLessThan(0.41)
  })

  it('is heading north in March and near the tropic in June', () => {
    expect(subsolarOn({ year: 2025, month: 3, day: 20 }, 7).heading).toBe('north')
    const june = subsolarOn({ year: 2025, month: 6, day: 10 }, 7)
    expect(june.latDeg).toBeGreaterThan(22.9)
    expect(june.degPerDay).toBeLessThan(0.1)
  })
})
