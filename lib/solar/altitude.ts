/**
 * Horizontal coordinates of the Sun: altitude and azimuth from the equatorial
 * position and the observer's latitude and longitude.
 *
 * Standard spherical astronomy (Meeus ch. 13). Geometric altitude only —
 * atmospheric refraction and observer elevation are neglected, and that is
 * stated on the method page (PRD §5.8). Refraction lifts the Sun by about
 * 0.5° at the horizon but under 0.01° above 45°, and every number this app
 * publishes is taken near culmination in the tropics, where the Sun is high.
 */

import {
  asinDeg,
  atan2Deg,
  cosDeg,
  normaliseDeg,
  normaliseSignedDeg,
  sinDeg,
  tanDeg,
} from './angles'
import { MINUTES_PER_DAY } from './noon'
import { startOfDay } from './julian'
import { solarPosition } from './position'

export interface HorizontalPosition {
  /** Geometric altitude of the Sun above the horizon, degrees. */
  readonly altDeg: number
  /** Azimuth of the Sun, degrees clockwise from true north. */
  readonly azDeg: number
  /** Hour angle, degrees; negative before culmination, positive after. */
  readonly haDeg: number
  /** Apparent declination at that instant, degrees. */
  readonly decDeg: number
}

/**
 * Local hour angle of the Sun, degrees, in (−180, 180].
 * Derived from mean solar time plus the Equation of Time, which avoids needing
 * sidereal time and keeps the module dependent on nothing but {@link solarPosition}.
 */
export function hourAngleDeg(jd: number, lonDeg: number): number {
  const { eotMinutes } = solarPosition(jd)
  const minutesFromMidnightUt = (jd - startOfDay(jd)) * MINUTES_PER_DAY
  const trueSolarTimeMinutes = minutesFromMidnightUt + eotMinutes + 4 * lonDeg
  return normaliseSignedDeg(trueSolarTimeMinutes / 4 - 180)
}

/** Altitude and azimuth of the Sun for a Julian Day (UT) and a place. */
export function horizontalPosition(
  jd: number,
  latDeg: number,
  lonDeg: number,
): HorizontalPosition {
  const { decDeg } = solarPosition(jd)
  const haDeg = hourAngleDeg(jd, lonDeg)
  return { ...horizontalFromEquatorial(haDeg, decDeg, latDeg), decDeg }
}

/**
 * Altitude and azimuth from hour angle, declination and latitude.
 * Meeus 13.5 and 13.6, with azimuth referred to north rather than south.
 */
export function horizontalFromEquatorial(
  haDeg: number,
  decDeg: number,
  latDeg: number,
): { altDeg: number; azDeg: number; haDeg: number } {
  const sinAlt =
    sinDeg(latDeg) * sinDeg(decDeg) + cosDeg(latDeg) * cosDeg(decDeg) * cosDeg(haDeg)
  const altDeg = asinDeg(Math.min(1, Math.max(-1, sinAlt)))

  // Meeus 13.5 gives azimuth westward from south; +180 refers it to north.
  const azFromSouth = atan2Deg(
    sinDeg(haDeg),
    cosDeg(haDeg) * sinDeg(latDeg) - tanDeg(decDeg) * cosDeg(latDeg),
  )
  return { altDeg, azDeg: normaliseDeg(azFromSouth + 180), haDeg }
}

/**
 * Altitude of the Sun at culmination, degrees, for a latitude and declination.
 * The closed form: 90° minus the angular distance between them. Exceeds 90° for
 * no latitude — a value of exactly 90 is the zero shadow condition.
 */
export function culminationAltitudeDeg(latDeg: number, decDeg: number): number {
  return 90 - Math.abs(latDeg - decDeg)
}

/**
 * Zenith distance at culmination, degrees — the angle Eratosthenes measured.
 * Zero when the Sun stands overhead.
 */
export function culminationZenithDeg(latDeg: number, decDeg: number): number {
  return Math.abs(latDeg - decDeg)
}
