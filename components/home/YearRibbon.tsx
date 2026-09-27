'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePlace } from '@/components/place/PlaceProvider'
import { todayIn } from '@/lib/clock'
import { noonOfYear } from '@/lib/day'
import { formatDateShort, formatLatitude } from '@/lib/format'
import type { Dictionary, Locale } from '@/lib/i18n'
import { dayOfYear, type CivilDate } from '@/lib/solar/julian'
import { zeroShadowDays } from '@/lib/zsd'

const WIDTH = 1000
const HEIGHT = 260
const LEFT = 52
const RIGHT = 988
const TOP = 16
const BOTTOM = 220
const SPAN_DEG = 25

/** Indonesia's latitude span, Sabang to Rote, for the shaded band. */
const BAND_NORTH_DEG = 6
const BAND_SOUTH_DEG = -11

/**
 * The whole phenomenon in one chart: the sun's latitude through the year (the
 * declination at each day's culmination) crossing the reader's own latitude.
 * The two crossings are the two zero shadow days.
 *
 * The curve is the sun's own path, so it is ochre; the crossings are vermilion,
 * and nothing else on it is. Every value comes from lib/day and lib/zsd.
 */
export function YearRibbon({ dictionary, locale }: { dictionary: Dictionary; locale: Locale }) {
  const { place } = usePlace()
  const [today, setToday] = useState<CivilDate | null>(null)
  useEffect(() => setToday(todayIn(place.offsetHours)), [place.offsetHours])

  const year = today?.year ?? null
  const noons = useMemo(() => (year === null ? null : noonOfYear(place, year)), [place, year])
  const result = useMemo(() => (year === null ? null : zeroShadowDays(place, year)), [place, year])

  // On a narrow screen the chart scrolls sideways; open it on today rather
  // than on January, so the reader's own crossing is in view.
  const scroller = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const element = scroller.current
    if (!element || today === null || element.scrollWidth <= element.clientWidth) return
    const fraction = (dayOfYear(today) - 1) / 365
    element.scrollLeft = fraction * element.scrollWidth - element.clientWidth / 2
  }, [today, noons])

  if (today === null || noons === null || result === null) {
    return <div className="skeleton h-72" aria-hidden />
  }

  const total = noons.length
  const x = (index: number) => LEFT + (index / (total - 1)) * (RIGHT - LEFT)
  const y = (deg: number) =>
    TOP + ((SPAN_DEG - Math.max(-SPAN_DEG, Math.min(SPAN_DEG, deg))) / (2 * SPAN_DEG)) * (BOTTOM - TOP)

  const path = noons
    .map((noon, index) => `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)},${y(noon.decDeg).toFixed(1)}`)
    .join(' ')
  const crossings = result.type === 'zero-shadow-days' ? result.days : []
  const todayIndex = dayOfYear(today) - 1
  const todayDec = noons[todayIndex]?.decDeg ?? 0
  const months = monthStarts(noons.map((noon) => noon.date.month))
  const placeLat = Math.max(-SPAN_DEG, Math.min(SPAN_DEG, place.latDeg))
  const dates = crossings.map((day) => formatDateShort(day.date, dictionary)).join(', ')

  return (
    <figure className="panel">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="text-2xl">{dictionary.home.ribbonHeading.replace('{year}', String(year))}</h2>
        <p className="max-w-[52ch] text-sm text-shadow-2">{dictionary.home.ribbonNote}</p>
      </figcaption>
      <div ref={scroller} className="-mx-2 mt-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full min-w-[36rem]"
          role="img"
          aria-label={dictionary.home.ribbonLabel.replace('{place}', place.label).replace('{dates}', dates)}
        >
          <rect
            x={LEFT}
            y={y(BAND_NORTH_DEG)}
            width={RIGHT - LEFT}
            height={y(BAND_SOUTH_DEG) - y(BAND_NORTH_DEG)}
            className="fill-palm/10"
          />
          <text x={LEFT + 8} y={y(BAND_NORTH_DEG) + 15} className="fill-palm text-[12px] font-semibold">
            {dictionary.home.ribbonBand} {formatLatitude(BAND_NORTH_DEG, locale, 0)} – {formatLatitude(BAND_SOUTH_DEG, locale, 0)}
          </text>

          {[23.44, 0, -23.44].map((deg) => (
            <g key={deg}>
              <line
                x1={LEFT}
                x2={RIGHT}
                y1={y(deg)}
                y2={y(deg)}
                className={deg === 0 ? 'stroke-shadow/25' : 'stroke-shadow/15'}
                strokeDasharray={deg === 0 ? undefined : '3 5'}
              />
              <text x={LEFT - 8} y={y(deg) + 4} textAnchor="end" className="fill-shadow-2 font-mono text-[11px]">
                {deg === 0 ? '0°' : `${deg > 0 ? '+' : '−'}${Math.abs(deg).toFixed(1)}°`}
              </text>
            </g>
          ))}

          {months.map(({ index, month }) => (
            <g key={month}>
              <line x1={x(index)} x2={x(index)} y1={BOTTOM} y2={BOTTOM + 5} className="stroke-shadow/25" />
              <text x={x(index) + 4} y={BOTTOM + 22} className="fill-shadow-2 text-[11px]">
                {(dictionary.months[month - 1] ?? '').slice(0, 3)}
              </text>
            </g>
          ))}

          <line x1={LEFT} x2={RIGHT} y1={y(placeLat)} y2={y(placeLat)} className="stroke-shadow" strokeWidth={1.75} />
          <text x={RIGHT - 4} y={y(placeLat) + (placeLat > 0 ? -8 : 17)} textAnchor="end" className="fill-shadow text-[12px] font-bold">
            {place.label} {formatLatitude(place.latDeg, locale, 2)}
          </text>

          <path d={path} className="fill-none stroke-sun-ink" strokeWidth={2.5} />

          <line x1={x(todayIndex)} x2={x(todayIndex)} y1={TOP} y2={BOTTOM} className="stroke-sky-deep" strokeWidth={1.5} strokeDasharray="4 4" />
          <circle cx={x(todayIndex)} cy={y(todayDec)} r={4.5} className="fill-sky-deep" />
          <text x={x(todayIndex) + (todayIndex > total * 0.85 ? -6 : 6)} y={TOP + 10} textAnchor={todayIndex > total * 0.85 ? 'end' : 'start'} className="fill-sky-deep text-[11px] font-semibold">
            {dictionary.home.ribbonToday}
          </text>

          {crossings.map((day) => {
            const index = dayOfYear(day.date) - 1
            return (
              <g key={day.jdCulmination}>
                <circle cx={x(index)} cy={y(placeLat)} r={7} className="fill-marker stroke-chalk" strokeWidth={2.5} />
                <text x={x(index)} y={y(placeLat) - 13} textAnchor="middle" className="fill-marker-ink font-mono text-[12px] font-medium">
                  {formatDateShort(day.date, dictionary)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </figure>
  )
}

/** Index of the first day of each month, from the months of the year's days. */
function monthStarts(months: readonly number[]): Array<{ index: number; month: number }> {
  return months.flatMap((month, index) => (index === 0 || months[index - 1] !== month ? [{ index, month }] : []))
}
