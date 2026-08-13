/**
 * The sky, as a function of where the sun actually is.
 *
 * Nothing here is decorative timing: the colour, the glow and the light on the
 * ground are all driven by the computed solar altitude, so the scene goes
 * golden when the sun is low because the sun *is* low. Dawn and dusk use the
 * standard twilight bands.
 *
 * Pure. No DOM, no clock, no network.
 */

export interface Rgb {
  readonly r: number
  readonly g: number
  readonly b: number
}

export interface SkyPalette {
  /** Colour overhead. */
  readonly zenith: Rgb
  /** Colour at the horizon, away from the sun. */
  readonly horizon: Rgb
  /** Colour of the sky immediately around the sun. */
  readonly glow: Rgb
  /** Colour of direct sunlight falling on the ground. */
  readonly sunlight: Rgb
  /** Colour of the ground plane under that light. */
  readonly ground: Rgb
  /** 0 at deep night, 1 in full day. Drives contrast and star opacity. */
  readonly daylight: number
  /** 1 while the sun is below the horizon, for stars and the night ground. */
  readonly night: number
}

const rgb = (r: number, g: number, b: number): Rgb => ({ r, g, b })

/** Linear interpolation between two colours. */
export function mix(a: Rgb, b: Rgb, t: number): Rgb {
  const k = Math.min(1, Math.max(0, t))
  return rgb(a.r + (b.r - a.r) * k, a.g + (b.g - a.g) * k, a.b + (b.b - a.b) * k)
}

export function toCss(colour: Rgb, alpha = 1): string {
  const channel = (value: number): number => Math.round(Math.min(255, Math.max(0, value)))
  return alpha >= 1
    ? `rgb(${channel(colour.r)}, ${channel(colour.g)}, ${channel(colour.b)})`
    : `rgba(${channel(colour.r)}, ${channel(colour.g)}, ${channel(colour.b)}, ${alpha.toFixed(3)})`
}

/** Smooth 0→1 ramp between two altitudes. */
function ramp(value: number, from: number, to: number): number {
  const t = Math.min(1, Math.max(0, (value - from) / (to - from)))
  return t * t * (3 - 2 * t)
}

// Key colours. Tropical noon overhead is deep, not pale; the horizon stays
// bright because the air path is long and full of haze.
const NIGHT_ZENITH = rgb(8, 14, 30)
const NIGHT_HORIZON = rgb(22, 34, 58)
const DAWN_ZENITH = rgb(38, 74, 124)
const DAWN_HORIZON = rgb(240, 138, 74)
const DAY_ZENITH = rgb(22, 104, 170)
const DAY_HORIZON = rgb(186, 226, 243)

const NIGHT_GROUND = rgb(24, 28, 38)
const DAWN_GROUND = rgb(150, 108, 84)
const DAY_GROUND = rgb(214, 202, 178)

const SUN_LOW = rgb(255, 138, 61)
const SUN_HIGH = rgb(255, 246, 214)

/**
 * The sky for a given solar altitude.
 *
 * Bands follow the usual definitions: civil twilight to −6°, and the light is
 * treated as fully out by −12°, where the sky is dark enough for stars.
 */
export function skyFor(altDeg: number): SkyPalette {
  const dawn = ramp(altDeg, -12, 2)
  const day = ramp(altDeg, 1, 22)
  const night = 1 - ramp(altDeg, -6, 0.5)

  const zenith = mix(mix(NIGHT_ZENITH, DAWN_ZENITH, dawn), DAY_ZENITH, day)
  const horizon = mix(mix(NIGHT_HORIZON, DAWN_HORIZON, dawn), DAY_HORIZON, day)
  const sunlight = mix(SUN_LOW, SUN_HIGH, ramp(altDeg, 2, 40))
  const ground = mix(mix(NIGHT_GROUND, DAWN_GROUND, dawn), DAY_GROUND, day)

  return {
    zenith,
    horizon,
    glow: mix(horizon, sunlight, 0.75),
    sunlight,
    ground,
    daylight: ramp(altDeg, -6, 18),
    night,
  }
}

/**
 * How hard the shadow's edge is. A high sun in clear tropical air throws one
 * crisp edge; near the horizon the shadow spreads and fades. Returned as an
 * opacity and a blur radius in screen units.
 */
export function shadowQuality(altDeg: number): { opacity: number; blur: number } {
  if (altDeg <= 0) return { opacity: 0, blur: 0 }
  // A low sun gives a long, soft shadow — but a soft shadow is still a visible
  // one. Spreading a faint fill over a wide blur made the longest shadows of
  // the day disappear entirely, which is the opposite of the truth: they are
  // the most striking thing on the ground at that hour.
  return {
    opacity: 0.42 + 0.46 * ramp(altDeg, 0, 34),
    blur: 5.5 - 5 * ramp(altDeg, 2, 45),
  }
}

/**
 * Stars, generated from a fixed seed so the sky is the same on every render and
 * every machine — determinism holds for the picture too.
 */
export function stars(count: number): Array<{ altDeg: number; azDeg: number; magnitude: number }> {
  const generated: Array<{ altDeg: number; azDeg: number; magnitude: number }> = []
  let seed = 20260404
  const random = (): number => {
    // Numerical Recipes' linear congruential generator.
    seed = (1664525 * seed + 1013904223) % 4294967296
    return seed / 4294967296
  }
  for (let index = 0; index < count; index += 1) {
    generated.push({
      altDeg: Math.asin(random()) * (180 / Math.PI),
      azDeg: random() * 360,
      magnitude: 0.3 + random() * 0.7,
    })
  }
  return generated
}
