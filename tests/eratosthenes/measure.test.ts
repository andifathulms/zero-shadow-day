import { describe, expect, it } from 'vitest'
import {
  ACCEPTED_CIRCUMFERENCE_KM,
  ACCEPTED_RADIUS_KM,
  MINIMUM_SEPARATION_DEG,
  measureEarth,
  meridianDistanceKm,
  ratePartner,
  signedZenithDeg,
  syntheticObservation,
  zenithAngleDeg,
} from '@/lib/eratosthenes'
import type { EratosthenesMeasurement, Observation } from '@/lib/eratosthenes'

const measured = (
  a: Observation,
  b: Observation,
  distanceKm: number,
): EratosthenesMeasurement => {
  const result = measureEarth(a, b, distanceKm)
  if (result.type !== 'measurement') throw new Error(`expected a measurement, got ${result.type}`)
  return result
}

describe('the round trip — correctness provable, not plausible', () => {
  it('synthetic observations from a known radius recover that radius', () => {
    // Two places on the same meridian, so the method's own assumption holds.
    const lonDeg = 110
    for (const generatingRadiusKm of [6371.0088, 5000, 8000, 12345.6789]) {
      for (const [latA, latB] of [
        [5, -5],
        [-6.2, 3.6],
        [10, -10],
        [0, -8],
        [-2, -9],
      ]) {
        const date = { year: 2026, month: 5, day: 12 }
        const a = syntheticObservation({ latDeg: latA, lonDeg, offsetHours: 7 }, date, 'A', 1)
        const b = syntheticObservation({ latDeg: latB, lonDeg, offsetHours: 7 }, date, 'B', 1)
        const distanceKm = meridianDistanceKm(latA, latB, generatingRadiusKm)

        const result = measured(a, b, distanceKm)
        expect(result.radiusKm).toBeCloseTo(generatingRadiusKm, 6)
        expect(result.circumferenceKm).toBeCloseTo(2 * Math.PI * generatingRadiusKm, 5)
      }
    }
  })

  it('recovers the separation exactly when both observers share a meridian', () => {
    const date = { year: 2026, month: 8, day: 2 }
    const a = syntheticObservation({ latDeg: 5.5, lonDeg: 105, offsetHours: 7 }, date, 'A')
    const b = syntheticObservation({ latDeg: -10.2, lonDeg: 105, offsetHours: 7 }, date, 'B')
    const result = measured(a, b, meridianDistanceKm(5.5, -10.2, ACCEPTED_RADIUS_KM))
    expect(result.separationDeg).toBeCloseTo(result.trueSeparationDeg, 9)
    expect(Math.abs(result.angleErrorDeg)).toBeLessThan(1e-9)
  })

  it('works with the subsolar point between the two observers, where the angles add', () => {
    // On this date the declination sits between the two latitudes, so both
    // shadows fall towards it from opposite sides.
    const date = { year: 2026, month: 4, day: 20 }
    const a = syntheticObservation({ latDeg: 20, lonDeg: 105, offsetHours: 7 }, date, 'A')
    const b = syntheticObservation({ latDeg: -5, lonDeg: 105, offsetHours: 7 }, date, 'B')
    expect(signedZenithDeg(a)).toBeGreaterThan(0)
    expect(signedZenithDeg(b)).toBeLessThan(0)
    const result = measured(a, b, meridianDistanceKm(20, -5, ACCEPTED_RADIUS_KM))
    expect(result.separationDeg).toBeCloseTo(25, 6)
    expect(result.radiusKm).toBeCloseTo(ACCEPTED_RADIUS_KM, 6)
  })

  it('reproduces the original: Syene at the zenith, Alexandria measured', () => {
    // Syene sits essentially on the Tropic of Cancer; on the June solstice the
    // sun stands overhead there and the whole measurement is one shadow.
    const date = { year: 2026, month: 6, day: 21 }
    const syene = syntheticObservation({ latDeg: 24.0889, lonDeg: 32.8998, offsetHours: 2 }, date, 'Syene')
    const alexandria = syntheticObservation(
      { latDeg: 31.2001, lonDeg: 32.8998, offsetHours: 2 },
      date,
      'Alexandria',
    )
    // Not quite zero any more: the obliquity has decreased by about a third of
    // a degree since Eratosthenes, so the tropic has drifted south of Syene and
    // the sun now misses its zenith by roughly two thirds of a degree.
    expect(zenithAngleDeg(syene)).toBeGreaterThan(0.4)
    expect(zenithAngleDeg(syene)).toBeLessThan(1)
    // Alexandria's own shadow angle is that drift plus the separation.
    expect(zenithAngleDeg(alexandria)).toBeCloseTo(7.76, 1)
    const result = measured(
      syene,
      alexandria,
      meridianDistanceKm(24.0889, 31.2001, ACCEPTED_RADIUS_KM),
    )
    // The famous "a fiftieth of a circle" is the difference of the two angles,
    // which survives the drift: 360/50 = 7.2°, and the separation is 7.11°.
    expect(result.separationDeg).toBeCloseTo(7.11, 2)
    // He called it a fiftieth; the true separation makes it a 50.6th. The
    // rounding was his, and it cost him well under one percent.
    expect(360 / result.separationDeg).toBeGreaterThan(50)
    expect(360 / result.separationDeg).toBeLessThan(51)
    expect(result.errorPercent).toBeCloseTo(0, 6)
  })
})

