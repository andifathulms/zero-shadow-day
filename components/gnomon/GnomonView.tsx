'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { usePlace } from '@/components/place/PlaceProvider'
import { useReducedMotion } from '@/components/hooks/useReducedMotion'
import { Readout } from '@/components/readout/Readout'
import { DateScrubber } from '@/components/scrubber/DateScrubber'
import { TimeScrubber } from '@/components/scrubber/TimeScrubber'
import { todayIn } from '@/lib/clock'
import { type Instant, civilDateFromOffset, dayTrack, instantAt, noonOfYear } from '@/lib/day'
import type { Dictionary } from '@/lib/i18n'
import { dayOfYear } from '@/lib/solar/julian'
import { solarPosition } from '@/lib/solar/position'
import { zeroShadowDays } from '@/lib/zsd'
import { formatBearing, formatClock, formatDate, formatDeg, formatRatio, formatSignedDeg } from '@/lib/format'
import { ShareBar } from '@/components/share/ShareBar'
import { useSharedView } from '@/components/share/useSharedView'
import { SkyScene } from '@/components/scene/SkyScene'

/** How many local hours pass per second of animation. A day in twelve seconds. */
const HOURS_PER_SECOND = 2

/**
 * The signature view: drag the date and watch the noon shadow shorten towards
 * nothing as the zero shadow day approaches, then lengthen again, flipping from
 * south to north as the sun crosses the latitude.
 *
 * Every number comes from lib/; this component holds state and draws.
 */
