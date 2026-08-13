/**
 * Apparent solar position: declination, right ascension, Equation of Time.
 *
 * Algorithm: the NOAA Solar Calculator formulation, which follows Meeus,
 * *Astronomical Algorithms*, 2nd ed., ch. 25 ("Solar Coordinates", low
 * accuracy) with the nutation-in-longitude and aberration terms of ch. 25.9
 * applied to give the *apparent* longitude.
 *
 * Stated accuracy (NOAA, ESRL Global Monitoring Laboratory): declination and
 * Equation of Time are good to roughly 0.01° and better than a minute of time
 * for years 1800–2100, degrading outside that span. That is an order of
 * magnitude better than the half-degree error of the simple sinusoidal
 * declination approximation, which would put a zero shadow day several days
 * wrong while still looking plausible (PRD §6, CLAUDE.md invariant 4).
 *
 * ΔT (TT − UT) is neglected: it is about 70 s in this era, which moves the
 * declination by under 0.0004° — three orders of magnitude below the accuracy
 * claimed anywhere in this app.
 *
 * Pure. No DOM, no clock, no network, no module-level mutable state.
 */

import {
  asinDeg,
  atan2Deg,
  cosDeg,
  normaliseDeg,
  sinDeg,
  tanDeg,
  toDegrees,
  toRadians,
} from './angles'
import { julianCentury } from './julian'

export interface SolarPosition {
  /** Julian Day the position was computed for. */
  readonly jd: number
  /** Apparent declination of the Sun, degrees, north positive. */
  readonly decDeg: number
  /** Apparent right ascension of the Sun, degrees, [0, 360). */
  readonly raDeg: number
  /** Apparent geocentric ecliptic longitude of the Sun, degrees, [0, 360). */
  readonly appLongDeg: number
  /** Equation of Time — apparent solar time minus mean solar time — in minutes. */
  readonly eotMinutes: number
  /** True obliquity of the ecliptic, degrees. */
  readonly obliquityDeg: number
  /** Sun–Earth distance, astronomical units. */
  readonly radiusVectorAu: number
  /** Apparent angular radius of the solar disc, degrees. */
  readonly semiDiameterDeg: number
}

/**
 * Mean angular radius of the solar disc at 1 AU, degrees.
 * 959.63 arcseconds — IAU 1976 value for the solar semi-diameter.
 * This is why "zero" has a width (PRD §6).
 */
export const SOLAR_SEMI_DIAMETER_1AU_DEG = 959.63 / 3600

/** Obliquity of the ecliptic at J2000.0, degrees — the latitude limit of the tropics. */
export const OBLIQUITY_J2000_DEG = 23.4392911

/** Geometric mean longitude of the Sun, degrees. NOAA / Meeus 25.2. */
function geomMeanLongDeg(t: number): number {
  return normaliseDeg(280.46646 + t * (36000.76983 + t * 0.0003032))
}

/** Geometric mean anomaly of the Sun, degrees. NOAA / Meeus 25.3. */
function geomMeanAnomalyDeg(t: number): number {
  return 357.52911 + t * (35999.05029 - 0.0001537 * t)
}

/** Eccentricity of Earth's orbit. NOAA / Meeus 25.4. */
function orbitEccentricity(t: number): number {
  return 0.016708634 - t * (0.000042037 + 0.0000001267 * t)
}

/** Sun's equation of the centre, degrees. NOAA / Meeus ch. 25. */
function equationOfCentreDeg(t: number, mDeg: number): number {
  return (
    sinDeg(mDeg) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    sinDeg(2 * mDeg) * (0.019993 - 0.000101 * t) +
    sinDeg(3 * mDeg) * 0.000289
  )
}

/**
 * Mean obliquity of the ecliptic, degrees. IAU 1980, Meeus 22.2.
 * Corrected to the true obliquity with the principal nutation term.
 */
function meanObliquityDeg(t: number): number {
  const seconds = 21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))
  return 23 + (26 + seconds / 60) / 60
}

/** Longitude of the ascending node of the Moon's mean orbit, degrees. Meeus 25.8. */
function moonAscendingNodeDeg(t: number): number {
  return 125.04 - 1934.136 * t
}

/** Apparent solar position for a Julian Day (UT). */
export function solarPosition(jd: number): SolarPosition {
  const t = julianCentury(jd)

  const l0 = geomMeanLongDeg(t)
  const m = geomMeanAnomalyDeg(t)
  const e = orbitEccentricity(t)
  const c = equationOfCentreDeg(t, m)

  const trueLongDeg = l0 + c
  const trueAnomalyDeg = m + c
  const omega = moonAscendingNodeDeg(t)

  // Apparent longitude: nutation in longitude plus aberration. Meeus 25.9.
  const appLongDeg = normaliseDeg(trueLongDeg - 0.00569 - 0.00478 * sinDeg(omega))

  // True obliquity: mean obliquity plus the principal nutation-in-obliquity term.
  const obliquityDeg = meanObliquityDeg(t) + 0.00256 * cosDeg(omega)

  const decDeg = asinDeg(sinDeg(obliquityDeg) * sinDeg(appLongDeg))
  const raDeg = normaliseDeg(
    atan2Deg(cosDeg(obliquityDeg) * sinDeg(appLongDeg), cosDeg(appLongDeg)),
  )

  // Radius vector, AU. Meeus 25.5.
  const radiusVectorAu =
    (1.000001018 * (1 - e * e)) / (1 + e * cosDeg(trueAnomalyDeg))

  // Equation of Time, minutes. NOAA's form of Meeus 28.3, expanded in varY.
  const varY = tanDeg(obliquityDeg / 2) ** 2
  const eotRadians =
    varY * Math.sin(2 * toRadians(l0)) -
    2 * e * Math.sin(toRadians(m)) +
    4 * e * varY * Math.sin(toRadians(m)) * Math.cos(2 * toRadians(l0)) -
    0.5 * varY * varY * Math.sin(4 * toRadians(l0)) -
    1.25 * e * e * Math.sin(2 * toRadians(m))
  const eotMinutes = 4 * toDegrees(eotRadians)

  return {
    jd,
    decDeg,
    raDeg,
    appLongDeg,
    eotMinutes,
    obliquityDeg,
    radiusVectorAu,
    semiDiameterDeg: SOLAR_SEMI_DIAMETER_1AU_DEG / radiusVectorAu,
  }
}

/** Apparent declination of the Sun, degrees. Convenience over {@link solarPosition}. */
export function declinationDeg(jd: number): number {
  return solarPosition(jd).decDeg
}

/** Equation of Time in minutes. Convenience over {@link solarPosition}. */
export function equationOfTimeMinutes(jd: number): number {
  return solarPosition(jd).eotMinutes
}
