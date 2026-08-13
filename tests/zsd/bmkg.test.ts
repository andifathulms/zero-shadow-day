import { describe, expect, it } from 'vitest'
import { julianDay } from '@/lib/solar/julian'
import { solarPosition } from '@/lib/solar/position'
import { culminationZenithDeg } from '@/lib/solar/altitude'
import { solarNoon } from '@/lib/solar/noon'
import { zeroShadowDays } from '@/lib/zsd'
import type { Place } from '@/lib/zsd'
import {
  BMKG_2025_SECOND,
  BMKG_2026_FIRST,
  BMKG_CITIES,
  type BmkgCulmination,
  ZONE_OFFSET,
  decimalLat,
  decimalLon,
  localHours,
} from './fixtures/bmkg'

/**
 * The engine against BMKG's published tables — 38 provincial capitals in each
 * of two publications, at BMKG's own coordinates.
 *
 * This is the strongest check the project has: an independent authority, its
 * own positions, and culmination times to the second.
 */

const cityByName = new Map(BMKG_CITIES.map((city) => [city.name, city]))

function placeOf(name: string): Place {
  const city = cityByName.get(name)
  if (!city) throw new Error(`no BMKG city named ${name}`)
  return {
    latDeg: decimalLat(city),
    lonDeg: decimalLon(city),
    offsetHours: ZONE_OFFSET[city.zone],
  }
}

/** The computed culmination the app would show for a published entry. */
function computed(entry: BmkgCulmination, which: 'first' | 'second') {
  const place = placeOf(entry.city)
  const result = zeroShadowDays(place, entry.date.year)
  if (result.type !== 'zero-shadow-days') {
    throw new Error(`${entry.city}: expected zero shadow days, got ${result.type}`)
  }
  const day = which === 'first' ? result.days[0]! : result.days[result.days.length - 1]!
  return {
    place,
    day,
    dayGap: julianDay(day.date) - julianDay(entry.date),
    secondsGap: (day.localNoonHours - localHours(entry)) * 3600,
  }
}

/**
 * Four rows of the 2025 second-culmination table repeat that city's *first*
 * culmination time. See the dedicated block below, which proves it from the
 * Equation of Time rather than assuming it. They are excluded from the timing
 * assertion and asserted separately — never silently dropped.
 */
const REPEATED_IN_2025_SECOND = new Set(['Jayapura', 'Nabire', 'Wamena', 'Merauke'])

describe.each([
  ['Kulminasi Utama I 2026', BMKG_2026_FIRST, 'first'],
  ['Kulminasi Utama II 2025', BMKG_2025_SECOND, 'second'],
] as const)('%s', (label, table, which) => {
  it('covers all 38 provincial capitals', () => {
    expect(table).toHaveLength(38)
    for (const entry of table) expect(cityByName.has(entry.city), entry.city).toBe(true)
  })

  it('every city gets a zero shadow day, and the published date agrees within a day', () => {
    for (const entry of table) {
      const { dayGap } = computed(entry, which)
      expect(Math.abs(dayGap), `${label} ${entry.city}`).toBeLessThanOrEqual(1)
    }
  })

  it('all but at most one date is exact', () => {
    const inexact = table.filter((entry) => computed(entry, which).dayGap !== 0)
    expect(inexact.map((entry) => entry.city).join(', ')).toBe(
      // Pekanbaru sits 0.53° north of the equator, where the declination crosses
      // between two candidate days; see the block below.
      label.includes('2026') ? 'Pekan baru' : '',
    )
  })

  it('culmination times match to within five seconds', () => {
    for (const entry of table) {
      if (which === 'second' && REPEATED_IN_2025_SECOND.has(entry.city)) continue
      const { secondsGap } = computed(entry, which)
      expect(Math.abs(secondsGap), `${label} ${entry.city}`).toBeLessThan(5)
    }
  })
})

/**
 * Where the engine and the table disagree, and why.
 *
 * CLAUDE.md says that when a fixture disagrees with published dates, the engine
 * is wrong. Both disagreements here are about something else, and each is
 * pinned down rather than waved away.
 */
