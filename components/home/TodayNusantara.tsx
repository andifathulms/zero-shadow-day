'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePlace } from '@/components/place/PlaceProvider'
import { INDONESIAN_CITIES } from '@/data/cities/indonesia'
import { INDONESIA_ISLANDS } from '@/data/geography/indonesia'
import { todayIn } from '@/lib/clock'
import { subsolarOn } from '@/lib/day'
import { formatDateShort, formatLatitude } from '@/lib/format'
import type { Dictionary, Locale } from '@/lib/i18n'
import type { CivilDate } from '@/lib/solar/julian'
import { upcomingZeroShadowDays } from '@/lib/zsd'

const WIDTH = 900
const HEIGHT = 330
const LON_MIN = 94
const LON_MAX = 142
const LAT_MIN = -12
const LAT_MAX = 7
const x = (lon: number) => ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * WIDTH
const y = (lat: number) => HEIGHT - ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * HEIGHT

/** How far ahead "coming up" looks, in days. */
const WINDOW_DAYS = 10

/**
 * Today, across the country: where the sun is overhead, which way it is
 * going, and whose zero shadow day is next. A reason to come back this week.
 *
 * Drawn on the bundled coastline (data/geography), nothing fetched. The band
 * is the sun's own path, so it is ochre; the cities whose day is inside the
 * window are vermilion, and nothing else on the map is.
 */
export function TodayNusantara({ dictionary, locale }: { dictionary: Dictionary; locale: Locale }) {
  const { place } = usePlace()
  const [today, setToday] = useState<CivilDate | null>(null)
  useEffect(() => setToday(todayIn(place.offsetHours)), [place.offsetHours])

  const subsolar = useMemo(() => (today === null ? null : subsolarOn(today, place.offsetHours)), [today, place.offsetHours])
  const soon = useMemo(
    () => (today === null ? null : upcomingZeroShadowDays(INDONESIAN_CITIES, today, WINDOW_DAYS)),
    [today],
  )
  // When the band is north or south of the country there is nothing within
  // the window; say which city is next instead of showing an empty list.
  const nextAnywhere = useMemo(
    () => (today === null || (soon?.length ?? 0) > 0 ? null : upcomingZeroShadowDays(INDONESIAN_CITIES, today, 366)[0] ?? null),
    [today, soon],
  )

  if (today === null || subsolar === null || soon === null) {
    return <div className="skeleton h-96" aria-hidden />
  }

  const highlighted = new Set(soon.map((entry) => entry.place.name))
  const bandLat = Math.max(LAT_MIN - 1, Math.min(LAT_MAX + 1, subsolar.latDeg))
  const listed = soon.slice(0, 8)

  return (
    <section aria-labelledby="nusantara" className="grid items-start gap-4 lg:grid-cols-[19rem_minmax(0,1fr)]">
      <div className="panel flex flex-col gap-5">
        <div>
          <h2 id="nusantara" className="text-2xl">
            {dictionary.home.nusantaraHeading}
          </h2>
          <p className="mt-1 text-sm text-shadow-2">{formatDateShort(today, dictionary)} {today.year}</p>
        </div>
        <div>
          <p className="font-mono text-4xl tracking-[-0.03em] text-sun-ink tabular">
            {formatLatitude(subsolar.latDeg, locale, 1)}
          </p>
          <p className="mt-1 text-sm leading-snug text-shadow-2">
            {dictionary.home.overheadAt},{' '}
            {(subsolar.heading === 'north' ? dictionary.home.headingNorth : dictionary.home.headingSouth).replace(
              '{rate}',
              subsolar.degPerDay.toFixed(2),
            )}
            .
          </p>
        </div>
        <div>
          <p className="label">{dictionary.home.comingUp}</p>
          {listed.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {listed.map((entry) => (
                <li key={entry.place.name} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-semibold">{entry.place.name}</span>
                  <span className="font-mono text-xs text-marker-ink tabular">
                    {entry.daysUntil === 0 ? dictionary.home.today : formatDateShort(entry.day.date, dictionary)}
                  </span>
                </li>
              ))}
            </ul>
          ) : nextAnywhere ? (
            <p className="mt-2 text-sm text-shadow-2">
              {dictionary.home.noneSoon}{' '}
              <span className="font-semibold text-shadow">{nextAnywhere.place.name}</span>,{' '}
              <span className="font-mono tabular">{formatDateShort(nextAnywhere.day.date, dictionary)}</span>
            </p>
          ) : null}
        </div>
        <Link href={`/${locale}/sapuan`} className="link mt-auto text-sm">
          {dictionary.nav.sweep} →
        </Link>
      </div>

      <figure className="overflow-hidden rounded-2xl border border-shadow/10 bg-sky/50">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full" role="img" aria-label={dictionary.home.mapLabel}>
          <g aria-hidden>
            {INDONESIA_ISLANDS.map((island, index) => (
              <polygon
                key={index}
                points={island.map(([lon, lat]) => `${x(lon).toFixed(1)},${y(lat).toFixed(1)}`).join(' ')}
                className="fill-chalk stroke-palm/30"
                strokeWidth={0.75}
              />
            ))}
          </g>
          <line x1={0} x2={WIDTH} y1={y(0)} y2={y(0)} className="stroke-shadow/20" strokeDasharray="4 5" />
          <text x={8} y={y(0) - 6} className="fill-shadow-2 font-mono text-[11px]">0°</text>

          <rect x={0} y={y(bandLat + 0.6)} width={WIDTH} height={y(bandLat - 0.6) - y(bandLat + 0.6)} className="fill-sun/35" />
          <line x1={0} x2={WIDTH} y1={y(bandLat)} y2={y(bandLat)} className="stroke-sun-ink" strokeWidth={1.75} />

          {INDONESIAN_CITIES.map((city) =>
            highlighted.has(city.name) ? null : (
              <circle key={city.name} cx={x(city.lonDeg)} cy={y(city.latDeg)} r={2.5} className="fill-shadow/45" />
            ),
          )}
          {listed.map((entry, index) => (
            <g key={entry.place.name}>
              <circle cx={x(entry.place.lonDeg)} cy={y(entry.place.latDeg)} r={5.5} className="fill-marker stroke-chalk" strokeWidth={2} />
              {/* The band packs the next cities onto one line of latitude, so
                  only the soonest few are named; the list beside names all. */}
              {index < 3 ? (
                <text x={x(entry.place.lonDeg)} y={y(entry.place.latDeg) + (index % 2 === 0 ? -11 : 20)} textAnchor="middle" className="fill-marker-ink stroke-chalk text-[13px] font-bold" strokeWidth={3} paintOrder="stroke">
                  {entry.place.name}
                </text>
              ) : null}
            </g>
          ))}
        </svg>
      </figure>
    </section>
  )
}