export function GnomonView({ dictionary }: { dictionary: Dictionary }) {
  const { place } = usePlace()
  const reducedMotion = useReducedMotion()
  const dragHintId = useId()

  const [year, setYear] = useState<number | null>(null)
  const [dayIndex, setDayIndex] = useState(0)
  const [localHours, setLocalHours] = useState(12)
  const [playing, setPlaying] = useState(false)

  // Open on the shared date and time when the reader followed a link, and
  // otherwise on today at the place's own clock. Both are resolved after mount:
  // the wall clock so the exported HTML stays deterministic, the link because
  // the query string is not known at build time.
  const { view: shared, ready } = useSharedView()
  useEffect(() => {
    if (!ready) return
    const opening = shared?.date ?? todayIn(place.offsetHours)
    setYear(opening.year)
    setDayIndex(dayOfYear(opening) - 1)
    if (shared?.localHours !== undefined) setLocalHours(shared.localHours)
  }, [ready, shared, place.offsetHours])

  const date = useMemo(
    () => (year === null ? null : civilDateFromOffset(year, dayIndex)),
    [year, dayIndex],
  )

  const track = useMemo(
    () => (date === null ? null : dayTrack(place, date, reducedMotion ? 60 : 5)),
    [place, date, reducedMotion],
  )

  const noonTrack = useMemo(
    () => (year === null ? null : noonOfYear(place, year)),
    [place, year],
  )

  const zsd = useMemo(
    () => (year === null ? null : zeroShadowDays(place, year)),
    [place, year],
  )

  const markedDays = useMemo(() => {
    if (!zsd || zsd.type !== 'zero-shadow-days') return []
    return zsd.days.map((day) => dayOfYear(day.date) - 1)
  }, [zsd])

  const instant = useMemo(
    () => (date === null ? null : instantAt(place, date, localHours)),
    [place, date, localHours],
  )

  // The one orchestrated moment: the shadow sweeping through the day.
  const frame = useRef<number>()
  const last = useRef<number>()
  useEffect(() => {
    if (!playing) return undefined

    if (reducedMotion) {
      const timer = window.setInterval(() => {
        setLocalHours((hours) => (hours + 1) % 24)
      }, 700)
      return () => window.clearInterval(timer)
    }

    const step = (time: number) => {
      if (last.current !== undefined) {
        const elapsed = (time - last.current) / 1000
        setLocalHours((hours) => (hours + elapsed * HOURS_PER_SECOND) % 24)
      }
      last.current = time
      frame.current = window.requestAnimationFrame(step)
    }
    frame.current = window.requestAnimationFrame(step)
    return () => {
      if (frame.current !== undefined) window.cancelAnimationFrame(frame.current)
      last.current = undefined
    }
  }, [playing, reducedMotion])

  // Dropping the date handle within a day of a zero shadow day lands on it:
  // the day is a single date, and a near miss by one reads as the wrong answer.
  const snapToDay = (index: number) => {
    const target = markedDays.find((marked) => Math.abs(marked - index) <= 1)
    if (target === undefined || target === index) return
    setDayIndex(target)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(12)
  }

  // The next zero shadow day at culmination, from the date shown.
  const jumpToDay = () => {
    if (!zsd || zsd.type !== 'zero-shadow-days' || markedDays.length === 0) return
    const ahead = markedDays.findIndex((marked) => marked > dayIndex)
    const index = ahead >= 0 ? ahead : 0
    const target = markedDays[index]
    const day = zsd.days[index]
    if (target === undefined || day === undefined) return
    setPlaying(false)
    setDayIndex(target)
    setLocalHours(day.localNoonHours)
  }

  // Space plays the day, Z jumps to the next zero shadow day — except while
  // typing, and except on a control that already owns the key.
  const jumpRef = useRef(jumpToDay)
  jumpRef.current = jumpToDay
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && target.closest('input, textarea, select, button, [contenteditable], dialog')) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key === ' ') {
        event.preventDefault()
        setPlaying((value) => !value)
      } else if (event.key === 'z' || event.key === 'Z') {
        jumpRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (year === null || date === null || track === null || instant === null || noonTrack === null) {
    return <div className="skeleton min-h-[32rem]" aria-hidden />
  }

  const onDay = markedDays.includes(dayIndex)
  const zsdToday = onDay && zsd?.type === 'zero-shadow-days'
    ? zsd.days[markedDays.indexOf(dayIndex)]
    : undefined

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="relative lg:col-start-1 lg:row-start-1">
          <SkyScene
            instant={instant}
            daySamples={track.samples}
            labels={dictionary.compass}
            ariaLabel={sceneDescription(instant, dictionary)}
            describedById={dragHintId}
            height="clamp(19rem, 40vw, 27rem)"
            className="rounded-3xl bg-sky-night shadow-lift"
          />
          <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
            <span className="rounded-lg bg-chalk/90 px-2.5 py-1 font-display text-sm font-semibold backdrop-blur">
              {formatDate(date, dictionary)}
            </span>
            {onDay ? (
              <span className="rounded-lg bg-marker-ink px-2.5 py-1 text-sm font-semibold text-chalk">
                {dictionary.meta.localName}
              </span>
            ) : null}
          </div>
          <p id={dragHintId} className="mt-2 text-xs text-shadow-2">
            {dictionary.gnomon.drag}
          </p>
        </div>

        <div className="panel space-y-6 lg:col-span-2 lg:row-start-2">
          <TimeScrubber
            dictionary={dictionary}
            localHours={localHours}
            onChange={setLocalHours}
            sunriseHours={track.sunriseHours}
            sunsetHours={track.sunsetHours}
            noonLocalHours={track.noonLocalHours}
            playing={playing}
            onTogglePlay={() => setPlaying((value) => !value)}
            reducedMotion={reducedMotion}
          />
          <div className="border-t border-shadow/10 pt-5">
            <DateScrubber
              dictionary={dictionary}
              year={year}
              dayIndex={dayIndex}
              onChange={setDayIndex}
              onCommit={snapToDay}
              noonTrack={noonTrack}
              markedDays={markedDays}
              date={date}
            />
            <p className="mt-2 text-xs leading-relaxed text-shadow-2">{dictionary.gnomon.curveCaption}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-shadow/10 pt-4">
            {markedDays.length > 0 ? (
              <button type="button" onClick={jumpToDay} className="btn">
                <span className="h-2 w-2 rounded-full bg-marker" aria-hidden />
                {dictionary.gnomon.jumpToDay}
              </button>
            ) : null}
            <p className="hidden text-xs text-shadow-2 md:block">{dictionary.gnomon.shortcuts}</p>
          </div>
        </div>

        <aside className="flex flex-col gap-4 lg:col-start-2 lg:row-start-1">
          <Readout
            dictionary={dictionary}
            date={date}
            instant={instant}
            noonLocalHours={track.noonLocalHours}
            eotMinutes={solarPosition(instant.jd).eotMinutes}
            latDeg={place.latDeg}
            onZeroShadowDay={onDay}
          />
          <p className="rounded-xl bg-sky/70 px-3 py-2.5 text-sm leading-relaxed">
            {zsdToday
              ? dictionary.gnomon.onDay.replace('{time}', formatClock(zsdToday.localNoonHours))
              : dictionary.gnomon.gap
                  .replace('{lat}', formatSignedDeg(place.latDeg))
                  .replace('{dec}', formatSignedDeg(instant.decDeg))
                  .replace('{gap}', Math.abs(place.latDeg - instant.decDeg).toFixed(2))}{' '}
            <span className="text-shadow-2">{dictionary.readout.convergeHint}</span>
          </p>
        </aside>
      </div>

      {/* A link that reproduces exactly this place, date and time. */}
      <ShareBar dictionary={dictionary} date={date} localHours={localHours} year={year} />
    </div>
  )
}

/** What the scene shows, for a reader who cannot see it. */
function sceneDescription(instant: Instant, dictionary: Dictionary): string {
  switch (instant.shadow.type) {
    case 'shadow':
      return `${dictionary.readout.altitude} ${formatDeg(instant.altDeg)}. ${dictionary.readout.shadowRatio} ${formatRatio(instant.shadow.lengthRatio)} ${dictionary.readout.perHeight}, ${dictionary.readout.shadowBearing} ${formatBearing(instant.shadow.bearingDeg)}.`
    case 'zenith':
      return dictionary.readout.zenith
    case 'no-shadow':
      return dictionary.readout.noShadow
    default: {
      const never: never = instant.shadow
      return never
    }
  }
}
