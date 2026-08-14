'use client'

import { useId, useState } from 'react'
import { INDONESIAN_CITIES } from '@/data/cities/indonesia'
import { formatLatitude, formatLongitude } from '@/lib/format'
import type { Dictionary, Locale } from '@/lib/i18n'
import { usePlace } from './PlaceProvider'

/**
 * Choose a place: a bundled city, typed coordinates, or the device.
 * Geolocation is read and used in the browser and discarded — nothing is sent.
 */
export function PlacePicker({
  dictionary,
  locale,
}: {
  dictionary: Dictionary
  locale: Locale
}) {
  const { place, setCity, setCoordinates, setFromDevice } = usePlace()
  const [status, setStatus] = useState<'idle' | 'locating' | 'denied' | 'unsupported' | 'invalid'>(
    'idle',
  )
  const [latInput, setLatInput] = useState('')
  const [lonInput, setLonInput] = useState('')
  const cityId = useId()
  const latId = useId()
  const lonId = useId()

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
    } else {
      setStatus('invalid')
    }
  }

  return (
    <section className="panel">
      <h2 className="label mb-3">{dictionary.place.heading}</h2>

      <div className="grid gap-4">
        <div>
          <label htmlFor={cityId} className="label block">
            {dictionary.place.city}
          </label>
          <select
            id={cityId}
            className="mt-1 w-full rounded-md border border-shadow/25 bg-bleached px-2 py-2 font-sans text-sm"
            value={place.fromDevice ? '' : place.label}
            onChange={(event) => {
              const city = INDONESIAN_CITIES.find((entry) => entry.name === event.target.value)
              if (city) setCity(city)
            }}
          >
            {place.fromDevice ? <option value="">{place.label}</option> : null}
            {INDONESIAN_CITIES.map((city) => (
              <option key={city.name} value={city.name}>
                {city.name} — {city.region}
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={applyTyped}>
          <span className="label block">{dictionary.place.coordinates}</span>
          <div className="mt-1 grid grid-cols-[1fr_1fr_auto] gap-2">
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
              className={`w-full min-w-0 rounded-md border bg-bleached px-2 py-2 font-mono tabular text-sm ${
                status === 'invalid' ? 'border-marker-ink' : 'border-shadow/25'
              }`}
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
              className={`w-full min-w-0 rounded-md border bg-bleached px-2 py-2 font-mono tabular text-sm ${
                status === 'invalid' ? 'border-marker-ink' : 'border-shadow/25'
              }`}
            />
            <button
              type="submit"
              aria-label={dictionary.place.apply}
              className="shrink-0 rounded-md border border-shadow/40 px-3 text-sm transition hover:bg-shadow hover:text-chalk"
            >
              ↵
            </button>
          </div>
        </form>
      </div>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-5 gap-y-2">
        <button
          type="button"
          onClick={locate}
          className="rounded-full border border-shadow/40 px-4 py-2 text-sm transition hover:bg-shadow hover:text-chalk"
        >
          {status === 'locating' ? dictionary.place.locating : dictionary.place.locate}
        </button>
        <p className="value">
          {formatLatitude(place.latDeg, locale)} · {formatLongitude(place.lonDeg, locale)} · UTC+
          {place.offsetHours}
        </p>
      </div>

      {status === 'denied' ? (
        <p className="mt-2 text-sm text-marker-ink">{dictionary.place.denied}</p>
      ) : null}
      {status === 'unsupported' ? (
        <p className="mt-2 text-sm text-marker-ink">{dictionary.place.unsupported}</p>
      ) : null}
      {status === 'invalid' ? (
        <p className="mt-2 text-sm text-marker-ink">{dictionary.place.invalidCoordinates}</p>
      ) : null}

      <p className="mt-3 max-w-prose text-xs leading-relaxed text-shadow/70">
        {dictionary.place.privacy}
      </p>
    </section>
  )
}
