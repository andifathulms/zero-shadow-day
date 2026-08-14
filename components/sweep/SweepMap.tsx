'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { INDONESIAN_CITIES } from '@/data/cities/indonesia'
import { usePlace } from '@/components/place/PlaceProvider'
import { useReducedMotion } from '@/components/hooks/useReducedMotion'
import { todayIn } from '@/lib/clock'
import { civilDateFromOffset } from '@/lib/day'
import { formatDate, formatDeg } from '@/lib/format'
import type { Dictionary } from '@/lib/i18n'
import { dayOfYear, daysInYear, julianDay } from '@/lib/solar/julian'
import { solarPosition } from '@/lib/solar/position'
import { zeroShadowDays } from '@/lib/zsd'

/**
 * The subsolar band crossing the archipelago.
 *
 * There is no basemap and no coastline here — that would be a data dependency,
 * and this project has none (CLAUDE.md invariant 3). The country is drawn as
 * what it actually is for this purpose: forty-two coordinates on a latitude
 * and longitude field. The band is the sun's own path, so it is ochre; a city
 * turns vermilion on the day the band reaches it, and nothing else does.
 */
export function SweepMap({ dictionary }: { dictionary: Dictionary }) {
  const { place } = usePlace()
  const [year, setYear] = useState<number | null>(null)
  const [dayIndex, setDayIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const today = todayIn(place.offsetHours)
    setYear(today.year)
    setDayIndex(dayOfYear(today) - 1)
  }, [place.offsetHours])

  // The year in half a minute, so the band can be watched crossing the country
  // rather than dragged across it. Reduced motion steps a week at a time.
  const frame = useRef<number>()
  const started = useRef<number>()
  useEffect(() => {
    if (!playing || year === null) return undefined
    const total = daysInYear(year)

    if (reducedMotion) {
      const timer = window.setInterval(() => {
        setDayIndex((current) => (current + 7) % total)
      }, 500)
      return () => window.clearInterval(timer)
    }

    const step = (time: number) => {
      if (started.current === undefined) started.current = time - (dayIndex / total) * 30000
      setDayIndex(Math.floor((((time - started.current) / 30000) % 1) * total))
      frame.current = window.requestAnimationFrame(step)
    }
    frame.current = window.requestAnimationFrame(step)
    return () => {
      if (frame.current !== undefined) window.cancelAnimationFrame(frame.current)
      started.current = undefined
    }
    // dayIndex is read once to resume from where it stopped, not tracked.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, reducedMotion, year])

  // Each city's two days, once per year rather than once per frame.
  const marks = useMemo(() => {
    if (year === null) return null
    return INDONESIAN_CITIES.map((city) => {
      const result = zeroShadowDays(city, year)
      return {
        city,
        days:
          result.type === 'zero-shadow-days'
            ? result.days.map((day) => ({ date: day.date, index: dayOfYear(day.date) - 1 }))
            : [],
      }
    })
  }, [year])

  if (year === null || marks === null) return <div className="skeleton min-h-[28rem]" aria-hidden />

  const total = daysInYear(year)
  const date = civilDateFromOffset(year, dayIndex)
  const { decDeg } = solarPosition(julianDay(date, 0.25))

  const width = 900
  const height = 340
  const lonMin = 94
  const lonMax = 142
  const latMin = -12
  const latMax = 7
  const x = (lon: number) => ((lon - lonMin) / (lonMax - lonMin)) * width
  const y = (lat: number) => height - ((lat - latMin) / (latMax - latMin)) * height

  const bandHalfWidth = 0.75
  // Which edge the band has gone past, if it is outside the plotted latitudes.
  const beyond: 'north' | 'south' | null =
    decDeg > latMax ? 'north' : decDeg < latMin ? 'south' : null

  return (
    <div className="space-y-4">
      <figure>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full rounded-lg bg-sky/25 shadow-lift"
          role="img"
          aria-label={`${dictionary.sweep.lede} ${formatDate(date, dictionary)}`}
        >
          {/* the equator and the two tropics, the only lines that matter here */}
          {[0].map((lat) => (
            <g key={lat}>
              <line x1={0} y1={y(lat)} x2={width} y2={y(lat)} className="stroke-shadow/25" strokeDasharray="4 4" />
              <text x={6} y={y(lat) - 5} className="fill-shadow/70 font-mono text-[10px]">
                0°
              </text>
            </g>
          ))}

          {/* The subsolar band: the sun's own path. For much of the year it
              sits north or south of the whole country, and drawing nothing
              would leave the map looking simply broken — so it is pinned to the
              edge it has passed beyond, and says where it really is. */}
          {beyond === null ? (
            <>
              <rect
                x={0}
                y={y(decDeg + bandHalfWidth)}
                width={width}
                height={Math.abs(y(decDeg - bandHalfWidth) - y(decDeg + bandHalfWidth))}
                className="fill-sun/30"
              />
              <line
                x1={0}
                y1={y(decDeg)}
                x2={width}
                y2={y(decDeg)}
                className="stroke-sun-ink"
                strokeWidth={2}
              />
              <text
                x={width - 6}
                y={y(decDeg) - 6}
                textAnchor="end"
                className="fill-sun-ink font-mono text-[11px]"
              >
                {formatDeg(decDeg, 2)}
              </text>
            </>
          ) : (
            <>
              <line
                x1={0}
                y1={beyond === 'north' ? 1 : height - 1}
                x2={width}
                y2={beyond === 'north' ? 1 : height - 1}
                className="stroke-sun-ink"
                strokeWidth={2}
                strokeDasharray="7 6"
              />
              <text
                x={width - 6}
                y={beyond === 'north' ? 18 : height - 8}
                textAnchor="end"
                className="fill-sun-ink font-mono text-[11px]"
              >
                {formatDeg(decDeg, 2)} ·{' '}
                {beyond === 'north' ? dictionary.sweep.beyondNorth : dictionary.sweep.beyondSouth}
              </text>
            </>
          )}

          {marks.map(({ city, days }) => {
            const today = days.some((day) => Math.abs(day.index - dayIndex) <= 0)
            const near = days.some((day) => Math.abs(day.index - dayIndex) <= 3)
            return (
              <g key={city.name}>
                <circle
                  cx={x(city.lonDeg)}
                  cy={y(city.latDeg)}
                  r={today ? 6 : 3}
                  className={today ? 'fill-marker' : near ? 'fill-shadow/70' : 'fill-shadow/35'}
                />
                {today ? (
                  <text
                    x={x(city.lonDeg) + 9}
                    y={y(city.latDeg) + 4}
                    className="fill-marker font-mono text-[11px]"
                  >
                    {city.name}
                  </text>
                ) : null}
              </g>
            )
          })}
        </svg>
      </figure>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setPlaying((value) => !value)}
              aria-pressed={playing}
              className="rounded-full border border-shadow/40 px-4 py-2 text-sm transition hover:bg-shadow hover:text-chalk"
            >
              {playing ? dictionary.gnomon.pause : dictionary.sweep.play}
            </button>
            <span className="label">
              {decDeg >= 0 ? dictionary.sweep.northward : dictionary.sweep.southward}
            </span>
          </div>
          <output className="font-mono tabular text-lg">{formatDate(date, dictionary)}</output>
        </div>
        <input
          type="range"
          min={0}
          max={total - 1}
          value={dayIndex}
          onChange={(event) => setDayIndex(Number(event.target.value))}
          className="mt-2 w-full accent-sun"
          aria-label={dictionary.sweep.day}
          aria-valuetext={formatDate(date, dictionary)}
        />
      </div>

      <ol className="grid gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
        {[...marks]
          .filter((mark) => mark.days.length > 0)
          .sort((left, right) => (left.days[0]?.index ?? 0) - (right.days[0]?.index ?? 0))
          .map(({ city, days }) => (
            <li
              key={city.name}
              className="rule flex items-baseline justify-between gap-3 py-1 text-sm"
            >
              <span>{city.name}</span>
              <span className="font-mono tabular text-xs text-shadow/70">
                {days
                  .map((day) => `${day.date.day}/${day.date.month}`)
                  .join(' · ')}
              </span>
            </li>
          ))}
      </ol>
    </div>
  )
}
