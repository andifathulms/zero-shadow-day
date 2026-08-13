import { describe, expect, it } from 'vitest'
import { julianDay, julianDayFromTime } from '@/lib/solar/julian'
import {
  OBLIQUITY_J2000_DEG,
  SOLAR_SEMI_DIAMETER_1AU_DEG,
  declinationDeg,
  equationOfTimeMinutes,
  solarPosition,
} from '@/lib/solar/position'

/**
 * Oracles are published values, never values this engine produced.
 *
 * Equinox and solstice instants are published to the minute; at those instants
 * the apparent solar declination is 0 and ±(true obliquity) by definition, so
 * they are the tightest free check available on the declination series.
 * Times below are UT, as published by the US Naval Observatory / IMCCE.
 */
const EQUINOX_2024 = [
  { label: '2024 March equinox', date: { year: 2024, month: 3, day: 20 }, hour: 3, minute: 6 },
  { label: '2024 September equinox', date: { year: 2024, month: 9, day: 22 }, hour: 12, minute: 44 },
] as const

const EQUINOX_2025 = [
  { label: '2025 March equinox', date: { year: 2025, month: 3, day: 20 }, hour: 9, minute: 1 },
  { label: '2025 September equinox', date: { year: 2025, month: 9, day: 22 }, hour: 18, minute: 19 },
] as const

const SOLSTICE = [
  { label: '2024 June solstice', date: { year: 2024, month: 6, day: 20 }, hour: 20, minute: 51, sign: 1 },
  { label: '2024 December solstice', date: { year: 2024, month: 12, day: 21 }, hour: 9, minute: 21, sign: -1 },
  { label: '2025 June solstice', date: { year: 2025, month: 6, day: 21 }, hour: 2, minute: 42, sign: 1 },
  { label: '2025 December solstice', date: { year: 2025, month: 12, day: 21 }, hour: 15, minute: 3, sign: -1 },
] as const

describe('declination at published equinox instants', () => {
  for (const { label, date, hour, minute } of [...EQUINOX_2024, ...EQUINOX_2025]) {
    it(`${label}: declination is zero`, () => {
      const dec = declinationDeg(julianDayFromTime(date, hour, minute))
      // Declination moves ~0.4°/day near an equinox, so a one-minute published
      // rounding is ~0.0003°. 0.01° is the engine's own stated accuracy.
      expect(Math.abs(dec)).toBeLessThan(0.01)
    })
  }
})

describe('declination at published solstice instants', () => {
  for (const { label, date, hour, minute, sign } of SOLSTICE) {
    it(`${label}: declination reaches the obliquity`, () => {
      const { decDeg, obliquityDeg } = solarPosition(julianDayFromTime(date, hour, minute))
      expect(Math.sign(decDeg)).toBe(sign)
      expect(Math.abs(decDeg)).toBeCloseTo(obliquityDeg, 3)
      // Published obliquity of the ecliptic for this era.
      expect(obliquityDeg).toBeGreaterThan(23.43)
      expect(obliquityDeg).toBeLessThan(OBLIQUITY_J2000_DEG)
    })
  }
})

describe('declination stays within the obliquity band all year', () => {
  it('never exceeds the tropics — this is why the tropics are where they are', () => {
    for (let jd = julianDay({ year: 2024, month: 1, day: 1 }); jd < julianDay({ year: 2025, month: 1, day: 1 }); jd += 0.25) {
      expect(Math.abs(declinationDeg(jd))).toBeLessThanOrEqual(OBLIQUITY_J2000_DEG)
    }
  })
})

/**
 * Equation of Time. Published extrema and zero crossings (Astronomical Almanac,
 * NOAA Solar Calculator): about −14.2 min around 11 February, +3.7 min around
 * 14 May, −6.5 min around 26 July, +16.4 min around 3 November; the curve
 * crosses zero around 15 April, 13 June, 1 September and 25 December.
 */
