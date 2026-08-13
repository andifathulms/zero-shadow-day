/**
 * Drawing the gnomon scene onto a 2D canvas.
 *
 * Everything here is geometry that arrived already computed: the sun's altitude
 * and azimuth from `lib/solar`, the shadow from `lib/shadow`, the camera and
 * projection from `lib/scene`. This module places pixels and nothing else.
 *
 * The shadow is drawn from its true tip, in a space where the gnomon is one
 * unit tall, so its length on screen is its real ratio to the stick.
 */

import type { Instant } from '@/lib/day'
import {
  type Camera,
  type Viewport,
  cameraBasis,
  directionFromSky,
  project,
  scaleVec,
  vec,
} from '@/lib/scene/projection'
import { type SkyPalette, mix, shadowQuality, skyFor, stars, toCss } from '@/lib/scene/sky'

/** Sky objects are drawn on a dome at this radius, in gnomon heights. */
const DOME = 60
const STARS = stars(220)

export interface SceneInput {
  readonly instant: Instant
  /** The whole day, for the sun's path across the sky. */
  readonly daySamples: readonly Instant[]
  readonly camera: Camera
  /** Ground rings, in gnomon heights. */
  readonly rings?: readonly number[]
  /** Draw the sun's path for the day. */
  readonly showPath?: boolean
  /** Draw the compass letters on the ground. */
  readonly showCompass?: boolean
  readonly labels?: { north: string; east: string; south: string; west: string }
}

export function drawScene(
  context: CanvasRenderingContext2D,
  viewport: Viewport,
  input: SceneInput,
): void {
  const { instant, camera } = input
  const sky = skyFor(instant.altDeg)
  const focal = viewport.height / 2 / Math.tan(((camera.fovDeg / 2) * Math.PI) / 180)
  // Tilting the camera down lifts the horizon in the frame.
  const horizonY = viewport.height / 2 - focal * Math.tan((camera.elevationDeg * Math.PI) / 180)

  drawSky(context, viewport, sky, horizonY)
  if (sky.night > 0.01) drawStars(context, viewport, camera, sky)
  drawSunGlow(context, viewport, camera, sky, instant)
  if (input.showPath !== false) drawSunPath(context, viewport, camera, input.daySamples, sky)
  drawSun(context, viewport, camera, sky, instant)
  drawGround(context, viewport, sky, horizonY)
  drawRings(context, viewport, camera, sky, input.rings ?? [1, 2, 3, 5])
  if (input.showCompass !== false && input.labels) {
    drawCompass(context, viewport, camera, sky, input.labels)
  }
  drawShadow(context, viewport, camera, sky, instant)
  drawGnomon(context, viewport, camera, sky, instant)
  drawOffscreenSun(context, viewport, camera, sky, instant)
}

/**
 * When the sun is overhead it is genuinely outside the frame — you cannot see
 * your feet and the zenith at once, and pretending otherwise would be a lie
 * about the geometry. So the scene says where it is instead: a chip at the edge
 * of the frame, in the sun's direction, carrying its altitude.
 */
