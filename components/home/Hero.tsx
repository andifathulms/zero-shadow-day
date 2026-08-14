'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePlace } from '@/components/place/PlaceProvider'
import { useReducedMotion } from '@/components/hooks/useReducedMotion'
import { SkyScene } from '@/components/scene/SkyScene'
import { todayIn } from '@/lib/clock'
import { dayTrack, instantAt } from '@/lib/day'
import { formatClock, formatDate } from '@/lib/format'
import type { Dictionary, Locale } from '@/lib/i18n'
import type { CivilDate } from '@/lib/solar/julian'
import { zeroShadowDays } from '@/lib/zsd'

/** One run of the day, sunrise to sunset, in seconds. */
const LOOP_SECONDS = 16

/**
 * The first thing a visitor sees: the phenomenon happening, with the answer for
 * their own town written over it.
 *
 * The scene plays a whole day in sixteen seconds — the sun climbing, the shadow
 * swinging round and shortening — because that is the one thing the site is
 * about, and it explains itself faster than a paragraph does. Under
 * `prefers-reduced-motion` it holds still at culmination, which is the moment
 * that matters anyway.
 */
export function Hero({ dictionary, locale }: { dictionary: Dictionary; locale: Locale }) {
  const { place } = usePlace()
  const reducedMotion = useReducedMotion()
  const [date, setDate] = useState<CivilDate | null>(null)
  const [hours, setHours] = useState(12)

  useEffect(() => setDate(todayIn(place.offsetHours)), [place.offsetHours])

  const track = useMemo(
    () => (date === null ? null : dayTrack(place, date, 5)),
    [place, date],
  )

  // The next zero shadow day for this place — the headline answer.
  const next = useMemo(() => {
    if (date === null) return null
    for (const year of [date.year, date.year + 1]) {
      const result = zeroShadowDays(place, year)
      if (result.type !== 'zero-shadow-days') return { outside: true as const }
      const upcoming = result.days.find(
        (day) =>
          day.date.year > date.year ||
          day.date.month > date.month ||
          (day.date.month === date.month && day.date.day >= date.day),
      )
      if (upcoming) return { outside: false as const, day: upcoming }
    }
    return null
  }, [place, date])

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

  // Indonesian-first (CLAUDE.md): lead with the Indonesian name on the id
  // locale rather than always leading with the English product name.
  const isId = locale === 'id'
  const primaryName = isId ? dictionary.meta.localName : dictionary.meta.title
  const secondaryName = isId ? dictionary.meta.title : dictionary.meta.localName

  return (
    <section className="relative isolate overflow-hidden rounded-xl bg-sky-night shadow-lift">
      <div className="absolute inset-0">
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
      </div>

      {/* A scrim, so the type stays legible whatever the sky is doing. */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-shadow/90 via-shadow/25 to-transparent"
        aria-hidden
      />

      <div className="relative flex min-h-[clamp(26rem,72vh,42rem)] flex-col justify-end p-6 sm:p-10">
        <p className="label text-chalk/80">{dictionary.home.kicker}</p>
        <h1 className="mt-3 max-w-[16ch] font-display text-hero text-chalk">{primaryName}</h1>
        <p className="mt-2 font-display text-2xl text-chalk/75 sm:text-3xl">{secondaryName}</p>
        <p className="mt-5 max-w-[46ch] text-lede text-chalk/90">{dictionary.home.plain}</p>

        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
          <Link
            href={`/${locale}/bayangan`}
            className="rounded-full bg-chalk px-6 py-3 text-sm font-medium text-shadow transition hover:bg-sun"
          >
            {dictionary.home.enter}
          </Link>

          {next && !next.outside ? (
            <p className="text-chalk/90">
              <span className="label block text-chalk/70">
                {dictionary.home.nextIn.replace('{place}', place.label)}
              </span>
              <span className="font-mono tabular text-lg text-chalk">
                {formatDate(next.day.date, dictionary)} · {formatClock(next.day.localNoonHours)}
              </span>
            </p>
          ) : null}
          {next?.outside ? (
            <p className="max-w-prose text-sm text-chalk/85">{dictionary.dates.outsideTropics}</p>
          ) : null}
          {next ? (
            <Link
              href={`/${locale}#tempat`}
              className="text-sm text-chalk/80 underline decoration-chalk/40 underline-offset-4 hover:text-chalk"
            >
              {dictionary.home.changeLocation}
            </Link>
          ) : null}
        </div>

        {instant ? (
          <p className="mt-6 font-mono tabular text-xs text-chalk/70">
            {formatClock(instant.localHours)} · {dictionary.readout.altitude}{' '}
            {instant.altDeg.toFixed(1)}°
            {instant.shadow.type === 'shadow'
              ? ` · ${dictionary.readout.shadowRatio} ${instant.shadow.lengthRatio.toFixed(2)}×`
              : ''}
            {' · '}
            <Link href={`/${locale}#kenapa`} className="underline decoration-chalk/40 hover:text-chalk">
              {dictionary.home.howLink}
            </Link>
          </p>
        ) : null}

        <p className="mt-4 max-w-prose text-xs text-chalk/80">
          {dictionary.method.disclaimer}{' '}
          <Link
            href={`/${locale}/metode`}
            className="underline decoration-chalk/40 underline-offset-2 hover:text-chalk"
          >
            {dictionary.nav.method}
          </Link>
        </p>
      </div>
    </section>
  )
}
