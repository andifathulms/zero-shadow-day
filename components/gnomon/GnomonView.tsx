'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePlace } from '@/components/place/PlaceProvider'
import { useReducedMotion } from '@/components/hooks/useReducedMotion'
import { Readout } from '@/components/readout/Readout'
import { DateScrubber } from '@/components/scrubber/DateScrubber'
import { TimeScrubber } from '@/components/scrubber/TimeScrubber'
import { currentYearIn, todayIn } from '@/lib/clock'
import { civilDateFromOffset, dayTrack, instantAt, noonOfYear } from '@/lib/day'
import { formatDate } from '@/lib/format'
import type { Dictionary } from '@/lib/i18n'
import { dayOfYear } from '@/lib/solar/julian'
import { solarPosition } from '@/lib/solar/position'
import { zeroShadowDays } from '@/lib/zsd'
import { GnomonScene } from './GnomonScene'

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

  const [year, setYear] = useState<number | null>(null)
  const [dayIndex, setDayIndex] = useState(0)
  const [localHours, setLocalHours] = useState(12)
  const [playing, setPlaying] = useState(false)

  // Open on today at the place's own clock — a wall-clock reading, so it
  // happens after mount and the exported HTML stays deterministic.
  useEffect(() => {
    const today = todayIn(place.offsetHours)
    setYear(currentYearIn(place.offsetHours))
    setDayIndex(dayOfYear(today) - 1)
  }, [place.offsetHours])

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
          <GnomonScene instant={instant} dictionary={dictionary} />
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
        <p className="mt-2 text-xs text-shadow/55">{dictionary.gnomon.markers}</p>
      </div>
    </div>
  )
}