function drawOffscreenSun(
  context: CanvasRenderingContext2D,
  viewport: Viewport,
  camera: Camera,
  sky: SkyPalette,
  instant: Instant,
): void {
  if (instant.altDeg < 0) return
  const point = project(
    scaleVec(directionFromSky(instant.altDeg, instant.azDeg), DOME),
    camera,
    viewport,
  )
  const margin = 26
  const inside =
    point !== null &&
    point.x > margin &&
    point.x < viewport.width - margin &&
    point.y > margin &&
    point.y < viewport.height - margin
  if (inside) return

  // Point towards the sun from the centre of the frame, clamped to the edge.
  const centreX = viewport.width / 2
  const centreY = viewport.height / 2
  const towardsX = point ? point.x - centreX : 0
  const towardsY = point ? point.y - centreY : -1
  const span = Math.hypot(towardsX, towardsY) || 1
  const limit = Math.min(
    Math.abs((viewport.width / 2 - margin) / (towardsX / span || 1e-6)),
    Math.abs((viewport.height / 2 - margin) / (towardsY / span || 1e-6)),
  )
  const x = centreX + (towardsX / span) * limit
  const y = centreY + (towardsY / span) * limit

  context.save()
  context.translate(x, y)
  const glow = context.createRadialGradient(0, 0, 0, 0, 0, 30)
  glow.addColorStop(0, toCss(sky.sunlight, 0.7))
  glow.addColorStop(1, toCss(sky.sunlight, 0))
  context.fillStyle = glow
  context.beginPath()
  context.arc(0, 0, 30, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = toCss(sky.sunlight)
  context.beginPath()
  context.arc(0, 0, 7, 0, Math.PI * 2)
  context.fill()

  context.font = '600 12px var(--font-mono), monospace'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillStyle = 'rgba(20, 17, 14, 0.85)'
  const caption = `${Math.round(instant.altDeg)}°`
  const offsetY = y < viewport.height / 2 ? 22 : -22
  context.fillText(caption, 0, offsetY)
  context.restore()
}

function drawSky(
  context: CanvasRenderingContext2D,
  viewport: Viewport,
  sky: SkyPalette,
  horizonY: number,
): void {
  const gradient = context.createLinearGradient(0, 0, 0, Math.max(horizonY, 1))
  gradient.addColorStop(0, toCss(sky.zenith))
  gradient.addColorStop(0.65, toCss(mix(sky.zenith, sky.horizon, 0.55)))
  gradient.addColorStop(1, toCss(sky.horizon))
  context.fillStyle = gradient
  context.fillRect(0, 0, viewport.width, Math.max(horizonY, 0))
}

function drawGround(
  context: CanvasRenderingContext2D,
  viewport: Viewport,
  sky: SkyPalette,
  horizonY: number,
): void {
  const top = Math.max(0, horizonY)
  const gradient = context.createLinearGradient(0, top, 0, viewport.height)
  // Far ground picks up the horizon's colour; near ground is lit by the sun.
  gradient.addColorStop(0, toCss(mix(sky.ground, sky.horizon, 0.55)))
  gradient.addColorStop(0.25, toCss(mix(sky.ground, sky.sunlight, 0.12 * sky.daylight)))
  gradient.addColorStop(1, toCss(sky.ground))
  context.fillStyle = gradient
  context.fillRect(0, top, viewport.width, viewport.height - top)

  // A soft line of haze where the ground meets the sky.
  const haze = context.createLinearGradient(0, top - 26, 0, top + 10)
  haze.addColorStop(0, toCss(sky.horizon, 0))
  haze.addColorStop(0.7, toCss(sky.horizon, 0.55))
  haze.addColorStop(1, toCss(sky.horizon, 0))
  context.fillStyle = haze
  context.fillRect(0, top - 26, viewport.width, 36)
}

function drawStars(
  context: CanvasRenderingContext2D,
  viewport: Viewport,
  camera: Camera,
  sky: SkyPalette,
): void {
  context.save()
  for (const star of STARS) {
    const point = project(
      scaleVec(directionFromSky(star.altDeg, star.azDeg), DOME),
      camera,
      viewport,
    )
    if (!point) continue
    context.fillStyle = `rgba(255, 253, 247, ${(star.magnitude * sky.night * 0.9).toFixed(3)})`
    context.beginPath()
    context.arc(point.x, point.y, star.magnitude * 1.3, 0, Math.PI * 2)
    context.fill()
  }
  context.restore()
}

/** The wash of light around the sun, which is most of why a sky looks like a sky. */
function drawSunGlow(
  context: CanvasRenderingContext2D,
  viewport: Viewport,
  camera: Camera,
  sky: SkyPalette,
  instant: Instant,
): void {
  if (instant.altDeg < -8) return
  const point = project(
    scaleVec(directionFromSky(instant.altDeg, instant.azDeg), DOME),
    camera,
    viewport,
  )
  if (!point) return

  const radius = viewport.height * 0.85
  const gradient = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius)
  const strength = 0.55 * Math.max(0, Math.min(1, (instant.altDeg + 8) / 20))
  gradient.addColorStop(0, toCss(sky.glow, 0.85 * (0.35 + strength)))
  gradient.addColorStop(0.25, toCss(sky.glow, 0.28 * (0.35 + strength)))
  gradient.addColorStop(1, toCss(sky.glow, 0))
  context.fillStyle = gradient
  context.fillRect(0, 0, viewport.width, viewport.height)
}

