'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePlace } from '@/components/place/PlaceProvider'
import { ReadoutRow } from '@/components/readout/ReadoutRow'
import { useCalendarDownload } from '@/components/share/useCalendarDownload'
import { todayIn } from '@/lib/clock'
import {
  formatClock,
  formatClockSeconds,
  formatDate,
  formatDateShort,
  formatDeg,
  formatDuration,
  formatLongitude,
  formatMinutes,
  formatRatio,
  formatZone,
} from '@/lib/format'
import type { Dictionary, Locale } from '@/lib/i18n'
import { type CivilDate, julianDay } from '@/lib/solar/julian'
import { solarNoon, zoneMeridianDeg } from '@/lib/solar/noon'
import { daysBetween, longestShadowDay, shadowDirectionTimeline, zeroShadowDays } from '@/lib/zsd'
import type { LongestShadowDay, ShadowDirectionSegment, ZeroShadowDay } from '@/lib/zsd'

/**
 * Both dates in full, with the clock-versus-sun offset broken into its two
 * causes — longitude within the zone, and the equation of time (PRD §5.2).
 */
export function DatesDetail({ dictionary, locale }: { dictionary: Dictionary; locale: Locale }) {
  const { place } = usePlace()
  const [year, setYear] = useState<number | null>(null)
  const [today, setToday] = useState<CivilDate | null>(null)
  useEffect(() => {
    const now = todayIn(place.offsetHours)
    setToday(now)
    setYear(now.year)
  }, [place.offsetHours])
  const downloadCalendar = useCalendarDownload(dictionary)

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

  if (year === null || today === null || result === null || longest === null || segments === null) {
    return <div className="skeleton min-h-[24rem]" aria-hidden />
  }

  return (
    <div className="space-y-8">
      <div className="flex items-baseline gap-4">
        <span className="label">{dictionary.dates.year}</span>
        <div className="flex flex-wrap gap-2">
          {[year - 1, year, year + 1, year + 2].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setYear(option)}
              aria-pressed={option === year}
              className="toggle font-mono tabular"
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <p className="max-w-prose text-sm leading-relaxed text-shadow-2">{dictionary.dates.howFound}</p>

      {result.type === 'outside-tropics' ? (
        <section className="panel">
          <p className="font-display text-2xl">{dictionary.dates.outsideTropics}</p>
          <p className="mt-3 max-w-prose leading-relaxed">
            {dictionary.dates.outsideExplain
              .replace('{gap}', result.minZenithDeg.toFixed(2))
              .replace('{limit}', Math.abs(result.limitDeg).toFixed(2))}
          </p>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-shadow-2">
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
              daysUntil={daysBetween(today, day.date)}
              locale={locale}
              onCalendar={() => downloadCalendar(day.date.year)}
            />
          ))}
        </div>
      )}

      <p className="max-w-prose text-sm leading-relaxed text-shadow-2">
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
      <p className="mt-1 max-w-prose text-sm leading-relaxed text-shadow-2">
        {dictionary.dates.longestLede}
      </p>
      <dl className="mt-4">
        <ReadoutRow label={dictionary.readout.culmination} value={formatClockSeconds(day.localNoonHours)} />
        <ReadoutRow
          label={dictionary.readout.shadowRatio}
          value={`${formatRatio(day.maxShadowRatio)} ${dictionary.readout.perHeight}`}
        />
        <ReadoutRow label={dictionary.eratosthenes.zenithAngle} value={formatDeg(day.maxZenithDeg, 2)} />
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
      <p className="mt-1 max-w-prose text-sm leading-relaxed text-shadow-2">
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
            <span className="text-shadow-2">
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
  daysUntil,
  locale,
  onCalendar,
}: {
  dictionary: Dictionary
  day: ZeroShadowDay
  label: string
  offsetHours: number
  lonDeg: number
  daysUntil: number
  locale: Locale
  onCalendar: () => void
}) {
  // The same solar noon the search used, re-read for its two components.
  const noon = solarNoon(julianDay(day.date), lonDeg, offsetHours)
  const passed = daysUntil < 0
  const badge =
    daysUntil === 0
      ? dictionary.dates.todayBadge
      : passed
        ? dictionary.dates.passed
        : dictionary.dates.daysIn.replace('{n}', String(daysUntil))

  return (
    <article className="panel flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.1em] ${
            passed ? 'bg-concrete text-shadow-2' : 'bg-marker/10 text-marker-ink'
          }`}
        >
          {label} · {badge}
        </span>
        {!passed ? (
          <button type="button" onClick={onCalendar} className="btn py-1.5 text-xs">
            {dictionary.home.addToCalendar}
          </button>
        ) : null}
      </div>

      <h2 className={`text-[clamp(1.75rem,3.5vw,2.5rem)] leading-none ${passed ? 'text-shadow' : 'text-marker-ink'}`}>
        {formatDate(day.date, dictionary)}
      </h2>

      {day.window ? <WindowStrip dictionary={dictionary} day={day} /> : null}

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        <Fact label={dictionary.readout.culmination} value={formatClockSeconds(day.localNoonHours)} />
        <Fact
          label={dictionary.dates.window}
          value={day.window ? formatDuration(day.window.durationSeconds, dictionary) : '—'}
        />
        <Fact label={dictionary.dates.residual} value={`${formatRatio(day.minShadowRatio)}×`} />
        <Fact label={dictionary.eratosthenes.zenithAngle} value={formatDeg(day.minZenithDeg, 3)} />
      </dl>

      <div className="border-t border-shadow/10 pt-4">
        <h3 className="label">{dictionary.dates.whyHeading}</h3>
        <ol className="mt-3 grid gap-2 sm:grid-cols-[repeat(4,minmax(0,1fr))]">
          <Step
            tone="ink"
            value="12:00:00"
            label={dictionary.dates.clockNoon.replace('{zone}', formatZone(offsetHours))}
            note={dictionary.dates.clockNoonNote.replace('{meridian}', String(zoneMeridianDeg(offsetHours)))}
          />
          <Step
            tone="sky"
            value={`${formatMinutes(noon.longitudeOffsetMinutes)} ${dictionary.units.minutes}`}
            label={dictionary.dates.longitudeStep.replace('{lon}', formatLongitude(lonDeg, locale))}
            note={(noon.longitudeOffsetMinutes >= 0 ? dictionary.dates.longitudeWest : dictionary.dates.longitudeEast).replace(
              '{deg}',
              Math.abs(noon.longitudeOffsetMinutes / 4).toFixed(2),
            )}
          />
          <Step
            tone="sun"
            value={`${formatMinutes(noon.eotOffsetMinutes)} ${dictionary.units.minutes}`}
            label={dictionary.dates.eotStep}
            note={dictionary.dates.eotNote}
          />
          <Step
            tone="marker"
            value={`= ${formatClockSeconds(day.localNoonHours)}`}
            label={dictionary.dates.culminationStep}
            note={`${formatMinutes(noon.offsetMinutes)} ${dictionary.units.minutes} · ${
              noon.offsetMinutes >= 0 ? dictionary.units.later : dictionary.units.earlier
            }`}
          />
        </ol>
      </div>
    </article>
  )
}

/**
 * The window as minutes on a strip: "a few minutes" made visible. Eight
 * minutes either side of culmination: wide enough for any window this far
 * inside the tropics, close enough that its width reads.
 */
function WindowStrip({ dictionary, day }: { dictionary: Dictionary; day: ZeroShadowDay }) {
  if (!day.window) return null
  const span = 8 / 60
  const from = day.localNoonHours - span
  const at = (hours: number) => ((hours - from) / (2 * span)) * 100
  return (
    <figure>
      <figcaption className="label">{dictionary.dates.windowLabel}</figcaption>
      <div className="relative mt-3 h-3 rounded-full bg-concrete" aria-hidden>
        <div
          className="absolute inset-y-0 rounded-full bg-marker/25"
          style={{
            left: `${at(day.window.startLocalHours)}%`,
            width: `${at(day.window.endLocalHours) - at(day.window.startLocalHours)}%`,
          }}
        />
        <div className="absolute -top-1.5 h-6 w-1 -translate-x-1/2 rounded bg-marker-ink" style={{ left: '50%' }} />
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[11px] text-shadow-2 tabular">
        <span>{formatClock(from)}</span>
        <span className="text-marker-ink">
          {formatClock(day.window.startLocalHours)}–{formatClock(day.window.endLocalHours)}
        </span>
        <span>{formatClock(day.localNoonHours + span)}</span>
      </div>
    </figure>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="label">{label}</dt>
      <dd className="mt-1 font-mono text-base tabular">{value}</dd>
    </div>
  )
}

const STEP_TONES = {
  ink: 'bg-shadow text-chalk',
  sky: 'bg-sky text-sky-deep',
  sun: 'bg-sun/25 text-sun-ink',
  marker: 'bg-marker-ink text-chalk',
} as const

function Step({
  tone,
  value,
  label,
  note,
}: {
  tone: keyof typeof STEP_TONES
  value: string
  label: string
  note: string
}) {
  return (
    <li className="flex flex-col gap-1.5">
      <span className={`rounded-lg px-2.5 py-2 text-center font-mono text-sm tabular ${STEP_TONES[tone]}`}>{value}</span>
      <span className="text-xs font-semibold">{label}</span>
      <span className="text-xs leading-snug text-shadow-2">{note}</span>
    </li>
  )
}
