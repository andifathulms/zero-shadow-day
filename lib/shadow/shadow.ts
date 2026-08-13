/**
 * Shadow geometry: length and bearing of a vertical gnomon's shadow from the
 * Sun's altitude and azimuth.
 *
 * This module deliberately shares no code with `lib/solar` — not even its
 * trigonometry helpers (CLAUDE.md invariant 8). The two are derived
 * independently so their tests cannot validate each other's errors.
 *
 * The geometry, and nothing more:
 *
 *   length = height / tan(altitude)          the shadow of a vertical stick
 *   bearing = azimuth + 180°                 a shadow falls away from the Sun
 *
 * Pure. No DOM, no clock, no network.
 */

const RADIANS_PER_DEGREE = Math.PI / 180

/** Shadow of a vertical gnomon, expressed as a ratio to the gnomon's height. */
export interface Shadow {
  readonly type: 'shadow'
  /** Shadow length divided by gnomon height. */
  readonly lengthRatio: number
  /** Direction the shadow points, degrees clockwise from true north. */
  readonly bearingDeg: number
  /** Altitude of the Sun that produced it, degrees. */
  readonly altDeg: number
}

/** The Sun stands exactly overhead: the shadow has length zero and no direction. */
export interface ZenithShadow {
  readonly type: 'zenith'
  readonly lengthRatio: 0
  readonly altDeg: 90
}

/** No Sun above the horizon, so no shadow at all. */
export interface NoShadow {
  readonly type: 'no-shadow'
  readonly reason: 'sun-below-horizon'
  readonly altDeg: number
}

export type ShadowResult = Shadow | ZenithShadow | NoShadow

/**
 * Shadow cast by a vertical gnomon.
 *
 * At an altitude of exactly 90° the shadow is a point and its direction is
 * undefined — hence a distinct variant rather than an arbitrary bearing. At or
 * below the horizon there is no shadow to speak of; the length would diverge.
 */
export function shadowFromSun(altDeg: number, azDeg: number): ShadowResult {
  if (altDeg >= 90) return { type: 'zenith', lengthRatio: 0, altDeg: 90 }
  if (altDeg <= 0) return { type: 'no-shadow', reason: 'sun-below-horizon', altDeg }
  return {
    type: 'shadow',
    lengthRatio: shadowLengthRatio(altDeg),
    bearingDeg: shadowBearingDeg(azDeg),
    altDeg,
  }
}

/**
 * Shadow length as a ratio to gnomon height: the cotangent of the Sun's
 * altitude. Equivalently the tangent of its zenith distance.
 */
export function shadowLengthRatio(altDeg: number): number {
  return 1 / Math.tan(altDeg * RADIANS_PER_DEGREE)
}

/** Shadow length ratio from the Sun's zenith distance — the Eratosthenes form. */
export function shadowLengthRatioFromZenith(zenithDeg: number): number {
  return Math.tan(zenithDeg * RADIANS_PER_DEGREE)
}

/** Zenith distance of the Sun implied by a measured shadow ratio, degrees. */
export function zenithFromShadowRatio(lengthRatio: number): number {
  return Math.atan(lengthRatio) / RADIANS_PER_DEGREE
}

/** The shadow points directly away from the Sun. */
export function shadowBearingDeg(azDeg: number): number {
  const bearing = (azDeg + 180) % 360
  return bearing < 0 ? bearing + 360 : bearing
}

/** Shadow length in the same unit as the gnomon height. */
export function shadowLength(altDeg: number, gnomonHeight: number): number {
  return shadowLengthRatio(altDeg) * gnomonHeight
}

/**
 * Shadow tip in ground coordinates, metres east and north of the gnomon's foot,
 * for a gnomon of the given height. The trace of this point over a day is the
 * hyperbola of PRD §5.3.
 */
export function shadowTip(
  altDeg: number,
  azDeg: number,
  gnomonHeight = 1,
): { east: number; north: number } | null {
  if (altDeg <= 0) return null
  const length = shadowLength(altDeg, gnomonHeight)
  const bearing = shadowBearingDeg(azDeg) * RADIANS_PER_DEGREE
  return { east: length * Math.sin(bearing), north: length * Math.cos(bearing) }
}

/** Compass point of a bearing, in Indonesian. Display helper. */
export function compassPointId(bearingDeg: number): string {
  const points = ['utara', 'timur laut', 'timur', 'tenggara', 'selatan', 'barat daya', 'barat', 'barat laut']
  const index = Math.round(((bearingDeg % 360) + 360) % 360 / 45) % 8
  return points[index] ?? 'utara'
}
