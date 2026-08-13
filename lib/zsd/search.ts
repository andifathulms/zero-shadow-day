/**
 * Zero shadow day search.
 *
 * Found by search, never by formula (CLAUDE.md invariant 5). The declination
 * equals a given latitude at some *instant*, which may fall at 03:00 local
 * time; the zero shadow day is then the calendar day whose *culmination* comes
 * closest, not the day the crossing happens to land on. Minimising the noon
 * shadow over candidate days handles that directly, and needs no special case
 * at the tropic edges where the year's two days converge into one.
 *
 * Two consequences the app must report honestly (PRD §6):
 *   - the residual shadow on the best day is small but non-zero;
 *   - the Sun has width, so there is a window, not an instant.
 */

import { culminationZenithDeg, horizontalPosition } from '@/lib/solar/altitude'
import { type CivilDate, daysInYear, julianDay } from '@/lib/solar/julian'
import { MINUTES_PER_DAY, solarNoon } from '@/lib/solar/noon'
import { solarPosition } from '@/lib/solar/position'
import { shadowLengthRatioFromZenith } from '@/lib/shadow'
import type {
  LongestShadowDay,
  OutsideTropics,
  Place,
  ShadowDirectionSegment,
  ZeroShadowDay,
  ZeroShadowResult,
  ZeroShadowWindow,
} from './types'

/** One candidate day of the year, evaluated at its own culmination. */
interface Candidate {
  readonly date: CivilDate
  readonly jdCulmination: number
  readonly localNoonHours: number
  readonly decDeg: number
  /** Signed distance of the Sun from the zenith at culmination: dec − lat. */
  readonly signedDeg: number
  readonly zenithDeg: number
}

/** Every day of a civil year, evaluated at culmination. The search space. */
export function noonCandidates(place: Place, year: number): Candidate[] {
  const candidates: Candidate[] = []
  const total = daysInYear(year)
  const jdJan1 = julianDay({ year, month: 1, day: 1 })

  for (let offset = 0; offset < total; offset += 1) {
    const jdLocalMidnight = jdJan1 + offset
    const noon = solarNoon(jdLocalMidnight, place.lonDeg, place.offsetHours)
    const { decDeg } = solarPosition(noon.jd)
    candidates.push({
      date: civilDateFromDayOffset(year, offset),
      jdCulmination: noon.jd,
      localNoonHours: noon.localHours,
      decDeg,
      signedDeg: decDeg - place.latDeg,
      zenithDeg: culminationZenithDeg(place.latDeg, decDeg),
    })
  }
  return candidates
}

