/**
 * Deck builders: one story per kind, written from the engine's own output.
 *
 * The rules every deck keeps (docs/RECON_CARDS.md §8, tests/cards):
 *   - every number comes from lib/zsd, lib/day or lib/eratosthenes, formatted
 *     in lib/cards/text — none is typed;
 *   - the shadow is "nyaris hilang", never gone: the residual is stated;
 *   - the caveat ends every deck, and decks that send people outside carry
 *     the eye-safety line;
 *   - a city is named, never located: no coordinate reaches a deck;
 *   - vermilion (the `siang` accent) marks only a zero shadow day's date or time.
 */

import { type City, INDONESIAN_CITIES } from '@/data/cities/indonesia'
import { instantAt } from '@/lib/day'
import {
  MINIMUM_SEPARATION_DEG,
  measureEarth,
  ratePartner,
  syntheticObservation,
} from '@/lib/eratosthenes'
import { formatClockSeconds } from '@/lib/format'
import { MINUTES_PER_DAY } from '@/lib/solar/noon'
import type { CivilDate } from '@/lib/solar/julian'
import type { ZeroShadowDay } from '@/lib/zsd'
import { caption, fit, TITLE_MAX } from './caption'
import {
  type NextFor,
  nextFor,
  noonExtremes,
  noonOn,
  partnerMeasurements,
  seasonEdge,
  zsdEvents,
} from './events'
import {
  CAVEAT,
  EYE_SAFETY,
  type SlideSpec,
  addDays,
  capitalise,
  clock,
  clockSeconds,
  dateDay,
  dateLong,
  dateShort,
  decimal,
  relativeDays,
  slide,
  tableSlides,
  whenPhrase,
  writeDeck,
  zsdAccent,
} from './text'
import type { CardDeck, DeckRequest } from './types'

/** Rows a weekly table lists before pointing to the app for the rest. */
const WEEK_ROWS_MAX = 24

/** Minutes either side of culmination for the "coba sendiri" photos, and the word the copy uses for it. */
const PHOTO_OFFSET_MINUTES = 5
const PHOTO_OFFSET_WORD = 'Lima'

interface Story {
  readonly title: string
  readonly slides: readonly SlideSpec[]
  readonly facts: readonly string[]
  readonly cityNames: readonly string[]
}

