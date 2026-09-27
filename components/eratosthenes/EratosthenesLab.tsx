'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { usePlace } from '@/components/place/PlaceProvider'
import { ReadoutRow } from '@/components/readout/ReadoutRow'
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
  // Six ranked candidates is more than a reader should weigh at once; the top
  // three cover almost every case, and the rest stay a tap away.
  const [showAllPartners, setShowAllPartners] = useState(false)
  const [step, setStep] = useState(0)
  const [classroom, setClassroom] = useState(false)

  // Classroom mode: large type for a projector, the site's menus hidden. Set
  // on the document so the header and tab bar outside this component follow.
  useEffect(() => {
    const root = document.documentElement
    if (classroom) root.dataset.classroom = 'on'
    else delete root.dataset.classroom
    return () => {
      delete root.dataset.classroom
    }
  }, [classroom])

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
    return <div className="skeleton min-h-[30rem]" aria-hidden />
  }

  const noonA = solarNoon(julianDay(date), place.lonDeg, place.offsetHours)
  const noonB = partner
    ? solarNoon(julianDay(date), partner.lonDeg, partner.offsetHours)
    : null

  const titles = dictionary.eratosthenes.steps
  const last = titles.length - 1
  // Every step is rendered; only the current one shows on screen, and all of
  // them print, which turns the printout into a worksheet.
  const stepClass = (index: number) => (index === step ? 'space-y-4' : 'hidden space-y-4 print:block')

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-shadow-2">
          {dictionary.eratosthenes.stepOf.replace('{n}', String(step + 1)).replace('{total}', String(titles.length))}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setClassroom((value) => !value)}
            aria-pressed={classroom}
            title={dictionary.eratosthenes.classroomHint}
            className="toggle"
          >
            {dictionary.eratosthenes.classroom}
          </button>
          <button type="button" onClick={() => window.print()} className="btn py-1.5">
            {dictionary.eratosthenes.print}
          </button>
        </div>
      </div>

      <ol className="no-print grid grid-cols-4 gap-2">
        {titles.map((title, index) => (
          <li key={title}>
            <button
              type="button"
              onClick={() => setStep(index)}
              aria-current={index === step ? 'step' : undefined}
              className="group flex w-full flex-col gap-2 text-left"
            >
              <span
                className={`block h-1.5 rounded-full transition ${index <= step ? 'bg-sky-deep' : 'bg-concrete group-hover:bg-sky'}`}
                aria-hidden
              />
              <span className={`text-xs font-semibold sm:text-sm ${index === step ? 'text-sky-deep' : 'text-shadow-2'}`}>
                <span className="font-mono tabular">{index + 1}</span>
                <span className="hidden sm:inline"> · {title}</span>
                <span className="sr-only sm:hidden"> · {title}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>

      <section className={`panel ${stepClass(0)}`} aria-labelledby="langkah-1">
        <h2 id="langkah-1" className="text-2xl">
          {titles[0]}
        </h2>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-shadow-2">
          {dictionary.eratosthenes.partnerNote}
        </p>
        <p className="mt-1 max-w-prose text-xs leading-relaxed text-shadow-2">
          {dictionary.eratosthenes.partnerLegend}
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(showAllPartners ? partners : partners.slice(0, 3)).map(({ city, rating }) => (
            <li key={city.name}>
              <button
                type="button"
                onClick={() => setPartner(city)}
                aria-pressed={partner?.name === city.name}
                className={`w-full rounded-lg border p-3 text-left transition ${
                  partner?.name === city.name
                    ? 'border-sky-deep bg-sky-deep text-chalk'
                    : 'border-shadow/15 bg-chalk hover:border-sky-deep/50 hover:text-sky-deep'
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
        {!showAllPartners && partners.length > 3 ? (
          <button
            type="button"
            onClick={() => setShowAllPartners(true)}
            className="mt-3 text-sm underline decoration-shadow/40 underline-offset-2 hover:text-shadow"
          >
            {dictionary.eratosthenes.showMorePartners}
          </button>
        ) : null}
      </section>

      <section className={`panel ${stepClass(1)}`} aria-labelledby="langkah-2">
        <h2 id="langkah-2" className="text-2xl">
          {titles[1]}
        </h2>
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
        <p className="mt-2 font-mono tabular text-xs text-shadow-2">
          {formatDate(date, dictionary)}
        </p>
      </section>

      <section className={stepClass(2)} aria-labelledby="langkah-3">
        <h2 id="langkah-3" className="text-2xl">
          {titles[2]}
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
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
        </div>
        <div className="panel">
          <label className="label block" htmlFor="distance">
            {dictionary.eratosthenes.distance} ({dictionary.units.km})
          </label>
          <input
            id="distance"
            inputMode="decimal"
            value={distanceKm}
            onChange={(event) => setDistanceKm(event.target.value)}
            className="mt-1 w-48 rounded-md border border-shadow/15 bg-chalk px-3 py-2 font-mono tabular"
          />
          {/* Stated plainly: the pre-filled distance already assumes the answer. */}
          <p className="mt-2 max-w-prose text-xs leading-relaxed text-shadow-2">
            {dictionary.eratosthenes.distanceNote}
          </p>
        </div>
      </section>

      <section className={stepClass(3)} aria-labelledby="langkah-4">
        <h2 id="langkah-4" className="text-2xl">
          {titles[3]}
        </h2>
        {result ? <ResultPanel dictionary={dictionary} result={result} /> : null}
      </section>

      <div className="no-print flex justify-between gap-3">
        <button type="button" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0} className="btn">
          ← {dictionary.eratosthenes.back}
        </button>
        {step < last ? (
          <button type="button" onClick={() => setStep((value) => Math.min(last, value + 1))} className="btn-primary">
            {dictionary.eratosthenes.next}: {titles[step + 1]} →
          </button>
        ) : null}
      </div>
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
    <article className="panel">
      <h3 className="font-display text-xl">{heading}</h3>
      <div className="mt-4 space-y-3">
        <Field
          label={dictionary.eratosthenes.gnomonHeight}
          value={entry.gnomonHeight}
          onChange={(value) => onChange({ ...entry, gnomonHeight: value })}
          invalid={!isPositiveNumber(entry.gnomonHeight)}
          invalidMessage={dictionary.eratosthenes.invalidNumber}
        />
        <Field
          label={dictionary.eratosthenes.shadowLength}
          value={entry.shadowLength}
          onChange={(value) => onChange({ ...entry, shadowLength: value })}
          invalid={!isNonNegativeNumber(entry.shadowLength)}
          invalidMessage={dictionary.eratosthenes.invalidNumber}
        />
        <div className="flex gap-2">
          {[true, false].map((north) => (
            <button
              key={String(north)}
              type="button"
              onClick={() => onChange({ ...entry, pointsNorth: north })}
              aria-pressed={entry.pointsNorth === north}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                entry.pointsNorth === north
                  ? 'border-sky-deep bg-sky-deep text-chalk'
                  : 'border-shadow/15 bg-chalk hover:border-sky-deep/50 hover:text-sky-deep'
              }`}
            >
              {north ? `↑ ${dictionary.dates.north}` : `↓ ${dictionary.dates.south}`}
            </button>
          ))}
        </div>
      </div>
    </article>
  )
}

