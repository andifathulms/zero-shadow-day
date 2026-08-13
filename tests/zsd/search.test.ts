import { describe, expect, it } from 'vitest'
import { OBLIQUITY_J2000_DEG } from '@/lib/solar/position'
import { dayOfYear, julianDay } from '@/lib/solar/julian'
import { shadowLengthRatioFromZenith } from '@/lib/shadow'
import {
  declinationLimits,
  longestShadowDay,
  shadowDirectionTimeline,
  zeroShadowDays,
} from '@/lib/zsd'
import type { Place, ZeroShadowDaysFound } from '@/lib/zsd'

const found = (place: Place, year: number): ZeroShadowDaysFound => {
  const result = zeroShadowDays(place, year)
  if (result.type !== 'zero-shadow-days') {
    throw new Error(`expected zero shadow days at ${place.latDeg}°, got ${result.type}`)
  }
  return result
}

/** Distance in days between a computed result and a published date. */
const daysApart = (
  date: { year: number; month: number; day: number },
  expected: { year: number; month: number; day: number },
): number => Math.abs(julianDay(date) - julianDay(expected))

describe('the tropics are computed, not assumed', () => {
  it('the year’s extreme declinations are the latitude limits', () => {
    const limits = declinationLimits(2024)
    expect(limits.maxDeg).toBeCloseTo(23.44, 1)
    expect(limits.minDeg).toBeCloseTo(-23.44, 1)
    expect(limits.maxDeg).toBeLessThan(OBLIQUITY_J2000_DEG)
    expect(limits.maxDeg + limits.minDeg).toBeCloseTo(0, 2)
  })
})

describe('known zero shadow days', () => {
  it('Jakarta 2024: 4 March and 9 October (BMKG)', () => {
    const result = found({ latDeg: -6.2088, lonDeg: 106.8456, offsetHours: 7 }, 2024)
    expect(result.days).toHaveLength(2)
    expect(daysApart(result.days[0]!.date, { year: 2024, month: 3, day: 4 })).toBeLessThanOrEqual(1)
    expect(daysApart(result.days[1]!.date, { year: 2024, month: 10, day: 9 })).toBeLessThanOrEqual(1)
  })

  it('Pontianak sits on the equator, so its days are the equinoxes', () => {
    const result = found({ latDeg: -0.0263, lonDeg: 109.3425, offsetHours: 7 }, 2024)
    expect(result.days).toHaveLength(2)
    expect(daysApart(result.days[0]!.date, { year: 2024, month: 3, day: 21 })).toBeLessThanOrEqual(1)
    expect(daysApart(result.days[1]!.date, { year: 2024, month: 9, day: 23 })).toBeLessThanOrEqual(1)
  })

  it('every Indonesian city gets exactly two, spread across the year', () => {
    const cities: ReadonlyArray<[string, number, number, number]> = [
      ['Banda Aceh', 5.5483, 95.3238, 7],
      ['Medan', 3.5952, 98.6722, 7],
      ['Jakarta', -6.2088, 106.8456, 7],
      ['Surabaya', -7.2575, 112.7521, 7],
      ['Makassar', -5.1477, 119.4327, 8],
      ['Denpasar', -8.6705, 115.2126, 8],
      ['Jayapura', -2.5333, 140.7167, 9],
      ['Kupang', -10.1772, 123.607, 8],
    ]
    for (const [label, latDeg, lonDeg, offsetHours] of cities) {
      const result = found({ latDeg, lonDeg, offsetHours }, 2024)
      expect(result.days, label).toHaveLength(2)
      expect(result.converged, label).toBe(false)
      const gap =
        dayOfYear(result.days[1]!.date) - dayOfYear(result.days[0]!.date)
      expect(gap, label).toBeGreaterThan(20)
    }
  })

  it('the sweep reaches northern places later on the way up and earlier on the way down', () => {
    const aceh = found({ latDeg: 5.5483, lonDeg: 95.3238, offsetHours: 7 }, 2024)
    const kupang = found({ latDeg: -10.1772, lonDeg: 123.607, offsetHours: 8 }, 2024)
    // The subsolar band travels north from the December solstice: it reaches
    // Kupang (10°S) well before Banda Aceh (5.5°N), and returns in reverse.
    expect(dayOfYear(kupang.days[0]!.date)).toBeLessThan(dayOfYear(aceh.days[0]!.date))
    expect(dayOfYear(kupang.days[1]!.date)).toBeGreaterThan(dayOfYear(aceh.days[1]!.date))
  })
})