describe('Equation of Time against published extrema', () => {
  const samples: Array<{ jd: number; eot: number }> = []
  const start = julianDay({ year: 2024, month: 1, day: 1 }, 0.5)
  for (let i = 0; i < 366; i += 1) {
    samples.push({ jd: start + i, eot: equationOfTimeMinutes(start + i) })
  }

  const extremum = (fromMonth: number, toMonth: number, pick: 'min' | 'max') => {
    const window = samples.filter((s) => {
      const doy = s.jd - start
      const monthStart = julianDay({ year: 2024, month: fromMonth, day: 1 }, 0.5) - start
      const monthEnd = julianDay({ year: 2024, month: toMonth, day: 28 }, 0.5) - start
      return doy >= monthStart && doy <= monthEnd
    })
    return window.reduce((best, s) =>
      pick === 'min' ? (s.eot < best.eot ? s : best) : s.eot > best.eot ? s : best,
    )
  }

  it('deep February minimum is about −14.2 minutes', () => {
    const found = extremum(1, 3, 'min')
    expect(found.eot).toBeCloseTo(-14.2, 0)
    expect(found.jd - start).toBeCloseTo(julianDay({ year: 2024, month: 2, day: 11 }, 0.5) - start, -0.5)
  })

  it('May maximum is about +3.7 minutes', () => {
    const found = extremum(4, 6, 'max')
    expect(found.eot).toBeCloseTo(3.7, 0)
  })

  it('July minimum is about −6.5 minutes', () => {
    const found = extremum(6, 8, 'min')
    expect(found.eot).toBeCloseTo(-6.5, 0)
  })

  it('November maximum is about +16.4 minutes', () => {
    const found = extremum(10, 12, 'max')
    expect(found.eot).toBeCloseTo(16.4, 0)
  })

  it('crosses zero four times a year, on the published dates', () => {
    const crossings: number[] = []
    for (let i = 1; i < samples.length; i += 1) {
      const previous = samples[i - 1]!
      const current = samples[i]!
      if (Math.sign(previous.eot) !== Math.sign(current.eot)) crossings.push(current.jd - start + 1)
    }
    expect(crossings).toHaveLength(4)
    const published = [
      julianDay({ year: 2024, month: 4, day: 15 }, 0.5) - start + 1,
      julianDay({ year: 2024, month: 6, day: 13 }, 0.5) - start + 1,
      julianDay({ year: 2024, month: 9, day: 1 }, 0.5) - start + 1,
      julianDay({ year: 2024, month: 12, day: 25 }, 0.5) - start + 1,
    ]
    crossings.forEach((crossing, index) => {
      expect(Math.abs(crossing - published[index]!)).toBeLessThanOrEqual(2)
    })
  })
})

describe('solar disc and distance', () => {
  it('perihelion falls in early January and aphelion in early July', () => {
    let nearest = { jd: 0, r: Infinity }
    let farthest = { jd: 0, r: 0 }
    const start = julianDay({ year: 2024, month: 1, day: 1 }, 0.5)
    for (let i = 0; i < 366; i += 1) {
      const { radiusVectorAu } = solarPosition(start + i)
      if (radiusVectorAu < nearest.r) nearest = { jd: start + i, r: radiusVectorAu }
      if (radiusVectorAu > farthest.r) farthest = { jd: start + i, r: radiusVectorAu }
    }
    // Published: perihelion 0.9833 AU around 3 January, aphelion 1.0167 AU around 5 July.
    expect(nearest.r).toBeCloseTo(0.9833, 3)
    expect(farthest.r).toBeCloseTo(1.0167, 3)
    expect(nearest.jd - start).toBeLessThan(10)
    expect(farthest.jd - start).toBeGreaterThan(180)
  })

  it('the disc is about half a degree across — the reason "zero" has a width', () => {
    const { semiDiameterDeg } = solarPosition(julianDay({ year: 2024, month: 4, day: 1 }, 0.5))
    expect(semiDiameterDeg * 2).toBeGreaterThan(0.52)
    expect(semiDiameterDeg * 2).toBeLessThan(0.55)
    // IAU 1976 solar semi-diameter at 1 AU: 959.63 arcseconds.
    expect(SOLAR_SEMI_DIAMETER_1AU_DEG * 3600).toBeCloseTo(959.63, 6)
  })
})

describe('determinism', () => {
  it('same input, identical output', () => {
    const jd = julianDayFromTime({ year: 2024, month: 8, day: 13 }, 4, 30)
    expect(JSON.stringify(solarPosition(jd))).toBe(JSON.stringify(solarPosition(jd)))
  })
})
