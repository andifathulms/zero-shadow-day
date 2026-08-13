/**
 * Degree/radian helpers. Every angle crossing a module boundary is in degrees
 * and named `*Deg`; radians exist only inside a computation (CLAUDE.md §11).
 */

export const DEG = Math.PI / 180

export function toRadians(deg: number): number {
  return deg * DEG
}

export function toDegrees(rad: number): number {
  return rad / DEG
}

/** Normalise to [0, 360). */
export function normaliseDeg(deg: number): number {
  const wrapped = deg % 360
  return wrapped < 0 ? wrapped + 360 : wrapped
}

/** Normalise to (-180, 180]. */
export function normaliseSignedDeg(deg: number): number {
  const wrapped = normaliseDeg(deg)
  return wrapped > 180 ? wrapped - 360 : wrapped
}

export const sinDeg = (deg: number): number => Math.sin(deg * DEG)
export const cosDeg = (deg: number): number => Math.cos(deg * DEG)
export const tanDeg = (deg: number): number => Math.tan(deg * DEG)
export const asinDeg = (x: number): number => Math.asin(x) / DEG
export const acosDeg = (x: number): number => Math.acos(x) / DEG
export const atan2Deg = (y: number, x: number): number => Math.atan2(y, x) / DEG
