import { ReadoutRow } from '@/components/readout/ReadoutRow'
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
  latDeg,
}: {
  dictionary: Dictionary
  date: CivilDate
  instant: Instant
  noonLocalHours: number
  eotMinutes: number
  /** The place's own latitude, read beside declination — the whole mechanism is these two converging. */
  latDeg: number
}) {
  const shadow = instant.shadow

  return (
    <div>
      <h2 className="label">{dictionary.readout.heading}</h2>
      <dl className="mt-3 space-y-0">
        <ReadoutRow label={dictionary.readout.date} value={formatDate(date, dictionary)} />
        <ReadoutRow label={dictionary.readout.time} value={formatClockSeconds(instant.localHours)} />
        <ReadoutRow label={dictionary.readout.culmination} value={formatClock(noonLocalHours)} />
        <ReadoutRow label={dictionary.readout.altitude} value={formatDeg(instant.altDeg)} />
        <ReadoutRow label={dictionary.readout.azimuth} value={formatDeg(instant.azDeg, 1)} />
        <ReadoutRow
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
        <ReadoutRow
          label={dictionary.readout.shadowBearing}
          value={shadow.type === 'shadow' ? formatBearing(shadow.bearingDeg) : '—'}
        />
        <ReadoutRow label={dictionary.readout.latitude} value={formatSignedDeg(latDeg)} />
        <ReadoutRow label={dictionary.readout.declination} value={formatSignedDeg(instant.decDeg)} />
        <ReadoutRow
          label={dictionary.readout.eot}
          value={`${formatMinutes(eotMinutes)} ${dictionary.units.minutes}`}
        />
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-shadow/70">{dictionary.readout.convergeHint}</p>
      {shadow.type === 'no-shadow' ? (
        <p className="mt-1 text-xs text-shadow/70">{dictionary.readout.noShadow}</p>
      ) : null}
    </div>
  )
}