function drawSun(
  context: CanvasRenderingContext2D,
  viewport: Viewport,
  camera: Camera,
  sky: SkyPalette,
  instant: Instant,
): void {
  if (instant.altDeg < -2) return
  const point = project(
    scaleVec(directionFromSky(instant.altDeg, instant.azDeg), DOME),
    camera,
    viewport,
  )
  if (!point) return

  const radius = Math.max(9, viewport.height * 0.022)
  const halo = context.createRadialGradient(point.x, point.y, radius * 0.4, point.x, point.y, radius * 4)
  halo.addColorStop(0, toCss(sky.sunlight, 0.9))
  halo.addColorStop(1, toCss(sky.sunlight, 0))
  context.fillStyle = halo
  context.beginPath()
  context.arc(point.x, point.y, radius * 4, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = toCss(mix(sky.sunlight, { r: 255, g: 255, b: 255 }, 0.55))
  context.beginPath()
  context.arc(point.x, point.y, radius, 0, Math.PI * 2)
  context.fill()
}

/** The sun's own track for the day, in its own colour. */
function drawSunPath(
  context: CanvasRenderingContext2D,
  viewport: Viewport,
  camera: Camera,
  samples: readonly Instant[],
  sky: SkyPalette,
): void {
  context.save()
  context.lineWidth = 2
  context.setLineDash([6, 7])
  context.strokeStyle = toCss(sky.sunlight, 0.45 + 0.3 * sky.daylight)
  context.beginPath()
  let drawing = false
  for (const sample of samples) {
    if (sample.altDeg < 0) {
      drawing = false
      continue
    }
    const point = project(
      scaleVec(directionFromSky(sample.altDeg, sample.azDeg), DOME),
      camera,
      viewport,
    )
    if (!point) {
      drawing = false
      continue
    }
    if (drawing) context.lineTo(point.x, point.y)
    else context.moveTo(point.x, point.y)
    drawing = true
  }
  context.stroke()
  context.restore()
}

/** Rings at whole gnomon heights, so the shadow can be read off the ground. */
function drawRings(
  context: CanvasRenderingContext2D,
  viewport: Viewport,
  camera: Camera,
  sky: SkyPalette,
  rings: readonly number[],
): void {
  context.save()
  context.lineWidth = 1
  context.strokeStyle = `rgba(20, 17, 14, ${(0.1 + 0.16 * sky.daylight).toFixed(3)})`
  for (const ring of rings) {
    context.beginPath()
    let drawing = false
    for (let step = 0; step <= 96; step += 1) {
      const angle = (step / 96) * Math.PI * 2
      const point = project(vec(Math.sin(angle) * ring, 0, Math.cos(angle) * ring), camera, viewport)
      if (!point) {
        drawing = false
        continue
      }
      if (drawing) context.lineTo(point.x, point.y)
      else context.moveTo(point.x, point.y)
      drawing = true
    }
    context.stroke()

    // Label the ring, so the shadow can be read as a multiple of the stick.
    const label = project(vec(0, 0, -ring), camera, viewport)
    if (label) {
      context.save()
      context.font = '500 11px var(--font-mono), monospace'
      context.textAlign = 'center'
      context.fillStyle = `rgba(20, 17, 14, ${(0.3 + 0.3 * sky.daylight).toFixed(3)})`
      context.fillText(`${ring}×`, label.x, label.y - 4)
      context.restore()
    }
  }
  context.restore()
}

function drawCompass(
  context: CanvasRenderingContext2D,
  viewport: Viewport,
  camera: Camera,
  sky: SkyPalette,
  labels: { north: string; east: string; south: string; west: string },
): void {
  const marks: Array<[string, number, number]> = [
    [labels.north, 0, 4.4],
    [labels.east, 4.4, 0],
    [labels.south, 0, -4.4],
    [labels.west, -4.4, 0],
  ]
  context.save()
  context.font = '600 13px var(--font-mono), monospace'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillStyle = `rgba(20, 17, 14, ${(0.35 + 0.35 * sky.daylight).toFixed(3)})`
  for (const [label, east, north] of marks) {
    const point = project(vec(east, 0, north), camera, viewport)
    if (point) context.fillText(label, point.x, point.y)
  }
  context.restore()
}

function drawShadow(
  context: CanvasRenderingContext2D,
  viewport: Viewport,
  camera: Camera,
  sky: SkyPalette,
  instant: Instant,
): void {
  const quality = shadowQuality(instant.altDeg)
  if (!instant.tip || quality.opacity <= 0) return

  const foot = project(vec(0, 0, 0), camera, viewport)
  const tip = project(vec(instant.tip.east, 0, instant.tip.north), camera, viewport)
  if (!foot || !tip) return

  // Perpendicular to the shadow, in screen space: a stick's width at the foot,
  // narrowing to a point at the tip.
  const dx = tip.x - foot.x
  const dy = tip.y - foot.y
  const span = Math.hypot(dx, dy) || 1
  const halfWidth = Math.max(2.5, 0.032 * foot.scale)
  const nx = (-dy / span) * halfWidth
  const ny = (dx / span) * halfWidth

  context.save()
  if (quality.blur > 0.5 && 'filter' in context) {
    context.filter = `blur(${quality.blur.toFixed(1)}px)`
  }
  context.fillStyle = `rgba(20, 17, 14, ${quality.opacity.toFixed(3)})`
  context.beginPath()
  context.moveTo(foot.x + nx, foot.y + ny)
  context.lineTo(foot.x - nx, foot.y - ny)
  context.lineTo(tip.x, tip.y)
  context.closePath()
  context.fill()
  context.restore()

  // A small contact darkening where the stick meets the ground: the one place
  // the shadow is genuinely opaque.
  const contact = context.createRadialGradient(foot.x, foot.y, 0, foot.x, foot.y, halfWidth * 5)
  contact.addColorStop(0, `rgba(20, 17, 14, ${(0.5 * sky.daylight).toFixed(3)})`)
  contact.addColorStop(1, 'rgba(20, 17, 14, 0)')
  context.fillStyle = contact
  context.beginPath()
  context.arc(foot.x, foot.y, halfWidth * 5, 0, Math.PI * 2)
  context.fill()
}

function drawGnomon(
  context: CanvasRenderingContext2D,
  viewport: Viewport,
  camera: Camera,
  sky: SkyPalette,
  instant: Instant,
): void {
  const foot = project(vec(0, 0, 0), camera, viewport)
  const top = project(vec(0, 1, 0), camera, viewport)
  if (!foot || !top) return

  const { right } = cameraBasis(camera)
  void right
  const dx = top.x - foot.x
  const dy = top.y - foot.y
  const span = Math.hypot(dx, dy) || 1
  const baseHalf = Math.max(2.5, 0.03 * foot.scale)
  const topHalf = Math.max(2, 0.024 * top.scale)
  const nx = (-dy / span) * baseHalf
  const ny = (dx / span) * baseHalf
  const tx = (-dy / span) * topHalf
  const ty = (dx / span) * topHalf

  // Lit on the side the sun is on, dark on the other: a cylinder, cheaply.
  const gradient = context.createLinearGradient(foot.x - nx, foot.y - ny, foot.x + nx, foot.y + ny)
  const lit = mix({ r: 20, g: 17, b: 14 }, sky.sunlight, 0.45 * sky.daylight)
  gradient.addColorStop(0, toCss({ r: 20, g: 17, b: 14 }))
  gradient.addColorStop(0.55, toCss(lit))
  gradient.addColorStop(1, toCss({ r: 20, g: 17, b: 14 }))

  context.fillStyle = gradient
  context.beginPath()
  context.moveTo(foot.x + nx, foot.y + ny)
  context.lineTo(top.x + tx, top.y + ty)
  context.lineTo(top.x - tx, top.y - ty)
  context.lineTo(foot.x - nx, foot.y - ny)
  context.closePath()
  context.fill()
}
