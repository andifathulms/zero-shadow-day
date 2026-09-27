'use client'

import { useId } from 'react'
import { formatClock } from '@/lib/format'
import type { Dictionary } from '@/lib/i18n'

/**
 * The time control. Sunrise, culmination and sunset are marked; daylight and
 * culmination in sun ochre, because that is the sun's own path. The play
 * button sits beside it, so the hand never leaves the dock.
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
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4">
      <button
        type="button"
        onClick={onTogglePlay}
        aria-pressed={playing}
        aria-label={playing ? dictionary.gnomon.pause : dictionary.gnomon.play}
        title={playing ? dictionary.gnomon.pause : dictionary.gnomon.play}
        className="mt-1 grid h-12 w-12 place-items-center rounded-full bg-sky-deep text-chalk transition hover:shadow-press hover:brightness-110"
      >
        {playing ? (
          <svg width="16" height="16" viewBox="0 0 14 14" aria-hidden>
            <path d="M3 1.5h3v11H3zM8 1.5h3v11H8z" fill="currentColor" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 14 14" aria-hidden>
            <path d="M3.5 1.5v11l9-5.5z" fill="currentColor" />
          </svg>
        )}
      </button>

      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <label htmlFor={inputId} className="label">
            {dictionary.gnomon.time}
          </label>
          <output htmlFor={inputId} className="font-mono text-lg tabular">
            {formatClock(localHours)}
          </output>
        </div>

        <div className="relative mt-2 h-2 rounded-full bg-concrete" aria-hidden>
          {sunriseHours !== null && sunsetHours !== null ? (
            <div
              className="absolute inset-y-0 rounded-full bg-sun/40"
              style={{
                left: percent(sunriseHours),
                width: `${((sunsetHours - sunriseHours) / 24) * 100}%`,
              }}
            />
          ) : null}
          <div
            className="absolute -top-1 h-4 w-0.5 rounded bg-sun-ink"
            style={{ left: percent(noonLocalHours) }}
          />
        </div>

        <input
          id={inputId}
          type="range"
          min={0}
          max={1440}
          step={reducedMotion ? 60 : 1}
          value={Math.round(localHours * 60)}
          onChange={(event) => onChange(Number(event.target.value) / 60)}
          className="range mt-1"
          aria-valuetext={formatClock(localHours)}
        />
        <div className="flex justify-between font-mono text-[11px] text-shadow-2 tabular">
          <span>00:00</span>
          <span>{sunriseHours === null ? '—' : formatClock(sunriseHours)}</span>
          <span className="text-sun-ink">{formatClock(noonLocalHours)}</span>
          <span>{sunsetHours === null ? '—' : formatClock(sunsetHours)}</span>
          <span>24:00</span>
        </div>
        {reducedMotion ? (
          <p className="mt-2 text-xs text-shadow-2">{dictionary.gnomon.reducedMotion}</p>
        ) : null}
      </div>
    </div>
  )
}
