/**
 * `lib/scene` — a small 3D projection, written from scratch.
 *
 * No engine, no dependency: a gnomon scene is a stick, a ground plane and a
 * sun, and that needs a camera and a perspective divide, not a renderer. This
 * keeps the site offline, under the JS budget of PRD §11, and free of the
 * WebGL fallback problem on older phones.
 *
 * World axes match the sky, so the geometry reads the same as the astronomy:
 *
 *   +x  east        +y  up (zenith)        +z  north
 *
 * Distances are in gnomon heights, so the stick is exactly 1 unit tall and the
 * shadow's length in this space *is* its ratio to the gnomon. The projection is
 * a camera transform applied to every point alike, so it never distorts that
 * relationship (CLAUDE.md invariant 10).
 *
 * Pure. No DOM, no clock, no network.
 */

export interface Vec3 {
  readonly x: number
  readonly y: number
  readonly z: number
}

/** An orbiting camera: where it stands is given in the same sky angles as the sun. */
export interface Camera {
  /** Compass bearing of the camera from the target, degrees clockwise from north. */
  readonly azimuthDeg: number
  /** Height of the camera above the horizon as seen from the target, degrees. */
  readonly elevationDeg: number
  /** Distance from the target, in gnomon heights. */
  readonly distance: number
  /** Vertical field of view, degrees. */
  readonly fovDeg: number
  /** Point the camera looks at. */
  readonly target: Vec3
}

export interface Projected {
  readonly x: number
  readonly y: number
  /** Distance along the view direction. Negative means behind the camera. */
  readonly depth: number
  /** Screen units per world unit at this depth — for sizing sprites and strokes. */
  readonly scale: number
}

const DEG = Math.PI / 180

export const vec = (x: number, y: number, z: number): Vec3 => ({ x, y, z })

export const add = (a: Vec3, b: Vec3): Vec3 => vec(a.x + b.x, a.y + b.y, a.z + b.z)
export const sub = (a: Vec3, b: Vec3): Vec3 => vec(a.x - b.x, a.y - b.y, a.z - b.z)
export const scaleVec = (a: Vec3, k: number): Vec3 => vec(a.x * k, a.y * k, a.z * k)
export const dot = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z
export const length = (a: Vec3): number => Math.sqrt(dot(a, a))

export function normalise(a: Vec3): Vec3 {
  const magnitude = length(a)
  return magnitude === 0 ? a : scaleVec(a, 1 / magnitude)
}

export function cross(a: Vec3, b: Vec3): Vec3 {
  return vec(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x)
}

/**
 * A direction on the sky sphere, from altitude and azimuth — the same pair the
 * solar engine produces. Azimuth is clockwise from north, so north is +z and
 * east is +x.
 */
export function directionFromSky(altDeg: number, azDeg: number): Vec3 {
  const alt = altDeg * DEG
  const az = azDeg * DEG
  return vec(Math.cos(alt) * Math.sin(az), Math.sin(alt), Math.cos(alt) * Math.cos(az))
}

/** Where the camera stands in world space. */
export function cameraPosition(camera: Camera): Vec3 {
  return add(
    camera.target,
    scaleVec(directionFromSky(camera.elevationDeg, camera.azimuthDeg), camera.distance),
  )
}

/** The camera's own axes: right, up, and the direction it looks. */
export function cameraBasis(camera: Camera): { right: Vec3; up: Vec3; forward: Vec3 } {
  const forward = normalise(sub(camera.target, cameraPosition(camera)))
  const worldUp = vec(0, 1, 0)
  // Looking straight down, world-up is degenerate; fall back to north.
  const reference = Math.abs(dot(forward, worldUp)) > 0.999 ? vec(0, 0, 1) : worldUp
  const right = normalise(cross(forward, reference))
  return { right, up: cross(right, forward), forward }
}

export interface Viewport {
  readonly width: number
  readonly height: number
}

/**
 * Project a world point to screen coordinates.
 *
 * Returns `null` for points at or behind the camera plane, which the caller
 * must treat as "do not draw" rather than clamping — a clamped point would put
 * a shadow tip somewhere it is not.
 */
export function project(point: Vec3, camera: Camera, viewport: Viewport): Projected | null {
  const { right, up, forward } = cameraBasis(camera)
  const relative = sub(point, cameraPosition(camera))

  const depth = dot(relative, forward)
  if (depth <= 1e-6) return null

  // Focal length in screen units, from the vertical field of view.
  const focal = viewport.height / 2 / Math.tan((camera.fovDeg / 2) * DEG)
  const scale = focal / depth

  return {
    x: viewport.width / 2 + dot(relative, right) * scale,
    y: viewport.height / 2 - dot(relative, up) * scale,
    depth,
    scale,
  }
}

/**
 * Clip a segment to the part in front of the camera, so a line running from a
 * visible point out past the camera is drawn up to the clip plane rather than
 * disappearing or wrapping around.
 */
export function clipSegment(
  from: Vec3,
  to: Vec3,
  camera: Camera,
  near = 0.05,
): { from: Vec3; to: Vec3 } | null {
  const { forward } = cameraBasis(camera)
  const eye = cameraPosition(camera)
  const depthOf = (point: Vec3): number => dot(sub(point, eye), forward)

  const fromDepth = depthOf(from)
  const toDepth = depthOf(to)
  if (fromDepth < near && toDepth < near) return null
  if (fromDepth >= near && toDepth >= near) return { from, to }

  const fraction = (near - fromDepth) / (toDepth - fromDepth)
  const crossing = add(from, scaleVec(sub(to, from), fraction))
  return fromDepth >= near ? { from, to: crossing } : { from: crossing, to }
}

/**
 * Where a ray from the camera through a screen point meets the ground plane.
 * Used to turn a drag into a camera orbit around the spot under the pointer.
 */
export function groundPointAt(
  screenX: number,
  screenY: number,
  camera: Camera,
  viewport: Viewport,
): Vec3 | null {
  const { right, up, forward } = cameraBasis(camera)
  const focal = viewport.height / 2 / Math.tan((camera.fovDeg / 2) * DEG)
  const direction = normalise(
    add(
      add(scaleVec(right, screenX - viewport.width / 2), scaleVec(up, viewport.height / 2 - screenY)),
      scaleVec(forward, focal),
    ),
  )
  const eye = cameraPosition(camera)
  if (Math.abs(direction.y) < 1e-6) return null
  const distance = -eye.y / direction.y
  return distance <= 0 ? null : add(eye, scaleVec(direction, distance))
}
