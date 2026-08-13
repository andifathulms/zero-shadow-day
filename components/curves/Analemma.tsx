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

  if (year === null || points === null) return <div className="min-h-[26rem]" aria-hidden />

  const visible = points.filter((point) => point.altDeg > -6)
  const width = 520
  const height = 420
  const pad = 40

  if (visible.length === 0) {
    return (
      <p className="py-10 text-sm text-shadow/70">
        {dictionary.readout.noShadow} — {formatClock(clockHours)}
      </p>
    )
  }

  // Azimuth is unwrapped about the mean so a figure crossing due north does not
  // tear at the 0/360 seam.
  const mean = visible.reduce((sum, point) => sum + point.azDeg, 0) / visible.length
  const unwrapped = visible.map((point) => ({
    ...point,
    az: point.azDeg - mean > 180 ? point.azDeg - 360 : point.azDeg - mean < -180 ? point.azDeg + 360 : point.azDeg,
  }))

  const azMin = Math.min(...unwrapped.map((point) => point.az))
  const azMax = Math.max(...unwrapped.map((point) => point.az))
  const altMin = Math.min(...unwrapped.map((point) => point.altDeg))
  const altMax = Math.max(...unwrapped.map((point) => point.altDeg))

  const x = (az: number) => pad + ((az - azMin) / Math.max(azMax - azMin, 1e-6)) * (width - 2 * pad)
  const y = (alt: number) =>
    height - pad - ((alt - altMin) / Math.max(altMax - altMin, 1e-6)) * (height - 2 * pad)

  const path = unwrapped
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${x(point.az).toFixed(1)},${y(point.altDeg).toFixed(1)}`)
    .join(' ')

  const solsticeMarks = unwrapped.filter(
    (point) => (point.date.month === 6 && point.date.day === 21) || (point.date.month === 12 && point.date.day === 21),
  )

  const eot = points.map((point) => point.eotMinutes)

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-4">
        <label className="label" htmlFor="analemma-clock">
          {dictionary.curves.atClock}
        </label>
        <input
          id="analemma-clock"
          type="range"
          min={5}
          max={19}
          step={0.5}
          value={clockHours}
          onChange={(event) => setClockHours(Number(event.target.value))}
          className="w-56 accent-sun"
        />
        <output className="font-mono tabular text-lg">{formatClock(clockHours)}</output>
      </div>

      <figure className="mt-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="mx-auto h-auto w-full max-w-[520px] bg-sky/40"
          role="img"
          aria-label={dictionary.curves.analemmaLede}
        >
          <path d={path} className="fill-none stroke-sun-ink" strokeWidth={2} />
          {unwrapped
            .filter((point) => point.date.day === 1)
            .map((point) => (
              <circle
                key={`${point.date.month}`}
                cx={x(point.az)}
                cy={y(point.altDeg)}
                r={2.5}
                className="fill-sun-ink"
              />
            ))}
          {solsticeMarks.map((point) => (
            <g key={`solstice-${point.date.month}`}>
              <circle cx={x(point.az)} cy={y(point.altDeg)} r={4} className="fill-shadow" />
              <text
                x={x(point.az) + 8}
                y={y(point.altDeg) + 4}
                className="fill-shadow/70 font-mono text-[10px]"
              >
                {dictionary.months[point.date.month - 1]}
              </text>
            </g>
          ))}
          <text x={pad} y={height - 12} className="fill-shadow/70 font-mono text-[11px]">
            {dictionary.readout.azimuth}: {formatDeg(azMin + mean, 0)} → {formatDeg(azMax + mean, 0)}
          </text>
          <text x={pad} y={22} className="fill-shadow/70 font-mono text-[11px]">
            {dictionary.readout.altitude}: {formatDeg(altMax, 0)}
          </text>
        </svg>
        <figcaption className="mt-3 font-mono tabular text-xs text-shadow/70">
          {dictionary.readout.eot}: {formatMinutes(Math.min(...eot))} …{' '}
          {formatMinutes(Math.max(...eot))} {dictionary.units.minutes}
        </figcaption>
      </figure>
    </div>
  )
}
