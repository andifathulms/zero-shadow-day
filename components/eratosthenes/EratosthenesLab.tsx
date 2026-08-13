'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePlace } from '@/components/place/PlaceProvider'
import { INDONESIAN_CITIES, type City } from '@/data/cities/indonesia'
import { todayIn } from '@/lib/clock'
import {
  ACCEPTED_CIRCUMFERENCE_KM,
  ACCEPTED_RADIUS_KM,
  measureEarth,
  meridianDistanceKm,
  ratePartner,
  syntheticObservation,
} from '@/lib/eratosthenes'
import type { Observation } from '@/lib/eratosthenes'
import { formatClock, formatDate, formatDeg } from '@/lib/format'
import type { Dictionary } from '@/lib/i18n'
import { julianDay, type CivilDate } from '@/lib/solar/julian'
import { solarNoon } from '@/lib/solar/noon'

/**
 * Eratosthenes mode: partner finder, measurement flow, the derived
 * circumference, and the error shown honestly — the gap between a schoolyard
 * measurement and the true figure is the lesson (PRD §4).
 */
export function EratosthenesLab({ dictionary }: { dictionary: Dictionary }) {
  const { place } = usePlace()
  const [date, setDate] = useState<CivilDate | null>(null)
  const [partner, setPartner] = useState<City | null>(null)
  const [entries, setEntries] = useState<{ a: Entry; b: Entry } | null>(null)
  const [distanceKm, setDistanceKm] = useState<string>('')

  useEffect(() => setDate(todayIn(place.offsetHours)), [place.offsetHours])

  // Ranked partners: separation in latitude is what the method divides by, and
  // a longitude gap is error it cannot see.
  const partners = useMemo(
    () =>
      INDONESIAN_CITIES.map((city) => ({ city, rating: ratePartner(place, city) }))
        .filter((entry) => entry.rating.separationDeg > 2)
        .sort((left, right) => right.rating.quality - left.rating.quality)
        .slice(0, 6),
    [place],
  )

  useEffect(() => {
    if (partner === null && partners.length > 0) setPartner(partners[0]!.city)
  }, [partner, partners])

  // What a perfect observer would measure — the starting point, which the
  // reader replaces with their own ruler.
  const predicted = useMemo(() => {
    if (date === null || partner === null) return null
    return {
      a: syntheticObservation(place, date, place.label, 100),
      b: syntheticObservation(partner, date, partner.name, 100),
    }
  }, [place, partner, date])

  useEffect(() => {
    if (!predicted) return
    setEntries({
      a: toEntry(predicted.a),
      b: toEntry(predicted.b),
    })
    setDistanceKm(
      meridianDistanceKm(predicted.a.latDeg, predicted.b.latDeg, ACCEPTED_RADIUS_KM).toFixed(1),
    )
  }, [predicted])

  const result = useMemo(() => {
    if (!entries || !predicted) return null
    const distance = Number.parseFloat(distanceKm)
    if (!Number.isFinite(distance) || distance <= 0) return null
    return measureEarth(
      fromEntry(entries.a, predicted.a),
      fromEntry(entries.b, predicted.b),
      distance,
    )
  }, [entries, predicted, distanceKm])

  if (date === null || predicted === null || entries === null) {
    return <div className="min-h-[30rem]" aria-hidden />
  }

  const noonA = solarNoon(julianDay(date), place.lonDeg, place.offsetHours)
  const noonB = partner
    ? solarNoon(julianDay(date), partner.lonDeg, partner.offsetHours)
    : null

  return (
    <div className="space-y-10">
      <section>
        <h2 className="font-display text-2xl">{dictionary.eratosthenes.partner}</h2>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-shadow/70">
          {dictionary.eratosthenes.partnerNote}
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {partners.map(({ city, rating }) => (
            <li key={city.name}>
              <button
                type="button"
                onClick={() => setPartner(city)}
                className={`w-full border p-3 text-left ${
                  partner?.name === city.name
                    ? 'border-shadow bg-shadow text-bleached'
                    : 'border-shadow/25 hover:border-shadow'
                }`}
              >
                <span className="block text-sm">{city.name}</span>
                <span className="mt-1 block font-mono tabular text-xs opacity-70">
                  Δφ {rating.separationDeg.toFixed(2)}° · {rating.meridianDistanceKm.toFixed(0)} km ·
                  Δλ {rating.lonGapDeg.toFixed(1)}°
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-display text-2xl">{dictionary.eratosthenes.instructions}</h2>
        <ol className="mt-3 max-w-prose list-decimal space-y-2 pl-5 leading-relaxed">
          <li>{dictionary.eratosthenes.step1}</li>
          <li>{dictionary.eratosthenes.step2}</li>
          <li>{dictionary.eratosthenes.step3}</li>
          <li>{dictionary.eratosthenes.step4}</li>
        </ol>
        <dl className="mt-4 grid max-w-xl gap-x-6 gap-y-1 sm:grid-cols-2">
          <div className="rule flex justify-between py-1.5">
            <dt className="label">{place.label}</dt>
            <dd className="value">{formatClock(noonA.localHours)}</dd>
          </div>
          {partner && noonB ? (
            <div className="rule flex justify-between py-1.5">
              <dt className="label">{partner.name}</dt>
              <dd className="value">{formatClock(noonB.localHours)}</dd>
            </div>
          ) : null}
        </dl>
        <p className="mt-2 font-mono tabular text-xs text-shadow/70">
          {formatDate(date, dictionary)}
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ObservationCard
          dictionary={dictionary}
          heading={`${dictionary.eratosthenes.observationA} — ${place.label}`}
          entry={entries.a}
          onChange={(next) => setEntries({ ...entries, a: next })}
        />
        {partner ? (
          <ObservationCard
            dictionary={dictionary}
            heading={`${dictionary.eratosthenes.observationB} — ${partner.name}`}
            entry={entries.b}
            onChange={(next) => setEntries({ ...entries, b: next })}
          />
        ) : null}
      </section>

      <section>
        <label className="label block" htmlFor="distance">
          {dictionary.eratosthenes.distance} ({dictionary.units.km})
        </label>
        <input
          id="distance"
          inputMode="decimal"
          value={distanceKm}
          onChange={(event) => setDistanceKm(event.target.value)}
          className="mt-1 w-48 border border-shadow/25 bg-bleached px-2 py-1.5 font-mono tabular"
        />
        {/* Stated plainly: the pre-filled distance already assumes the answer. */}
        <p className="mt-2 max-w-prose text-xs leading-relaxed text-shadow/70">
          {dictionary.eratosthenes.distanceNote}
        </p>
      </section>

      {result ? <ResultPanel dictionary={dictionary} result={result} /> : null}
    </div>
  )
}

interface Entry {
  gnomonHeight: string
  shadowLength: string
  pointsNorth: boolean
}

function toEntry(observation: Observation): Entry {
  return {
    gnomonHeight: observation.gnomonHeight.toFixed(1),
    shadowLength: observation.shadowLength.toFixed(2),
    pointsNorth: observation.pointsNorth,
  }
}

function fromEntry(entry: Entry, base: Observation): Observation {
  const gnomonHeight = Number.parseFloat(entry.gnomonHeight)
  const shadowLength = Number.parseFloat(entry.shadowLength)
  return {
    ...base,
    gnomonHeight: Number.isFinite(gnomonHeight) && gnomonHeight > 0 ? gnomonHeight : base.gnomonHeight,
    shadowLength: Number.isFinite(shadowLength) && shadowLength >= 0 ? shadowLength : base.shadowLength,
    pointsNorth: entry.pointsNorth,
  }
}

function ObservationCard({
  dictionary,
  heading,
  entry,
  onChange,
}: {
  dictionary: Dictionary
  heading: string
  entry: Entry
  onChange: (entry: Entry) => void
}) {
  return (
    <article className="border border-shadow/20 bg-concrete/20 p-5">
      <h3 className="font-display text-xl">{heading}</h3>
      <div className="mt-4 space-y-3">
        <Field
          label={dictionary.eratosthenes.gnomonHeight}
          value={entry.gnomonHeight}
          onChange={(value) => onChange({ ...entry, gnomonHeight: value })}
        />
        <Field
          label={dictionary.eratosthenes.shadowLength}
          value={entry.shadowLength}
          onChange={(value) => onChange({ ...entry, shadowLength: value })}
        />
        <div className="flex gap-2">
          {[true, false].map((north) => (
            <button
              key={String(north)}
              type="button"
              onClick={() => onChange({ ...entry, pointsNorth: north })}
              className={`border px-3 py-1.5 text-sm ${
                entry.pointsNorth === north
                  ? 'border-shadow bg-shadow text-bleached'
                  : 'border-shadow/25 hover:border-shadow'
              }`}
            >
              {north ? '↑ utara / north' : '↓ selatan / south'}
            </button>
          ))}
        </div>
      </div>
    </article>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="label block">{label}</span>
      <input
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full border border-shadow/25 bg-bleached px-2 py-1.5 font-mono tabular"
      />
    </label>
  )
}

function ResultPanel({
  dictionary,
  result,
}: {
  dictionary: Dictionary
  result: ReturnType<typeof measureEarth>
}) {
  if (result.type === 'insufficient-separation') {
    return (
      <section className="border border-marker/40 bg-marker/5 p-5">
        <p className="max-w-prose leading-relaxed">
          Δφ = {formatDeg(result.separationDeg, 3)} &lt; {result.minimumDeg}°.{' '}
          {dictionary.eratosthenes.partnerNote}
        </p>
      </section>
    )
  }

  return (
    <section className="border-l-2 border-marker bg-concrete/20 p-5">
      <h2 className="font-display text-2xl">{dictionary.eratosthenes.circumference}</h2>
      <p className="mt-2 font-mono tabular text-4xl text-marker">
        {result.circumferenceKm.toFixed(0)} {dictionary.units.km}
      </p>

      <dl className="mt-5 grid gap-x-8 sm:grid-cols-2">
        <Row label={dictionary.eratosthenes.zenithAngle + ' A'} value={formatDeg(result.signedADeg, 3)} />
        <Row label={dictionary.eratosthenes.zenithAngle + ' B'} value={formatDeg(result.signedBDeg, 3)} />
        <Row label={dictionary.eratosthenes.separation} value={formatDeg(result.separationDeg, 3)} />
        <Row
          label={dictionary.eratosthenes.radius}
          value={`${result.radiusKm.toFixed(0)} ${dictionary.units.km}`}
        />
        <Row
          label={dictionary.eratosthenes.accepted}
          value={`${ACCEPTED_CIRCUMFERENCE_KM.toFixed(0)} ${dictionary.units.km}`}
        />
        <Row
          label={dictionary.eratosthenes.error}
          value={`${result.errorKm >= 0 ? '+' : '−'}${Math.abs(result.errorKm).toFixed(0)} ${dictionary.units.km} · ${result.errorPercent.toFixed(2)} %`}
          emphasis
        />
      </dl>

      <h3 className="label mt-6">{dictionary.eratosthenes.errorHeading}</h3>
      <ul className="mt-2 max-w-prose space-y-2 text-sm leading-relaxed">
        <li className="font-mono tabular">
          1′ → ±{result.kmPerArcminute.toFixed(0)} {dictionary.units.km}
        </li>
        <li>
          Δφ {formatDeg(result.separationDeg, 3)} vs {formatDeg(result.trueSeparationDeg, 3)} ={' '}
          <span className="font-mono tabular">{formatDeg(result.angleErrorDeg, 4)}</span>
        </li>
        {result.lonGapDeg > 0.5 ? (
          <li className="text-marker">
            {dictionary.eratosthenes.sameMeridian.replace('{gap}', result.lonGapDeg.toFixed(1))}
          </li>
        ) : null}
        <li className="text-shadow/70">{dictionary.eratosthenes.errorNote}</li>
      </ul>
    </section>
  )
}

function Row({
  label,
  value,
  emphasis = false,
}: {
  label: string
  value: string
  emphasis?: boolean
}) {
  return (
    <div className="rule flex items-baseline justify-between gap-4 py-1.5">
      <dt className="label">{label}</dt>
      <dd className={emphasis ? 'value text-[1.05rem]' : 'value'}>{value}</dd>
    </div>
  )
}