function isPositiveNumber(raw: string): boolean {
  const value = Number.parseFloat(raw)
  return Number.isFinite(value) && value > 0
}

function isNonNegativeNumber(raw: string): boolean {
  const value = Number.parseFloat(raw)
  return Number.isFinite(value) && value >= 0
}

function Field({
  label,
  value,
  onChange,
  invalid = false,
  invalidMessage,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  invalid?: boolean
  invalidMessage?: string
}) {
  const errorId = useId()
  const showError = invalid && Boolean(invalidMessage)
  return (
    <label className="block">
      <span className="label block">{label}</span>
      <input
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid}
        aria-describedby={showError ? errorId : undefined}
        className={`mt-1 w-full rounded-md border bg-bleached px-3 py-2 font-mono tabular ${
          invalid ? 'border-2 border-shadow' : 'border-shadow/15 bg-chalk'
        }`}
      />
      {showError ? (
        <span id={errorId} className="mt-1 block text-xs font-semibold text-shadow">
          <span aria-hidden>⚠ </span>
          {invalidMessage}
        </span>
      ) : null}
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
      <section className="panel">
        <p className="max-w-prose leading-relaxed">
          {dictionary.eratosthenes.separationTooSmall
            .replace('{separation}', formatDeg(result.separationDeg, 3))
            .replace('{minimum}', String(result.minimumDeg))}{' '}
          {dictionary.eratosthenes.partnerNote}
        </p>
      </section>
    )
  }

  return (
    <section className="panel">
      <h2 className="font-display text-2xl">{dictionary.eratosthenes.circumference}</h2>
      <p className="mt-2 font-mono tabular text-5xl tracking-[-0.03em] text-sky-deep">
        {result.circumferenceKm.toFixed(0)} {dictionary.units.km}
      </p>
      <p className="mt-2 max-w-prose text-xs leading-relaxed text-shadow-2">
        {dictionary.eratosthenes.formula}
      </p>

      <ErrorScale dictionary={dictionary} errorPercent={result.errorPercent} />

      <dl className="mt-5 grid gap-x-8 sm:grid-cols-2">
        <ReadoutRow label={dictionary.eratosthenes.zenithAngle + ' A'} value={formatDeg(result.signedADeg, 3)} />
        <ReadoutRow label={dictionary.eratosthenes.zenithAngle + ' B'} value={formatDeg(result.signedBDeg, 3)} />
        <ReadoutRow label={dictionary.eratosthenes.separation} value={formatDeg(result.separationDeg, 3)} />
        <ReadoutRow
          label={dictionary.eratosthenes.radius}
          value={`${result.radiusKm.toFixed(0)} ${dictionary.units.km}`}
        />
        <ReadoutRow
          label={dictionary.eratosthenes.accepted}
          value={`${ACCEPTED_CIRCUMFERENCE_KM.toFixed(0)} ${dictionary.units.km}`}
        />
        <ReadoutRow
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
          <li className="font-semibold">
            {dictionary.eratosthenes.sameMeridian.replace('{gap}', result.lonGapDeg.toFixed(1))}
          </li>
        ) : null}
        <li className="text-shadow-2">{dictionary.eratosthenes.errorNote}</li>
      </ul>
    </section>
  )
}

