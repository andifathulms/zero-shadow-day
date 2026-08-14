'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePlace } from '@/components/place/PlaceProvider'
import { currentYearIn } from '@/lib/clock'
import {
  formatClock,
  formatClockSeconds,
  formatDate,
  formatDateShort,
  formatDeg,
  formatDuration,
  formatMinutes,
  formatRatio,
} from '@/lib/format'
import type { Dictionary } from '@/lib/i18n'
import { julianDay } from '@/lib/solar/julian'
import { solarNoon } from '@/lib/solar/noon'
import { longestShadowDay, shadowDirectionTimeline, zeroShadowDays } from '@/lib/zsd'
import type { LongestShadowDay, ShadowDirectionSegment, ZeroShadowDay } from '@/lib/zsd'

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
  // The dual of the search above, and the same search read for direction
  // instead of minimum — both meaningful at any latitude, tropics or not.
  const longest = useMemo(
    () => (year === null ? null : longestShadowDay(place, year)),
    [place, year],
  )
  const segments = useMemo(
    () => (year === null ? null : shadowDirectionTimeline(place, year)),
    [place, year],
  )

  if (year === null || result === null || longest === null || segments === null) {
    return <div className="min-h-[24rem]" aria-hidden />
  }

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
              aria-pressed={option === year}
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
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-shadow/80">
            {dictionary.dates.bestDay
              .replace('{date}', formatDate(result.bestDate, dictionary))
              .replace('{time}', formatClock(result.bestLocalNoonHours))}
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

      <div className="grid gap-6 lg:grid-cols-2">
        <LongestShadowCard dictionary={dictionary} day={longest} />
        <DirectionTimeline dictionary={dictionary} segments={segments} />
      </div>
    </div>
  )
}

/** The dual of the day cards above: the noon shadow's longest day, not its shortest. */
function LongestShadowCard({
  dictionary,
  day,
}: {
  dictionary: Dictionary
  day: LongestShadowDay
}) {
  return (
    <article className="panel">
      <p className="label">{dictionary.dates.longestHeading}</p>
      <h2 className="mt-1 font-display text-2xl">{formatDate(day.date, dictionary)}</h2>
      <p className="mt-1 max-w-prose text-sm leading-relaxed text-shadow/70">
        {dictionary.dates.longestLede}
      </p>
      <dl className="mt-4">
        <Row label={dictionary.readout.culmination} value={formatClockSeconds(day.localNoonHours)} />
        <Row
          label={dictionary.readout.shadowRatio}
          value={`${formatRatio(day.maxShadowRatio)} ${dictionary.readout.perHeight}`}
        />
        <Row label={dictionary.eratosthenes.zenithAngle} value={formatDeg(day.maxZenithDeg, 2)} />
      </dl>
    </article>
  )
}

/** Which way the noon shadow points, as a run of date ranges — the flip made visible. */
function DirectionTimeline({
  dictionary,
  segments,
}: {
  dictionary: Dictionary
  segments: readonly ShadowDirectionSegment[]
}) {
  return (
    <section className="panel">
      <h2 className="label">{dictionary.dates.directionHeading}</h2>
      <p className="mt-1 max-w-prose text-sm leading-relaxed text-shadow/70">
        {segments.length > 1 ? dictionary.dates.directionLede : dictionary.dates.directionLedeOutside}
      </p>
      <ul className="mt-4 space-y-2">
        {segments.map((segment) => (
          <li
            key={`${segment.direction}-${segment.startDate.month}-${segment.startDate.day}`}
            className="flex items-center gap-3 text-sm"
          >
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                segment.direction === 'north' ? 'bg-sky-deep' : 'bg-palm'
              }`}
              aria-hidden
            />
            <span className="value">
              {formatDateShort(segment.startDate, dictionary)} –{' '}
              {formatDateShort(segment.endDate, dictionary)}
            </span>
            <span className="text-shadow/80">
              {dictionary.dates.pointsTo.replace(
                '{direction}',
                segment.direction === 'north' ? dictionary.dates.north : dictionary.dates.south,
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
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
