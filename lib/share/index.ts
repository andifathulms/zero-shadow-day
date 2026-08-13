/**
 * Sharing: the whole view encoded in the URL.
 *
 * A place is three numbers and a date is three more, so a link needs nothing
 * but query parameters — no shortener, no server, no stored state. Opening a
 * shared link is a page load and nothing else, which keeps the promise that no
 * coordinate is sent anywhere: the coordinates in the URL are the reader's own,
 * and they travel only where the reader sends them.
 */

import type { CivilDate } from '@/lib/solar/julian'
import { indonesianOffsetForLongitude } from '@/data/cities/indonesia'

export interface SharedView {
  readonly latDeg: number
  readonly lonDeg: number
  readonly offsetHours: number
  readonly label?: string
  readonly date?: CivilDate
  /** Local clock time, hours since midnight. */
  readonly localHours?: number
}

/** Query string for a view. Coordinates are rounded to about a metre. */
export function encodeView(view: SharedView): string {
  const params = new URLSearchParams()
  params.set('lat', view.latDeg.toFixed(5))
  params.set('lon', view.lonDeg.toFixed(5))
  params.set('utc', String(view.offsetHours))
  if (view.label) params.set('n', view.label)
  if (view.date) {
    params.set('d', `${view.date.year}-${pad(view.date.month)}-${pad(view.date.day)}`)
  }
  if (view.localHours !== undefined) params.set('t', view.localHours.toFixed(4))
  return params.toString()
}

/**
 * Read a view from a query string. Every field is validated, and anything
 * malformed is dropped rather than thrown — a mangled link should open the
 * default view, not an error page.
 */
export function decodeView(search: string): SharedView | null {
  const params = new URLSearchParams(search)
  const latDeg = finite(params.get('lat'))
  const lonDeg = finite(params.get('lon'))
  if (latDeg === null || lonDeg === null) return null
  if (Math.abs(latDeg) > 90 || Math.abs(lonDeg) > 180) return null

  const offsetRaw = finite(params.get('utc'))
  const offsetHours =
    offsetRaw !== null && Math.abs(offsetRaw) <= 14
      ? offsetRaw
      : indonesianOffsetForLongitude(lonDeg)

  const label = params.get('n')?.slice(0, 60) ?? undefined
  const localRaw = finite(params.get('t'))

  return {
    latDeg,
    lonDeg,
    offsetHours,
    label: label && label.trim() !== '' ? label : undefined,
    date: parseDate(params.get('d')),
    localHours: localRaw !== null && localRaw >= 0 && localRaw < 24 ? localRaw : undefined,
  }
}

function parseDate(value: string | null): CivilDate | undefined {
  if (!value) return undefined
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return undefined
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined
  if (year < 1800 || year > 2200) return undefined
  return { year, month, day }
}

function finite(value: string | null): number | null {
  if (value === null) return null
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}