/**
 * The measurement against the accepted circumference, on a ±10 % scale. The
 * gap is the lesson (PRD §4), so it is drawn, not only printed.
 */
function ErrorScale({ dictionary, errorPercent }: { dictionary: Dictionary; errorPercent: number }) {
  const range = 10
  const clamped = Math.max(-range, Math.min(range, errorPercent))
  const at = (percent: number) => `${50 + (percent / range) * 50}%`
  return (
    <figure className="mt-6">
      <figcaption className="label">{dictionary.eratosthenes.scaleLabel}</figcaption>
      <div className="relative mt-6 h-2 rounded-full bg-concrete" aria-hidden>
        <div className="absolute -top-1.5 h-5 w-0.5 -translate-x-1/2 bg-shadow" style={{ left: at(0) }} />
        <div
          className="absolute -top-2 h-6 w-6 -translate-x-1/2 rounded-full border-4 border-chalk bg-sky-deep shadow-lift"
          style={{ left: at(clamped), top: '-0.5rem' }}
        />
        <span
          className="absolute -top-7 -translate-x-1/2 whitespace-nowrap text-xs font-semibold text-sky-deep"
          style={{ left: at(clamped) }}
        >
          {dictionary.eratosthenes.measured} {errorPercent >= 0 ? '+' : '−'}
          {Math.abs(errorPercent).toFixed(1)} %
        </span>
      </div>
      <div className="mt-2 flex justify-between font-mono text-[11px] text-shadow-2 tabular">
        <span>−{range} %</span>
        <span>{dictionary.eratosthenes.accepted}</span>
        <span>+{range} %</span>
      </div>
    </figure>
  )
}
