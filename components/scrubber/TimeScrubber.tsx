'use client'

import { useId } from 'react'
import { formatClock } from '@/lib/format'
import type { Dictionary } from '@/lib/i18n'

/**
 * The time control. Sunrise, culmination and sunset are marked; culmination in
 * sun ochre, because that is the sun's own path.
 */
export function TimeScrubber({
  dictionary,
  localHours,
  onChange,
  sunriseHours,
  sunsetHours,
  noonLocalHours,
  playing,
  onTogglePlay,
  reducedMotion,
}: {
  dictionary: Dictionary
  localHours: number
  onChange: (hours: number) => void
  sunriseHours: number | null
  sunsetHours: number | null
  noonLocalHours: number
  playing: boolean
  onTogglePlay: () => void
  reducedMotion: boolean
}) {
  const inputId = useId()
  const percent = (hours: number) => `${(hours / 24) * 100}%`

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <button
          type="button"
          onClick={onTogglePlay}
          className="border border-shadow/40 px-3 py-1.5 text-sm hover:bg-shadow hover:text-bleached"
          aria-pressed={playing}
        >
          {playing ? dictionary.gnomon.pause : dictionary.gnomon.play}
        </button>
        <output className="font-mono tabular text-lg">{formatClock(localHours)}</output>
      </div>

      <div className="relative mt-3 h-3">
        <div className="absolute inset-x-0 top-1 h-1 bg-shadow/15" />
        {sunriseHours !== null && sunsetHours !== null ? (
          <div
            className="absolute top-1 h-1 bg-sky"
            style={{
              left: percent(sunriseHours),
              width: `${((sunsetHours - sunriseHours) / 24) * 100}%`,
            }}
          />
        ) : null}
        <div
          className="absolute top-0 h-3 w-px bg-sun"
          style={{ left: percent(noonLocalHours) }}
          aria-hidden
        />
      </div>

      <label htmlFor={inputId} className="sr-only">
        {dictionary.gnomon.scrubTime}
      </label>
      <input
        id={inputId}
        type="range"
        min={0}
        max={1440}
        step={reducedMotion ? 60 : 1}
        value={Math.round(localHours * 60)}
        onChange={(event) => onChange(Number(event.target.value) / 60)}
        className="w-full accent-shadow"
        aria-valuetext={formatClock(localHours)}
      />
      <div className="flex justify-between font-mono tabular text-[11px] text-shadow/50">
        <span>00:00</span>
        <span>{sunriseHours === null ? '—' : formatClock(sunriseHours)}</span>
        <span className="text-sun">{formatClock(noonLocalHours)}</span>
        <span>{sunsetHours === null ? '—' : formatClock(sunsetHours)}</span>
        <span>24:00</span>
      </div>
      {reducedMotion ? (
        <p className="mt-2 text-xs text-shadow/55">{dictionary.gnomon.reducedMotion}</p>
      ) : null}
    </div>
  )
}
