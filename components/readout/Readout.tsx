import type { Instant } from '@/lib/day'
import {
  formatClock,
  formatClockSeconds,
  formatDate,
  formatBearing,
  formatDeg,
  formatMinutes,
  formatRatio,
  formatSignedDeg,
} from '@/lib/format'
import type { Dictionary } from '@/lib/i18n'
import type { CivilDate } from '@/lib/solar/julian'

/**
 * The printed column of values beside the shadow — never over it.
 * Every figure is tabular, so nothing reflows as the date is dragged.
 */
export function Readout({
  dictionary,
  date,
  instant,
  noonLocalHours,
  eotMinutes,
}: {
  dictionary: Dictionary
  date: CivilDate
  instant: Instant
  noonLocalHours: number
  eotMinutes: number
}) {
  const shadow = instant.shadow

  return (
    <div className="min-w-[15rem]">
      <h2 className="label">{dictionary.readout.heading}</h2>
      <dl className="mt-3 space-y-0">
        <Row label={dictionary.readout.date} value={formatDate(date, dictionary)} />
        <Row label={dictionary.readout.time} value={formatClockSeconds(instant.localHours)} />
        <Row label={dictionary.readout.culmination} value={formatClock(noonLocalHours)} />
        <Row label={dictionary.readout.altitude} value={formatDeg(instant.altDeg)} />
        <Row label={dictionary.readout.azimuth} value={formatDeg(instant.azDeg, 1)} />
        <Row
          label={dictionary.readout.shadowRatio}
          value={
            shadow.type === 'shadow'
              ? `${formatRatio(shadow.lengthRatio)} ${dictionary.readout.perHeight}`
              : shadow.type === 'zenith'
                ? `0.000 ${dictionary.readout.perHeight}`
                : '—'
          }
          emphasis={shadow.type === 'shadow' || shadow.type === 'zenith'}
        />
        <Row
          label={dictionary.readout.shadowBearing}
          value={shadow.type === 'shadow' ? formatBearing(shadow.bearingDeg) : '—'}
        />
        <Row label={dictionary.readout.declination} value={formatSignedDeg(instant.decDeg)} />
        <Row
          label={dictionary.readout.eot}
          value={`${formatMinutes(eotMinutes)} ${dictionary.units.minutes}`}
        />
      </dl>
      {shadow.type === 'no-shadow' ? (
        <p className="mt-3 text-xs text-shadow/70">{dictionary.readout.noShadow}</p>
      ) : null}
    </div>
  )
}

function Row({
  label,
  value,
  emphasis = false,
}: {
  label: string
  value: string
  emphasis?: boolean
}) {
  return (
    <div className="rule flex items-baseline justify-between gap-4 py-1.5">
      <dt className="label">{label}</dt>
      <dd className={emphasis ? 'value text-[1.05rem]' : 'value'}>{value}</dd>
    </div>
  )
}
