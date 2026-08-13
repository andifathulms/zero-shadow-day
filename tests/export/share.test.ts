import { describe, expect, it } from 'vitest'
import { decodeView, encodeView } from '@/lib/share'
import { buildIcs, buildNoonCsv } from '@/lib/export'
import { formatBearing, roundBearing } from '@/lib/format'
import { noonOfYear } from '@/lib/day'
import { zeroShadowDays } from '@/lib/zsd'

const JAKARTA = { latDeg: -6.2088, lonDeg: 106.8456, offsetHours: 7 }

describe('a shared link round-trips', () => {
  it('carries place, date and time', () => {
    const view = {
      latDeg: -6.2088,
      lonDeg: 106.8456,
      offsetHours: 7,
      label: 'Jakarta',
      date: { year: 2026, month: 3, day: 5 },
      localHours: 12.0625,
    }
    const decoded = decodeView(encodeView(view))
    expect(decoded?.latDeg).toBeCloseTo(view.latDeg, 5)
    expect(decoded?.lonDeg).toBeCloseTo(view.lonDeg, 5)
    expect(decoded?.offsetHours).toBe(7)
    expect(decoded?.label).toBe('Jakarta')
    expect(decoded?.date).toEqual(view.date)
    expect(decoded?.localHours).toBeCloseTo(12.0625, 4)
  })

  it('keeps coordinates to about a metre', () => {
    const encoded = encodeView({ latDeg: -6.20881234, lonDeg: 106.84561234, offsetHours: 7 })
    expect(encoded).toContain('lat=-6.20881')
    expect(encoded).toContain('lon=106.84561')
  })

  it('infers the Indonesian zone when the link omits it', () => {
    expect(decodeView('lat=-5.1477&lon=119.4327')?.offsetHours).toBe(8)
    expect(decodeView('lat=-2.5333&lon=140.7167')?.offsetHours).toBe(9)
  })
})

describe('a mangled link opens the default view rather than an error', () => {
  const rejected = ['', 'lat=abc&lon=xyz', 'lat=999&lon=0', 'lat=0&lon=400', 'n=Jakarta']
  for (const search of rejected) {
    it(`rejects "${search}"`, () => {
      expect(decodeView(search)).toBeNull()
    })
  }

  it('drops only the bad fields when the coordinates are sound', () => {
    const decoded = decodeView('lat=0&lon=110&d=not-a-date&t=99&utc=50')
    expect(decoded).not.toBeNull()
    expect(decoded?.date).toBeUndefined()
    expect(decoded?.localHours).toBeUndefined()
    // An absurd offset falls back to the zone the longitude implies.
    expect(decoded?.offsetHours).toBe(7)
  })

  it('bounds the label, so a link cannot inject a wall of text', () => {
    const decoded = decodeView(`lat=0&lon=110&n=${'x'.repeat(500)}`)
    expect(decoded?.label?.length).toBe(60)
  })
})

