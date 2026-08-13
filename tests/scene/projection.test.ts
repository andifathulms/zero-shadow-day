import { describe, expect, it } from 'vitest'
import {
  type Camera,
  cameraBasis,
  cameraPosition,
  clipSegment,
  directionFromSky,
  groundPointAt,
  length,
  project,
  vec,
} from '@/lib/scene/projection'
import { mix, shadowQuality, skyFor, stars, toCss } from '@/lib/scene/sky'
import { shadowTip } from '@/lib/shadow'

const camera: Camera = {
  azimuthDeg: 200,
  elevationDeg: 18,
  distance: 7,
  fovDeg: 42,
  target: vec(0, 0.5, 0),
}
const viewport = { width: 800, height: 500 }

describe('sky directions match the astronomy convention', () => {
  it('azimuth is clockwise from north, altitude is up', () => {
    expect(directionFromSky(0, 0)).toMatchObject({ x: expect.closeTo(0, 9), z: expect.closeTo(1, 9) })
    expect(directionFromSky(0, 90).x).toBeCloseTo(1, 9)
    expect(directionFromSky(0, 180).z).toBeCloseTo(-1, 9)
    expect(directionFromSky(0, 270).x).toBeCloseTo(-1, 9)
    expect(directionFromSky(90, 0).y).toBeCloseTo(1, 9)
  })

  it('is a unit vector at every angle', () => {
    for (let alt = -90; alt <= 90; alt += 13) {
      for (let az = 0; az < 360; az += 37) {
        expect(length(directionFromSky(alt, az))).toBeCloseTo(1, 12)
      }
    }
  })
})

describe('the camera', () => {
  it('stands at its stated distance from the target', () => {
    expect(length({
      x: cameraPosition(camera).x - camera.target.x,
      y: cameraPosition(camera).y - camera.target.y,
      z: cameraPosition(camera).z - camera.target.z,
    })).toBeCloseTo(camera.distance, 9)
  })

  it('has an orthonormal basis', () => {
    const { right, up, forward } = cameraBasis(camera)
    for (const axis of [right, up, forward]) expect(length(axis)).toBeCloseTo(1, 9)
    const dot = (a: typeof right, b: typeof right) => a.x * b.x + a.y * b.y + a.z * b.z
    expect(dot(right, up)).toBeCloseTo(0, 9)
    expect(dot(right, forward)).toBeCloseTo(0, 9)
    expect(dot(up, forward)).toBeCloseTo(0, 9)
  })

  it('does not degenerate looking straight down', () => {
    const overhead = { ...camera, elevationDeg: 90 }
    const { right, up, forward } = cameraBasis(overhead)
    for (const axis of [right, up, forward]) {
      expect(Number.isFinite(length(axis))).toBe(true)
      expect(length(axis)).toBeCloseTo(1, 9)
    }
  })
})

describe('projection', () => {
  it('puts the target at the centre of the frame', () => {
    const projected = project(camera.target, camera, viewport)
    expect(projected?.x).toBeCloseTo(viewport.width / 2, 6)
    expect(projected?.y).toBeCloseTo(viewport.height / 2, 6)
  })

  it('refuses points behind the camera rather than wrapping them round', () => {
    // Camera due north of the origin looking south: anything further north is
    // behind it.
    const facingSouth: Camera = {
      azimuthDeg: 0,
      elevationDeg: 0,
      distance: 5,
      fovDeg: 42,
      target: vec(0, 0, 0),
    }
    expect(project(vec(0, 0, 40), facingSouth, viewport)).toBeNull()
    expect(project(vec(0, 0, -10), facingSouth, viewport)).not.toBeNull()
  })

  it('shrinks with distance, in inverse proportion', () => {
    const near = project(vec(0, 0, 0), { ...camera, distance: 5 }, viewport)
    const far = project(vec(0, 0, 0), { ...camera, distance: 10 }, viewport)
    expect(near!.scale / far!.scale).toBeCloseTo(2, 1)
  })

  it('puts up on the screen where up is in the world', () => {
    const top = project(vec(0, 1, 0), camera, viewport)!
    const bottom = project(vec(0, 0, 0), camera, viewport)!
    expect(top.y).toBeLessThan(bottom.y)
  })
})

describe('the projection preserves the shadow, which is the whole point', () => {
  it('the drawn shadow is the true ratio, because one transform moves every point', () => {
    // Seen from directly overhead, the ground plane maps linearly, so a shadow
    // twice as long is drawn twice as long. Any scene that fudged the shadow for
    // looks would fail this (CLAUDE.md invariant 10).
    const overhead: Camera = {
      azimuthDeg: 0,
      elevationDeg: 90,
      distance: 12,
      fovDeg: 40,
      target: vec(0, 0, 0),
    }
    const foot = project(vec(0, 0, 0), overhead, viewport)!
    const measure = (altDeg: number): number => {
      const tip = shadowTip(altDeg, 90, 1)!
      const screen = project(vec(tip.east, 0, tip.north), overhead, viewport)!
      return Math.hypot(screen.x - foot.x, screen.y - foot.y)
    }
    // cot(26.565°) = 2.000, cot(45°) = 1.000 — a ratio of exactly two.
    expect(measure(26.56505) / measure(45)).toBeCloseTo(2, 3)
    expect(measure(45) / measure(63.43495)).toBeCloseTo(2, 3)
  })
})

