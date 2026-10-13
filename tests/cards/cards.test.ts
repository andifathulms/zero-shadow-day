import { describe, expect, it } from 'vitest'
import { parseDeck, registerVariant, hasVariant, validateVariant } from 'carousel-core/parse'
import { type City, INDONESIAN_CITIES } from '@/data/cities/indonesia'
import { instantAt, noonOfYear } from '@/lib/day'
import { measureEarth, ratePartner, syntheticObservation } from '@/lib/eratosthenes'
import { formatClock, formatClockSeconds } from '@/lib/format'
import { MINUTES_PER_DAY } from '@/lib/solar/noon'
import { getDictionary } from '@/lib/i18n'
import { type CivilDate, civilFromJulianDay, julianDay } from '@/lib/solar/julian'
import { daysBetween, nextZeroShadowDay, zeroShadowDays } from '@/lib/zsd'
import {
  CAPTION_MAX,
  CARD_KINDS,
  CAVEAT,
  type CardKind,
  EYE_SAFETY,
  TENGAH_HARI,
  TITLE_MAX,
  buildDeck,
  cityForPlace,
} from '@/lib/cards'

/**
 * The decks are only as trustworthy as the rule that no number in them is
 * typed. These tests rebuild the numbers a deck may contain straight from the
 * engine — lib/zsd, lib/day, lib/eratosthenes — without going through
 * lib/cards, and fail on any token the engine did not produce.
 */

const city = (name: string): City => {
  const found = INDONESIAN_CITIES.find((c) => c.name === name)
  if (!found) throw new Error(name)
  return found
}

/** Written for a fixed day: Tuesday 13 October 2026, two days before Denpasar's. */
const TODAY: CivilDate = { year: 2026, month: 10, day: 13 }
/** A week in December, when no listed city has its day. */
const QUIET: CivilDate = { year: 2026, month: 12, day: 1 }
/** The first week of March, when Java has its days one after another. */
const BUSY: CivilDate = { year: 2027, month: 3, day: 1 }

const CITIES = ['Denpasar', 'Jakarta', 'Kupang', 'Medan', 'Jayapura', 'Sabang'].map(city)
const CHALLENGE_KINDS: readonly CardKind[] = ['cek-kotamu', 'cluster-hari-ini', 'kota-terakhir', 'ukur-bumi']

const requests = [TODAY, QUIET, BUSY].flatMap((today) =>
  CARD_KINDS.flatMap((kind) => CITIES.map((c) => ({ kind, city: c, today }))),
)
const decks = requests.map((request) => ({ request, deck: buildDeck(request) }))

// ── The numbers the engine produced, by what they measure ───────────────────

const MONTHS = getDictionary('id').months
const decimal = (value: number, digits = 1): string => value.toFixed(digits).replace('.', ',')
const longDate = (d: CivilDate): string => `${d.day} ${MONTHS[d.month - 1]} ${d.year}`
const shortDate = (d: CivilDate): string => `${d.day} ${MONTHS[d.month - 1]?.slice(0, 3)}`

interface EngineFacts {
  readonly dates: Set<string>
  readonly shortDates: Set<string>
  readonly times: Set<string>
  readonly timesSeconds: Set<string>
  readonly mm: Set<string>
  readonly cm: Set<string>
  readonly decimalMinutes: Set<string>
  readonly seconds: Set<string>
  readonly days: Set<string>
  readonly cities: Set<string>
  readonly km: Set<string>
  readonly minutes: Set<string>
}

