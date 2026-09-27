import { ReadoutRow } from '@/components/readout/ReadoutRow'
import type { Instant } from '@/lib/day'
import {
  formatBearing,
  formatClock,
  formatClockSeconds,
  formatCompassPoint,
  formatDate,
  formatDeg,
  formatMinutes,
  formatRatio,
  formatSignedDeg,
} from '@/lib/format'
import type { Dictionary } from '@/lib/i18n'
import type { CivilDate } from '@/lib/solar/julian'

/**
 * The printed column of values beside the shadow — never over it.
 *
 * Three readings lead, because they are what the scene shows: the shadow's
 * length, its direction, and the height of the sun that casts it. The other
 * seven sit behind a disclosure. Every figure is tabular, so nothing reflows
 * as the date is dragged.
 */
export function Readout({
  dictionary,
  date,
  instant,
  noonLocalHours,
  eotMinutes,
  latDeg,
  onZeroShadowDay,
}: {
  dictionary: Dictionary
  date: CivilDate
  instant: Instant
  noonLocalHours: number
  eotMinutes: number
  /** The place's own latitude, read beside declination — the whole mechanism is these two converging. */
  latDeg: number
  /** True when the date shown is one of the place's zero shadow days. */
  onZeroShadowDay: boolean
}) {
  const shadow = instant.shadow
  const rest = [
    { label: dictionary.readout.date, value: formatDate(date, dictionary) },
    { label: dictionary.readout.time, value: formatClockSeconds(instant.localHours) },
    { label: dictionary.readout.culmination, value: formatClock(noonLocalHours) },
    { label: dictionary.readout.azimuth, value: formatDeg(instant.azDeg, 1) },
    { label: dictionary.readout.latitude, value: formatSignedDeg(latDeg) },
    { label: dictionary.readout.declination, value: formatSignedDeg(instant.decDeg) },
    { label: dictionary.readout.eot, value: `${formatMinutes(eotMinutes)} ${dictionary.units.minutes}` },
  ]

  const length =
    shadow.type === 'shadow' ? formatRatio(shadow.lengthRatio) : shadow.type === 'zenith' ? '0.000' : '—'
  const bearing =
    shadow.type === 'shadow'
      ? `${formatCompassPoint(shadow.bearingDeg, dictionary)} ${formatBearing(shadow.bearingDeg, 0)}`
      : '—'

  return (
    <div className="flex flex-col gap-4">
      <h2 className="label">{dictionary.readout.heading}</h2>
      <dl className="divide-y divide-shadow/10 border-y border-shadow/10">
        <Primary label={dictionary.readout.shadowRatio} unit={shadow.type === 'no-shadow' ? '' : dictionary.readout.perHeight} large marked={onZeroShadowDay && shadow.type !== 'no-shadow'}>
          {length}
        </Primary>
        <Primary label={dictionary.readout.shadowBearing}>{bearing}</Primary>
        <Primary label={dictionary.readout.altitude}>{formatDeg(instant.altDeg, 1)}</Primary>
      </dl>

      <details className="group rounded-xl border border-shadow/10 bg-bleached px-3 py-2">
        <summary className="cursor-pointer list-none text-sm font-semibold text-sky-deep">
          <span className="mr-1 inline-block transition group-open:rotate-90" aria-hidden>
            ›
          </span>
          {dictionary.gnomon.moreValues.replace('{n}', String(rest.length))}
        </summary>
        <dl className="mt-2">
          {rest.map((row) => (
            <ReadoutRow key={row.label} label={row.label} value={row.value} />
          ))}
        </dl>
      </details>

      {shadow.type === 'no-shadow' ? (
        <p className="text-xs text-shadow-2">{dictionary.readout.noShadow}</p>
      ) : null}
    </div>
  )
}

function Primary({
  label,
  unit,
  large = false,
  marked = false,
  children,
}: {
  label: string
  unit?: string
  large?: boolean
  /** Vermilion only on a zero shadow day: it marks the day and nothing else. */
  marked?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="py-3">
      <dt className="label">{label}</dt>
      <dd
        className={`mt-1 font-mono tabular tracking-[-0.02em] ${large ? 'text-4xl' : 'text-2xl'} ${
          marked ? 'text-marker-ink' : 'text-shadow'
        }`}
      >
        {children}
        {unit ? <span className="ml-1.5 font-sans text-sm tracking-normal text-shadow-2">{unit}</span> : null}
      </dd>
    </div>
  )
}
