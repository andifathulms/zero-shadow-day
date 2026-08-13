import { describe, expect, it } from 'vitest'
import { julianDay } from '@/lib/solar/julian'
import { solarNoon } from '@/lib/solar/noon'
import { solarPosition } from '@/lib/solar/position'
import {
  culminationAltitudeDeg,
  culminationZenithDeg,
  horizontalFromEquatorial,
  horizontalPosition,
  hourAngleDeg,
} from '@/lib/solar/altitude'

const JAKARTA = { latDeg: -6.2088, lonDeg: 106.8456, offsetHours: 7 }

describe('altitude at culmination matches the closed form', () => {
  it('90° minus the separation of latitude and declination', () => {
    for (const month of [1, 3, 6, 9, 12]) {
      const noon = solarNoon(julianDay({ year: 2024, month, day: 12 }), JAKARTA.lonDeg, 7)
      const { altDeg, decDeg } = horizontalPosition(noon.jd, JAKARTA.latDeg, JAKARTA.lonDeg)
      expect(altDeg).toBeCloseTo(culminationAltitudeDeg(JAKARTA.latDeg, decDeg), 4)
      expect(altDeg + culminationZenithDeg(JAKARTA.latDeg, decDeg)).toBeCloseTo(90, 4)
    }
  })

  it('never exceeds 90° anywhere on Earth', () => {
    for (let lat = -90; lat <= 90; lat += 5) {
      for (let dec = -23.44; dec <= 23.44; dec += 2) {
        expect(culminationAltitudeDeg(lat, dec)).toBeLessThanOrEqual(90)
      }
    }
  })
})

/** Separation of two azimuths on the circle, degrees. */
const azimuthGap = (a: number, b: number): number => Math.abs(((a - b + 540) % 360) - 180)

describe('azimuth', () => {
  it('is due north or due south at culmination, according to which side the Sun is on', () => {
    // Jakarta in June: declination is north, latitude is south, so the Sun
    // culminates in the north.
    const june = solarNoon(julianDay({ year: 2024, month: 6, day: 21 }), JAKARTA.lonDeg, 7)
    expect(azimuthGap(horizontalPosition(june.jd, JAKARTA.latDeg, JAKARTA.lonDeg).azDeg, 0)).toBeLessThan(0.01)

    // In December the declination is further south than Jakarta, so it culminates south.
    const december = solarNoon(julianDay({ year: 2024, month: 12, day: 21 }), JAKARTA.lonDeg, 7)
    expect(horizontalPosition(december.jd, JAKARTA.latDeg, JAKARTA.lonDeg).azDeg).toBeCloseTo(180, 2)
  })

  it('runs east in the morning and west in the afternoon', () => {
    const noon = solarNoon(julianDay({ year: 2024, month: 4, day: 10 }), JAKARTA.lonDeg, 7)
    const morning = horizontalPosition(noon.jd - 3 / 24, JAKARTA.latDeg, JAKARTA.lonDeg)
    const afternoon = horizontalPosition(noon.jd + 3 / 24, JAKARTA.latDeg, JAKARTA.lonDeg)
    expect(morning.azDeg).toBeGreaterThan(45)
    expect(morning.azDeg).toBeLessThan(135)
    expect(afternoon.azDeg).toBeGreaterThan(225)
    expect(afternoon.azDeg).toBeLessThan(315)
  })

  it('is symmetric about culmination', () => {
    const noon = solarNoon(julianDay({ year: 2024, month: 4, day: 10 }), JAKARTA.lonDeg, 7)
    const before = horizontalPosition(noon.jd - 2 / 24, JAKARTA.latDeg, JAKARTA.lonDeg)
    const after = horizontalPosition(noon.jd + 2 / 24, JAKARTA.latDeg, JAKARTA.lonDeg)
    expect(before.altDeg).toBeCloseTo(after.altDeg, 1)
  })
})

describe('hour angle', () => {
  it('advances 15° per hour', () => {
    const noon = solarNoon(julianDay({ year: 2024, month: 4, day: 10 }), JAKARTA.lonDeg, 7)
    expect(hourAngleDeg(noon.jd + 1 / 24, JAKARTA.lonDeg)).toBeCloseTo(15, 1)
    expect(hourAngleDeg(noon.jd - 1 / 24, JAKARTA.lonDeg)).toBeCloseTo(-15, 1)
  })
})

describe('horizontalFromEquatorial — geometry alone', () => {
  it('puts the Sun at the zenith when declination equals latitude at culmination', () => {
    const { altDeg } = horizontalFromEquatorial(0, -6.2088, -6.2088)
    expect(altDeg).toBeCloseTo(90, 9)
  })

  it('puts the Sun on the horizon at the pole when declination is zero', () => {
    expect(horizontalFromEquatorial(0, 0, 90).altDeg).toBeCloseTo(0, 9)
  })

  it('gives the observer latitude as the culminating altitude of the celestial equator', () => {
    for (const lat of [-40, -10, 0, 23.44, 51.5]) {
      expect(horizontalFromEquatorial(0, 0, lat).altDeg).toBeCloseTo(90 - Math.abs(lat), 9)
    }
  })
})

describe('determinism', () => {
  it('same input, identical output', () => {
    const jd = julianDay({ year: 2024, month: 8, day: 13 }, 0.2)
    expect(JSON.stringify(horizontalPosition(jd, -6.2, 106.8))).toBe(
      JSON.stringify(horizontalPosition(jd, -6.2, 106.8)),
    )
  })

  it('does not depend on solarPosition being called first', () => {
    const jd = julianDay({ year: 2024, month: 8, day: 13 }, 0.2)
    const first = horizontalPosition(jd, -6.2, 106.8)
    solarPosition(jd + 100)
    expect(horizontalPosition(jd, -6.2, 106.8)).toEqual(first)
  })
})
