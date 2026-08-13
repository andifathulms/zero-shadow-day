import { describe, expect, it } from 'vitest'
import { analemma, dayTrack, instantAt, noonOfYear, shadowTipCurve } from '@/lib/day'
import { zeroShadowDays } from '@/lib/zsd'
import type { Place } from '@/lib/zsd'

const JAKARTA: Place = { latDeg: -6.2088, lonDeg: 106.8456, offsetHours: 7 }

describe('the day track', () => {
  const track = dayTrack(JAKARTA, { year: 2024, month: 4, day: 10 }, 5)

  it('rises and sets once, roughly twelve hours apart in the tropics', () => {
    expect(track.sunriseHours).not.toBeNull()
    expect(track.sunsetHours).not.toBeNull()
    const daylight = (track.sunsetHours ?? 0) - (track.sunriseHours ?? 0)
    expect(daylight).toBeGreaterThan(11.5)
    expect(daylight).toBeLessThan(12.5)
  })

  it('culminates between sunrise and sunset', () => {
    expect(track.noonLocalHours).toBeGreaterThan(track.sunriseHours ?? 0)
    expect(track.noonLocalHours).toBeLessThan(track.sunsetHours ?? 24)
  })

  it('has its shortest shadow at culmination', () => {
    const shortest = track.samples
      .filter((sample) => sample.shadow.type === 'shadow')
      .reduce((best, sample) =>
        sample.shadow.type === 'shadow' &&
        best.shadow.type === 'shadow' &&
        sample.shadow.lengthRatio < best.shadow.lengthRatio
          ? sample
          : best,
      )
    expect(Math.abs(shortest.localHours - track.noonLocalHours)).toBeLessThan(0.1)
  })

  it('casts no shadow at night', () => {
    const midnight = instantAt(JAKARTA, { year: 2024, month: 4, day: 10 }, 0)
    expect(midnight.shadow.type).toBe('no-shadow')
    expect(midnight.tip).toBeNull()
  })
})

describe('the noon shadow flips direction as the Sun crosses the latitude', () => {
  it('Jakarta’s noon shadow points south in the northern half of the year and north in the southern', () => {
    const year = noonOfYear(JAKARTA, 2024)
    const june = year.find((day) => day.date.month === 6 && day.date.day === 21)
    const december = year.find((day) => day.date.month === 12 && day.date.day === 21)
    // Sun north of Jakarta in June: the shadow falls south.
    expect(june?.bearingDeg).toBeGreaterThan(170)
    expect(june?.bearingDeg).toBeLessThan(190)
    // Sun south of Jakarta in December: the shadow falls north.
    expect(december?.bearingDeg ?? 180).toBeLessThan(10)
  })

  it('the noon shadow reaches its minimum on the zero shadow days', () => {
    const year = noonOfYear(JAKARTA, 2024)
    const result = zeroShadowDays(JAKARTA, 2024)
    if (result.type !== 'zero-shadow-days') throw new Error('unreachable')
    for (const zsd of result.days) {
      const day = year.find(
        (entry) => entry.date.month === zsd.date.month && entry.date.day === zsd.date.day,
      )
      expect(day).toBeDefined()
      expect(day?.shadowRatio).toBeCloseTo(zsd.minShadowRatio, 6)
      // Nothing else in the year is shorter.
      expect(Math.min(...year.map((entry) => entry.shadowRatio))).toBeGreaterThanOrEqual(
        Math.min(...result.days.map((entry) => entry.minShadowRatio)) - 1e-12,
      )
    }
  })
})

describe('the shadow-tip curve', () => {
  it('is a straight line on the equinox and curved on the solstice', () => {
    const straightness = (points: ReturnType<typeof shadowTipCurve>): number => {
      const drawn = points.filter((point): point is NonNullable<typeof point> => point !== null)
      const first = drawn[0]!
      const last = drawn[drawn.length - 1]!
      // Greatest perpendicular deviation from the chord, in gnomon heights.
      const dx = last.east - first.east
      const dy = last.north - first.north
      const length = Math.hypot(dx, dy)
      return Math.max(
        ...drawn.map(
          (point) =>
            Math.abs(dx * (first.north - point.north) - (first.east - point.east) * dy) / length,
        ),
      )
    }

    const equinox = shadowTipCurve(JAKARTA, { year: 2024, month: 3, day: 20 })
    const solstice = shadowTipCurve(JAKARTA, { year: 2024, month: 6, day: 21 })
    expect(straightness(equinox)).toBeLessThan(0.02)
    expect(straightness(solstice)).toBeGreaterThan(0.5)
  })

  it('breaks the polyline rather than clipping to the edge', () => {
    const points = shadowTipCurve(JAKARTA, { year: 2024, month: 6, day: 21 })
    expect(points.some((point) => point === null)).toBe(true)
  })
})

describe('the analemma', () => {
  const figure = analemma(JAKARTA, 2024, 12)

  it('has a point for every day of the year', () => {
    expect(figure).toHaveLength(366)
  })

  it('spans the Equation of Time’s full swing — the figure-eight is that quantity', () => {
    const eot = figure.map((point) => point.eotMinutes)
    expect(Math.max(...eot)).toBeGreaterThan(16)
    expect(Math.min(...eot)).toBeLessThan(-14)
  })

  it('crosses itself: the same azimuth is reached at two different declinations', () => {
    const north = figure.filter((point) => point.decDeg > 10)
    const south = figure.filter((point) => point.decDeg < -10)
    expect(north.length).toBeGreaterThan(50)
    expect(south.length).toBeGreaterThan(50)
  })
})

describe('determinism', () => {
  it('same inputs, identical output', () => {
    const date = { year: 2024, month: 4, day: 10 }
    expect(JSON.stringify(dayTrack(JAKARTA, date, 30))).toBe(
      JSON.stringify(dayTrack(JAKARTA, date, 30)),
    )
  })
})
