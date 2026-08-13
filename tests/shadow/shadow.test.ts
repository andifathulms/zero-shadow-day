import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  compassPointId,
  shadowBearingDeg,
  shadowFromSun,
  shadowLength,
  shadowLengthRatio,
  shadowLengthRatioFromZenith,
  shadowTip,
  zenithFromShadowRatio,
} from '@/lib/shadow'

describe('lib/shadow is independent of lib/solar', () => {
  it('imports nothing from the solar engine', () => {
    const source = readFileSync(new URL('../../lib/shadow/shadow.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/from\s+['"].*solar/)
    expect(source).not.toMatch(/import\s+.*solar/)
  })
})

describe('shadow length is the cotangent of altitude', () => {
  const cases: ReadonlyArray<[number, number]> = [
    [90, 0],
    [60, 1 / Math.sqrt(3)],
    [45, 1],
    [30, Math.sqrt(3)],
    [15, 2 + Math.sqrt(3)], // cot 15° = 2 + √3
  ]

  for (const [altDeg, expected] of cases) {
    it(`altitude ${altDeg}° gives ratio ${expected.toFixed(4)}`, () => {
      expect(shadowLengthRatio(altDeg)).toBeCloseTo(expected, 9)
    })
  }

  it('scales linearly with gnomon height', () => {
    expect(shadowLength(45, 2.5)).toBeCloseTo(2.5, 9)
    expect(shadowLength(30, 3)).toBeCloseTo(3 * Math.sqrt(3), 9)
  })

  it('lengthens without bound as the Sun approaches the horizon', () => {
    expect(shadowLengthRatio(5)).toBeGreaterThan(11)
    expect(shadowLengthRatio(1)).toBeGreaterThan(57)
    expect(shadowLengthRatio(0.1)).toBeGreaterThan(500)
  })
})

describe('zenith form round-trips', () => {
  it('ratio from zenith and zenith from ratio are inverses', () => {
    for (let zenith = 0; zenith < 89; zenith += 3.5) {
      const ratio = shadowLengthRatioFromZenith(zenith)
      expect(zenithFromShadowRatio(ratio)).toBeCloseTo(zenith, 9)
    }
  })

  it('agrees with the altitude form', () => {
    for (let alt = 1; alt <= 89; alt += 4) {
      expect(shadowLengthRatioFromZenith(90 - alt)).toBeCloseTo(shadowLengthRatio(alt), 9)
    }
  })
})

describe('a shadow points away from the Sun', () => {
  const cases: ReadonlyArray<[number, number]> = [
    [0, 180],
    [90, 270],
    [180, 0],
    [270, 90],
    [45, 225],
    [359, 179],
  ]

  for (const [azDeg, expected] of cases) {
    it(`Sun at ${azDeg}° casts a shadow towards ${expected}°`, () => {
      expect(shadowBearingDeg(azDeg)).toBeCloseTo(expected, 9)
    })
  }

  it('stays inside [0, 360)', () => {
    for (let az = -720; az <= 720; az += 7) {
      const bearing = shadowBearingDeg(((az % 360) + 360) % 360)
      expect(bearing).toBeGreaterThanOrEqual(0)
      expect(bearing).toBeLessThan(360)
    }
  })
})

describe('shadowFromSun — the discriminated result', () => {
  it('returns a shadow when the Sun is up', () => {
    const result = shadowFromSun(45, 90)
    expect(result.type).toBe('shadow')
    if (result.type !== 'shadow') throw new Error('unreachable')
    expect(result.lengthRatio).toBeCloseTo(1, 9)
    expect(result.bearingDeg).toBeCloseTo(270, 9)
  })

  it('returns the zenith variant at exactly 90°, where direction is undefined', () => {
    const result = shadowFromSun(90, 180)
    expect(result.type).toBe('zenith')
    expect(result.lengthRatio).toBe(0)
    expect(result).not.toHaveProperty('bearingDeg')
  })

  it('returns no shadow at or below the horizon, rather than a diverging length', () => {
    for (const alt of [0, -0.5, -18, -90]) {
      const result = shadowFromSun(alt, 90)
      expect(result.type).toBe('no-shadow')
      if (result.type !== 'no-shadow') throw new Error('unreachable')
      expect(result.reason).toBe('sun-below-horizon')
    }
  })
})

describe('shadow tip on the ground plane', () => {
  it('a Sun due east throws the tip due west', () => {
    const tip = shadowTip(45, 90, 1)
    expect(tip).not.toBeNull()
    expect(tip?.east).toBeCloseTo(-1, 9)
    expect(tip?.north).toBeCloseTo(0, 9)
  })

  it('a Sun due north throws the tip due south', () => {
    const tip = shadowTip(30, 0, 1)
    expect(tip?.north).toBeCloseTo(-Math.sqrt(3), 9)
    expect(tip?.east).toBeCloseTo(0, 9)
  })

  it('the tip distance equals the shadow length', () => {
    const tip = shadowTip(37, 213, 2)
    expect(Math.hypot(tip?.east ?? 0, tip?.north ?? 0)).toBeCloseTo(shadowLength(37, 2), 9)
  })

  it('is null when the Sun is down', () => {
    expect(shadowTip(-1, 90, 1)).toBeNull()
  })
})

describe('compass points', () => {
  it('names the bearing in Indonesian', () => {
    expect(compassPointId(0)).toBe('utara')
    expect(compassPointId(180)).toBe('selatan')
    expect(compassPointId(90)).toBe('timur')
    expect(compassPointId(315)).toBe('barat laut')
    expect(compassPointId(359)).toBe('utara')
  })
})

describe('determinism', () => {
  it('same input, identical output', () => {
    expect(JSON.stringify(shadowFromSun(33.3, 121.7))).toBe(JSON.stringify(shadowFromSun(33.3, 121.7)))
  })
})
