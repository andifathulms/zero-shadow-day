'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { usePlace } from '@/components/place/PlaceProvider'
import { useReducedMotion } from '@/components/hooks/useReducedMotion'
import { Readout } from '@/components/readout/Readout'
import { DateScrubber } from '@/components/scrubber/DateScrubber'
import { TimeScrubber } from '@/components/scrubber/TimeScrubber'
import { todayIn } from '@/lib/clock'
import { type Instant, civilDateFromOffset, dayTrack, instantAt, noonOfYear } from '@/lib/day'
import { formatDate } from '@/lib/format'
import type { Dictionary } from '@/lib/i18n'
import { dayOfYear } from '@/lib/solar/julian'
import { solarPosition } from '@/lib/solar/position'
import { zeroShadowDays } from '@/lib/zsd'
import { formatBearing, formatDeg, formatRatio } from '@/lib/format'
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

  if (year === null || date === null || track === null || instant === null || noonTrack === null) {
    return <div className="min-h-[32rem]" aria-hidden />
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_16rem]">
        <div>
          <SkyScene
            instant={instant}
            daySamples={track.samples}
            labels={dictionary.compass}
            ariaLabel={sceneDescription(instant, dictionary)}
            describedById={dragHintId}
            height={480}
            className="rounded-lg shadow-lift"
          />
          <p id={dragHintId} className="mt-2 text-xs text-shadow/70">
            {dictionary.gnomon.drag}
          </p>
          <p className="mt-3 font-display text-2xl">
            {formatDate(date, dictionary)}
            {markedDays.includes(dayIndex) ? (
              <span className="ml-3 align-middle text-base text-marker">
                — {dictionary.meta.title}
              </span>
            ) : null}
          </p>
        </div>

        <Readout
          dictionary={dictionary}
          date={date}
          instant={instant}
          noonLocalHours={track.noonLocalHours}
          eotMinutes={solarPosition(instant.jd).eotMinutes}
          latDeg={place.latDeg}
        />
      </div>

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

      <div>
        <DateScrubber
          dictionary={dictionary}
          year={year}
          dayIndex={dayIndex}
          onChange={setDayIndex}
          noonTrack={noonTrack}
          markedDays={markedDays}
          date={date}
        />
        <p className="mt-2 text-xs text-shadow/70">{dictionary.gnomon.markers}</p>
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
