'use client'

import { useId } from 'react'
import type { NoonOfYear } from '@/lib/day'
import { formatDate } from '@/lib/format'
import type { Dictionary } from '@/lib/i18n'
import type { CivilDate } from '@/lib/solar/julian'

/**
 * The date control, marked with both zero shadow days.
 *
 * Behind the slider runs the year's noon shadow, so the two collapses towards
 * nothing are visible before the handle reaches them — and the flip from a
 * north-pointing to a south-pointing shadow is drawn as the sign of the curve.
 * Vermilion marks the zero shadow days and nothing else.
 */
export function DateScrubber({
  dictionary,
  year,
  dayIndex,
  onChange,
  noonTrack,
  markedDays,
  date,
}: {
  dictionary: Dictionary
  year: number
  dayIndex: number
  onChange: (dayIndex: number) => void
  noonTrack: readonly NoonOfYear[]
  /** Day-of-year indices (0-based) of the zero shadow days. */
  markedDays: readonly number[]
  date: CivilDate
}) {
  const inputId = useId()
  const total = noonTrack.length
  const width = 1000
  const height = 96
  const mid = height / 2
  const maxRatio = Math.max(...noonTrack.map((day) => Math.abs(day.shadowRatio)), 0.001)

  // A signed profile: north-pointing noon shadows above the line, south-pointing
  // below. Its two zero crossings are the zero shadow days.
  const signed = (day: NoonOfYear): number => {
    const northward = day.bearingDeg === null ? 0 : Math.cos((day.bearingDeg * Math.PI) / 180)
    return day.shadowRatio * Math.sign(northward || 1)
  }

  const path = noonTrack
    .map((day, index) => {
      const x = (index / (total - 1)) * width
      const y = mid - (signed(day) / maxRatio) * (mid - 8)
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  return (
    <div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-24 w-full"
          role="img"
          aria-label={dictionary.gnomon.curveCaption}
        >
          <line x1={0} y1={mid} x2={width} y2={mid} className="stroke-shadow/25" strokeWidth={1} />
          {monthTicks(year).map((tick) => (
            <line
              key={tick.index}
              x1={(tick.index / (total - 1)) * width}
              y1={mid - 5}
              x2={(tick.index / (total - 1)) * width}
              y2={mid + 5}
              className="stroke-shadow/25"
              strokeWidth={1}
            />
          ))}
          <path d={path} className="fill-none stroke-shadow" strokeWidth={1.75} />
          {markedDays.map((marked) => (
            <g key={marked}>
              <line
                x1={(marked / (total - 1)) * width}
                y1={4}
                x2={(marked / (total - 1)) * width}
                y2={height - 4}
                className="stroke-marker"
                strokeWidth={2}
              />
              <circle
                cx={(marked / (total - 1)) * width}
                cy={mid}
                r={4}
                className="fill-marker"
              />
            </g>
          ))}
          <line
            x1={(dayIndex / (total - 1)) * width}
            y1={0}
            x2={(dayIndex / (total - 1)) * width}
            y2={height}
            className="stroke-shadow/70"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        </svg>
      </div>

      <label htmlFor={inputId} className="sr-only">
        {dictionary.gnomon.scrubDate}
      </label>
      <input
        id={inputId}
        type="range"
        min={0}
        max={total - 1}
        step={1}
        value={dayIndex}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-marker"
        aria-valuetext={formatDate(date, dictionary)}
      />
      <div className="mt-1 flex justify-between font-mono tabular text-[11px] text-shadow/70">
        {monthTicks(year).map((tick) => (
          // min-w-0 lets a flex item shrink past its content size: without it,
          // 12 unwrapped labels floor the row wider than a 320px viewport.
          <span key={tick.index} className="min-w-0 truncate">
            {(dictionary.months[tick.month] ?? '').slice(0, 3)}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Day-of-year index of the first of each month. */
function monthTicks(year: number): Array<{ index: number; month: number }> {
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  const lengths = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  const ticks: Array<{ index: number; month: number }> = []
  let index = 0
  for (let month = 0; month < 12; month += 1) {
    ticks.push({ index, month })
    index += lengths[month] ?? 31
  }
  return ticks
}
