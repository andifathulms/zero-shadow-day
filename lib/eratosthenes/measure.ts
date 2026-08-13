/**
 * `lib/eratosthenes` — the circumference of the Earth from two shadows.
 *
 * Eratosthenes knew the sun stood overhead at Syene and measured the shadow
 * angle at Alexandria on the same day. Two sticks, one ruler, and the size of
 * the planet.
 *
 * The arithmetic:
 *
 *   z      = atan(shadow / height)          zenith angle at each place
 *   s      = ±z                             signed by which way the shadow fell
 *   Δφ     = sA − sB                        the latitude separation, measured
 *   C      = 360° / Δφ × distance           the circumference
 *
 * The sign matters and is measurable: a shadow falling north means the sun is
 * south of you, so you are north of the subsolar latitude. With both shadows
 * signed this way the method works wherever the two observers stand, including
 * on opposite sides of the subsolar point, where the angles add rather than
 * subtract.
 *
 * The distance is an *input*, not something this app derives — Eratosthenes
 * had it from surveyors. Pre-filling it from coordinates would silently assume
 * the very radius being measured, and the result carries a note saying so.
 */

import { culminationZenithDeg, horizontalPosition } from '@/lib/solar/altitude'
import type { CivilDate } from '@/lib/solar/julian'
import { julianDay } from '@/lib/solar/julian'
import { solarNoon } from '@/lib/solar/noon'
import { shadowFromSun, shadowLengthRatioFromZenith, zenithFromShadowRatio } from '@/lib/shadow'
import type { Place } from '@/lib/zsd'

/** Mean Earth radius, IUGG: 6371.0088 km. What the measurement is compared against. */
export const ACCEPTED_RADIUS_KM = 6371.0088
export const ACCEPTED_CIRCUMFERENCE_KM = 2 * Math.PI * ACCEPTED_RADIUS_KM

/** One schoolyard measurement. Everything here is something a ruler can give. */
export interface Observation {
  readonly label: string
  readonly latDeg: number
  readonly lonDeg: number
  /** Height of the stick, any unit, so long as both are the same. */
  readonly gnomonHeight: number
  /** Length of its shadow at culmination, in that same unit. */
  readonly shadowLength: number
  /** Which way the shadow fell. Undefined only when there is no shadow at all. */
  readonly pointsNorth: boolean
}

export interface EratosthenesMeasurement {
  readonly type: 'measurement'
  readonly zenithADeg: number
  readonly zenithBDeg: number
  /** Zenith angles signed by shadow direction; their difference is the separation. */
  readonly signedADeg: number
  readonly signedBDeg: number
  /** The latitude separation as *measured* by the two shadows. */
  readonly separationDeg: number
  /** The separation implied by the two latitudes, for comparison. */
  readonly trueSeparationDeg: number
  readonly distanceKm: number
  readonly circumferenceKm: number
  readonly radiusKm: number
  readonly acceptedCircumferenceKm: number
  readonly errorKm: number
  readonly errorPercent: number
  /** How much the circumference moves per arcminute of angle error. */
  readonly kmPerArcminute: number
  /** Longitude difference between the two places; the method assumes zero. */
  readonly lonGapDeg: number
  /** Error in the measured angle itself, degrees. */
  readonly angleErrorDeg: number
}

/** Too little separation to divide by: the method has nothing to work with. */
export interface EratosthenesDegenerate {
  readonly type: 'insufficient-separation'
  readonly separationDeg: number
  /** Below this the division amplifies measurement error past any usefulness. */
  readonly minimumDeg: number
}

export type EratosthenesResult = EratosthenesMeasurement | EratosthenesDegenerate

/** Below a degree of separation, a millimetre of ruler error swamps the answer. */
export const MINIMUM_SEPARATION_DEG = 1

/** Zenith angle of an observation, from the ruler alone. */
export function zenithAngleDeg(observation: Observation): number {
  return zenithFromShadowRatio(observation.shadowLength / observation.gnomonHeight)
}

/** The zenith angle signed by which way the shadow fell. */
export function signedZenithDeg(observation: Observation): number {
  const zenith = zenithAngleDeg(observation)
  return observation.pointsNorth ? zenith : -zenith
}