describe('boundaries — where a formula-based approach silently breaks', () => {
  it('at the Tropic of Cancer the two dates converge into one at the June solstice', () => {
    const limits = declinationLimits(2024)
    const result = found({ latDeg: limits.maxDeg - 0.0005, lonDeg: 105, offsetHours: 7 }, 2024)
    expect(result.converged).toBe(true)
    expect(result.days).toHaveLength(1)
    expect(result.days[0]!.date.month).toBe(6)
    expect(daysApart(result.days[0]!.date, { year: 2024, month: 6, day: 20 })).toBeLessThanOrEqual(1)
  })

  it('at the Tropic of Capricorn they converge at the December solstice', () => {
    const limits = declinationLimits(2024)
    const result = found({ latDeg: limits.minDeg + 0.0005, lonDeg: 120, offsetHours: 8 }, 2024)
    expect(result.converged).toBe(true)
    expect(result.days[0]!.date.month).toBe(12)
    expect(daysApart(result.days[0]!.date, { year: 2024, month: 12, day: 21 })).toBeLessThanOrEqual(1)
  })

  it('just inside the tropic there are still two distinct days', () => {
    const result = found({ latDeg: 23.0, lonDeg: 105, offsetHours: 7 }, 2024)
    expect(result.days).toHaveLength(2)
    expect(result.converged).toBe(false)
    expect(result.days.every((day) => day.date.month === 6 || day.date.month === 7)).toBe(true)
  })

  it('just outside the tropic returns a structured no-result, not a nearest date', () => {
    const limits = declinationLimits(2024)
    const result = zeroShadowDays({ latDeg: limits.maxDeg + 0.01, lonDeg: 105, offsetHours: 7 }, 2024)
    expect(result.type).toBe('outside-tropics')
    if (result.type !== 'outside-tropics') throw new Error('unreachable')
    expect(result.hemisphere).toBe('north')
    expect(result.limitDeg).toBeCloseTo(limits.maxDeg, 9)
    expect(result.minZenithDeg).toBeGreaterThan(0)
    expect(result.bestDate.year).toBe(2024)
  })

  it('refuses in both directions and names the limit', () => {
    const outside: ReadonlyArray<[string, number, number, number, 'north' | 'south']> = [
      ['Tokyo', 35.6762, 139.6503, 9, 'north'],
      ['London', 51.5072, -0.1276, 0, 'north'],
      ['Sydney', -33.8688, 151.2093, 10, 'south'],
      ['Ushuaia', -54.8019, -68.303, -3, 'south'],
      ['North Pole', 90, 0, 0, 'north'],
    ]
    for (const [label, latDeg, lonDeg, offsetHours, hemisphere] of outside) {
      const result = zeroShadowDays({ latDeg, lonDeg, offsetHours }, 2024)
      expect(result.type, label).toBe('outside-tropics')
      if (result.type !== 'outside-tropics') throw new Error('unreachable')
      expect(result.hemisphere, label).toBe(hemisphere)
      expect(Math.abs(result.limitDeg), label).toBeCloseTo(23.44, 1)
      expect(result.minZenithDeg, label).toBeGreaterThan(0)
    }
  })

  it('both sides of the boundary, one step apart', () => {
    const limits = declinationLimits(2024)
    expect(zeroShadowDays({ latDeg: limits.maxDeg - 0.001, lonDeg: 105, offsetHours: 7 }, 2024).type).toBe(
      'zero-shadow-days',
    )
    expect(zeroShadowDays({ latDeg: limits.maxDeg + 0.001, lonDeg: 105, offsetHours: 7 }, 2024).type).toBe(
      'outside-tropics',
    )
    expect(zeroShadowDays({ latDeg: limits.minDeg + 0.001, lonDeg: 105, offsetHours: 7 }, 2024).type).toBe(
      'zero-shadow-days',
    )
    expect(zeroShadowDays({ latDeg: limits.minDeg - 0.001, lonDeg: 105, offsetHours: 7 }, 2024).type).toBe(
      'outside-tropics',
    )
  })
})