describe('the two disagreements, explained', () => {
  it('Pekanbaru: the app names the day of the smaller residual, as its own rule requires', () => {
    // BMKG names 21 March 2026; the app names 22 March. The city sits 0.53°
    // north of the equator, so the declination crosses its latitude between the
    // two culminations — exactly the discrete-day versus continuous-crossing
    // case of PRD §6. The rule is to minimise the noon shadow, so the smaller
    // zenith distance decides, and it falls on the 22nd.
    const place = placeOf('Pekan baru')
    const zenithOn = (day: number): number => {
      const date = { year: 2026, month: 3, day }
      const noon = solarNoon(julianDay(date), place.lonDeg, place.offsetHours)
      return culminationZenithDeg(place.latDeg, solarPosition(noon.jd).decDeg)
    }
    expect(zenithOn(22)).toBeLessThan(zenithOn(21))
    // Both are close approaches; the disagreement is a day, which is the bar.
    expect(zenithOn(21)).toBeLessThan(0.5)
    expect(zenithOn(22)).toBeLessThan(0.5)
  })

  it('four rows of the 2025 table carry the first culmination’s time, not the second’s', () => {
    const firstByCity = new Map(BMKG_2026_FIRST.map((entry) => [entry.city, entry]))
    const secondByCity = new Map(BMKG_2025_SECOND.map((entry) => [entry.city, entry]))

    for (const city of REPEATED_IN_2025_SECOND) {
      const first = firstByCity.get(city)!
      const second = secondByCity.get(city)!

      // A culmination time is 12:00 plus a fixed longitude term minus the
      // Equation of Time. The longitude does not move between the two dates, so
      // the published times MUST differ by the change in the Equation of Time.
      const eotFirst = solarPosition(julianDay(first.date, 0.2)).eotMinutes
      const eotSecond = solarPosition(julianDay(second.date, 0.2)).eotMinutes
      const demanded = Math.abs(eotFirst - eotSecond)
      expect(demanded, city).toBeGreaterThan(15)

      // Instead they are within ten seconds of each other.
      const published = Math.abs(localHours(second) - localHours(first)) * 3600
      expect(published, city).toBeLessThan(10)

      // And the app's own value differs from the published one by precisely
      // that missing Equation of Time change — which is what a repeated cell
      // looks like, and what a drifting engine does not.
      const { secondsGap } = computed(second, 'second')
      expect(Math.abs(secondsGap) / 60, city).toBeCloseTo(demanded, 0)
    }
  })

  it('the same table is correct for the neighbouring cities, so the table is not systematically wrong', () => {
    // Sorong and Manokwari sit in the same zone, in the same table, and their
    // two publications differ by exactly the Equation of Time change. The four
    // above are isolated cells, not a broken column.
    const firstByCity = new Map(BMKG_2026_FIRST.map((entry) => [entry.city, entry]))
    const secondByCity = new Map(BMKG_2025_SECOND.map((entry) => [entry.city, entry]))

    for (const city of ['Sorong', 'Manokwari']) {
      const first = firstByCity.get(city)!
      const second = secondByCity.get(city)!
      const eotChange =
        solarPosition(julianDay(first.date, 0.2)).eotMinutes -
        solarPosition(julianDay(second.date, 0.2)).eotMinutes
      const publishedChange = (localHours(second) - localHours(first)) * 60
      expect(publishedChange, city).toBeCloseTo(eotChange, 0)
      expect(Math.abs(computed(second, 'second').secondsGap), city).toBeLessThan(5)
    }
  })
})

describe('what the tables say about the country as a whole', () => {
  it('the sweep reaches the south first and the north last, in both directions', () => {
    // BMKG: "antara 21 Februari di Baa … hingga 5 April di Sabang, dan
    // 7 September di Sabang … sampai 21 Oktober di Baa".
    const northward = [...BMKG_2026_FIRST].sort(
      (a, b) => julianDay(a.date) - julianDay(b.date),
    )
    const southward = [...BMKG_2025_SECOND].sort(
      (a, b) => julianDay(a.date) - julianDay(b.date),
    )
    const latOf = (entry: BmkgCulmination) => decimalLat(cityByName.get(entry.city)!)

    // Heading north, the southernmost capital is reached first and the
    // northernmost last; returning south, the reverse.
    expect(latOf(northward[0]!)).toBeLessThan(-8)
    expect(latOf(northward[northward.length - 1]!)).toBeGreaterThan(5)
    expect(latOf(southward[0]!)).toBeGreaterThan(2)
    expect(latOf(southward[southward.length - 1]!)).toBeLessThan(-8)
  })

  it('the engine reproduces that ordering from the coordinates alone', () => {
    const computedDates = BMKG_2026_FIRST.map((entry) => ({
      lat: decimalLat(cityByName.get(entry.city)!),
      jd: julianDay(computed(entry, 'first').day.date),
    })).sort((a, b) => a.jd - b.jd)

    expect(computedDates[0]!.lat).toBeLessThan(-8)
    expect(computedDates[computedDates.length - 1]!.lat).toBeGreaterThan(5)
  })
})
