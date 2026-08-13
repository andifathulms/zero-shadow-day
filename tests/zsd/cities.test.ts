import { describe, expect, it } from 'vitest'
import {
  INDONESIAN_CITIES,
  NORTHERNMOST,
  SOUTHERNMOST,
  greatCircleKm,
  indonesianOffsetForLongitude,
  nearestCity,
  searchCities,
} from '@/data/cities/indonesia'
import { declinationLimits, zeroShadowDays } from '@/lib/zsd'

describe('the whole country lies inside the tropics', () => {
  const limits = declinationLimits(2026)

  it('Sabang to Rote: every listed city is within the declination band', () => {
    for (const city of INDONESIAN_CITIES) {
      expect(city.latDeg, city.name).toBeLessThan(limits.maxDeg)
      expect(city.latDeg, city.name).toBeGreaterThan(limits.minDeg)
    }
    expect(NORTHERNMOST.name).toBe('Sabang')
    expect(SOUTHERNMOST.name).toBe('Kupang')
    // The span of the archipelago: roughly 6°N to 10°S, comfortably inside
    // the +-23.44° band, which is why nowhere in the country misses out.
    expect(NORTHERNMOST.latDeg).toBeCloseTo(5.89, 1)
    expect(SOUTHERNMOST.latDeg).toBeCloseTo(-10.18, 1)
  })

  it('so every one of them gets two zero shadow days', () => {
    for (const city of INDONESIAN_CITIES) {
      const result = zeroShadowDays(city, 2026)
      expect(result.type, city.name).toBe('zero-shadow-days')
      if (result.type !== 'zero-shadow-days') throw new Error('unreachable')
      expect(result.days, city.name).toHaveLength(2)
    }
  })
})

describe('the zone follows the meridian, not a lookup table', () => {
  it('assigns WIB, WITA and WIT by longitude', () => {
    expect(indonesianOffsetForLongitude(106.8)).toBe(7)
    expect(indonesianOffsetForLongitude(119.4)).toBe(8)
    expect(indonesianOffsetForLongitude(140.7)).toBe(9)
  })

  it('agrees with every listed city’s own offset within a boundary province', () => {
    // Kalimantan and Sulawesi straddle the zone boundaries by administrative
    // decision rather than longitude, so this holds for the clear cases only.
    const clear = INDONESIAN_CITIES.filter(
      (city) => city.lonDeg < 105 || (city.lonDeg > 122 && city.lonDeg < 126) || city.lonDeg > 135,
    )
    for (const city of clear) {
      expect(indonesianOffsetForLongitude(city.lonDeg), city.name).toBe(city.offsetHours)
    }
  })
})

describe('lookup happens on the device', () => {
  it('search matches name and region', () => {
    expect(searchCities('jakar').map((city) => city.name)).toContain('Jakarta')
    expect(searchCities('aceh').map((city) => city.name)).toContain('Banda Aceh')
    expect(searchCities('papua').length).toBeGreaterThan(2)
    expect(searchCities('')).toHaveLength(0)
  })

  it('nearest city is a for-loop, not a geocoding request', () => {
    const near = nearestCity(-6.2, 106.85)
    expect(near.city.name).toBe('Jakarta')
    expect(near.km).toBeLessThan(5)
  })

  it('great-circle distance is right at a known separation', () => {
    // Jakarta to Surabaya is about 660 km.
    expect(greatCircleKm(-6.2088, 106.8456, -7.2575, 112.7521)).toBeCloseTo(660, -1)
    expect(greatCircleKm(0, 0, 0, 1)).toBeCloseTo(111.19, 1)
  })
})
