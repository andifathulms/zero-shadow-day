'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { INDONESIAN_CITIES, type City } from '@/data/cities/indonesia'
import { formatLatitude, formatLongitude } from '@/lib/format'
import type { Dictionary, Locale } from '@/lib/i18n'
import { usePlace } from './PlaceProvider'

/**
 * Choose a place: search the bundled cities, type coordinates, or ask the
 * device. One sheet, opened from the place chip in the header or from any
 * "change location" link, so the place is chosen before a tool is read rather
 * than at the bottom of it.
 *
 * A native <dialog>: focus is trapped and returned by the browser, Escape
 * closes it, and it works as a bottom sheet on a phone. Geolocation is read
 * and used in the browser and discarded — nothing is sent (invariant 9).
 */
export function PlaceSheet({ dictionary, locale }: { dictionary: Dictionary; locale: Locale }) {
  const { place, setCity, setCoordinates, setFromDevice, pickerOpen, closePicker } = usePlace()
  const dialog = useRef<HTMLDialogElement>(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'idle' | 'locating' | 'denied' | 'unsupported' | 'invalid'>(
    'idle',
  )
  const [latInput, setLatInput] = useState('')
  const [lonInput, setLonInput] = useState('')
  const titleId = useId()
  const searchId = useId()
  const latId = useId()
  const lonId = useId()
  const coordErrorId = useId()

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (pickerOpen && !element.open) {
      setQuery('')
      setStatus('idle')
      element.showModal()
    } else if (!pickerOpen && element.open) {
      element.close()
    }
  }, [pickerOpen])

  const matches = useMemo(() => filterCities(query), [query])

  const choose = (city: City) => {
    setCity(city)
    closePicker()
  }

  const locate = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unsupported')
      return
    }
    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFromDevice(position.coords.latitude, position.coords.longitude)
        setStatus('idle')
        closePicker()
      },
      () => setStatus('denied'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    )
  }

  const applyTyped = (event: React.FormEvent) => {
    event.preventDefault()
    const latDeg = Number.parseFloat(latInput)
    const lonDeg = Number.parseFloat(lonInput)
    const valid =
      Number.isFinite(latDeg) &&
      Number.isFinite(lonDeg) &&
      Math.abs(latDeg) <= 90 &&
      Math.abs(lonDeg) <= 180
    if (valid) {
      setCoordinates(latDeg, lonDeg)
      setStatus('idle')
      closePicker()
    } else {
      setStatus('invalid')
    }
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onClose={closePicker}
      onClick={(event) => {
        // A click on the backdrop lands on the dialog element itself.
        if (event.target === event.currentTarget) closePicker()
      }}
      className="place-sheet bg-chalk p-0 text-shadow shadow-lift backdrop:bg-sky-night/50"
    >
      <div className="flex max-h-[85dvh] flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-shadow/10 px-5 pb-4 pt-5">
          <div>
            <p className="eyebrow">{dictionary.place.current}</p>
            <h2 id={titleId} className="mt-1 text-2xl">
              {place.label}
            </h2>
            <p className="value mt-1 text-sm text-shadow-2">
              {formatLatitude(place.latDeg, locale)} · {formatLongitude(place.lonDeg, locale)} · UTC+
              {place.offsetHours}
            </p>
          </div>
          <button type="button" onClick={closePicker} className="btn px-3" aria-label={dictionary.place.close}>
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
              <path d="M2 2l10 10M12 2 2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="space-y-3 px-5 pt-4">
          <label htmlFor={searchId} className="sr-only">
            {dictionary.place.search}
          </label>
          <input
            id={searchId}
            type="search"
            autoComplete="off"
            placeholder={dictionary.place.search}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="field w-full"
          />
          <button type="button" onClick={locate} className="btn w-full">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
              <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 0.5v2.5M7 11v2.5M0.5 7H3M11 7h2.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            {status === 'locating' ? dictionary.place.locating : dictionary.place.locate}
          </button>
          {status === 'denied' || status === 'unsupported' ? (
            <p role="status" className="text-sm text-shadow-2">
              {status === 'denied' ? dictionary.place.denied : dictionary.place.unsupported}
            </p>
          ) : null}
        </div>

        <ul className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3" aria-label={dictionary.place.city}>
          {matches.map((city) => {
            const selected = !place.fromDevice && city.name === place.label
            return (
              <li key={`${city.name}-${city.region}`}>
                <button
                  type="button"
                  onClick={() => choose(city)}
                  aria-current={selected ? 'true' : undefined}
                  className={`flex w-full items-baseline justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-sky/60 ${
                    selected ? 'bg-sky text-sky-deep' : ''
                  }`}
                >
                  <span>
                    <span className="font-semibold">{city.name}</span>
                    <span className="ml-2 text-sm text-shadow-2">{city.region}</span>
                  </span>
                  <span className="value shrink-0 text-xs text-shadow-2">
                    {formatLatitude(city.latDeg, locale, 2)} · {city.zone}
                  </span>
                </button>
              </li>
            )
          })}
          {matches.length === 0 ? (
            <li className="px-3 py-4 text-sm text-shadow-2">{dictionary.place.noResults}</li>
          ) : null}
        </ul>

        <form onSubmit={applyTyped} className="border-t border-shadow/10 px-5 pb-5 pt-4">
          <span className="label block">{dictionary.place.orCoordinates}</span>
          <div className="mt-2 grid grid-cols-[1fr_1fr_auto] gap-2">
            <input
              id={latId}
              aria-label={dictionary.place.latitude}
              inputMode="decimal"
              placeholder={dictionary.place.latitude}
              value={latInput}
              onChange={(event) => {
                setLatInput(event.target.value)
                if (status === 'invalid') setStatus('idle')
              }}
              aria-invalid={status === 'invalid'}
              aria-describedby={status === 'invalid' ? coordErrorId : undefined}
              className="field w-full min-w-0 font-mono tabular"
            />
            <input
              id={lonId}
              aria-label={dictionary.place.longitude}
              inputMode="decimal"
              placeholder={dictionary.place.longitude}
              value={lonInput}
              onChange={(event) => {
                setLonInput(event.target.value)
                if (status === 'invalid') setStatus('idle')
              }}
              aria-invalid={status === 'invalid'}
              aria-describedby={status === 'invalid' ? coordErrorId : undefined}
              className="field w-full min-w-0 font-mono tabular"
            />
            <button type="submit" className="btn-primary px-4" aria-label={dictionary.place.apply}>
              ↵
            </button>
          </div>
          {status === 'invalid' ? (
            <p id={coordErrorId} role="status" className="mt-2 text-sm text-shadow">
              {dictionary.place.invalidCoordinates}
            </p>
          ) : null}
          <p className="mt-3 text-xs leading-relaxed text-shadow-2">{dictionary.place.privacy}</p>
        </form>
      </div>
    </dialog>
  )
}

/** Every city when the box is empty; a name-or-region match otherwise. Local, never a request. */
function filterCities(query: string): readonly City[] {
  const needle = query.trim().toLowerCase()
  if (needle === '') return INDONESIAN_CITIES
  return INDONESIAN_CITIES.filter(
    (city) =>
      city.name.toLowerCase().includes(needle) || city.region.toLowerCase().includes(needle),
  )
}
