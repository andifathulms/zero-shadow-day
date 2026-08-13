'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePlace } from '@/components/place/PlaceProvider'
import { currentYearIn } from '@/lib/clock'
import { formatClock, formatDate, formatDuration, formatRatio } from '@/lib/format'
import type { Dictionary, Locale } from '@/lib/i18n'
import { zeroShadowDays } from '@/lib/zsd'

/**
 * The two dates, compactly. The same result object the dates page expands;
 * computed in lib/zsd, never here.
 */
export function DatesSummary({
  dictionary,
  locale,
  href,
}: {
  dictionary: Dictionary
  locale: Locale
  href?: string
}) {
  const { place } = usePlace()
  // The current year is a wall-clock reading, so it is resolved after mount to
  // keep the exported HTML deterministic.
  const [year, setYear] = useState<number | null>(null)
  useEffect(() => setYear(currentYearIn(place.offsetHours)), [place.offsetHours])

  const result = useMemo(
    () => (year === null ? null : zeroShadowDays(place, year)),
    [place, year],
  )

  if (!result) return <div className="min-h-[7rem]" aria-hidden />

  if (result.type === 'outside-tropics') {
    return (
      <section className="border border-marker/40 bg-marker/5 p-5">
        <p className="font-display text-xl text-marker">{dictionary.dates.outsideTropics}</p>
        <p className="mt-2 max-w-prose text-sm leading-relaxed">
          {dictionary.dates.outsideExplain
            .replace('{gap}', result.minZenithDeg.toFixed(2))
            .replace('{limit}', Math.abs(result.limitDeg).toFixed(2))}
        </p>
      </section>
    )
  }

  return (
    <section>
      <h2 className="label">
        {dictionary.home.yourDates} · {place.label} · {result.year}
      </h2>
      <ul className="mt-3 grid gap-4 sm:grid-cols-2">
        {result.days.map((day, index) => (
          <li key={day.jdCulmination} className="border-l-2 border-marker bg-concrete/20 p-4">
            <p className="label">
              {result.converged
                ? dictionary.dates.only
                : index === 0
                  ? dictionary.dates.first
                  : dictionary.dates.second}
            </p>
            <p className="mt-1 font-display text-2xl text-marker">
              {formatDate(day.date, dictionary)}
            </p>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="label self-center">{dictionary.readout.culmination}</dt>
              <dd className="value">{formatClock(day.localNoonHours)}</dd>
              <dt className="label self-center">{dictionary.dates.window}</dt>
              <dd className="value">
                {day.window
                  ? `${formatClock(day.window.startLocalHours)}–${formatClock(day.window.endLocalHours)} · ${formatDuration(day.window.durationSeconds, dictionary)}`
                  : '—'}
              </dd>
              <dt className="label self-center">{dictionary.dates.residual}</dt>
              <dd className="value">
                {formatRatio(day.minShadowRatio)} {dictionary.readout.perHeight}
              </dd>
            </dl>
          </li>
        ))}
      </ul>
      <p className="mt-3 max-w-prose text-xs leading-relaxed text-shadow/70">
        {dictionary.dates.windowNote}
      </p>
      {href ? (
        <Link
          href={href}
          className="mt-4 inline-block border-b border-shadow pb-0.5 text-sm hover:border-marker hover:text-marker"
        >
          {dictionary.dates.heading} →
        </Link>
      ) : null}
    </section>
  )
}
