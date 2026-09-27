/**
 * The zero shadow day counted from a given date: the countdown the home page
 * leads with, and whose day comes next across a list of places.
 *
 * Both read the same search (`zeroShadowDays`), so a countdown can never
 * disagree with the dates page. "Today" is passed in as a civil date; the
 * clock is read at the display boundary (lib/clock), never here.
 */

import { type CivilDate, julianDay } from '@/lib/solar/julian'
import { zeroShadowDays } from './search'
import type { OutsideTropics, Place, ZeroShadowDay } from './types'

export interface NextZeroShadowDay {
  readonly type: 'next'
  readonly day: ZeroShadowDay
  /** Whole days from the given date. Zero on the day itself. */
  readonly daysUntil: number
  /** The other date of the same year, before or after; null where the two converge. */
  readonly other: ZeroShadowDay | null
}

export type NextZeroShadowResult = NextZeroShadowDay | OutsideTropics

/** Whole days from one civil date to another; negative when `to` is earlier. */
export function daysBetween(from: CivilDate, to: CivilDate): number {
  return Math.round(julianDay(to) - julianDay(from))
}

/** The first zero shadow day on or after `today`, looking into next year if both have passed. */
export function nextZeroShadowDay(place: Place, today: CivilDate): NextZeroShadowResult {
  for (const year of [today.year, today.year + 1]) {
    const result = zeroShadowDays(place, year)
    if (result.type === 'outside-tropics') return result
    const index = result.days.findIndex((day) => daysBetween(today, day.date) >= 0)
    if (index >= 0) {
      const day = result.days[index]
      if (day === undefined) continue
      const other = result.days.find((_, candidate) => candidate !== index) ?? null
      return { type: 'next', day, daysUntil: daysBetween(today, day.date), other }
    }
  }
  // Two consecutive years always hold a date on or after any day of the first.
  throw new Error('unreachable: no zero shadow day in two consecutive years')
}

export interface UpcomingZeroShadowDay<T extends Place> {
  readonly place: T
  readonly day: ZeroShadowDay
  readonly daysUntil: number
}

/**
 * Places whose zero shadow day falls within `withinDays` of `today`, soonest
 * first. Places outside the tropics are simply absent.
 */
export function upcomingZeroShadowDays<T extends Place>(
  places: readonly T[],
  today: CivilDate,
  withinDays: number,
): UpcomingZeroShadowDay<T>[] {
  const upcoming: UpcomingZeroShadowDay<T>[] = []
  for (const place of places) {
    const next = nextZeroShadowDay(place, today)
    if (next.type === 'next' && next.daysUntil <= withinDays) {
      upcoming.push({ place, day: next.day, daysUntil: next.daysUntil })
    }
  }
  return upcoming.sort(
    (left, right) => left.daysUntil - right.daysUntil || left.place.latDeg - right.place.latDeg,
  )
}