export function buildDeck(request: DeckRequest): CardDeck {
  const story = storyFor(request)
  const title = fit(story.title, TITLE_MAX)
  return {
    kind: request.kind,
    text: writeDeck(title, story.slides),
    title,
    caption: caption(title, story.facts, CAVEAT, story.cityNames),
    name: `${request.kind}-${request.city.name}-${request.today.year}-${request.today.month}-${request.today.day}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-'),
  }
}

function storyFor({ kind, city, today }: DeckRequest): Story {
  switch (kind) {
    case 'cek-kotamu':
      return cekKotamu(city, today)
    case 'bayangan-minggu-ini':
      return bayanganMingguIni(city, today)
    case 'cluster-hari-ini':
      return clusterHariIni(city, today)
    case 'kota-terakhir':
      return kotaTerakhir(city, today)
    case 'ukur-bumi':
      return ukurBumi(city, today)
    case 'tengah-hari-bukan-jam-12':
      return tengahHari(city, today)
    case 'mitos-vs-hitungan':
      return mitosVsHitungan(city, today)
    default: {
      const unreachable: never = kind
      throw new Error(`unknown card kind ${String(unreachable)}`)
    }
  }
}

// ── Shared slides ────────────────────────────────────────────────────────────

/** "Kamis, 15 Oktober 2026, 12:05 WITA", in vermilion: the day and its moment. */
function zsdMoment(day: ZeroShadowDay, zone: string): string {
  return zsdAccent(`${dateLong(day.date)}, ${clock(day.localNoonHours, zone)}`)
}

/** The residual shadow of a one-metre stick at culmination, in millimetres. */
function residualMm(day: ZeroShadowDay): string {
  const mm = day.minShadowRatio * 1000
  return `${decimal(mm, mm < 0.05 ? 2 : 1)} mm`
}

/** The disc-on-zenith window, or why there is none. */
function windowLine(day: ZeroShadowDay, zone: string): string {
  const w = day.window
  if (!w) return 'Cakram matahari tidak sampai menutupi titik zenit hari itu.'
  return `Jendela ${formatClockSeconds(w.startLocalHours)}–${formatClockSeconds(w.endLocalHours)} ${zone}, ${Math.round(w.durationSeconds)} detik.`
}

/** The day in detail: culmination to the second, window, residual. */
function detailSlide(city: City, day: ZeroShadowDay, headline: string): SlideSpec {
  return slide('card', 'siang', [
    headline,
    `Kulminasi ${zsdAccent(clockSeconds(day.localNoonHours, city.zone))}`,
    windowLine(day, city.zone),
    `Sisa bayangan tongkat 1 meter: ${residualMm(day)}.`,
  ])
}

/** Length of a one-metre stick's shadow `minutes` after culmination, in cm. */
function shadowCmAfter(city: City, day: ZeroShadowDay, minutes: number): string {
  const { shadow } = instantAt(city, day.date, day.localNoonHours + minutes / 60)
  const ratio = shadow.type === 'shadow' ? shadow.lengthRatio : 0
  return `${decimal(ratio * 100)} cm`
}

/** The participation slide: three photos around culmination. Carries the eye-safety line. */
function tryItSlide(city: City, day: ZeroShadowDay): SlideSpec {
  const at = (minutes: number): string => clock(day.localNoonHours + minutes / 60, city.zone)
  return slide('card', 'kapur', [
    'Coba sendiri',
    'Tegakkan tongkat atau sapu lurus di lantai datar.',
    `Foto bayangannya pukul ${at(-PHOTO_OFFSET_MINUTES)}, ${at(0)}, dan ${at(PHOTO_OFFSET_MINUTES)}.`,
    `${PHOTO_OFFSET_WORD} menit dari kulminasi, bayangan tongkat 1 meter sudah sekitar ${shadowCmAfter(city, day, PHOTO_OFFSET_MINUTES)}.`,
    'Unggah dengan nama kotamu.',
    EYE_SAFETY,
  ])
}

/** The closing slide: the ask, the eye-safety line where people go outside, the caveat. */
function endSlide(challenge: boolean): SlideSpec {
  return slide('end', 'deep', [
    'Cek kotamu',
    'Tulis nama kotamu di komentar.',
    ...(challenge ? [EYE_SAFETY] : []),
    CAVEAT,
  ])
}

/** The zero shadow day after `next`: always in the future, unlike the year's "other". */
function following(city: City, next: NextFor): NextFor {
  return nextFor(city, addDays(next.day.date, 1))
}

// ── Stories ──────────────────────────────────────────────────────────────────

function cekKotamu(city: City, today: CivilDate): Story {
  const next = nextFor(city, today)
  const after = following(city, next)
  const { day } = next
  return {
    title: `${city.name}: bayangan nyaris hilang ${dateShort(day.date)}, ${clock(day.localNoonHours, city.zone)}`,
    slides: [
      slide('cover', 'siang', [
        `${city.name}: bayanganmu | nyaris hilang`,
        zsdMoment(day, city.zone),
        `${capitalise(relativeDays(next.daysUntil))}.`,
      ]),
      detailSlide(city, day, 'Kapan tepatnya?'),
      slide('card', 'kapur', [
        'Kenapa nyaris, bukan nol?',
        `Tongkat 1 meter tetap berbayang sekitar ${residualMm(day)}.`,
        'Matahari itu lebar, jadi bayangan menyusut ke titik terpendek, tidak lenyap.',
      ]),
      tryItSlide(city, day),
      slide('card', 'siang', [
        'Berikutnya lagi',
        zsdMoment(after.day, city.zone),
        'Dua kali setahun: saat matahari melintas ke utara, lalu saat kembali ke selatan.',
      ]),
      endSlide(true),
    ],
    facts: [
      `Kulminasi ${clockSeconds(day.localNoonHours, city.zone)}, ${dateLong(day.date)}.`,
      windowLine(day, city.zone),
      `Sisa bayangan tongkat 1 meter: ${residualMm(day)}.`,
    ],
    cityNames: [city.name],
  }
}

function bayanganMingguIni(city: City, today: CivilDate): Story {
  const events = zsdEvents(INDONESIAN_CITIES, today, 6)
  const end = addDays(today, 6)
  const own = nextFor(city, today)
  const listed = events.slice(0, WEEK_ROWS_MAX)
  const rest = events.length - listed.length

  const slides: SlideSpec[] = [
    slide('cover', 'deep', [
      'Bayangan | minggu ini',
      `${dateDay(today)} – ${dateDay(end)}`,
      events.length > 0
        ? `${events.length} kota nyaris tanpa bayangan saat tengah hari.`
        : 'Minggu ini tak satu pun kota di daftar kami nyaris tanpa bayangan.',
    ]),
  ]
  if (events.length > 0) {
    slides.push(
      ...tableSlides(
        'kapur',
        'Jadwal kulminasi',
        ['Hari', 'Kota', 'Kulminasi'],
        listed.map((e) => [dateShort(e.day.date), e.city.name, clock(e.day.localNoonHours, e.city.zone)]),
        rest > 0 ? `Dan ${rest} kota lain: cek di aplikasi.` : undefined,
      ),
    )
  } else {
    const [upcoming] = zsdEvents(INDONESIAN_CITIES, today, 400)
    if (upcoming) {
      slides.push(
        slide('card', 'siang', [
          `Berikutnya: ${upcoming.city.name}`,
          zsdMoment(upcoming.day, upcoming.city.zone),
          `${capitalise(relativeDays(upcoming.daysUntil))}.`,
        ]),
      )
    }
  }
  slides.push(
    slide('card', 'siang', [
      `Kotamu: ${city.name}`,
      zsdMoment(own.day, city.zone),
      `${capitalise(relativeDays(own.daysUntil))}.`,
    ]),
    endSlide(false),
  )

  return {
    title:
      events.length > 0
        ? `Bayangan minggu ini: ${events.length} kota nyaris tanpa bayangan`
        : `Bayangan minggu ini: belum ada kota, ${city.name} ${dateShort(own.day.date)}`,
    slides,
    facts: listed.map(
      (e) => `${e.city.name}: ${dateShort(e.day.date)}, ${clock(e.day.localNoonHours, e.city.zone)}`,
    ),
    cityNames: listed.map((e) => e.city.name),
  }
}

function clusterHariIni(city: City, today: CivilDate): Story {
  const next = nextFor(city, today)
  const cluster = zsdEvents(INDONESIAN_CITIES, next.day.date, 0)
  const featured = cluster.find((e) => e.city.name === city.name) ?? { city, day: next.day }
  const when = whenPhrase(next.daysUntil, next.day.date)
  const where = cluster.length > 1 ? `di ${cluster.length} kota` : `di ${city.name}`

  return {
    title:
      next.daysUntil <= 6
        ? `${when}: bayangan nyaris hilang ${where} (${dateShort(next.day.date)})`
        : `${when}: bayangan nyaris hilang ${where}`,
    slides: [
      slide('cover', 'siang', [
        `Bayangan nyaris hilang | ${where}`,
        zsdAccent(dateLong(next.day.date)),
        next.daysUntil <= 6
          ? `${when}, tepat saat kulminasi di kota masing-masing.`
          : 'Tepat saat kulminasi di kota masing-masing.',
      ]),
      ...tableSlides(
        'kapur',
        `Kulminasi ${dateShort(next.day.date)}`,
        ['Kota', 'Kulminasi', 'Jendela'],
        cluster.map((e) => [
          e.city.name,
          clock(e.day.localNoonHours, e.city.zone),
          e.day.window ? `${Math.round(e.day.window.durationSeconds)} detik` : '–',
        ]),
        'Jendela: lama cakram matahari menutupi titik zenit.',
      ),
      detailSlide(featured.city, featured.day, featured.city.name),
      tryItSlide(featured.city, featured.day),
      endSlide(true),
    ],
    facts: cluster.map((e) => `${e.city.name}: ${clockSeconds(e.day.localNoonHours, e.city.zone)}`),
    cityNames: cluster.map((e) => e.city.name),
  }
}

function kotaTerakhir(city: City, today: CivilDate): Story {
  const { last, next, gapDays } = seasonEdge(today)
  const own = nextFor(city, today)
  const slides: SlideSpec[] = [
    slide('cover', 'siang', [
      `${last.city.name}: kota terakhir | sebelum jeda ${gapDays} hari`,
      zsdMoment(last.day, last.city.zone),
      `${capitalise(relativeDays(last.daysUntil))}.`,
    ]),
    slide('card', 'kapur', [
      `Lalu jeda ${gapDays} hari`,
      `Sesudah itu, tak satu pun dari ${INDONESIAN_CITIES.length} kota di daftar kami nyaris tanpa bayangan sampai ${dateDay(next.day.date)}.`,
      `Kota pertama sesudah jeda: ${next.city.name}.`,
    ]),
    slide('card', 'langit', [
      'Kenapa ada jeda?',
      'Titik tempat matahari tepat di atas kepala bergerak bolak-balik antara dua garis balik.',
      'Selama jeda, titik itu berada di luar lintang kota-kota di daftar kami, lalu berbalik arah.',
    ]),
    detailSlide(last.city, last.day, last.city.name),
  ]
  if (city.name !== last.city.name) {
    slides.push(
      slide('card', 'siang', [
        `Kotamu: ${city.name}`,
        zsdMoment(own.day, city.zone),
        `${capitalise(relativeDays(own.daysUntil))}.`,
      ]),
    )
  }
  slides.push(tryItSlide(last.city, last.day), endSlide(true))

  return {
    title: `${last.city.name}, ${dateShort(last.day.date)}: kota terakhir sebelum jeda ${gapDays} hari`,
    slides,
    facts: [
      `${last.city.name}: ${dateLong(last.day.date)}, ${clockSeconds(last.day.localNoonHours, last.city.zone)}.`,
      `Sesudahnya: ${next.city.name}, ${dateLong(next.day.date)}.`,
      `Di antara ${INDONESIAN_CITIES.length} kota di daftar aplikasi.`,
    ],
    cityNames: [last.city.name, next.city.name],
  }
}

function ukurBumi(host: City, today: CivilDate): Story {
  const next = nextFor(host, today)
  const date = next.day.date
  const partners = partnerMeasurements(host, date, MINIMUM_SEPARATION_DEG).slice(0, 8)
  const best = partners[0]

  const slides: SlideSpec[] = [
    slide('cover', 'siang', [
      'Ukur Bumi | dari kotamu',
      zsdMoment(next.day, host.zone),
      `Matahari tepat di atas ${host.name}. Kota lain mengukur bayangannya.`,
    ]),
    slide('card', 'langit', [
      'Seperti Eratosthenes',
      'Lebih dari dua ribu tahun lalu, Eratosthenes mengukur keliling Bumi dengan dua bayangan.',
      'Satu kota tanpa bayangan, satu kota lain berbayang. Selisih sudutnya adalah selisih lintang keduanya.',
    ]),
    ...tableSlides(
      'kapur',
      `Bayangan tongkat 1 meter, ${dateShort(date)}`,
      ['Kota', 'Kulminasi', 'Bayangan'],
      partners.map((p) => [
        p.city.name,
        clock(p.noon.localNoonHours, p.city.zone),
        `${decimal(p.observation.shadowLength)} cm ke ${p.observation.pointsNorth ? 'utara' : 'selatan'}`,
      ]),
      'Diukur saat kulminasi di kota masing-masing.',
    ),
    slide('card', 'kapur', [
      'Cara ukur',
      'Tegakkan tongkat lurus di lantai datar.',
      'Saat kulminasi kotamu, ukur tinggi tongkat dan panjang bayangannya dalam cm.',
      'Tulis kota, tinggi, dan panjang bayangan di komentar.',
      EYE_SAFETY,
    ]),
    slide('card', 'kapur', [
      'Hitungannya',
      'Sudut = arctan(bayangan ÷ tinggi).',
      'Keliling Bumi = 360° ÷ selisih sudut × jarak utara–selatan.',
      'Jaraknya ambil dari peta, bukan dari aplikasi ini.',
    ]),
  ]
  if (best) {
    const pair = ratePartner(host, best.city)
    const measured = measureEarth(
      syntheticObservation(host, date, host.name, 100),
      best.observation,
      pair.meridianDistanceKm,
    )
    if (measured.type === 'measurement') {
      slides.push(
        slide('card', 'kapur', [
          'Hasilnya pasti meleset',
          `Untuk pasangan ${host.name}–${best.city.name}, salah ukur satu menit busur menggeser hasil sekitar ${Math.round(measured.kmPerArcminute)} km.`,
          'Selisih itu bukan aib. Itulah pelajarannya.',
        ]),
      )
    }
  }
  slides.push(endSlide(true))

  return {
    title: `Ukur Bumi dari kotamu: ${dateShort(date)}, ${clock(next.day.localNoonHours, host.zone)} di ${host.name}`,
    slides,
    facts: partners.map(
      (p) =>
        `${p.city.name}: ${clock(p.noon.localNoonHours, p.city.zone)}, bayangan ${decimal(p.observation.shadowLength)} cm`,
    ),
    cityNames: [host.name, ...partners.map((p) => p.city.name)],
  }
}

function tengahHari(city: City, today: CivilDate): Story {
  const noons = INDONESIAN_CITIES.map((c) => ({ city: c, noon: noonOn(c, today) }))
  const rows: { city: City; hours: number }[] = []
  for (const zone of ['WIB', 'WITA', 'WIT'] as const) {
    const inZone = noons.filter((n) => n.city.zone === zone)
    const sorted = [...inZone].sort((a, b) => a.noon.localNoonHours - b.noon.localNoonHours)
    const first = sorted[0]
    const lastOne = sorted[sorted.length - 1]
    if (first) rows.push({ city: first.city, hours: first.noon.localNoonHours })
    if (lastOne && lastOne !== first) rows.push({ city: lastOne.city, hours: lastOne.noon.localNoonHours })
  }
  const own = noonOn(city, today)
  if (!rows.some((r) => r.city.name === city.name)) rows.push({ city, hours: own.localNoonHours })
  const { earliest, latest } = noonExtremes(city, today, 365)
  const swingMinutes = (latest.localNoonHours - earliest.localNoonHours) * 60

  return {
    title: `Jam 12 bukan tengah hari: di ${city.name} pukul ${clock(own.localNoonHours, city.zone)}`,
    slides: [
      slide('cover', 'deep', [
        'Jam 12 siang | bukan tengah hari',
        `Di ${city.name}, matahari tertinggi pada ${dateDay(today)} pukul ${clock(own.localNoonHours, city.zone)}.`,
      ]),
      ...tableSlides(
        'kapur',
        `Kulminasi ${dateDay(today)}`,
        ['Kota', 'Kulminasi'],
        rows.map((r) => [r.city.name, clock(r.hours, r.city.zone)]),
        'Paling pagi dan paling siang di tiap zona waktu.',
      ),
      slide('card', 'langit', [
        'Dua penyebab',
        `Letak kota di zona waktunya: tiap derajat bujur menggeser ${MINUTES_PER_DAY / 360} menit.`,
        'Perata waktu: sepanjang tahun matahari kadang mendahului jam, kadang tertinggal.',
      ]),
      slide('card', 'kapur', [
        `Setahun di ${city.name}`,
        `Paling pagi: ${dateDay(earliest.date)}, pukul ${clockSeconds(earliest.localNoonHours, city.zone)}.`,
        `Paling siang: ${dateDay(latest.date)}, pukul ${clockSeconds(latest.localNoonHours, city.zone)}.`,
        `Selisihnya ${decimal(swingMinutes)} menit.`,
      ]),
      endSlide(false),
    ],
    facts: rows.map((r) => `${r.city.name}: ${clock(r.hours, r.city.zone)}`),
    cityNames: [city.name],
  }
}

function mitosVsHitungan(city: City, today: CivilDate): Story {
  const next = nextFor(city, today)
  const after = following(city, next)
  const { day } = next
  const compare = (headline: string, wrong: string, right: string, why: string): SlideSpec =>
    slide('compare', 'kapur', [
      `headline: ${headline}`,
      `wrong: ${wrong}`,
      `right: ${right}`,
      `why: ${why}`,
      'wrong-label: Mitos',
      'right-label: Hitungan',
    ])

  return {
    title: `Mitos vs hitungan: hari tanpa bayangan di ${city.name}`,
    slides: [
      slide('cover', 'deep', ['Mitos vs | hitungan', `Hari tanpa bayangan di ${city.name}`]),
      compare(
        'Bayangannya',
        'Bayangan benar-benar nol.',
        `Nyaris hilang: tongkat 1 meter masih berbayang sekitar ${residualMm(day)}.`,
        'Matahari bukan titik. Cakramnya lebar, jadi bayangan menyusut ke titik terpendek.',
      ),
      compare(
        'Lamanya',
        'Berlangsung seharian.',
        day.window
          ? `Sekitar ${Math.round(day.window.durationSeconds)} detik, di sekitar pukul ${clock(day.localNoonHours, city.zone)}.`
          : `Hanya sesaat, di sekitar pukul ${clock(day.localNoonHours, city.zone)}.`,
        `${PHOTO_OFFSET_WORD} menit kemudian, bayangan tongkat 1 meter sudah sekitar ${shadowCmAfter(city, day, PHOTO_OFFSET_MINUTES)}.`,
      ),
      compare(
        'Jamnya',
        'Tengah hari selalu pukul 12:00.',
        `Di ${city.name}, kulminasi ${dateDay(day.date)} pukul ${clockSeconds(day.localNoonHours, city.zone)}.`,
        'Jam mengikuti zona waktu, matahari mengikuti bujur kotamu.',
      ),
      compare(
        'Seberapa sering',
        'Hanya sekali setahun.',
        `Dua kali: ${dateDay(day.date)} dan ${dateDay(after.day.date)}.`,
        'Sekali saat matahari melintas ke utara, sekali saat kembali ke selatan.',
      ),
      compare(
        'Suhunya',
        'Hari itu pasti paling panas.',
        'Ini soal posisi matahari, bukan suhu.',
        'Panas dipengaruhi awan, angin, dan kelembapan. Aplikasi ini tidak menghitung suhu.',
      ),
      endSlide(false),
    ],
    facts: [
      `${city.name}: ${dateLong(day.date)}, ${clockSeconds(day.localNoonHours, city.zone)}.`,
      `Sisa bayangan tongkat 1 meter: ${residualMm(day)}.`,
    ],
    cityNames: [city.name],
  }
}

