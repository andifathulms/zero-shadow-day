import { describe, expect, it } from 'vitest'
import { julianDay, julianDayFromTime } from '@/lib/solar/julian'
import {
  INDONESIA_ZONES,
  formatHours,
  solarNoon,
  solarNoonJd,
  zoneMeridianDeg,
} from '@/lib/solar/noon'
import { equationOfTimeMinutes } from '@/lib/solar/position'
import { hourAngleDeg } from '@/lib/solar/altitude'

const BANDA_ACEH = { latDeg: 5.5483, lonDeg: 95.3238, offsetHours: 7 }
const JAKARTA = { latDeg: -6.2088, lonDeg: 106.8456, offsetHours: 7 }
const JAYAPURA = { latDeg: -2.5333, lonDeg: 140.7167, offsetHours: 9 }

describe('Indonesian zones are anchored meridians, not a database', () => {
  it('WIB, WITA and WIT sit on 105°E, 120°E and 135°E', () => {
    expect(INDONESIA_ZONES.map((z) => z.meridianDeg)).toEqual([105, 120, 135])
    expect(INDONESIA_ZONES.map((z) => zoneMeridianDeg(z.offsetHours))).toEqual([105, 120, 135])
  })
})

describe('solar noon decomposes into longitude and the Equation of Time', () => {
  it('Banda Aceh runs roughly forty minutes late on longitude alone (PRD §1)', () => {
    const noon = solarNoon(julianDay({ year: 2024, month: 4, day: 1 }), BANDA_ACEH.lonDeg, 7)
    // (105 − 95.3238)° × 4 min/° = 38.7 min
    expect(noon.longitudeOffsetMinutes).toBeCloseTo(38.7, 1)
    expect(noon.offsetMinutes).toBeCloseTo(
      noon.longitudeOffsetMinutes + noon.eotOffsetMinutes,
      9,
    )
  })

  it('Jakarta sits east of its meridian, so solar noon comes early on that count', () => {
    const noon = solarNoon(julianDay({ year: 2024, month: 4, day: 1 }), JAKARTA.lonDeg, 7)
    expect(noon.longitudeOffsetMinutes).toBeLessThan(0)
    expect(noon.longitudeOffsetMinutes).toBeCloseTo(-7.4, 1)
  })

  it('Jayapura sits east of 135°E and so runs early too', () => {
    const noon = solarNoon(julianDay({ year: 2024, month: 4, day: 1 }), JAYAPURA.lonDeg, 9)
    expect(noon.longitudeOffsetMinutes).toBeCloseTo(-22.9, 1)
  })

  it('the Equation of Time term is its negation, and swings by about 30 minutes', () => {
    const early = solarNoon(julianDay({ year: 2024, month: 11, day: 3 }), JAKARTA.lonDeg, 7)
    const late = solarNoon(julianDay({ year: 2024, month: 2, day: 11 }), JAKARTA.lonDeg, 7)
    expect(early.eotOffsetMinutes).toBeCloseTo(-early.eotMinutes, 9)
    expect(early.eotOffsetMinutes).toBeLessThan(-16)
    expect(late.eotOffsetMinutes).toBeGreaterThan(14)
    expect(late.localHours - early.localHours).toBeCloseTo(30.6 / 60, 1)
  })
})

describe('solar noon is the instant the hour angle is zero', () => {
  const places = [
    { label: 'Banda Aceh', ...BANDA_ACEH },
    { label: 'Jakarta', ...JAKARTA },
    { label: 'Jayapura', ...JAYAPURA },
  ]

  for (const place of places) {
    it(`${place.label}: hour angle vanishes at the computed instant`, () => {
      for (const month of [1, 4, 7, 10]) {
        const noon = solarNoon(julianDay({ year: 2024, month, day: 15 }), place.lonDeg, place.offsetHours)
        // Under 0.01° of hour angle is under 2.5 seconds of time.
        expect(Math.abs(hourAngleDeg(noon.jd, place.lonDeg))).toBeLessThan(0.01)
      }
    })
  }

  it('solarNoonJd agrees with the civil-time form', () => {
    const noon = solarNoon(julianDay({ year: 2024, month: 9, day: 8 }), JAKARTA.lonDeg, 7)
    const bare = solarNoonJd(noon.jd, JAKARTA.lonDeg)
    expect(bare).toBeCloseTo(noon.jd, 6)
  })
})

describe('solar noon against the closed form', () => {
  it('local noon equals 12:00 + longitude offset − Equation of Time', () => {
    const jdMidnight = julianDay({ year: 2024, month: 6, day: 21 })
    const noon = solarNoon(jdMidnight, JAKARTA.lonDeg, 7)
    const eot = equationOfTimeMinutes(noon.jd)
    const expectedMinutes = 720 + (105 - JAKARTA.lonDeg) * 4 - eot
    expect(noon.localHours * 60).toBeCloseTo(expectedMinutes, 6)
  })
})

describe('formatting is a display concern with tabular width', () => {
  it('pads to HH:MM', () => {
    expect(formatHours(12.5)).toBe('12:30')
    expect(formatHours(9.005)).toBe('09:00')
    expect(formatHours(0)).toBe('00:00')
  })
})

describe('determinism', () => {
  it('same input, identical output', () => {
    const jd = julianDayFromTime({ year: 2024, month: 8, day: 13 }, 0)
    expect(JSON.stringify(solarNoon(jd, 110, 7))).toBe(JSON.stringify(solarNoon(jd, 110, 7)))
  })
})
