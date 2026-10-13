/**
 * What the decks are about, read from the engine: zero shadow days over a run
 * of dates, the next one for a city, the noon of a given day, the Eratosthenes
 * observation a perfect observer would make. Composition only — every value
 * comes from lib/zsd, lib/day or lib/eratosthenes (CLAUDE.md invariant 14
 * keeps all of this out of components).
 */

import { type City, INDONESIAN_CITIES, nearestCity } from '@/data/cities/indonesia'
import { type NoonOfYear, noonOfYear } from '@/lib/day'
import { type Observation, ratePartner, syntheticObservation } from '@/lib/eratosthenes'
import { type CivilDate, civilFromJulianDay, dayOfYear, julianDay } from '@/lib/solar/julian'
import {
  type Place,
  type ZeroShadowDay,
  daysBetween,
  nextZeroShadowDay,
  zeroShadowDays,
} from '@/lib/zsd'

export interface ZsdEvent {
  readonly city: City
  readonly day: ZeroShadowDay
  /** Whole days from the reference date; 0 on the day itself. */
  readonly daysUntil: number
}

/**
 * Every zero shadow day of `cities` from `from` through `withinDays` days
 * later, soonest first, then west to east by the instant of culmination.
 */
export function zsdEvents(
  cities: readonly City[],
  from: CivilDate,
  withinDays: number,
): ZsdEvent[] {
  // Only the civil years the window touches: each is a full-year search per city.
  const lastYear = civilFromJulianDay(julianDay(from) + withinDays).year
  const years: number[] = []
  for (let year = from.year; year <= lastYear; year += 1) years.push(year)

  const events: ZsdEvent[] = []
  for (const city of cities) {
    for (const year of years) {
      const result = zeroShadowDays(city, year)
      if (result.type !== 'zero-shadow-days') continue
      for (const day of result.days) {
        const daysUntil = daysBetween(from, day.date)
        if (daysUntil >= 0 && daysUntil <= withinDays) events.push({ city, day, daysUntil })
      }
    }
  }
  return events.sort(
    (a, b) => a.daysUntil - b.daysUntil || a.day.jdCulmination - b.day.jdCulmination,
  )
}

export interface NextFor {
  readonly day: ZeroShadowDay
  readonly daysUntil: number
  /** The year's other date, or null where the two converge. */
  readonly other: ZeroShadowDay | null
}

/** The city's next zero shadow day on or after `today`. Every listed city is tropical. */
export function nextFor(city: City, today: CivilDate): NextFor {
  const next = nextZeroShadowDay(city, today)
  if (next.type !== 'next') {
    // Indonesia lies wholly inside the tropics; a listed city outside them is a data error.
    throw new Error(`${city.name} is outside the tropics (limit ${next.limitDeg}°)`)
  }
  return { day: next.day, daysUntil: next.daysUntil, other: next.other }
}

/** The culmination of one civil day at a place: time, altitude, noon shadow. */
export function noonOn(place: Place, date: CivilDate): NoonOfYear {
  const day = noonOfYear(place, date.year)[dayOfYear(date) - 1]
  if (!day) throw new Error(`no noon for ${date.year}-${date.month}-${date.day}`)
  return day
}

/** The earliest and latest culmination over the `days` days from `from`. */
export function noonExtremes(
  place: Place,
  from: CivilDate,
  days: number,
): { earliest: NoonOfYear; latest: NoonOfYear } {
  const run = [...noonOfYear(place, from.year), ...noonOfYear(place, from.year + 1)].filter(
    (noon) => {
      const offset = daysBetween(from, noon.date)
      return offset >= 0 && offset < days
    },
  )
  const first = run[0]
  if (!first) throw new Error('noonExtremes: empty run')
  let earliest = first
  let latest = first
  for (const noon of run) {
    if (noon.localNoonHours < earliest.localNoonHours) earliest = noon
    if (noon.localNoonHours > latest.localNoonHours) latest = noon
  }
  return { earliest, latest }
}

/**
 * The last zero shadow day before the sweep leaves the listed cities for a
 * while, and the first one after: a gap of at least `minGapDays` with no
 * listed city's date in it. The sweep turns at each solstice, so this is
 * Kupang in October and Sabang in April, but it is found, never assumed.
 */
export function seasonEdge(
  today: CivilDate,
  cities: readonly City[] = INDONESIAN_CITIES,
  minGapDays = 30,
): { last: ZsdEvent; next: ZsdEvent; gapDays: number } {
  const events = zsdEvents(cities, today, 400)
  for (let index = 0; index + 1 < events.length; index += 1) {
    const last = events[index]
    const next = events[index + 1]
    if (!last || !next) break
    const gapDays = next.daysUntil - last.daysUntil
    if (gapDays >= minGapDays) return { last, next, gapDays }
  }
  throw new Error('seasonEdge: no gap within 400 days')
}

export interface Measurement {
  readonly city: City
  readonly noon: NoonOfYear
  readonly observation: Observation
  readonly separationDeg: number
  readonly lonGapDeg: number
  readonly quality: number
}

/**
 * What a perfect observer in each partner city would measure at their own
 * culmination on the host's zero shadow day, best pairings first by the app's
 * own `ratePartner`. Gnomon height 100, so the shadow reads in centimetres
 * for a one-metre stick.
 */
export function partnerMeasurements(
  host: City,
  date: CivilDate,
  minimumSeparationDeg: number,
  cities: readonly City[] = INDONESIAN_CITIES,
): Measurement[] {
  return cities
    .filter((city) => city.name !== host.name)
    .map((city) => {
      const rating = ratePartner(host, city)
      return {
        city,
        noon: noonOn(city, date),
        observation: syntheticObservation(city, date, city.name, 100),
        separationDeg: rating.separationDeg,
        lonGapDeg: rating.lonGapDeg,
        quality: rating.quality,
      }
    })
    .filter((m) => m.separationDeg >= minimumSeparationDeg)
    .sort((a, b) => b.quality - a.quality || a.city.name.localeCompare(b.city.name))
}

/**
 * The listed city a place stands for on a card. A place picked from the list
 * is itself; a typed or geolocated one is named by its nearest listed city, so
 * its coordinates never reach a deck (CLAUDE.md invariant 9).
 */
export function cityForPlace(place: Place & { readonly label?: string }): City {
  const listed = INDONESIAN_CITIES.find(
    (city) =>
      city.name === place.label && city.latDeg === place.latDeg && city.lonDeg === place.lonDeg,
  )
  return listed ?? nearestCity(place.latDeg, place.lonDeg).city
}
