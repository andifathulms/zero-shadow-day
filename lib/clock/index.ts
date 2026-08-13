/**
 * The one place a `Date` is allowed: reading the wall clock in the browser.
 *
 * The numerical core never sees this — it carries Julian Days and fractional
 * days only (CLAUDE.md invariant 2). Everything here is a display concern:
 * which day to open on, and where to put "now" on the time scrubber.
 */

import type { CivilDate } from '@/lib/solar/julian'

/** Today's civil date in a zone given by its UTC offset in hours. */
export function todayIn(offsetHours: number, now = new Date()): CivilDate {
  const shifted = new Date(now.getTime() + offsetHours * 3600_000)
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  }
}

/** The current local clock time in that zone, as hours since local midnight. */
export function nowHoursIn(offsetHours: number, now = new Date()): number {
  const shifted = new Date(now.getTime() + offsetHours * 3600_000)
  return (
    shifted.getUTCHours() +
    shifted.getUTCMinutes() / 60 +
    shifted.getUTCSeconds() / 3600
  )
}

/** The current year in that zone. */
export function currentYearIn(offsetHours: number, now = new Date()): number {
  return todayIn(offsetHours, now).year
}
