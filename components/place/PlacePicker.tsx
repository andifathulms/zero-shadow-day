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
  const [status, setStatus] = useState<'idle' | 'locating' | 'denied' | 'unsupported'>('idle')
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
    if (Number.isFinite(latDeg) && Number.isFinite(lonDeg)) setCoordinates(latDeg, lonDeg)
  }

  return (
    <section className="border border-shadow/15 bg-concrete/25 p-4 sm:p-5">
      <h2 className="label mb-3">{dictionary.place.heading}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={cityId} className="label block">
            {dictionary.place.city}
          </label>
          <select
            id={cityId}
            className="mt-1 w-full border border-shadow/25 bg-bleached px-2 py-1.5 font-sans text-sm"
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
          <div className="mt-1 flex gap-2">
            <input
              id={latId}
              aria-label={dictionary.place.latitude}
              inputMode="decimal"
              placeholder={dictionary.place.latitude}
              value={latInput}
              onChange={(event) => setLatInput(event.target.value)}
              className="w-full border border-shadow/25 bg-bleached px-2 py-1.5 font-mono tabular text-sm"
            />
            <input
              id={lonId}
              aria-label={dictionary.place.longitude}
              inputMode="decimal"
              placeholder={dictionary.place.longitude}
              value={lonInput}
              onChange={(event) => setLonInput(event.target.value)}
              className="w-full border border-shadow/25 bg-bleached px-2 py-1.5 font-mono tabular text-sm"
            />
            <button
              type="submit"
              className="shrink-0 border border-shadow/40 px-3 py-1.5 text-sm hover:bg-shadow hover:text-bleached"
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
          className="border border-shadow/40 px-3 py-1.5 text-sm hover:bg-shadow hover:text-bleached"
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

      <p className="mt-3 max-w-prose text-xs leading-relaxed text-shadow/70">
        {dictionary.place.privacy}
      </p>
    </section>
  )
}