/** Civil date `offset` days after 1 January of `year`. */
function civilDateFromDayOffset(year: number, offset: number): CivilDate {
  const lengths = [31, daysInYear(year) === 366 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  let remaining = offset
  for (let month = 1; month <= 12; month += 1) {
    const length = lengths[month - 1] ?? 31
    if (remaining < length) return { year, month, day: remaining + 1 }
    remaining -= length
  }
  return { year, month: 12, day: 31 }
}

/**
 * Extreme declinations reached during a year, sampled finely enough that the
 * solstice peak is not stepped over. This is the true latitude limit for the
 * year — the tropics are where they are because of this number, so it is
 * computed rather than assumed to be 23.44°.
 */
export function declinationLimits(year: number): { maxDeg: number; minDeg: number } {
  const jdStart = julianDay({ year, month: 1, day: 1 })
  const jdEnd = julianDay({ year: year + 1, month: 1, day: 1 })
  let maxDeg = -Infinity
  let minDeg = Infinity
  for (let jd = jdStart; jd <= jdEnd; jd += 0.05) {
    const { decDeg } = solarPosition(jd)
    if (decDeg > maxDeg) maxDeg = decDeg
    if (decDeg < minDeg) minDeg = decDeg
  }
  return { maxDeg, minDeg }
}

/**
 * The zero shadow days of a place for a civil year, or a structured no-result
 * for a place outside the tropics.
 */
export function zeroShadowDays(place: Place, year: number): ZeroShadowResult {
  const limits = declinationLimits(year)
  const candidates = noonCandidates(place, year)

  if (place.latDeg > limits.maxDeg || place.latDeg < limits.minDeg) {
    return outsideTropics(place, year, limits, candidates)
  }

  // A crossing is a day-to-day sign change of (declination − latitude): the
  // moment the subsolar latitude sweeps past this place.
  const crossings: number[] = []
  for (let index = 1; index < candidates.length; index += 1) {
    const previous = candidates[index - 1]!
    const current = candidates[index]!
    if (previous.signedDeg === 0) {
      crossings.push(index - 1)
    } else if (Math.sign(previous.signedDeg) !== Math.sign(current.signedDeg)) {
      // Name the day of the smaller residual — the discrete-day rule of PRD §6.
      crossings.push(Math.abs(previous.signedDeg) <= Math.abs(current.signedDeg) ? index - 1 : index)
    }
  }

  // Within a whisker of the tropic the sweep turns before crossing a whole day
  // boundary; the closest approach of the year is then the single answer.
  const chosen = crossings.length > 0 ? crossings : [indexOfMinimumZenith(candidates)]

  const uniqueDates = new Map<string, Candidate>()
  for (const index of chosen) {
    const candidate = candidates[index]!
    const key = `${candidate.date.year}-${candidate.date.month}-${candidate.date.day}`
    const existing = uniqueDates.get(key)
    if (!existing || candidate.zenithDeg < existing.zenithDeg) uniqueDates.set(key, candidate)
  }

  const days = [...uniqueDates.values()]
    .sort((a, b) => a.jdCulmination - b.jdCulmination)
    .map((candidate) => describeDay(place, candidate))

  return {
    type: 'zero-shadow-days',
    latDeg: place.latDeg,
    lonDeg: place.lonDeg,
    year,
    days,
    converged: days.length === 1,
  }
}

function indexOfMinimumZenith(candidates: readonly Candidate[]): number {
  let best = 0
  for (let index = 1; index < candidates.length; index += 1) {
    if (candidates[index]!.zenithDeg < candidates[best]!.zenithDeg) best = index
  }
  return best
}

function outsideTropics(
  place: Place,
  year: number,
  limits: { maxDeg: number; minDeg: number },
  candidates: readonly Candidate[],
): OutsideTropics {
  const hemisphere = place.latDeg > 0 ? 'north' : 'south'
  const best = candidates[indexOfMinimumZenith(candidates)]!
  return {
    type: 'outside-tropics',
    latDeg: place.latDeg,
    year,
    limitDeg: hemisphere === 'north' ? limits.maxDeg : limits.minDeg,
    hemisphere,
    minZenithDeg: best.zenithDeg,
    bestDate: best.date,
    bestLocalNoonHours: best.localNoonHours,
  }
}

/**
 * The day of the year with the longest noon shadow: the dual of
 * `zeroShadowDays`, maximising rather than minimising the same culmination
 * zenith distance. Meaningful at any latitude, tropics or not.
 */
export function longestShadowDay(place: Place, year: number): LongestShadowDay {
  const candidates = noonCandidates(place, year)
  let best = candidates[0]!
  for (const candidate of candidates) {
    if (candidate.zenithDeg > best.zenithDeg) best = candidate
  }
  return {
    date: best.date,
    jdCulmination: best.jdCulmination,
    localNoonHours: best.localNoonHours,
    maxZenithDeg: best.zenithDeg,
    maxShadowRatio: shadowLengthRatioFromZenith(best.zenithDeg),
  }
}

/**
 * Which way the noon shadow points, as consecutive runs of days. Inside the
 * tropics this flips at each zero shadow day (dec − lat changes sign);
 * outside the tropics dec − lat never changes sign, so the whole year is one
 * segment — the same fact `home.flip` states in prose, read here as data.
 */
export function shadowDirectionTimeline(place: Place, year: number): ShadowDirectionSegment[] {
  const candidates = noonCandidates(place, year)
  const segments: ShadowDirectionSegment[] = []
  let current: { direction: 'north' | 'south'; startDate: Candidate['date']; endDate: Candidate['date'] } | null =
    null

  for (const candidate of candidates) {
    // At the exact instant of a crossing the direction is momentarily moot;
    // at daily resolution this essentially never lands on a sampled day.
    if (candidate.signedDeg === 0) continue
    // North of the subsolar latitude (dec < lat) the sun is to the south and
    // the shadow falls north — the same convention as lib/eratosthenes.
    const direction: 'north' | 'south' = candidate.signedDeg < 0 ? 'north' : 'south'
    if (current && current.direction === direction) {
      current = { direction, startDate: current.startDate, endDate: candidate.date }
    } else {
      if (current) segments.push(current)
      current = { direction, startDate: candidate.date, endDate: candidate.date }
    }
  }
  if (current) segments.push(current)
  return segments
}

/** Fill in the shadow residual and the window for a chosen candidate day. */
function describeDay(place: Place, candidate: Candidate): ZeroShadowDay {
  return {
    date: candidate.date,
    jdCulmination: candidate.jdCulmination,
    localNoonHours: candidate.localNoonHours,
    minZenithDeg: candidate.zenithDeg,
    minShadowRatio: shadowLengthRatioFromZenith(candidate.zenithDeg),
    window: zeroShadowWindow(place, candidate.jdCulmination, candidate.localNoonHours),
  }
}

/**
 * The window during which the Sun's disc covers the zenith, bisected on the
 * zenith distance of its centre against its own apparent semi-diameter that
 * day. The half-degree width of the Sun is the whole reason a window exists,
 * so it is read from the position, never assumed.
 */
export function zeroShadowWindow(
  place: Place,
  jdCulmination: number,
  localNoonHours: number,
): ZeroShadowWindow | null {
  const { semiDiameterDeg } = solarPosition(jdCulmination)
  const zenithAt = (jd: number): number =>
    90 - horizontalPosition(jd, place.latDeg, place.lonDeg).altDeg

  if (zenithAt(jdCulmination) > semiDiameterDeg) return null

  // The Sun moves at most a degree every four minutes, so an hour either side
  // always brackets an exit from a half-degree disc.
  const bracketDays = 1 / 24
  const edge = (direction: -1 | 1): number => {
    let inside = jdCulmination
    let outside = jdCulmination + direction * bracketDays
    for (let step = 0; step < 60; step += 1) {
      const middle = (inside + outside) / 2
      if (zenithAt(middle) <= semiDiameterDeg) inside = middle
      else outside = middle
    }
    return inside
  }

  const start = edge(-1)
  const end = edge(1)
  const offsetToLocalHours = (jd: number): number =>
    localNoonHours + (jd - jdCulmination) * 24

  return {
    startLocalHours: offsetToLocalHours(start),
    endLocalHours: offsetToLocalHours(end),
    durationSeconds: (end - start) * MINUTES_PER_DAY * 60,
    semiDiameterDeg,
  }
}