describe('clipping', () => {
  it('keeps a segment that is entirely in front', () => {
    expect(clipSegment(vec(0, 0, 0), vec(1, 0, 1), camera)).not.toBeNull()
  })

  it('drops a segment that is entirely behind', () => {
    const close = { ...camera, distance: 0.1, elevationDeg: 0, azimuthDeg: 0 }
    expect(clipSegment(vec(0, 0, 5), vec(0, 0, 9), close)).toBeNull()
  })

  it('cuts a crossing segment at the near plane', () => {
    const close = { ...camera, distance: 1, elevationDeg: 0, azimuthDeg: 0, target: vec(0, 0, 0) }
    const clipped = clipSegment(vec(0, 0, -3), vec(0, 0, 3), close)
    expect(clipped).not.toBeNull()
    // Both ends must now project, which is the property that matters.
    expect(project(clipped!.from, close, viewport)).not.toBeNull()
    expect(project(clipped!.to, close, viewport)).not.toBeNull()
  })
})

describe('picking the ground', () => {
  it('the centre of the frame lands on the point the camera looks at', () => {
    const flat: Camera = { ...camera, target: vec(0, 0, 0) }
    const ground = groundPointAt(viewport.width / 2, viewport.height / 2, flat, viewport)
    expect(ground?.x).toBeCloseTo(0, 6)
    expect(ground?.z).toBeCloseTo(0, 6)
    expect(ground?.y).toBeCloseTo(0, 6)
  })

  it('returns nothing when the ray never meets the ground', () => {
    const skyward: Camera = { ...camera, elevationDeg: -20, target: vec(0, 5, 0) }
    expect(groundPointAt(viewport.width / 2, 0, skyward, viewport)).toBeNull()
  })
})

describe('the sky is driven by the sun, not by the clock', () => {
  it('goes from night through dawn to day as the altitude rises', () => {
    const night = skyFor(-20)
    const dawn = skyFor(0)
    const noon = skyFor(70)
    expect(night.daylight).toBeCloseTo(0, 6)
    expect(noon.daylight).toBeCloseTo(1, 6)
    expect(dawn.daylight).toBeGreaterThan(0)
    expect(dawn.daylight).toBeLessThan(1)
    // The horizon burns orange at dawn: more red than blue.
    expect(dawn.horizon.r).toBeGreaterThan(dawn.horizon.b)
    // By day it is the other way round.
    expect(noon.zenith.b).toBeGreaterThan(noon.zenith.r)
  })

  it('moves continuously, with no visible step anywhere', () => {
    // The dawn ramp is steep on purpose — sunrise is abrupt in the tropics — so
    // a bound on the step size would only measure that steepness. A step shows
    // up as curvature, so the second difference is what to bound: a smooth ramp
    // keeps it near zero, and any discontinuity blows it up.
    const channels = (alt: number) => {
      const sky = skyFor(alt)
      return [sky.zenith.r, sky.zenith.g, sky.zenith.b, sky.horizon.r, sky.ground.g]
    }
    for (let alt = -25; alt <= 90; alt += 0.25) {
      const before = channels(alt - 0.25)
      const here = channels(alt)
      const after = channels(alt + 0.25)
      for (let index = 0; index < here.length; index += 1) {
        const curvature = Math.abs(after[index]! - 2 * here[index]! + before[index]!)
        expect(curvature, `channel ${index} at ${alt}°`).toBeLessThan(1)
      }
    }
  })

  it('stars are out at night and gone by day', () => {
    expect(skyFor(-15).night).toBeCloseTo(1, 6)
    expect(skyFor(10).night).toBeCloseTo(0, 6)
  })

  it('the shadow hardens as the sun climbs', () => {
    expect(shadowQuality(-1).opacity).toBe(0)
    expect(shadowQuality(70).opacity).toBeGreaterThan(shadowQuality(10).opacity)
    expect(shadowQuality(70).blur).toBeLessThan(shadowQuality(5).blur)
  })
})

describe('the picture is deterministic too', () => {
  it('the same stars come out every time, on every machine', () => {
    expect(stars(40)).toEqual(stars(40))
    expect(stars(40)[0]!.azDeg).toBeGreaterThanOrEqual(0)
    expect(stars(40).every((star) => star.altDeg >= 0 && star.altDeg <= 90)).toBe(true)
  })

  it('colours format as css', () => {
    expect(toCss({ r: 10, g: 20, b: 30 })).toBe('rgb(10, 20, 30)')
    expect(toCss({ r: 10, g: 20, b: 30 }, 0.5)).toBe('rgba(10, 20, 30, 0.500)')
    expect(mix({ r: 0, g: 0, b: 0 }, { r: 10, g: 10, b: 10 }, 0.5).r).toBe(5)
  })
})