describe('the longest shadow, the dual of the shortest', () => {
  it('is the June solstice for places south of the equator', () => {
    const kupang = longestShadowDay({ latDeg: -10.1772, lonDeg: 123.607, offsetHours: 8 }, 2024)
    expect(kupang.date.month).toBe(6)
    expect(daysApart(kupang.date, { year: 2024, month: 6, day: 21 })).toBeLessThanOrEqual(2)
  })

  it('is the December solstice for places north of the equator', () => {
    const aceh = longestShadowDay({ latDeg: 5.5483, lonDeg: 95.3238, offsetHours: 7 }, 2024)
    expect(aceh.date.month).toBe(12)
    expect(daysApart(aceh.date, { year: 2024, month: 12, day: 21 })).toBeLessThanOrEqual(2)
  })

  it('the shadow ratio matches the reported zenith distance', () => {
    const jakarta = longestShadowDay({ latDeg: -6.2088, lonDeg: 106.8456, offsetHours: 7 }, 2024)
    expect(jakarta.maxShadowRatio).toBeCloseTo(shadowLengthRatioFromZenith(jakarta.maxZenithDeg), 12)
    expect(jakarta.maxZenithDeg).toBeGreaterThan(0)
  })

  it('is longer than the shortest shadow at the same place', () => {
    const place = { latDeg: -6.2088, lonDeg: 106.8456, offsetHours: 7 }
    const longest = longestShadowDay(place, 2024)
    const shortest = found(place, 2024)
    for (const day of shortest.days) {
      expect(longest.maxZenithDeg).toBeGreaterThan(day.minZenithDeg)
    }
  })

  it('determinism', () => {
    const place = { latDeg: -6.2088, lonDeg: 106.8456, offsetHours: 7 }
    expect(JSON.stringify(longestShadowDay(place, 2024))).toBe(
      JSON.stringify(longestShadowDay(place, 2024)),
    )
  })
})

describe('the outside-tropics no-result names its best day', () => {
  it('names a date and a culmination time, not just a residual', () => {
    const result = zeroShadowDays({ latDeg: 35.6762, lonDeg: 139.6503, offsetHours: 9 }, 2024)
    expect(result.type).toBe('outside-tropics')
    if (result.type !== 'outside-tropics') throw new Error('unreachable')
    expect(result.bestDate.year).toBe(2024)
    expect(result.bestLocalNoonHours).toBeGreaterThan(0)
    expect(result.bestLocalNoonHours).toBeLessThan(24)
  })

  it('the best day is the June solstice north of the tropics, December south of them', () => {
    const tokyo = zeroShadowDays({ latDeg: 35.6762, lonDeg: 139.6503, offsetHours: 9 }, 2024)
    const sydney = zeroShadowDays({ latDeg: -33.8688, lonDeg: 151.2093, offsetHours: 10 }, 2024)
    if (tokyo.type !== 'outside-tropics' || sydney.type !== 'outside-tropics') {
      throw new Error('unreachable')
    }
    expect(tokyo.bestDate.month).toBe(6)
    expect(sydney.bestDate.month).toBe(12)
  })
})

