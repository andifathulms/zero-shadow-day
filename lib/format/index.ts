/**
 * The display boundary. Angles, times and ratios become strings here and
 * nowhere else, always with a fixed number of digits so tabular figures do not
 * reflow while the date is dragged (CLAUDE.md conventions).
 */

import type { CivilDate } from '@/lib/solar/julian'
import type { Dictionary } from '@/lib/i18n'

export function formatDeg(deg: number, digits = 2): string {
  return `${deg.toFixed(digits)}°`
}

export function formatSignedDeg(deg: number, digits = 2): string {
  return `${deg >= 0 ? '+' : '−'}${Math.abs(deg).toFixed(digits)}°`
}

export function formatRatio(ratio: number, digits = 3): string {
  return ratio.toFixed(digits)
}

export function formatMinutes(minutes: number, digits = 1): string {
  return `${minutes >= 0 ? '+' : '−'}${Math.abs(minutes).toFixed(digits)}`
}

/** Hours since local midnight as HH:MM. */
export function formatClock(localHours: number): string {
  const total = Math.round(localHours * 60)
  return `${pad(Math.floor(total / 60) % 24)}:${pad(((total % 60) + 60) % 60)}`
}

/** Hours since local midnight as HH:MM:SS. */
export function formatClockSeconds(localHours: number): string {
  const total = Math.round(localHours * 3600)
  return `${pad(Math.floor(total / 3600) % 24)}:${pad(Math.floor(total / 60) % 60)}:${pad(total % 60)}`
}

export function formatDate(date: CivilDate, dictionary: Dictionary): string {
  return `${date.day} ${dictionary.months[date.month - 1]} ${date.year}`
}

export function formatDateShort(date: CivilDate, dictionary: Dictionary): string {
  return `${date.day} ${(dictionary.months[date.month - 1] ?? '').slice(0, 3)}`
}

/** A duration in seconds as "2 menit 6 detik" / "2 minutes 6 seconds". */
export function formatDuration(seconds: number, dictionary: Dictionary): string {
  const whole = Math.round(seconds)
  const minutes = Math.floor(whole / 60)
  const rest = whole % 60
  if (minutes === 0) return `${rest} ${dictionary.units.seconds}`
  return `${minutes} ${dictionary.units.minutes} ${rest} ${dictionary.units.seconds}`
}

/** Latitude as 6.21° S, longitude as 106.85° E — the reading a chart uses. */
export function formatLatitude(latDeg: number, locale: 'id' | 'en'): string {
  const hemisphere = latDeg >= 0 ? (locale === 'id' ? 'LU' : 'N') : locale === 'id' ? 'LS' : 'S'
  return `${Math.abs(latDeg).toFixed(4)}° ${hemisphere}`
}

export function formatLongitude(lonDeg: number, locale: 'id' | 'en'): string {
  const hemisphere = lonDeg >= 0 ? (locale === 'id' ? 'BT' : 'E') : locale === 'id' ? 'BB' : 'W'
  return `${Math.abs(lonDeg).toFixed(4)}° ${hemisphere}`
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}
