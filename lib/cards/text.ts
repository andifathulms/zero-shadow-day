/**
 * The display boundary for cards: Indonesian dates, times and decimals, and the
 * carousel-core deck grammar (PRD §4 of Carousel Press, SPEC-lexicon §2).
 *
 * Every number reaching a deck passes through one of the formatters here, from
 * a value the engine computed. Nothing in this file knows any astronomy.
 */

import { formatClock, formatClockSeconds } from '@/lib/format'
import { getDictionary } from '@/lib/i18n'
import { type CivilDate, civilFromJulianDay, julianDay } from '@/lib/solar/julian'

const MONTHS = getDictionary('id').months
const WEEKDAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const

/** The registered host variant every deck is drawn with (lib/cards/variant.ts). */
export const TEMPLATE_ID = 'editorial/tengah-hari'

/** Appended to every deck, word for word (docs/RECON_CARDS.md §8). */
export const CAVEAT = 'Tanggal ±1 hari, jam ±1 menit. Rujukan resmi: BMKG. Butuh langit cerah.'

/** On every deck that asks people to go outside and look. */
export const EYE_SAFETY = 'Lihat bayangannya, jangan lihat mataharinya.'

/** carousel-core's table limit: one header row and at most eight body rows. */
export const TABLE_MAX_ROWS = 8
export const TABLE_MAX_COLUMNS = 4

/** Day of the week, 0 = Sunday. Meeus ch. 7: (JD + 1.5) mod 7 at 0h. */
export function weekday(date: CivilDate): number {
  return Math.floor(julianDay(date) + 1.5) % 7
}

/** "Kamis, 15 Oktober 2026". */
export function dateLong(date: CivilDate): string {
  return `${WEEKDAYS[weekday(date)]}, ${date.day} ${MONTHS[date.month - 1]} ${date.year}`
}

/** "Kamis 15 Okt" — for table cells. */
export function dateShort(date: CivilDate): string {
  return `${WEEKDAYS[weekday(date)]?.slice(0, 3)} ${date.day} ${MONTHS[date.month - 1]?.slice(0, 3)}`
}

/** "15 Oktober 2026". */
export function dateDay(date: CivilDate): string {
  return `${date.day} ${MONTHS[date.month - 1]} ${date.year}`
}

/** "12:05 WITA". */
export function clock(localHours: number, zone: string): string {
  return `${formatClock(localHours)} ${zone}`
}

/** "12:04:59 WITA". */
export function clockSeconds(localHours: number, zone: string): string {
  return `${formatClockSeconds(localHours)} ${zone}`
}

/** A decimal with an Indonesian comma: 2.94 → "2,9". */
export function decimal(value: number, digits = 1): string {
  return value.toFixed(digits).replace('.', ',')
}

/** "hari ini", "besok", "lusa", or "12 hari lagi". */
export function relativeDays(days: number): string {
  if (days === 0) return 'hari ini'
  if (days === 1) return 'besok'
  if (days === 2) return 'lusa'
  return `${days} hari lagi`
}

export function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** The civil date `days` after `date`. */
export function addDays(date: CivilDate, days: number): CivilDate {
  const { year, month, day } = civilFromJulianDay(julianDay(date) + days)
  return { year, month, day }
}

/**
 * Text made safe for one deck line: `|` is a line break in the grammar and a
 * cell separator in tables, `*` opens an accent. Neither occurs in a city name,
 * but the escape costs nothing and keeps the grammar from ever being guessed.
 */
export function plain(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\*/g, '\\*')
}

/**
 * The zero shadow day's own date or time, in the accent colour. On the
 * variant's `siang` surface the accent is vermilion, which marks the zero
 * shadow day and nothing else (CLAUDE.md invariant 12); builders call this
 * only around such a date or time.
 */
export function zsdAccent(text: string): string {
  return `*${text}*`
}

/** The surfaces of `editorial/tengah-hari` (lib/cards/variant.ts). */
export type SurfaceName = 'siang' | 'kapur' | 'langit' | 'deep'

export type SlideType = 'cover' | 'card' | 'table' | 'compare' | 'end'

export interface SlideSpec {
  readonly type: SlideType
  readonly surface: SurfaceName
  /** The slide's lines after the tag line, already in deck grammar. */
  readonly lines: readonly string[]
  /** `number=off` on a card: hides the badge. */
  readonly numberOff?: boolean
}

export function slide(
  type: SlideType,
  surface: SurfaceName,
  lines: readonly string[],
  options: { numberOff?: boolean } = {},
): SlideSpec {
  return { type, surface, lines, ...(options.numberOff ? { numberOff: true } : {}) }
}

/**
 * A table across as many slides as its rows need: carousel-core draws at most
 * eight body rows and four columns, so a longer list continues on the next
 * slide under the same header, titled "(1/2)", "(2/2)". The note closes
 * the last page only.
 */
export function tableSlides(
  surface: SurfaceName,
  title: string,
  header: readonly string[],
  rows: readonly (readonly string[])[],
  note?: string,
): SlideSpec[] {
  if (header.length < 2 || header.length > TABLE_MAX_COLUMNS) {
    throw new Error(`tableSlides: ${header.length} columns; carousel-core draws 2–${TABLE_MAX_COLUMNS}`)
  }
  const pages: (readonly (readonly string[])[])[] = []
  for (let start = 0; start < rows.length; start += TABLE_MAX_ROWS) {
    pages.push(rows.slice(start, start + TABLE_MAX_ROWS))
  }
  if (pages.length === 0) pages.push([])

  const line = (cells: readonly string[]): string => `| ${cells.map(plain).join(' | ')} |`
  return pages.map((page, index) =>
    slide('table', surface, [
      pages.length > 1 ? `${title} (${index + 1}/${pages.length})` : title,
      line(header),
      ...page.map(line),
      ...(note && index === pages.length - 1 ? [note] : []),
    ]),
  )
}

/** The deck text: header lines, then each slide behind `---`. */
export function writeDeck(title: string, slides: readonly SlideSpec[]): string {
  const header = [`template: ${TEMPLATE_ID}`, 'lang: id', `title: ${title.replace(/\s+/g, ' ')}`]
  const blocks = slides.map((spec) => {
    const attrs = [spec.type, `surface=${spec.surface}`, ...(spec.numberOff ? ['number=off'] : [])]
    return [`[${attrs.join(' ')}]`, ...spec.lines].join('\n')
  })
  return [header.join('\n'), ...blocks].join('\n---\n') + '\n'
}
