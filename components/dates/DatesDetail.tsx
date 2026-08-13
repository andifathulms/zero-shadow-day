'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePlace } from '@/components/place/PlaceProvider'
import { currentYearIn } from '@/lib/clock'
import {
  formatClock,
  formatClockSeconds,
  formatDate,
  formatDeg,
  formatDuration,
  formatMinutes,
  formatRatio,
} from '@/lib/format'
import type { Dictionary } from '@/lib/i18n'
import { julianDay } from '@/lib/solar/julian'
import { solarNoon } from '@/lib/solar/noon'
import { zeroShadowDays } from '@/lib/zsd'
import type { ZeroShadowDay } from '@/lib/zsd'

/**
 * Both dates in full, with the clock-versus-sun offset broken into its two
 * causes — longitude within the zone, and the equation of time (PRD §5.2).
 */
export function DatesDetail({ dictionary }: { dictionary: Dictionary }) {
  const { place } = usePlace()
  const [year, setYear] = useState<number | null>(null)
  useEffect(() => setYear(currentYearIn(place.offsetHours)), [place.offsetHours])

  const result = useMemo(
    () => (year === null ? null : zeroShadowDays(place, year)),
    [place, year],
  )

  if (year === null || result === null) return <div className="min-h-[24rem]" aria-hidden />

  return (
    <div className="space-y-8">
      <div className="flex items-baseline gap-4">
        <span className="label">{dictionary.dates.year}</span>
        <div className="flex gap-2">
          {[year - 1, year, year + 1, year + 2].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setYear(option)}
              className={`rounded-full border px-4 py-1.5 font-mono tabular text-sm transition ${
                option === year
                  ? 'border-shadow bg-shadow text-chalk'
                  : 'border-shadow/30 hover:border-shadow'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {result.type === 'outside-tropics' ? (
        <section className="panel border-marker/40 bg-marker/5">
          <p className="font-display text-2xl text-marker">{dictionary.dates.outsideTropics}</p>
          <p className="mt-3 max-w-prose leading-relaxed">
            {dictionary.dates.outsideExplain
              .replace('{gap}', result.minZenithDeg.toFixed(2))
              .replace('{limit}', Math.abs(result.limitDeg).toFixed(2))}
          </p>
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {result.days.map((day, index) => (
            <DayCard
              key={day.jdCulmination}
              dictionary={dictionary}
              day={day}
              label={
                result.converged
                  ? dictionary.dates.only
                  : index === 0
                    ? dictionary.dates.first
                    : dictionary.dates.second
              }
              offsetHours={place.offsetHours}
              lonDeg={place.lonDeg}
            />
          ))}
        </div>
      )}

      <p className="max-w-prose text-sm leading-relaxed text-shadow/70">
        {dictionary.dates.windowNote}
      </p>
    </div>
  )
}

function DayCard({
  dictionary,
  day,
  label,
  offsetHours,
  lonDeg,
}: {
  dictionary: Dictionary
  day: ZeroShadowDay
  label: string
  offsetHours: number
  lonDeg: number
}) {
  // The same solar noon the search used, re-read for its two components.
  const noon = solarNoon(julianDay(day.date), lonDeg, offsetHours)

  return (
    <article className="panel border-l-4 border-l-marker">
      <p className="label">{label}</p>
      <h2 className="mt-1 font-display text-3xl text-marker">
        {formatDate(day.date, dictionary)}
      </h2>

      <dl className="mt-4">
        <Row label={dictionary.readout.culmination} value={formatClockSeconds(day.localNoonHours)} />
        <Row
          label={dictionary.dates.window}
          value={
            day.window
              ? `${formatClock(day.window.startLocalHours)} – ${formatClock(day.window.endLocalHours)}`
              : '—'
          }
        />
        <Row
          label={dictionary.units.seconds}
          value={day.window ? formatDuration(day.window.durationSeconds, dictionary) : '—'}
        />
        <Row
          label={dictionary.dates.residual}
          value={`${formatRatio(day.minShadowRatio)} ${dictionary.readout.perHeight}`}
        />
        <Row label={dictionary.eratosthenes.zenithAngle} value={formatDeg(day.minZenithDeg, 3)} />
      </dl>

      <h3 className="label mt-6">{dictionary.dates.breakdown}</h3>
      <dl className="mt-2">
        <Row
          label={dictionary.dates.fromLongitude}
          value={`${formatMinutes(noon.longitudeOffsetMinutes)} ${dictionary.units.minutes}`}
        />
        <Row
          label={dictionary.dates.fromEot}
          value={`${formatMinutes(noon.eotOffsetMinutes)} ${dictionary.units.minutes}`}
        />
        <Row
          label={dictionary.dates.total}
          value={`${formatMinutes(noon.offsetMinutes)} ${dictionary.units.minutes} ${
            noon.offsetMinutes >= 0 ? dictionary.units.later : dictionary.units.earlier
          }`}
          emphasis
        />
      </dl>
    </article>
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
