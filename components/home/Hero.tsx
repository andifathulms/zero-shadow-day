'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePlace } from '@/components/place/PlaceProvider'
import { useReducedMotion } from '@/components/hooks/useReducedMotion'
import { SkyScene } from '@/components/scene/SkyScene'
import { useCalendarDownload } from '@/components/share/useCalendarDownload'
import { todayIn } from '@/lib/clock'
import { dayTrack, instantAt } from '@/lib/day'
import { formatClock, formatClockSeconds, formatDate, formatZone } from '@/lib/format'
import type { Dictionary, Locale } from '@/lib/i18n'
import type { CivilDate } from '@/lib/solar/julian'
import { nextZeroShadowDay } from '@/lib/zsd'

/** One run of the day, sunrise to sunset, in seconds. */
const LOOP_SECONDS = 16

/**
 * The first screen answers the question a visitor came with: when is my day?
 * The countdown, the date and the culmination time lead; the scene beside them
 * plays today, sunrise to sunset, because watching the shadow swing and
 * shorten explains the idea faster than a paragraph does.
 *
 * Under `prefers-reduced-motion` the scene holds still at culmination.
 */
export function Hero({ dictionary, locale }: { dictionary: Dictionary; locale: Locale }) {
  const { place, openPicker } = usePlace()
  const reducedMotion = useReducedMotion()
  const downloadCalendar = useCalendarDownload(dictionary)
  const [date, setDate] = useState<CivilDate | null>(null)
  const [hours, setHours] = useState(12)

  useEffect(() => setDate(todayIn(place.offsetHours)), [place.offsetHours])

  const track = useMemo(
    () => (date === null ? null : dayTrack(place, date, 5)),
    [place, date],
  )
  const next = useMemo(
    () => (date === null ? null : nextZeroShadowDay(place, date)),
    [place, date],
  )

  const frame = useRef<number>()
  const started = useRef<number>()
  useEffect(() => {
    if (!track || reducedMotion) {
      if (track) setHours(track.noonLocalHours)
      return undefined
    }
    const from = (track.sunriseHours ?? 6) - 0.4
    const to = (track.sunsetHours ?? 18) + 0.4
    const step = (time: number) => {
      if (started.current === undefined) started.current = time
      const progress = (((time - started.current) / 1000) % LOOP_SECONDS) / LOOP_SECONDS
      setHours(from + (to - from) * progress)
      frame.current = window.requestAnimationFrame(step)
    }
    frame.current = window.requestAnimationFrame(step)
    return () => {
      if (frame.current !== undefined) window.cancelAnimationFrame(frame.current)
      started.current = undefined
    }
  }, [track, reducedMotion])

  const instant = useMemo(
    () => (date === null ? null : instantAt(place, date, hours)),
    [place, date, hours],
  )

  const zone = formatZone(place.offsetHours)
  const isId = locale === 'id'
  const primaryName = isId ? dictionary.meta.localName : dictionary.meta.title
  const secondaryName = isId ? dictionary.meta.title : dictionary.meta.localName

  const countdown =
    next?.type === 'next'
      ? next.daysUntil === 0
        ? dictionary.home.today
        : next.daysUntil === 1
          ? dictionary.home.tomorrow
          : dictionary.home.daysLeft.replace('{n}', String(next.daysUntil))
      : null

  return (
    <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12">
      <div>
        <p className="eyebrow">{dictionary.home.kicker}</p>
        <h1 className="mt-3 text-[clamp(2.25rem,5vw,3.5rem)] leading-[1] tracking-[-0.035em]">
          {primaryName}
          <span className="sr-only"> — {secondaryName}</span>
        </h1>
        <p className="mt-4 max-w-[46ch] text-lg leading-relaxed text-shadow-2">
          {dictionary.home.plain}
        </p>

        <div className="mt-7 border-t border-shadow/10 pt-6" aria-live="polite">
          {next === null ? (
            <div className="skeleton h-40" aria-hidden />
          ) : next.type === 'outside-tropics' ? (
            <p className="max-w-prose text-lg">{dictionary.dates.outsideTropics}</p>
          ) : (
            <>
              <p className="flex items-center gap-2 text-sm font-semibold text-shadow-2">
                <span className="h-2 w-2 rounded-full bg-marker" aria-hidden />
                {dictionary.home.nextIn.replace('{place}', place.label)}
              </p>
              <p className="mt-2 font-display text-hero font-extrabold text-marker-ink">
                {countdown}
              </p>
              <p className="mt-3 font-display text-2xl font-semibold tracking-[-0.02em]">
                {formatDate(next.day.date, dictionary)}
              </p>
              <p className="mt-1 font-mono text-sm text-shadow-2 tabular">
                {dictionary.home.culminationAt
                  .replace('{time}', formatClockSeconds(next.day.localNoonHours))
                  .replace('{zone}', zone)}
                {next.day.window
                  ? ` · ${dictionary.home.windowAt
                      .replace('{start}', formatClock(next.day.window.startLocalHours))
                      .replace('{end}', formatClock(next.day.window.endLocalHours))}`
                  : ''}
              </p>
            </>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link href={`/${locale}/bayangan`} className="btn-primary">
            {dictionary.home.enter} <span aria-hidden>→</span>
          </Link>
          {next?.type === 'next' ? (
            <button
              type="button"
              onClick={() => downloadCalendar(next.day.date.year)}
              className="btn"
            >
              <CalendarIcon />
              {dictionary.home.addToCalendar}
            </button>
          ) : null}
          <button type="button" onClick={openPicker} className="btn">
            {dictionary.home.changeLocation}
          </button>
        </div>

        {next?.type === 'next' && next.other ? (
          <p className="mt-6 text-sm text-shadow-2">
            {dictionary.home.otherDate}:{' '}
            <span className="font-semibold text-shadow">{formatDate(next.other.date, dictionary)}</span>
            {next.other.jdCulmination < next.day.jdCulmination ? ` (${dictionary.home.past})` : ''}
            {' · '}
            <Link href={`/${locale}/tanggal`} className="link">
              {dictionary.home.allDates} →
            </Link>
          </p>
        ) : null}
      </div>

      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-sky-night shadow-lift lg:aspect-[5/6]">
        {instant && track ? (
          <SkyScene
            instant={instant}
            daySamples={track.samples}
            labels={dictionary.compass}
            interactive={false}
            height="100%"
            ariaLabel={dictionary.home.sceneLabel}
          />
        ) : null}
        {instant ? (
          <p className="absolute bottom-3 left-3 flex flex-wrap gap-1.5 font-mono text-xs tabular">
            <span className="rounded-md bg-chalk/90 px-2 py-1 backdrop-blur">
              {formatClock(instant.localHours)} {zone}
            </span>
            <span className="rounded-md bg-chalk/90 px-2 py-1 backdrop-blur">
              {dictionary.readout.altitude} {instant.altDeg.toFixed(1)}°
            </span>
            {instant.shadow.type === 'shadow' ? (
              <span className="rounded-md bg-chalk/90 px-2 py-1 backdrop-blur">
                {dictionary.readout.shadowRatio} {instant.shadow.lengthRatio.toFixed(2)}×
              </span>
            ) : null}
          </p>
        ) : null}
      </div>
    </section>
  )
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <rect x="1.5" y="2.5" width="11" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1.5 6h11M4.5 1v3M9.5 1v3" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}
