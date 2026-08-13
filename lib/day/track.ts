/**
 * `lib/day` — composition of `lib/solar` and `lib/shadow` into the tracks the
 * views read: a day's shadow, a day's shadow-tip curve, the analemma, and the
 * year of noon shadows the scrubber is marked with.
 *
 * Nothing is computed in a component (CLAUDE.md invariant 14). Components take
 * these structures and draw them.
 */

import { horizontalPosition } from '@/lib/solar/altitude'
import { type CivilDate, daysInYear, julianDay } from '@/lib/solar/julian'
import { solarNoon } from '@/lib/solar/noon'
import { solarPosition } from '@/lib/solar/position'
import { type ShadowResult, shadowFromSun, shadowTip } from '@/lib/shadow'
import type { Place } from '@/lib/zsd'

export interface Instant {
  /** Local civil time, hours since local midnight. */
  readonly localHours: number
  readonly jd: number
  readonly altDeg: number
  readonly azDeg: number
  readonly decDeg: number
  readonly shadow: ShadowResult
  /** Shadow tip in gnomon heights, east and north of the foot. Null below the horizon. */
  readonly tip: { east: number; north: number } | null
}

/** Julian Day (UT) for a local civil date and clock time. */
export function jdFromLocal(date: CivilDate, localHours: number, offsetHours: number): number {
  return julianDay(date) + localHours / 24 - offsetHours / 24
}

/** The Sun, the shadow and the shadow tip at one local clock time. */
export function instantAt(place: Place, date: CivilDate, localHours: number): Instant {
  const jd = jdFromLocal(date, localHours, place.offsetHours)
  const { altDeg, azDeg, decDeg } = horizontalPosition(jd, place.latDeg, place.lonDeg)
  return {
    localHours,
    jd,
    altDeg,
    azDeg,
    decDeg,
    shadow: shadowFromSun(altDeg, azDeg),
    tip: shadowTip(altDeg, azDeg, 1),
  }
}

export interface DayTrack {
  readonly date: CivilDate
  readonly samples: readonly Instant[]
  /** Local clock hours of geometric sunrise and sunset; null if the Sun never rises or never sets. */
  readonly sunriseHours: number | null
  readonly sunsetHours: number | null
  readonly noonLocalHours: number
  readonly noonAltDeg: number
  readonly noonAzDeg: number
  /** Shortest shadow of the day, as a ratio to gnomon height. */
  readonly minShadowRatio: number
}

/**
 * A day sampled at a fixed cadence, plus its culmination.
 * `stepMinutes` of 2 gives a smooth sweep; `prefers-reduced-motion` steps by
 * the hour instead, over the same structure.
 */
export function dayTrack(place: Place, date: CivilDate, stepMinutes = 2): DayTrack {
  const samples: Instant[] = []
  for (let minutes = 0; minutes <= 1440; minutes += stepMinutes) {
    samples.push(instantAt(place, date, minutes / 60))
  }

  const noon = solarNoon(julianDay(date), place.lonDeg, place.offsetHours)
  const noonInstant = instantAt(place, date, noon.localHours)

  return {
    date,
    samples,
    sunriseHours: crossHorizon(samples, 'up'),
    sunsetHours: crossHorizon(samples, 'down'),
    noonLocalHours: noon.localHours,
    noonAltDeg: noonInstant.altDeg,
    noonAzDeg: noonInstant.azDeg,
    minShadowRatio:
      noonInstant.shadow.type === 'shadow' ? noonInstant.shadow.lengthRatio : 0,
  }
}

/** Local hour the geometric altitude crosses zero, by linear interpolation. */
function crossHorizon(samples: readonly Instant[], direction: 'up' | 'down'): number | null {
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1]!
    const current = samples[index]!
    const rising = previous.altDeg <= 0 && current.altDeg > 0
    const setting = previous.altDeg > 0 && current.altDeg <= 0
    if ((direction === 'up' && rising) || (direction === 'down' && setting)) {
      const fraction = -previous.altDeg / (current.altDeg - previous.altDeg)
      return previous.localHours + fraction * (current.localHours - previous.localHours)
    }
  }
  return null
}

/**
 * The curve traced by the shadow tip over one day: a hyperbola on every day
 * but the equinoxes, where the Sun's diurnal circle lies in the plane of the
 * celestial equator and the trace is exactly a straight line (PRD §5.3).
 *
 * Points are in gnomon heights and clipped, since the trace runs to infinity
 * at sunrise and sunset.
 */