describe('the shadow direction timeline', () => {
  it('flips exactly at the zero shadow days, inside the tropics', () => {
    const place = { latDeg: -6.2088, lonDeg: 106.8456, offsetHours: 7 }
    const segments = shadowDirectionTimeline(place, 2024)
    const zsd = found(place, 2024)
    expect(segments).toHaveLength(3)
    expect(segments[0]!.direction).toBe('north')
    expect(segments[1]!.direction).toBe('south')
    expect(segments[2]!.direction).toBe('north')
    expect(daysApart(segments[0]!.endDate, zsd.days[0]!.date)).toBeLessThanOrEqual(1)
    expect(daysApart(segments[1]!.startDate, zsd.days[0]!.date)).toBeLessThanOrEqual(1)
    expect(daysApart(segments[1]!.endDate, zsd.days[1]!.date)).toBeLessThanOrEqual(1)
    expect(daysApart(segments[2]!.startDate, zsd.days[1]!.date)).toBeLessThanOrEqual(1)
  })

  it('never flips outside the tropics', () => {
    const tokyo = shadowDirectionTimeline({ latDeg: 35.6762, lonDeg: 139.6503, offsetHours: 9 }, 2024)
    expect(tokyo).toHaveLength(1)
    expect(tokyo[0]!.direction).toBe('north')

    const sydney = shadowDirectionTimeline(
      { latDeg: -33.8688, lonDeg: 151.2093, offsetHours: 10 },
      2024,
    )
    expect(sydney).toHaveLength(1)
    expect(sydney[0]!.direction).toBe('south')
  })

  it('covers the whole year with no gaps', () => {
    const place = { latDeg: -6.2088, lonDeg: 106.8456, offsetHours: 7 }
    const segments = shadowDirectionTimeline(place, 2024)
    expect(segments[0]!.startDate).toEqual({ year: 2024, month: 1, day: 1 })
    expect(segments.at(-1)!.endDate).toEqual({ year: 2024, month: 12, day: 31 })
  })
})

describe('"zero" has a width', () => {
  const jakarta = { latDeg: -6.2088, lonDeg: 106.8456, offsetHours: 7 }

  it('the shortest shadow is never reported as exactly zero', () => {
    for (const day of found(jakarta, 2024).days) {
      expect(day.minShadowRatio).toBeGreaterThan(0)
      expect(day.minZenithDeg).toBeGreaterThan(0)
      expect(day.minShadowRatio).toBeCloseTo(shadowLengthRatioFromZenith(day.minZenithDeg), 12)
      // The residual is small: under half a degree of zenith distance.
      expect(day.minZenithDeg).toBeLessThan(0.5)
    }
  })

  it('the window follows the Sun’s angular diameter rather than a constant', () => {
    for (const day of found(jakarta, 2024).days) {
      if (day.window === null) continue
      const { semiDiameterDeg, durationSeconds, startLocalHours, endLocalHours } = day.window
      // The Sun sweeps its own diameter in 2·r/15.04° per hour of sky motion;
      // the window must match that scale, and it moves with the disc, so it is
      // asserted against the semi-diameter of the day, not a fixed number.
      const expectedSeconds = ((2 * semiDiameterDeg) / 15.04) * 3600
      expect(durationSeconds).toBeGreaterThan(expectedSeconds * 0.7)
      expect(durationSeconds).toBeLessThan(expectedSeconds * 1.4)
      expect(endLocalHours).toBeGreaterThan(startLocalHours)
      expect(day.localNoonHours).toBeGreaterThan(startLocalHours)
      expect(day.localNoonHours).toBeLessThan(endLocalHours)
    }
  })

  it('a window is a couple of minutes, not an instant', () => {
    const windows = found(jakarta, 2024)
      .days.map((day) => day.window)
      .filter((window): window is NonNullable<typeof window> => window !== null)
    expect(windows.length).toBeGreaterThan(0)
    for (const window of windows) {
      expect(window.durationSeconds).toBeGreaterThan(60)
      expect(window.durationSeconds).toBeLessThan(300)
    }
  })
})

describe('solar noon on a zero shadow day', () => {
  it('Banda Aceh culminates well after 12:00 because it sits west of 105°E', () => {
    for (const day of found({ latDeg: 5.5483, lonDeg: 95.3238, offsetHours: 7 }, 2024).days) {
      expect(day.localNoonHours).toBeGreaterThan(12.4)
      expect(day.localNoonHours).toBeLessThan(13.0)
    }
  })
})

describe('determinism', () => {
  it('same inputs, identical output', () => {
    const place = { latDeg: -6.2088, lonDeg: 106.8456, offsetHours: 7 }
    expect(JSON.stringify(zeroShadowDays(place, 2024))).toBe(
      JSON.stringify(zeroShadowDays(place, 2024)),
    )
  })

  it('holds across years', () => {
    for (const year of [2023, 2024, 2025, 2026]) {
      const result = found({ latDeg: -6.2088, lonDeg: 106.8456, offsetHours: 7 }, year)
      expect(result.days).toHaveLength(2)
      expect(result.year).toBe(year)
      expect(result.days.every((day) => day.date.year === year)).toBe(true)
    }
  })
})