function engineFacts(today: CivilDate): EngineFacts {
  const f: EngineFacts = {
    dates: new Set(), shortDates: new Set(), times: new Set(), timesSeconds: new Set(), mm: new Set(),
    cm: new Set(), decimalMinutes: new Set(), seconds: new Set(), days: new Set(), cities: new Set(),
    km: new Set(), minutes: new Set(),
  }
  const years = [today.year, today.year + 1, today.year + 2]
  const date = (d: CivilDate): void => {
    f.dates.add(longDate(d))
    f.shortDates.add(shortDate(d))
  }
  date(today)
  const { year, month, day } = civilFromJulianDay(julianDay(today) + 6)
  date({ year, month, day })

  const offsets: number[] = []
  for (const c of INDONESIAN_CITIES) {
    for (const y of years) {
      const result = zeroShadowDays(c, y)
      if (result.type !== 'zero-shadow-days') continue
      for (const d of result.days) {
        date(d.date)
        offsets.push(daysBetween(today, d.date))
        f.times.add(formatClock(d.localNoonHours))
        f.timesSeconds.add(formatClockSeconds(d.localNoonHours))
        const mm = d.minShadowRatio * 1000
        f.mm.add(decimal(mm, mm < 0.05 ? 2 : 1))
        for (const minutes of [-5, 5]) f.times.add(formatClock(d.localNoonHours + minutes / 60))
        const after = instantAt(c, d.date, d.localNoonHours + 5 / 60).shadow
        if (after.type === 'shadow') f.cm.add(decimal(after.lengthRatio * 100))
        if (d.window) {
          f.timesSeconds.add(formatClockSeconds(d.window.startLocalHours))
          f.timesSeconds.add(formatClockSeconds(d.window.endLocalHours))
          f.seconds.add(String(Math.round(d.window.durationSeconds)))
        }
      }
    }
    // A year of culminations from today: the noon table and the annual extremes.
    const run = [...noonOfYear(c, today.year), ...noonOfYear(c, today.year + 1)].filter((n) => {
      const offset = daysBetween(today, n.date)
      return offset >= 0 && offset < 365
    })
    for (const n of run) f.times.add(formatClock(n.localNoonHours))
    const earliest = run.reduce((a, b) => (b.localNoonHours < a.localNoonHours ? b : a))
    const latest = run.reduce((a, b) => (b.localNoonHours > a.localNoonHours ? b : a))
    for (const n of [earliest, latest]) {
      date(n.date)
      f.timesSeconds.add(formatClockSeconds(n.localNoonHours))
    }
    f.decimalMinutes.add(decimal((latest.localNoonHours - earliest.localNoonHours) * 60))
  }

  // Eratosthenes: each city as host on its next day, every other city as partner.
  for (const host of INDONESIAN_CITIES) {
    const next = nextZeroShadowDay(host, today)
    if (next.type !== 'next') continue
    const hostObservation = syntheticObservation(host, next.day.date, host.name, 100)
    for (const partner of INDONESIAN_CITIES) {
      if (partner.name === host.name) continue
      const observation = syntheticObservation(partner, next.day.date, partner.name, 100)
      f.cm.add(decimal(observation.shadowLength))
      const measured = measureEarth(hostObservation, observation, ratePartner(host, partner).meridianDistanceKm)
      if (measured.type === 'measurement') f.km.add(String(Math.round(measured.kmPerArcminute)))
    }
  }

  // Days until a date, gaps between consecutive dates, and how many cities share a span.
  const sorted = offsets.filter((d) => d >= 0).sort((a, b) => a - b)
  for (const d of sorted) f.days.add(String(d))
  for (let i = 0; i + 1 < sorted.length; i += 1) f.days.add(String(sorted[i + 1]! - sorted[i]!))
  for (let span = 0; span < 7; span += 1) f.cities.add(String(sorted.filter((d) => d <= span).length))
  for (const d of new Set(sorted)) f.cities.add(String(sorted.filter((x) => x === d).length))
  f.cities.add(String(INDONESIAN_CITIES.length))

  // Minutes of clock per degree of longitude: the engine's own day over a full circle.
  f.minutes.add(String(MINUTES_PER_DAY / 360))
  return f
}

const factsCache = new Map<string, EngineFacts>()
function factsFor(today: CivilDate): EngineFacts {
  const key = `${today.year}-${today.month}-${today.day}`
  const cached = factsCache.get(key)
  if (cached) return cached
  const facts = engineFacts(today)
  factsCache.set(key, facts)
  return facts
}

/**
 * Numbers that are copy, not data: the caveat's "±1", the one-metre stick, the
 * myth "pukul 12:00", the title "Jam 12", the 360° of a full circle. Removed
 * first, as whole phrases, so a bare "1" or "12" elsewhere still has to be data.
 */
const COPY_PHRASES = ['±1 hari', '±1 menit', 'tongkat 1 meter', 'pukul 12:00', 'Jam 12', '360°']

/** Table pages, "(1/2)": structure, checked in the grammar tests. */
const PAGE = /\((\d+)\/(\d+)\)/g

const MONTH_NAMES = MONTHS.join('|')
const SHORT_MONTHS = MONTHS.map((m) => m.slice(0, 3)).join('|')
const WEEKDAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

