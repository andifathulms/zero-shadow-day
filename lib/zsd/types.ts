import type { CivilDate } from '@/lib/solar/julian'

/** A place, as three numbers. Nothing else is ever needed (PRD §12 data dependency: none). */
export interface Place {
  readonly latDeg: number
  readonly lonDeg: number
  /** UTC offset in hours, east positive. Indonesia: 7, 8 or 9. */
  readonly offsetHours: number
}

/**
 * The window during which the Sun's disc covers the zenith.
 *
 * The Sun is about half a degree across, so a real shadow shrinks to a minimum
 * over a couple of minutes rather than vanishing at an instant. Derived from
 * the apparent semi-diameter on the day, never hardcoded (PRD §6).
 */
export interface ZeroShadowWindow {
  readonly startLocalHours: number
  readonly endLocalHours: number
  readonly durationSeconds: number
  /** Apparent angular radius of the disc that defines the window, degrees. */
  readonly semiDiameterDeg: number
}

export interface ZeroShadowDay {
  readonly date: CivilDate
  /** Julian Day (UT) of culmination on that date. */
  readonly jdCulmination: number
  /** Culmination as local civil time, hours since local midnight. */
  readonly localNoonHours: number
  /** Zenith distance of the Sun's centre at culmination, degrees. The residual. */
  readonly minZenithDeg: number
  /** Shortest shadow of the day, as a ratio to gnomon height. Never exactly zero. */
  readonly minShadowRatio: number
  /**
   * The window the disc covers the zenith, or null when even the closest
   * approach leaves the centre further than the disc's own radius — a place
   * within a whisker of the tropic limit, where the Sun never quite reaches.
   */
  readonly window: ZeroShadowWindow | null
}

/** A place inside the tropics: two zero shadow days a year, or one where they converge. */
export interface ZeroShadowDaysFound {
  readonly type: 'zero-shadow-days'
  readonly latDeg: number
  readonly lonDeg: number
  readonly year: number
  readonly days: readonly ZeroShadowDay[]
  /** True when the year's two crossings fall on a single date, at the tropic edge. */
  readonly converged: boolean
}

/**
 * A place outside the tropics. A structured no-result naming the limit —
 * never a nearest date, never a clamp (CLAUDE.md invariant 7).
 */
export interface OutsideTropics {
  readonly type: 'outside-tropics'
  readonly latDeg: number
  readonly year: number
  /** The latitude limit for that hemisphere in that year: the extreme declination. */
  readonly limitDeg: number
  readonly hemisphere: 'north' | 'south'
  /** How far short the Sun falls of the zenith at its best, degrees. */
  readonly minZenithDeg: number
}

export type ZeroShadowResult = ZeroShadowDaysFound | OutsideTropics
