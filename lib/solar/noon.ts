/**
 * Solar noon — the instant of upper culmination (*kulminasi*) — from longitude
 * and the Equation of Time.
 *
 * No timezone database, no DST (CLAUDE.md invariant 3). A zone is nothing but a
 * UTC offset here, and the clock-versus-sun gap decomposes into exactly two
 * causes, which the UI shows separately (PRD §5.2):
 *
 *   1. longitude within the zone — 4 minutes per degree from the zone meridian
 *   2. the Equation of Time — the ±16-minute annual swing
 */

import { equationOfTimeMinutes, solarPosition } from './position'
import { startOfDay } from './julian'

export const MINUTES_PER_DAY = 1440

/** A UTC offset expressed in whole or fractional hours. East positive. */
export type UtcOffsetHours = number

export interface TimeZone {
  /** Short label as used in Indonesia: WIB, WITA, WIT. */
  readonly code: string
  /** Offset from UTC in hours, east positive. */
  readonly offsetHours: UtcOffsetHours
  /** Meridian the zone is anchored to, degrees east. */
  readonly meridianDeg: number
}

/**
 * Indonesia's three zones, anchored at 105°E, 120°E and 135°E.
 * Indonesia observes no daylight saving, so an offset is the whole story.
 */
export const INDONESIA_ZONES: readonly TimeZone[] = [
  { code: 'WIB', offsetHours: 7, meridianDeg: 105 },
  { code: 'WITA', offsetHours: 8, meridianDeg: 120 },
  { code: 'WIT', offsetHours: 9, meridianDeg: 135 },
] as const

/** The zone meridian implied by a UTC offset. */
export function zoneMeridianDeg(offsetHours: UtcOffsetHours): number {
  return offsetHours * 15
}

export interface SolarNoon {
  /** Julian Day (UT) of solar noon. */
  readonly jd: number
  /** Solar noon as local civil time, in hours since local midnight. */
  readonly localHours: number
  /** Minutes solar noon runs late because the place sits west of its zone meridian. */
  readonly longitudeOffsetMinutes: number
  /** Minutes solar noon runs late because of the Equation of Time (its negation). */
  readonly eotOffsetMinutes: number
  /** Total offset of solar noon from 12:00 local clock time, minutes. */
  readonly offsetMinutes: number
  /** The Equation of Time itself at that instant, minutes. */
  readonly eotMinutes: number
}

/**
 * Solar noon for a place on a given local civil day.
 *
 * `jdLocalMidnight` is the Julian Day of 00:00 *local civil* time; callers
 * build it from a civil date at the display boundary. Solved by one refinement
 * pass, since the Equation of Time itself depends on the instant — it moves by
 * under 0.4 minutes a day, so a second pass changes nothing measurable.
 */
export function solarNoon(
  jdLocalMidnight: number,
  lonDeg: number,
  offsetHours: UtcOffsetHours,
): SolarNoon {
  const longitudeOffsetMinutes = (zoneMeridianDeg(offsetHours) - lonDeg) * 4

  let localMinutes = MINUTES_PER_DAY / 2 + longitudeOffsetMinutes
  let eotMinutes = 0
  for (let pass = 0; pass < 2; pass += 1) {
    const jdUt = jdLocalMidnight + localMinutes / MINUTES_PER_DAY - offsetHours / 24
    eotMinutes = equationOfTimeMinutes(jdUt)
    localMinutes = MINUTES_PER_DAY / 2 + longitudeOffsetMinutes - eotMinutes
  }

  return {
    jd: jdLocalMidnight + localMinutes / MINUTES_PER_DAY - offsetHours / 24,
    localHours: localMinutes / 60,
    longitudeOffsetMinutes,
    eotOffsetMinutes: -eotMinutes,
    offsetMinutes: localMinutes - MINUTES_PER_DAY / 2,
    eotMinutes,
  }
}

/**
 * Solar noon for a UT day at a given longitude, ignoring civil time entirely.
 * The form the zero shadow day search uses: it needs the culmination instant,
 * not what a clock says (CLAUDE.md invariant 2).
 */
export function solarNoonJd(jdUtDay: number, lonDeg: number): number {
  const midnightUt = startOfDay(jdUtDay)
  let jd = midnightUt + 0.5 - lonDeg / 360
  for (let pass = 0; pass < 2; pass += 1) {
    jd = midnightUt + 0.5 - lonDeg / 360 - solarPosition(jd).eotMinutes / MINUTES_PER_DAY
  }
  return jd
}

/** Format hours-since-midnight as HH:MM. Display boundary only. */
export function formatHours(localHours: number): string {
  const total = Math.round(localHours * 60)
  const hours = Math.floor(total / 60) % 24
  const minutes = ((total % 60) + 60) % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/** Format hours-since-midnight as HH:MM:SS. Display boundary only. */
export function formatHoursSeconds(localHours: number): string {
  const total = Math.round(localHours * 3600)
  const hours = Math.floor(total / 3600) % 24
  const minutes = Math.floor(total / 60) % 60
  const seconds = total % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
