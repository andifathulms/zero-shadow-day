'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePlace } from '@/components/place/PlaceProvider'
import { currentYearIn } from '@/lib/clock'
import { civilDateFromOffset, shadowTipCurve, shadowTipCurveFamily } from '@/lib/day'
import { formatDate } from '@/lib/format'
import type { Dictionary } from '@/lib/i18n'
import { dayOfYear } from '@/lib/solar/julian'
import { zeroShadowDays } from '@/lib/zsd'

/**
 * The family of shadow-tip curves: a hyperbola on every day but the equinoxes,
 * where the trace is exactly a straight line. This is the figure every ancient
 * sundial was laid out around.
 *
 * Plan view, in gnomon heights — no foreshortening at all here, because the
 * shape of the curve is the whole point.
 */
export function ShadowTipCurves({ dictionary }: { dictionary: Dictionary }) {
  const { place } = usePlace()
  const [year, setYear] = useState<number | null>(null)
  useEffect(() => setYear(currentYearIn(place.offsetHours)), [place.offsetHours])

  const family = useMemo(
    () => (year === null ? null : shadowTipCurveFamily(place, year, 10)),
    [place, year],
  )

  const zsdCurves = useMemo(() => {
    if (year === null) return []
    const result = zeroShadowDays(place, year)
    if (result.type !== 'zero-shadow-days') return []
    return result.days.map((day) => ({
      date: day.date,
      points: shadowTipCurve(place, day.date),
    }))
  }, [place, year])

  const equinoxCurves = useMemo(() => {
    if (year === null) return []
    // The equinoxes to the nearest day: the two dates the trace is straight.
    return [79, 265].map((offset) => {
      const date = civilDateFromOffset(year, offset)
      return { date, points: shadowTipCurve(place, date) }
    })
  }, [place, year])

  if (year === null || family === null) return <div className="min-h-[26rem]" aria-hidden />

  const extent = 4
  const size = 520
  const centre = size / 2
  const scale = centre / extent

  const toPath = (points: ReturnType<typeof shadowTipCurve>): string => {
    let path = ''
    let pen: 'up' | 'down' = 'up'
    for (const point of points) {
      if (point === null) {
        pen = 'up'
        continue
      }
      const x = centre + point.east * scale
      const y = centre - point.north * scale
      path += `${pen === 'up' ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)} `
      pen = 'down'
    }
    return path
  }

  return (
    <figure>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="mx-auto h-auto w-full max-w-[520px] bg-concrete/25"
        role="img"
        aria-label={dictionary.curves.tipLede}
      >
        {[1, 2, 3, 4].map((ring) => (
          <circle
            key={ring}
            cx={centre}
            cy={centre}
            r={ring * scale}
            className="fill-none stroke-shadow/10"
          />
        ))}
        <line x1={0} y1={centre} x2={size} y2={centre} className="stroke-shadow/20" />
        <line x1={centre} y1={0} x2={centre} y2={size} className="stroke-shadow/20" />

        {family.map((entry) => (
          <path
            key={dayOfYear(entry.date)}
            d={toPath(entry.points)}
            className="fill-none stroke-shadow/30"
            strokeWidth={1}
          />
        ))}

        {equinoxCurves.map((entry) => (
          <path
            key={`equinox-${dayOfYear(entry.date)}`}
            d={toPath(entry.points)}
            className="fill-none stroke-shadow"
            strokeWidth={2}
          />
        ))}

        {zsdCurves.map((entry) => (
          <path
            key={`zsd-${dayOfYear(entry.date)}`}
            d={toPath(entry.points)}
            className="fill-none stroke-marker"
            strokeWidth={2}
          />
        ))}

        <circle cx={centre} cy={centre} r={4} className="fill-shadow" />
        <text x={centre} y={16} textAnchor="middle" className="fill-shadow/45 font-mono text-[11px]">
          U
        </text>
      </svg>

      <figcaption className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-shadow/70">
        <span className="flex items-center gap-2">
          <span className="inline-block h-0.5 w-6 bg-shadow" />
          {dictionary.curves.equinox}
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-0.5 w-6 bg-marker" />
          {zsdCurves.map((entry) => formatDate(entry.date, dictionary)).join(' · ')}
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-0.5 w-6 bg-shadow/30" />
          {year}
        </span>
      </figcaption>
    </figure>
  )
}