/**
 * Every number in `text`, each checked against the engine values of its own
 * kind — a duration against window lengths, a time against culminations, a
 * date against zero shadow days. Returns what is left over: numbers the
 * engine did not produce.
 */
function strayNumbers(text: string, f: EngineFacts): string[] {
  const strays: string[] = []
  let rest = text.replace(PAGE, ' ')
  for (const phrase of COPY_PHRASES) {
    rest = rest.replace(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ')
  }

  const take = (pattern: RegExp, allowed: Set<string>, key: (m: RegExpExecArray) => string): void => {
    rest = rest.replace(pattern, (...args) => {
      const match = args.slice(0, -2) as unknown as RegExpExecArray
      const value = key(match)
      if (!allowed.has(value)) strays.push(match[0])
      return ' '
    })
  }
  take(new RegExp(`\\b(\\d{1,2}) (${MONTH_NAMES}) (\\d{4})\\b`, 'g'), f.dates, (m) => `${m[1]} ${m[2]} ${m[3]}`)
  take(new RegExp(`\\b(\\d{1,2}) (${SHORT_MONTHS})\\b`, 'g'), f.shortDates, (m) => `${m[1]} ${m[2]}`)
  take(/\b\d{2}:\d{2}:\d{2}\b/g, f.timesSeconds, (m) => m[0])
  take(/\b\d{2}:\d{2}\b/g, f.times, (m) => m[0])
  take(/\b(\d+,\d+) mm\b/g, f.mm, (m) => m[1] ?? '')
  take(/\b(\d+,\d+) cm\b/g, f.cm, (m) => m[1] ?? '')
  take(/\b(\d+,\d+) menit\b/g, f.decimalMinutes, (m) => m[1] ?? '')
  take(/\b(\d+) detik\b/g, f.seconds, (m) => m[1] ?? '')
  take(/\b(\d+) hari\b/g, f.days, (m) => m[1] ?? '')
  take(/\b(\d+) kota\b/g, f.cities, (m) => m[1] ?? '')
  take(/\b(\d+) km\b/g, f.km, (m) => m[1] ?? '')
  take(/\b(\d+) menit\b/g, f.minutes, (m) => m[1] ?? '')
  strays.push(...(rest.match(/\d+(?:[.,:]\d+)*/g) ?? []))
  return strays
}

if (!hasVariant(TENGAH_HARI.id)) registerVariant(TENGAH_HARI)

// ── Tests ────────────────────────────────────────────────────────────────────

describe('every number in a deck is the engine’s', () => {
  it.each(decks.map(({ request, deck }) => [`${request.kind} ${request.city.name} ${request.today.month}/${request.today.year}`, request, deck] as const))(
    '%s',
    (_label, request, deck) => {
      const text = `${deck.text}\n${deck.title}\n${deck.caption}`
      expect(strayNumbers(text, factsFor(request.today))).toEqual([])
    },
    20_000,
  )

  it('rejects a typed number, whatever it is next to', () => {
    const f = factsFor(TODAY)
    for (const typed of [
      'Sekitar 240 SM, Eratosthenes mengukur.',
      'Jendela 999 detik.',
      'Kulminasi 12:34:56 WITA.',
      'Keliling 40.075 km.',
      'Tongkat 1 meter berbayang 7,7 mm.',
      'Rabu, 31 Februari 2027.',
    ]) {
      expect(strayNumbers(typed, f), typed).not.toEqual([])
    }
    expect(strayNumbers('Tanggal ±1 hari, Tongkat 1 meter, 360° ÷ sudut, pukul 12:00.', f)).toEqual([])
  })

  it('names the right weekday for every date', () => {
    const weekdayDate = new RegExp(`\\b(${WEEKDAY_NAMES.join('|')}), (\\d{1,2}) (${MONTH_NAMES}) (\\d{4})\\b`, 'g')
    let checked = 0
    for (const { deck } of decks) {
      for (const m of deck.text.matchAll(weekdayDate)) {
        const [, name, d, month, y] = m
        // An independent clock: the test may use Date; the numerical core may not.
        const weekday = new Date(Date.UTC(Number(y), MONTHS.indexOf(month ?? ''), Number(d))).getUTCDay()
        expect(WEEKDAY_NAMES[weekday], m[0]).toBe(name)
        checked += 1
      }
    }
    expect(checked).toBeGreaterThan(50)
  })

  it('states the exact culmination, window and residual for the city', () => {
    const denpasar = city('Denpasar')
    const deck = buildDeck({ kind: 'cek-kotamu', city: denpasar, today: TODAY })
    const next = nextZeroShadowDay(denpasar, TODAY)
    if (next.type !== 'next' || !next.day.window) throw new Error('Denpasar has a window')
    expect(next.day.date).toEqual({ year: 2026, month: 10, day: 15 })
    expect(deck.text).toContain(`*${formatClockSeconds(next.day.localNoonHours)} WITA*`)
    expect(deck.text).toContain(
      `${formatClockSeconds(next.day.window.startLocalHours)}–${formatClockSeconds(next.day.window.endLocalHours)} WITA`,
    )
    expect(deck.text).toContain(`${decimal(next.day.minShadowRatio * 1000)} mm`)
  })

  it('finds Kupang on 20 October as the last city before the gap', () => {
    const deck = buildDeck({ kind: 'kota-terakhir', city: city('Jakarta'), today: TODAY })
    expect(deck.text).toContain('Kupang: kota terakhir')
    expect(deck.text).toContain('*Selasa, 20 Oktober 2026, 11:30 WITA*')
  })

  it('lists the 15 October cluster around Denpasar', () => {
    const deck = buildDeck({ kind: 'cluster-hari-ini', city: city('Denpasar'), today: TODAY })
    for (const name of ['Denpasar', 'Mataram', 'Sumbawa Besar', 'Bima', 'Labuan Bajo', 'Maumere', 'Merauke']) {
      expect(deck.text).toContain(`| ${name} |`)
    }
  })
})

describe('the deck grammar holds', () => {
  it('parses every deck without a warning, under the registered variant', () => {
    for (const { request, deck } of decks) {
      const { deck: parsed, warnings } = parseDeck(deck.text)
      expect(warnings, `${request.kind} ${request.city.name}`).toEqual([])
      expect(parsed.template).toBe(TENGAH_HARI.id)
    }
  })

  it('keeps every table to eight rows and four columns, and numbers split pages', () => {
    let tables = 0
    for (const { deck } of decks) {
      const parsed = parseDeck(deck.text).deck
      for (const s of parsed.slides) {
        if (s.type !== 'table' || !s.table) continue
        tables += 1
        expect(s.table.rows.length).toBeLessThanOrEqual(8)
        expect(s.table.header.length).toBeGreaterThanOrEqual(2)
        expect(s.table.header.length).toBeLessThanOrEqual(4)
        for (const row of s.table.rows) expect(row.length).toBe(s.table.header.length)
      }
      for (const [, page, pages] of deck.text.matchAll(PAGE)) {
        expect(Number(page)).toBeLessThanOrEqual(Number(pages))
      }
    }
    expect(tables).toBeGreaterThan(20)
  })

  it('splits a busy week across slides rather than overfilling one', () => {
    const deck = buildDeck({ kind: 'bayangan-minggu-ini', city: city('Jakarta'), today: BUSY })
    expect(deck.text).toContain('(1/')
    expect(deck.text).toContain('(2/')
  })

  it('puts no cta on table or compare slides; every deck ends on [end]', () => {
    for (const { deck } of decks) {
      const parsed = parseDeck(deck.text).deck
      for (const s of parsed.slides) {
        if (s.type === 'table' || s.type === 'compare') expect(s.attrs.cta).toBeUndefined()
      }
      expect(parsed.slides[parsed.slides.length - 1]?.type).toBe('end')
    }
  })
})

describe('what a deck promises', () => {
  it('always closes with the caveat, on the slides and in the caption', () => {
    for (const { deck } of decks) {
      expect(deck.text).toContain(CAVEAT)
      expect(deck.caption).toContain(CAVEAT)
    }
  })

  it('says "nyaris hilang", never that the shadow is gone', () => {
    for (const { deck } of decks) {
      const all = `${deck.text}\n${deck.caption}`.toLowerCase()
      expect(all).not.toContain('hilang total')
      expect(all).not.toMatch(/bayangan(mu)? hilang(?! )|bayangan(mu)? hilang\b(?<!nyaris hilang)/)
    }
    const cek = decks.find(({ request }) => request.kind === 'cek-kotamu')
    expect(cek?.deck.text).toContain('nyaris hilang')
  })

  it('carries the eye-safety line on every deck that sends people outside', () => {
    for (const { request, deck } of decks) {
      if (CHALLENGE_KINDS.includes(request.kind)) expect(deck.text, request.kind).toContain(EYE_SAFETY)
    }
  })

  it('keeps the TikTok title and caption inside their limits', () => {
    for (const { deck } of decks) {
      expect(deck.title.length).toBeLessThanOrEqual(TITLE_MAX)
      expect(deck.caption.length).toBeLessThanOrEqual(CAPTION_MAX)
    }
  })

  it('is deterministic', () => {
    for (const { request, deck } of decks.slice(0, 14)) expect(buildDeck(request)).toEqual(deck)
  })
})

describe('a deck names a city and never locates it', () => {
  // Two to four decimals: a kilometre and finer. One decimal is ten kilometres,
  // locates nobody, and collides with honest data — Kupang's 10.2° S reads the
  // same as a 10,2 cm shadow in an Ukur Bumi table.
  const coordinateStrings = (c: City): string[] =>
    [c.latDeg, Math.abs(c.latDeg), c.lonDeg].flatMap((v) =>
      [2, 3, 4].flatMap((digits) => [v.toFixed(digits), v.toFixed(digits).replace('.', ',')]),
    )

  it('contains no coordinate of any listed city, nor any degree reading but the 360° of a circle', () => {
    for (const { deck } of decks) {
      const all = `${deck.text}\n${deck.title}\n${deck.caption}`
      for (const c of INDONESIAN_CITIES) {
        for (const s of coordinateStrings(c)) {
          if (s.length >= 4) expect(all.includes(s), `${c.name} ${s}`).toBe(false)
        }
      }
      expect(all.replace(/360°/g, '')).not.toMatch(/°|\b(LS|LU|BT|BB)\b/)
    }
  })

  it('names a typed or geolocated place by its nearest listed city', () => {
    const near = cityForPlace({ latDeg: -8.65, lonDeg: 115.22, offsetHours: 8, label: 'Lokasi saya' })
    expect(near.name).toBe('Denpasar')
    const listed = city('Kupang')
    expect(cityForPlace({ ...listed, label: listed.name })).toBe(listed)
  })
})

describe('vermilion marks the zero shadow day and nothing else', () => {
  const ZSD_MOMENT =
    /^(?:(?:Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu), \d{1,2} [A-Z][a-z]+ \d{4}(?:, \d{2}:\d{2} (?:WIB|WITA|WIT))?|\d{2}:\d{2}:\d{2} (?:WIB|WITA|WIT))$/

  it('accents only a date or time, and only on the siang surface', () => {
    let spans = 0
    for (const { deck } of decks) {
      for (const block of deck.text.split('\n---\n').slice(1)) {
        const accents = [...block.matchAll(/(?<!\\)\*([^*]+)\*/g)].map((m) => m[1] ?? '')
        if (accents.length === 0) continue
        expect(block.split('\n')[0]).toContain('surface=siang')
        for (const a of accents) expect(a).toMatch(ZSD_MOMENT)
        spans += accents.length
      }
    }
    expect(spans).toBeGreaterThan(50)
  })

  it('names its surface on every slide, so none falls back to the rotation', () => {
    for (const { deck } of decks) {
      for (const block of deck.text.split('\n---\n').slice(1)) {
        expect(block.split('\n')[0]).toMatch(/ surface=(siang|kapur|langit|deep)\b/)
      }
    }
  })
})

describe('editorial/tengah-hari', () => {
  it('passes carousel-core’s own validator', () => {
    expect(validateVariant(TENGAH_HARI)).toEqual([])
  })

  it('uses vermilion as the accent of the siang surface only', () => {
    const vermilion = TENGAH_HARI.surfaces.siang?.accent
    for (const [name, surface] of Object.entries(TENGAH_HARI.surfaces)) {
      if (name === 'siang') continue
      expect(surface.accent, name).not.toBe(vermilion)
    }
    expect(TENGAH_HARI.rotation).toEqual(['kapur'])
  })

  it('keeps blobs off and draws headlines in the app’s display face', () => {
    expect(TENGAH_HARI.deco.blobs).toBe(false)
    expect(TENGAH_HARI.fonts).toEqual({
      serif: 'Bricolage Grotesque',
      sans: 'Plus Jakarta Sans',
      mono: 'JetBrains Mono',
    })
  })
})
