/**
 * Export: the results as files the reader keeps.
 *
 * Everything is generated in the browser from values already computed — no
 * endpoint, no request. A teacher planning next term's lesson wants the two
 * dates in a calendar; a spreadsheet of the year's noons is the other thing
 * people ask for.
 *
 * Pure string builders. The caller supplies the timestamp, so these stay
 * deterministic and testable.
 */

import type { CivilDate } from '@/lib/solar/julian'
import type { NoonOfYear } from '@/lib/day'
import { roundBearing } from '@/lib/format'
import type { ZeroShadowDay } from '@/lib/zsd'

/** RFC 5545 escaping: backslash, semicolon, comma and newline. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

/**
 * RFC 5545 line folding at 75 octets. Folded on octets rather than characters,
 * because Indonesian place names are UTF-8 and a fold inside a multi-byte
 * sequence would corrupt it.
 */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line)
  if (bytes.length <= 75) return line

  const parts: string[] = []
  let start = 0
  let limit = 75
  while (start < bytes.length) {
    let end = Math.min(start + limit, bytes.length)
    // Never split a UTF-8 continuation byte from its leader.
    while (end > start && end < bytes.length && (bytes[end]! & 0xc0) === 0x80) end -= 1
    parts.push(new TextDecoder().decode(bytes.slice(start, end)))
    start = end
    limit = 74 // continuation lines carry a leading space
  }
  return parts.join('\r\n ')
}

/** A UTC timestamp in iCalendar's basic format, from a local civil time. */
function toUtcStamp(date: CivilDate, localHours: number, offsetHours: number): string {
  const utcMillis =
    Date.UTC(date.year, date.month - 1, date.day) + (localHours - offsetHours) * 3600_000
  const utc = new Date(utcMillis)
  return (
    `${utc.getUTCFullYear()}${pad(utc.getUTCMonth() + 1)}${pad(utc.getUTCDate())}` +
    `T${pad(utc.getUTCHours())}${pad(utc.getUTCMinutes())}${pad(utc.getUTCSeconds())}Z`
  )
}

export interface IcsOptions {
  readonly placeLabel: string
  readonly offsetHours: number
  readonly days: readonly ZeroShadowDay[]
  /** DTSTAMP, in the same basic UTC format. Supplied by the caller. */
  readonly stamp: string
  readonly title: string
  readonly windowNote: string
  readonly siteUrl?: string
}

/**
 * An iCalendar file for the zero shadow days.
 *
 * Times are written in UTC, which sidesteps needing a VTIMEZONE and keeps the
 * promise of no timezone database. Each event spans the *window*, not an
 * instant, and the description says why.
 */
export function buildIcs(options: IcsOptions): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Hari Tanpa Bayangan//Zero Shadow Day//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  for (const day of options.days) {
    const start = day.window ? day.window.startLocalHours : day.localNoonHours - 1 / 60
    const end = day.window ? day.window.endLocalHours : day.localNoonHours + 1 / 60
    const stampedDate = `${day.date.year}${pad(day.date.month)}${pad(day.date.day)}`

    lines.push(
      'BEGIN:VEVENT',
      `UID:zsd-${stampedDate}-${day.date.year}${Math.round(day.minZenithDeg * 10000)}@hari-tanpa-bayangan`,
      `DTSTAMP:${options.stamp}`,
      `DTSTART:${toUtcStamp(day.date, start, options.offsetHours)}`,
      `DTEND:${toUtcStamp(day.date, end, options.offsetHours)}`,
      fold(`SUMMARY:${escapeText(`${options.title} — ${options.placeLabel}`)}`),
      fold(
        `DESCRIPTION:${escapeText(
          `${options.windowNote}\n${formatLocal(day.localNoonHours)} ± ${
            day.window ? Math.round(day.window.durationSeconds / 2) : 60
          }s.`,
        )}`,
      ),
      fold(`LOCATION:${escapeText(options.placeLabel)}`),
      ...(options.siteUrl ? [fold(`URL:${options.siteUrl}`)] : []),
      'END:VEVENT',
    )
  }

  lines.push('END:VCALENDAR')
  // RFC 5545 requires CRLF, and a trailing one.
  return `${lines.join('\r\n')}\r\n`
}

/** A year of culminations as CSV. Comma-separated, one header row, ISO dates. */
export function buildNoonCsv(track: readonly NoonOfYear[], placeLabel: string): string {
  const header = [
    'date',
    'place',
    'solar_noon_local',
    'sun_altitude_deg',
    'declination_deg',
    'shadow_ratio',
    'shadow_bearing_deg',
  ].join(',')

  const rows = track.map((day) =>
    [
      `${day.date.year}-${pad(day.date.month)}-${pad(day.date.day)}`,
      csvField(placeLabel),
      formatLocal(day.localNoonHours),
      day.altDeg.toFixed(4),
      day.decDeg.toFixed(4),
      day.shadowRatio.toFixed(6),
      day.bearingDeg === null ? '' : roundBearing(day.bearingDeg).toFixed(2),
    ].join(','),
  )

  return `${[header, ...rows].join('\n')}\n`
}

/** A field is quoted only when it has to be, and quotes are doubled. */
function csvField(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

function formatLocal(localHours: number): string {
  const total = Math.round(localHours * 3600)
  return `${pad(Math.floor(total / 3600) % 24)}:${pad(Math.floor(total / 60) % 60)}:${pad(total % 60)}`
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/**
 * Hand a generated file to the reader. A blob URL, revoked immediately after —
 * the file never exists anywhere but in the tab.
 */
export function downloadText(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
