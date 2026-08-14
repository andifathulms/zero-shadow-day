'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePlace } from '@/components/place/PlaceProvider'
import { currentYearIn } from '@/lib/clock'
import { analemma } from '@/lib/day'
import { formatClock, formatDeg, formatMinutes } from '@/lib/format'
import type { Dictionary } from '@/lib/i18n'

/**
 * The analemma: the sun photographed at the same clock time all year.
 *
 * Plotted looking straight up — the zenith at the centre, distance from the
 * centre the angle from overhead, direction the compass bearing. Altitude and
 * azimuth as plain x and y cannot draw this in the tropics: at noon here the
 * sun passes within a degree of the zenith, where the azimuth swings through
 * the whole circle within a couple of days and the figure tears itself apart.
 * Looking up is also what the photograph actually looks like.
 *
 * Sun ochre, because this is the sun's own path (CLAUDE.md invariant 12). The
 * figure-eight is the equation of time made visible — the same quantity that
 * shifts culmination away from 12:00 on the dates page.
 */
export function Analemma({ dictionary }: { dictionary: Dictionary }) {
  const { place } = usePlace()
  const [year, setYear] = useState<number | null>(null)
  const [clockHours, setClockHours] = useState(12)
  useEffect(() => setYear(currentYearIn(place.offsetHours)), [place.offsetHours])

  const points = useMemo(
    () => (year === null ? null : analemma(place, year, clockHours)),
    [place, year, clockHours],
  )

  if (year === null || points === null) return <div className="skeleton min-h-[26rem]" aria-hidden />

  const visible = points.filter((point) => point.altDeg > 0)
  const size = 460
  const centre = size / 2

  if (visible.length === 0) {
    return (
      <div>
        <ClockControl dictionary={dictionary} value={clockHours} onChange={setClockHours} />
        <p className="mt-6 text-sm text-shadow/70">
          {dictionary.readout.noShadow} — {formatClock(clockHours)}
        </p>
      </div>
    )
  }

  // Zenith distance drives the radius, so the centre of the plot is straight up.
  const maxZenith = Math.max(...visible.map((point) => 90 - point.altDeg), 4)
  const radius = (centre - 34) / maxZenith
  const place2d = (altDeg: number, azDeg: number) => {
    const zenith = 90 - altDeg
    const bearing = (azDeg * Math.PI) / 180
    return {
      x: centre + zenith * radius * Math.sin(bearing),
      // North at the top of the plot, as on a map.
      y: centre - zenith * radius * Math.cos(bearing),
    }
  }

  const path = visible
    .map((point, index) => {
      const { x, y } = place2d(point.altDeg, point.azDeg)
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const marks = visible.filter(
    (point) =>
      (point.date.month === 6 && point.date.day === 21) ||
      (point.date.month === 12 && point.date.day === 21),
  )
  const eot = points.map((point) => point.eotMinutes)
  const closest = Math.min(...visible.map((point) => 90 - point.altDeg))

  return (
    <div>
      <ClockControl dictionary={dictionary} value={clockHours} onChange={setClockHours} />

      <figure className="mt-4">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="mx-auto h-auto w-full max-w-[460px] rounded-lg bg-sky/40 shadow-lift"
          role="img"
          aria-label={dictionary.curves.analemmaLede}
        >
          {/* Rings of equal angle from overhead, every ten degrees. */}
          {[10, 20, 30, 40, 50, 60]
            .filter((ring) => ring <= maxZenith + 8)
            .map((ring) => (
              <g key={ring}>
                <circle
                  cx={centre}
                  cy={centre}
                  r={ring * radius}
                  className="fill-none stroke-shadow/20"
                />
                <text
                  x={centre + 4}
                  y={centre - ring * radius - 3}
                  className="fill-shadow/70 font-mono text-[11px]"
                >
                  {ring}°
                </text>
              </g>
            ))}

          <line x1={centre} y1={16} x2={centre} y2={size - 16} className="stroke-shadow/20" />
          <line x1={16} y1={centre} x2={size - 16} y2={centre} className="stroke-shadow/20" />

          <path d={path} className="fill-none stroke-sun-ink" strokeWidth={2.5} />

          {visible
            .filter((point) => point.date.day === 1)
            .map((point) => {
              const { x, y } = place2d(point.altDeg, point.azDeg)
              return <circle key={point.date.month} cx={x} cy={y} r={2.5} className="fill-sun-ink" />
            })}

          {/* The zenith: where the figure crosses it, the shadow is gone. */}
          <circle cx={centre} cy={centre} r={3.5} className="fill-marker" />

          {marks.map((point) => {
            const { x, y } = place2d(point.altDeg, point.azDeg)
            return (
              <g key={point.date.month}>
                <circle cx={x} cy={y} r={4} className="fill-shadow" />
                <text x={x + 8} y={y + 4} className="fill-shadow/70 font-mono text-[11px]">
                  {dictionary.months[point.date.month - 1]}
                </text>
              </g>
            )
          })}

          <text
            x={centre}
            y={14}
            textAnchor="middle"
            className="fill-shadow/70 font-mono text-[11px]"
          >
            {dictionary.compass.north}
          </text>
        </svg>

        <figcaption className="mt-3 space-y-1 text-xs leading-relaxed text-shadow/70">
          <p className="font-mono tabular">
            {dictionary.readout.eot}: {formatMinutes(Math.min(...eot))} …{' '}
            {formatMinutes(Math.max(...eot))} {dictionary.units.minutes}
          </p>
          <p className="max-w-prose">
            {dictionary.curves.analemmaNote.replace('{gap}', formatDeg(closest, 1))}
          </p>
        </figcaption>
      </figure>
    </div>
  )
}

function ClockControl({
  dictionary,
  value,
  onChange,
}: {
  dictionary: Dictionary
  value: number
  onChange: (hours: number) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <label className="label" htmlFor="analemma-clock">
        {dictionary.curves.atClock}
      </label>
      <input
        id="analemma-clock"
        type="range"
        min={5}
        max={19}
        step={0.5}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-56 accent-sun-ink"
      />
      <output className="font-mono tabular text-lg">{formatClock(value)}</output>
    </div>
  )
}
