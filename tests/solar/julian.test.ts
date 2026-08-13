import { describe, expect, it } from 'vitest'
import {
  civilFromJulianDay,
  dayOfYear,
  daysInYear,
  julianCentury,
  julianDay,
  julianDayFromTime,
  startOfDay,
} from '@/lib/solar/julian'

/**
 * Oracle: the worked examples in Meeus, *Astronomical Algorithms*, 2nd ed.,
 * ch. 7. Published values, not values this engine produced.
 */
describe('julianDay — published examples (Meeus ch. 7)', () => {
  const cases: ReadonlyArray<[string, number, number, number, number, number]> = [
    // label, year, month, day, dayFraction, expected JD
    ['1957 Oct 4.81 (Sputnik 1)', 1957, 10, 4, 0.81, 2436116.31],
    ['2000 Jan 1.5 (J2000.0)', 2000, 1, 1, 0.5, 2451545.0],
    ['1999 Jan 1.0', 1999, 1, 1, 0, 2451179.5],
    ['1987 Jan 27.0', 1987, 1, 27, 0, 2446822.5],
    ['1988 Jun 19.5', 1988, 6, 19, 0.5, 2447332.0],
    ['1600 Jan 1.0', 1600, 1, 1, 0, 2305447.5],
    ['1600 Dec 31.0', 1600, 12, 31, 0, 2305812.5],
  ]

  for (const [label, year, month, day, dayFraction, expected] of cases) {
    it(label, () => {
      expect(julianDay({ year, month, day }, dayFraction)).toBeCloseTo(expected, 6)
    })
  }
})

describe('julianDayFromTime', () => {
  it('matches the fractional-day form', () => {
    expect(julianDayFromTime({ year: 2024, month: 3, day: 20 }, 3, 6, 0)).toBeCloseTo(
      julianDay({ year: 2024, month: 3, day: 20 }, (3 + 6 / 60) / 24),
      12,
    )
  })

  it('places noon UT half a day after midnight UT', () => {
    const midnight = julianDayFromTime({ year: 2024, month: 6, day: 20 }, 0)
    const noon = julianDayFromTime({ year: 2024, month: 6, day: 20 }, 12)
    expect(noon - midnight).toBeCloseTo(0.5, 12)
  })
})

describe('civilFromJulianDay', () => {
  it('inverts julianDay across a century of dates', () => {
    for (let jd = 2415020.5; jd < 2451545; jd += 37.25) {
      const civil = civilFromJulianDay(jd)
      expect(julianDay(civil, civil.dayFraction)).toBeCloseTo(jd, 6)
    }
  })

  it('recovers the Meeus example', () => {
    const civil = civilFromJulianDay(2436116.31)
    expect(civil.year).toBe(1957)
    expect(civil.month).toBe(10)
    expect(civil.day).toBe(4)
    expect(civil.dayFraction).toBeCloseTo(0.81, 6)
  })
})

describe('calendar helpers', () => {
  it('julianCentury is zero at J2000.0', () => {
    expect(julianCentury(2451545.0)).toBe(0)
  })

  it('startOfDay lands on midnight UT', () => {
    expect(startOfDay(2451545.0)).toBe(2451544.5)
    expect(startOfDay(2451544.5)).toBe(2451544.5)
    expect(startOfDay(2451544.9999)).toBe(2451544.5)
  })

  it('dayOfYear counts from 1', () => {
    expect(dayOfYear({ year: 2024, month: 1, day: 1 })).toBe(1)
    expect(dayOfYear({ year: 2024, month: 3, day: 1 })).toBe(61) // leap year
    expect(dayOfYear({ year: 2023, month: 3, day: 1 })).toBe(60)
    expect(dayOfYear({ year: 2024, month: 12, day: 31 })).toBe(366)
  })

  it('daysInYear follows the Gregorian rule', () => {
    expect(daysInYear(2024)).toBe(366)
    expect(daysInYear(2023)).toBe(365)
    expect(daysInYear(1900)).toBe(365)
    expect(daysInYear(2000)).toBe(366)
  })
})