/**
 * Derive the circumference from two observations and a known ground distance.
 * `distanceKm` is the surveyed distance between the two places.
 */
export function measureEarth(
  a: Observation,
  b: Observation,
  distanceKm: number,
): EratosthenesResult {
  const signedADeg = signedZenithDeg(a)
  const signedBDeg = signedZenithDeg(b)
  const separationDeg = Math.abs(signedADeg - signedBDeg)

  if (separationDeg < MINIMUM_SEPARATION_DEG) {
    return {
      type: 'insufficient-separation',
      separationDeg,
      minimumDeg: MINIMUM_SEPARATION_DEG,
    }
  }

  const circumferenceKm = (360 / separationDeg) * distanceKm
  const radiusKm = circumferenceKm / (2 * Math.PI)
  const trueSeparationDeg = Math.abs(a.latDeg - b.latDeg)

  return {
    type: 'measurement',
    zenithADeg: zenithAngleDeg(a),
    zenithBDeg: zenithAngleDeg(b),
    signedADeg,
    signedBDeg,
    separationDeg,
    trueSeparationDeg,
    distanceKm,
    circumferenceKm,
    radiusKm,
    acceptedCircumferenceKm: ACCEPTED_CIRCUMFERENCE_KM,
    errorKm: circumferenceKm - ACCEPTED_CIRCUMFERENCE_KM,
    errorPercent:
      ((circumferenceKm - ACCEPTED_CIRCUMFERENCE_KM) / ACCEPTED_CIRCUMFERENCE_KM) * 100,
    // dC/dΔφ = −C/Δφ, so this is what one arcminute of angle error costs.
    kmPerArcminute: circumferenceKm / (separationDeg * 60),
    lonGapDeg: Math.abs(a.lonDeg - b.lonDeg),
    angleErrorDeg: separationDeg - trueSeparationDeg,
  }
}

/**
 * The measurement the model says a perfect observer would make at culmination
 * on a given date: what to expect before going outside, and the generator for
 * the round-trip test.
 */
export function syntheticObservation(
  place: Place,
  date: CivilDate,
  label: string,
  gnomonHeight = 1,
): Observation {
  const noon = solarNoon(julianDay(date), place.lonDeg, place.offsetHours)
  const { altDeg, azDeg, decDeg } = horizontalPosition(noon.jd, place.latDeg, place.lonDeg)
  const shadow = shadowFromSun(altDeg, azDeg)

  return {
    label,
    latDeg: place.latDeg,
    lonDeg: place.lonDeg,
    gnomonHeight,
    shadowLength:
      gnomonHeight * shadowLengthRatioFromZenith(culminationZenithDeg(place.latDeg, decDeg)),
    // North of the subsolar latitude, the sun is to the south and the shadow
    // falls north. At the zenith the direction is moot and the length is zero.
    pointsNorth: shadow.type === 'shadow' ? shadow.bearingDeg < 90 || shadow.bearingDeg > 270 : true,
  }
}

/**
 * Distance along the meridian between two latitudes for a given Earth radius.
 * Used to *generate* a synthetic pair — never to derive an answer, which would
 * assume the radius being measured.
 */
export function meridianDistanceKm(latADeg: number, latBDeg: number, radiusKm: number): number {
  return (Math.abs(latADeg - latBDeg) * Math.PI * radiusKm) / 180
}

export interface PartnerSuggestion {
  readonly separationDeg: number
  readonly meridianDistanceKm: number
  readonly lonGapDeg: number
  /** Larger separation and smaller longitude gap make a better pair. */
  readonly quality: number
}

/**
 * How good a pairing two places make: separation in latitude is what the
 * method divides by, and any longitude gap is error the method cannot see.
 */
export function ratePartner(a: Place, b: Place): PartnerSuggestion {
  const separationDeg = Math.abs(a.latDeg - b.latDeg)
  const lonGapDeg = Math.abs(a.lonDeg - b.lonDeg)
  return {
    separationDeg,
    meridianDistanceKm: meridianDistanceKm(a.latDeg, b.latDeg, ACCEPTED_RADIUS_KM),
    lonGapDeg,
    quality: separationDeg - lonGapDeg / 8,
  }
}
