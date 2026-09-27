import { describe, expect, it } from 'vitest'
import { INDONESIAN_CITIES } from '@/data/cities/indonesia'
import { nextZeroShadowDay, upcomingZeroShadowDays } from '@/lib/zsd'

const jakarta = { latDeg: -6.2088, lonDeg: 106.8456, offsetHours: 7 }
const makassar = { latDeg: -5.1477, lonDeg: 119.4327, offsetHours: 8 }

describe('the next zero shadow day, counted from a given date', () => {
  it('counts the days to the coming date, and names the other one', () => {
    // BMKG 2025: Makassar 6 October.
    const next = nextZeroShadowDay(makassar, { year: 2025, month: 9, day: 27 })
    if (next.type !== 'next') throw new Error(next.type)
    expect(next.day.date).toEqual({ year: 2025, month: 10, day: 6 })
    expect(next.daysUntil).toBe(9)
    expect(next.other?.date.month).toBe(3)
  })

  it('is zero on the day itself, not already past', () => {
    const next = nextZeroShadowDay(makassar, { year: 2025, month: 10, day: 6 })
    if (next.type !== 'next') throw new Error(next.type)
    expect(next.daysUntil).toBe(0)
  })

  it('rolls into next year once both dates have passed', () => {
    const next = nextZeroShadowDay(jakarta, { year: 2025, month: 12, day: 1 })
    if (next.type !== 'next') throw new Error(next.type)
    expect(next.day.date.year).toBe(2026)
    expect(next.day.date.month).toBe(3)
    expect(next.daysUntil).toBeGreaterThan(80)
    expect(next.daysUntil).toBeLessThan(100)
  })

  it('outside the tropics it is the structured no-result, never a nearest date', () => {
    const result = nextZeroShadowDay({ latDeg: -33.87, lonDeg: 151.21, offsetHours: 10 }, { year: 2025, month: 1, day: 1 })
    expect(result.type).toBe('outside-tropics')
  })

  it('is deterministic', () => {
    const a = nextZeroShadowDay(jakarta, { year: 2026, month: 5, day: 1 })
    const b = nextZeroShadowDay(jakarta, { year: 2026, month: 5, day: 1 })
    expect(a).toEqual(b)
  })
})

describe('whose day comes next across the archipelago', () => {
  const today = { year: 2025, month: 9, day: 27 }

  it('lists cities in date order, within the window asked for', () => {
    const list = upcomingZeroShadowDays(INDONESIAN_CITIES, today, 14)
    expect(list.length).toBeGreaterThan(3)
    for (let index = 1; index < list.length; index += 1) {
      expect(list[index]!.daysUntil).toBeGreaterThanOrEqual(list[index - 1]!.daysUntil)
    }
    for (const entry of list) expect(entry.daysUntil).toBeLessThanOrEqual(14)
    // Makassar's 6 October is inside a fortnight of 27 September.
    expect(list.map((entry) => entry.place.name)).toContain('Makassar')
  })

  it('late September the sun is heading south, so northern cities are not listed', () => {
    const list = upcomingZeroShadowDays(INDONESIAN_CITIES, today, 14)
    for (const entry of list) expect(entry.place.latDeg).toBeLessThan(0)
  })

  it('in June the band is north of the country, so nothing is within a week', () => {
    expect(upcomingZeroShadowDays(INDONESIAN_CITIES, { year: 2025, month: 6, day: 21 }, 7)).toEqual([])
  })
})