export function shadowTipCurve(
  place: Place,
  date: CivilDate,
  { stepMinutes = 4, maxRatio = 6 }: { stepMinutes?: number; maxRatio?: number } = {},
): Array<{ east: number; north: number; localHours: number } | null> {
  const points: Array<{ east: number; north: number; localHours: number } | null> = []
  for (let minutes = 0; minutes <= 1440; minutes += stepMinutes) {
    const { tip, localHours } = instantAt(place, date, minutes / 60)
    if (!tip || Math.hypot(tip.east, tip.north) > maxRatio) {
      // A break in the polyline, not a point at the clip edge.
      if (points[points.length - 1] !== null) points.push(null)
      continue
    }
    points.push({ ...tip, localHours })
  }
  return points
}

/** A year of shadow-tip curves, one every `everyDays`, for the family of hyperbolas. */
export function shadowTipCurveFamily(
  place: Place,
  year: number,
  everyDays = 15,
): Array<{ date: CivilDate; points: ReturnType<typeof shadowTipCurve> }> {
  const family: Array<{ date: CivilDate; points: ReturnType<typeof shadowTipCurve> }> = []
  for (let offset = 0; offset < daysInYear(year); offset += everyDays) {
    const date = civilDateFromOffset(year, offset)
    family.push({ date, points: shadowTipCurve(place, date) })
  }
  return family
}

/**
 * The analemma: the Sun's position at the same *clock* time on every day of
 * the year. The figure-eight is the Equation of Time made visible — the same
 * quantity that shifts solar noon away from 12:00 (PRD §5.4).
 */
export function analemma(
  place: Place,
  year: number,
  localClockHours: number,
): Array<{ date: CivilDate; altDeg: number; azDeg: number; eotMinutes: number; decDeg: number }> {
  const points = []
  for (let offset = 0; offset < daysInYear(year); offset += 1) {
    const date = civilDateFromOffset(year, offset)
    const jd = jdFromLocal(date, localClockHours, place.offsetHours)
    const { altDeg, azDeg } = horizontalPosition(jd, place.latDeg, place.lonDeg)
    const { eotMinutes, decDeg } = solarPosition(jd)
    points.push({ date, altDeg, azDeg, eotMinutes, decDeg })
  }
  return points
}

export interface NoonOfYear {
  readonly date: CivilDate
  readonly dayOfYear: number
  readonly localNoonHours: number
  readonly altDeg: number
  readonly decDeg: number
  /** Noon shadow ratio; 0 when the Sun stands at the zenith. */
  readonly shadowRatio: number
  /** Bearing of the noon shadow, or null at the zenith. */
  readonly bearingDeg: number | null
}

/**
 * Every day of a year at culmination. The scrubber is marked from this, and it
 * is where the flip from a north-pointing to a south-pointing noon shadow
 * becomes visible (PRD §1).
 */
export function noonOfYear(place: Place, year: number): NoonOfYear[] {
  const track: NoonOfYear[] = []
  for (let offset = 0; offset < daysInYear(year); offset += 1) {
    const date = civilDateFromOffset(year, offset)
    const noon = solarNoon(julianDay(date), place.lonDeg, place.offsetHours)
    const { altDeg, azDeg, decDeg } = horizontalPosition(noon.jd, place.latDeg, place.lonDeg)
    const shadow = shadowFromSun(altDeg, azDeg)
    track.push({
      date,
      dayOfYear: offset + 1,
      localNoonHours: noon.localHours,
      altDeg,
      decDeg,
      shadowRatio: shadow.type === 'shadow' ? shadow.lengthRatio : 0,
      bearingDeg: shadow.type === 'shadow' ? shadow.bearingDeg : null,
    })
  }
  return track
}

/** Civil date `offset` days after 1 January. */
export function civilDateFromOffset(year: number, offset: number): CivilDate {
  const lengths = [31, daysInYear(year) === 366 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  let remaining = offset
  for (let month = 1; month <= 12; month += 1) {
    const length = lengths[month - 1] ?? 31
    if (remaining < length) return { year, month, day: remaining + 1 }
    remaining -= length
  }
  return { year, month: 12, day: 31 }
}
