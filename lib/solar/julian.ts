/**
 * Julian Day conversion.
 *
 * Algorithm: Meeus, *Astronomical Algorithms*, 2nd ed., ch. 7.
 * Valid for any date in the Gregorian calendar (from 1582 October 15).
 *
 * The numerical core carries Julian Day numbers and fractional days only —
 * never `Date`, never a timezone. Civil time is a display concern applied at
 * the boundary (CLAUDE.md invariants 1–3).
 */

/** Julian Day of 2000 January 1.5 TT — the standard epoch J2000.0. */
export const JD_J2000 = 2451545.0

/** Days in a Julian century. */
export const DAYS_PER_JULIAN_CENTURY = 36525

/** A civil calendar date in Universal Time, with the day expressed as an integer. */
export interface CivilDate {
  readonly year: number
  /** 1 = January … 12 = December. */
  readonly month: number
  readonly day: number
}

/**
 * Julian Day for a Gregorian civil date and a fraction of that day.
 *
 * `dayFraction` is measured from 00:00 of the given date: 0 = midnight,
 * 0.5 = noon. Meeus ch. 7, equation 7.1.
 */
export function julianDay(date: CivilDate, dayFraction = 0): number {
  let y = date.year
  let m = date.month
  if (m <= 2) {
    y -= 1
    m += 12
  }
  const a = Math.floor(y / 100)
  const b = 2 - a + Math.floor(a / 4)
  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    date.day +
    b -
    1524.5 +
    dayFraction
  )
}

/** Julian Day for a civil date and a UT clock time in hours, minutes, seconds. */
export function julianDayFromTime(
  date: CivilDate,
  hours: number,
  minutes = 0,
  seconds = 0,
): number {
  return julianDay(date, (hours + minutes / 60 + seconds / 3600) / 24)
}

/**
 * The civil date and day fraction for a Julian Day. Inverse of {@link julianDay}.
 * Meeus ch. 7, the reverse algorithm.
 */
export function civilFromJulianDay(jd: number): CivilDate & { dayFraction: number } {
  const shifted = jd + 0.5
  const z = Math.floor(shifted)
  const f = shifted - z
  const alpha = Math.floor((z - 1867216.25) / 36524.25)
  const a = z + 1 + alpha - Math.floor(alpha / 4)
  const b = a + 1524
  const c = Math.floor((b - 122.1) / 365.25)
  const d = Math.floor(365.25 * c)
  const e = Math.floor((b - d) / 30.6001)
  const day = b - d - Math.floor(30.6001 * e)
  const month = e < 14 ? e - 1 : e - 13
  const year = month > 2 ? c - 4716 : c - 4715
  return { year, month, day, dayFraction: f }
}

/** Julian centuries since J2000.0. The time argument of every series below. */
export function julianCentury(jd: number): number {
  return (jd - JD_J2000) / DAYS_PER_JULIAN_CENTURY
}

/** Julian Day at 00:00 UT of the day containing `jd`. */
export function startOfDay(jd: number): number {
  return Math.floor(jd - 0.5) + 0.5
}

/** Day of the year, 1-based, for a civil date. */
export function dayOfYear(date: CivilDate): number {
  return julianDay(date) - julianDay({ year: date.year, month: 1, day: 1 }) + 1
}

/** Whether a Gregorian year is a leap year. */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/** Number of days in a Gregorian year. */
export function daysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365
}
