'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePlace } from '@/components/place/PlaceProvider'
import { ReadoutRow } from '@/components/readout/ReadoutRow'
import { todayIn } from '@/lib/clock'
import { instantAt } from '@/lib/day'
import {
  formatBearing,
  formatClockSeconds,
  formatDeg,
  formatMinutes,
  formatRatio,
  formatSignedDeg,
} from '@/lib/format'
import type { Dictionary } from '@/lib/i18n'
import { compassPointId } from '@/lib/shadow'
import { julianDay } from '@/lib/solar/julian'
import { solarNoon } from '@/lib/solar/noon'

/**
 * Solar noon anywhere (PRD §5.7): for any place and date, culmination, the
 * sun's altitude there, the shadow ratio for a unit gnomon, and the bearing.
 * The practical output — the one architects, solar installers and
 * photographers actually want.
 */
export function NoonAnywhere({ dictionary }: { dictionary: Dictionary }) {
  const { place } = usePlace()
  const [iso, setIso] = useState<string>('')

  useEffect(() => {
    const today = todayIn(place.offsetHours)
    setIso(`${today.year}-${pad(today.month)}-${pad(today.day)}`)
  }, [place.offsetHours])

  const date = useMemo(() => {
    const [year, month, day] = iso.split('-').map(Number)
    if (!year || !month || !day) return null
    return { year, month, day }
  }, [iso])

  const values = useMemo(() => {
    if (date === null) return null
    const noon = solarNoon(julianDay(date), place.lonDeg, place.offsetHours)
    const instant = instantAt(place, date, noon.localHours)
    return { noon, instant }
  }, [place, date])

  if (!values) return <div className="skeleton min-h-[12rem]" aria-hidden />

  const { noon, instant } = values
  const shadow = instant.shadow

  return (
    <section className="panel">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl">{dictionary.readout.culmination}</h2>
        <input
          type="date"
          value={iso}
          onChange={(event) => setIso(event.target.value)}
          min="1800-01-01"
          max="2100-12-31"
          className="rounded-md border border-shadow/25 bg-bleached px-3 py-2 font-mono tabular text-sm"
          aria-label={dictionary.readout.date}
        />
      </div>

      <dl className="mt-4 grid gap-x-10 sm:grid-cols-2">
        <ReadoutRow label={dictionary.readout.culmination} value={formatClockSeconds(noon.localHours)} />
        <ReadoutRow label={dictionary.readout.altitude} value={formatDeg(instant.altDeg)} />
        <ReadoutRow
          label={dictionary.readout.shadowRatio}
          value={
            shadow.type === 'shadow'
              ? `${formatRatio(shadow.lengthRatio)} ${dictionary.readout.perHeight}`
              : shadow.type === 'zenith'
                ? `0.000 ${dictionary.readout.perHeight}`
                : '—'
          }
          emphasis
        />
        <ReadoutRow
          label={dictionary.readout.shadowBearing}
          value={
            shadow.type === 'shadow'
              ? `${formatBearing(shadow.bearingDeg)} · ${compassPointId(shadow.bearingDeg)}`
              : '—'
          }
        />
        <ReadoutRow label={dictionary.readout.latitude} value={formatSignedDeg(place.latDeg)} />
        <ReadoutRow label={dictionary.readout.declination} value={formatSignedDeg(instant.decDeg)} />
        <ReadoutRow
          label={dictionary.readout.eot}
          value={`${formatMinutes(noon.eotMinutes)} ${dictionary.units.minutes}`}
        />
      </dl>
    </section>
  )
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}