describe('the calendar file', () => {
  const result = zeroShadowDays(JAKARTA, 2026)
  if (result.type !== 'zero-shadow-days') throw new Error('unreachable')

  const ics = buildIcs({
    placeLabel: 'Jakarta',
    offsetHours: 7,
    days: result.days,
    stamp: '20260813T000000Z',
    title: 'Hari Tanpa Bayangan',
    windowNote: 'Bayangan tidak benar-benar nol — matahari punya lebar; ada jendela beberapa menit.',
    siteUrl: 'https://example.test/zero-shadow-day/',
  })

  it('is a well-formed calendar with one event per day', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2)
    expect(ics.match(/END:VEVENT/g)).toHaveLength(2)
  })

  it('uses CRLF throughout, as RFC 5545 requires', () => {
    expect(ics.split('\r\n').length).toBeGreaterThan(10)
    expect(/[^\r]\n/.test(ics)).toBe(false)
  })

  it('writes times in UTC, so no timezone database is needed', () => {
    const starts = [...ics.matchAll(/DTSTART:(\d{8}T\d{6}Z)/g)].map((match) => match[1]!)
    expect(starts).toHaveLength(2)
    for (const start of starts) expect(start.endsWith('Z')).toBe(true)
    // Jakarta culminates near midday local, which is early morning UTC.
    expect(starts[0]!.slice(9, 11)).toMatch(/^0[45]$/)
  })

  it('spans the window rather than an instant, and says why', () => {
    const start = /DTSTART:(\d{8}T\d{6})Z/.exec(ics)![1]!
    const end = /DTEND:(\d{8}T\d{6})Z/.exec(ics)![1]!
    const seconds = (stamp: string) =>
      Number(stamp.slice(9, 11)) * 3600 + Number(stamp.slice(11, 13)) * 60 + Number(stamp.slice(13, 15))
    const duration = seconds(end) - seconds(start)
    expect(duration).toBeGreaterThan(60)
    expect(duration).toBeLessThan(300)
    expect(ics).toContain('matahari punya lebar')
  })

  it('escapes the characters RFC 5545 reserves', () => {
    const escaped = buildIcs({
      placeLabel: 'Semarang, Jawa Tengah; pusat',
      offsetHours: 7,
      days: result.days.slice(0, 1),
      stamp: '20260813T000000Z',
      title: 'Test',
      windowNote: 'satu\ndua',
      siteUrl: undefined,
    })
    expect(escaped).toContain('Semarang\\, Jawa Tengah\\; pusat')
    expect(escaped).toContain('satu\\ndua')
  })

  it('folds long lines without splitting a UTF-8 sequence', () => {
    const folded = buildIcs({
      placeLabel: 'Kabupaten Manggarai Barat — Labuan Bajo — Nusa Tenggara Timur — Indonesia',
      offsetHours: 8,
      days: result.days.slice(0, 1),
      stamp: '20260813T000000Z',
      title: 'Hari Tanpa Bayangan',
      windowNote: 'x',
    })
    for (const line of folded.split('\r\n')) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
    }
    // The em dashes survive the fold intact.
    expect(folded.replace(/\r\n /g, '')).toContain('Labuan Bajo — Nusa Tenggara Timur')
  })
})

describe('the spreadsheet', () => {
  const csv = buildNoonCsv(noonOfYear(JAKARTA, 2026), 'Jakarta')

  it('has a header and a row for every day', () => {
    const lines = csv.trim().split('\n')
    expect(lines[0]).toContain('solar_noon_local')
    expect(lines).toHaveLength(366)
  })

  it('quotes only fields that need it', () => {
    expect(buildNoonCsv(noonOfYear(JAKARTA, 2026).slice(0, 1), 'Jakarta')).toContain(',Jakarta,')
    expect(buildNoonCsv(noonOfYear(JAKARTA, 2026).slice(0, 1), 'Semarang, Jawa Tengah')).toContain(
      '"Semarang, Jawa Tengah"',
    )
  })

  it('is deterministic', () => {
    expect(buildNoonCsv(noonOfYear(JAKARTA, 2026), 'Jakarta')).toBe(csv)
  })
})

describe('a bearing never reads 360°', () => {
  it('rounds before wrapping, so due north prints as zero', () => {
    // A shadow falling due north computes as 359.9999°.
    expect(formatBearing(359.9999)).toBe('0.0°')
    expect(roundBearing(359.9999)).toBe(0)
    expect(formatBearing(359.94)).toBe('359.9°')
    expect(formatBearing(0)).toBe('0.0°')
    expect(formatBearing(178.34)).toBe('178.3°')
  })

  it('the exported year of noons has no 360 in it', () => {
    const csv = buildNoonCsv(noonOfYear(JAKARTA, 2026), 'Jakarta')
    expect(csv).not.toMatch(/,360\.00\n/)
    expect(csv).toMatch(/,0\.00\n/)
  })
})