describe('the ruler alone', () => {
  it('zenith angle is the arctangent of the shadow ratio', () => {
    const observation: Observation = {
      label: 'A',
      latDeg: 0,
      lonDeg: 0,
      gnomonHeight: 100,
      shadowLength: 100,
      pointsNorth: true,
    }
    expect(zenithAngleDeg(observation)).toBeCloseTo(45, 9)
    expect(signedZenithDeg({ ...observation, pointsNorth: false })).toBeCloseTo(-45, 9)
  })

  it('is unit-free: centimetres and inches give the same angle', () => {
    const cm = zenithAngleDeg({
      label: 'A', latDeg: 0, lonDeg: 0, gnomonHeight: 120, shadowLength: 37, pointsNorth: true,
    })
    const inches = zenithAngleDeg({
      label: 'A', latDeg: 0, lonDeg: 0, gnomonHeight: 120 / 2.54, shadowLength: 37 / 2.54, pointsNorth: true,
    })
    expect(cm).toBeCloseTo(inches, 12)
  })
})

describe('honest error reporting', () => {
  it('refuses when the two places are barely separated', () => {
    const date = { year: 2026, month: 3, day: 3 }
    const a = syntheticObservation({ latDeg: -6.2, lonDeg: 106.8, offsetHours: 7 }, date, 'A')
    const b = syntheticObservation({ latDeg: -6.5, lonDeg: 106.8, offsetHours: 7 }, date, 'B')
    const result = measureEarth(a, b, 33)
    expect(result.type).toBe('insufficient-separation')
    if (result.type !== 'insufficient-separation') throw new Error('unreachable')
    expect(result.minimumDeg).toBe(MINIMUM_SEPARATION_DEG)
  })

  it('a longitude gap shows up as angle error, because the method cannot see it', () => {
    const date = { year: 2026, month: 5, day: 12 }
    const a = syntheticObservation({ latDeg: 5, lonDeg: 95, offsetHours: 7 }, date, 'A')
    const b = syntheticObservation({ latDeg: -9, lonDeg: 140, offsetHours: 9 }, date, 'B')
    const result = measured(a, b, meridianDistanceKm(5, -9, ACCEPTED_RADIUS_KM))
    expect(result.lonGapDeg).toBeCloseTo(45, 6)
    // The declination moves between the two culminations, so the measured
    // separation is no longer exactly the latitude separation.
    expect(Math.abs(result.angleErrorDeg)).toBeGreaterThan(0)
    expect(Math.abs(result.errorPercent)).toBeGreaterThan(0)
  })

  it('states what an arcminute of angle error costs', () => {
    const date = { year: 2026, month: 5, day: 12 }
    const a = syntheticObservation({ latDeg: 5, lonDeg: 110, offsetHours: 7 }, date, 'A')
    const b = syntheticObservation({ latDeg: -5, lonDeg: 110, offsetHours: 7 }, date, 'B')
    const result = measured(a, b, meridianDistanceKm(5, -5, ACCEPTED_RADIUS_KM))
    // C = 360/Δφ × d, so dC/dΔφ = −C/Δφ.
    expect(result.kmPerArcminute).toBeCloseTo(result.circumferenceKm / (10 * 60), 6)
    // A degraded angle really does move the answer by that much.
    const degraded = measureEarth(
      { ...a, shadowLength: a.shadowLength * 1.0 },
      b,
      meridianDistanceKm(5, -5, ACCEPTED_RADIUS_KM),
    )
    expect(degraded.type).toBe('measurement')
  })

  it('compares against the accepted circumference, not a rounded one', () => {
    // 2π × 6371.0088 km, the IUGG mean radius.
    expect(ACCEPTED_CIRCUMFERENCE_KM).toBeCloseTo(40030.229, 2)
    expect(ACCEPTED_RADIUS_KM).toBe(6371.0088)
  })
})

describe('partner finding', () => {
  it('prefers a large latitude separation and a small longitude gap', () => {
    const jakarta = { latDeg: -6.2088, lonDeg: 106.8456, offsetHours: 7 }
    const nearSameMeridian = ratePartner(jakarta, { latDeg: 5.5, lonDeg: 106.5, offsetHours: 7 })
    const farEast = ratePartner(jakarta, { latDeg: 5.5, lonDeg: 140.7, offsetHours: 9 })
    const close = ratePartner(jakarta, { latDeg: -6.9, lonDeg: 107.6, offsetHours: 7 })
    expect(nearSameMeridian.quality).toBeGreaterThan(farEast.quality)
    expect(nearSameMeridian.quality).toBeGreaterThan(close.quality)
  })

  it('meridian distance matches the accepted radius', () => {
    // One degree of latitude is about 111.19 km on a sphere of this radius.
    expect(meridianDistanceKm(0, 1, ACCEPTED_RADIUS_KM)).toBeCloseTo(111.19, 1)
  })
})

describe('determinism', () => {
  it('same inputs, identical output', () => {
    const date = { year: 2026, month: 5, day: 12 }
    const a = syntheticObservation({ latDeg: 5, lonDeg: 110, offsetHours: 7 }, date, 'A')
    const b = syntheticObservation({ latDeg: -5, lonDeg: 110, offsetHours: 7 }, date, 'B')
    expect(JSON.stringify(measureEarth(a, b, 1111.9))).toBe(
      JSON.stringify(measureEarth(a, b, 1111.9)),
    )
  })
})
