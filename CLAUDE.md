# CLAUDE.md — Zero Shadow Day

Tropical solar position and shadow tool. Computes the two days a year when the sun stands directly overhead at a given place, animates the gnomon shadow, and supports reproducing Eratosthenes' measurement. Static site, GitHub Pages, no backend, no runtime network.

Read `PRD.md` before starting any task — **§4 and §6 in particular**. It fixes scope; this file describes how to work in the repo.

**Four things shape everything:**

1. **Accuracy decides correctness, and errors are invisible.** A half-degree error in declination puts the date days off, and the output still looks entirely plausible. The solar engine is verified against published values before any UI exists.
2. **"Zero" has a width.** The sun's disc is about half a degree across, so a real shadow shrinks to a minimum rather than vanishing. Report a window, never an instant — a user with a stick can disprove an over-precise claim.
3. **No data dependency at all.** Everything computes from latitude, longitude, and date. No feed, no licence, no gate. Do not introduce one.
4. **`lib/solar` is shared with Falak.** Keep it framework-free and extractable as a standalone package without modification.

---

## Stack

- Next.js 14, App Router, `output: 'export'` — static only
- TypeScript, `strict: true`
- Tailwind CSS
- Vitest
- pnpm
- **No astronomy library, no date library, no timezone database.** The solar engine is the project; Indonesia has no DST.
- Fonts via `next/font`, self-hosted.

## Commands

```bash
pnpm dev
pnpm build                  # static export to ./out
pnpm preview                # serve ./out under the production basePath
pnpm test                   # vitest watch
pnpm test:run               # vitest once — before every commit
pnpm test:solar             # declination + equation of time vs published values
pnpm test:zsd               # known ZSD dates, tropic edges, outside-tropics refusal
pnpm test:eratosthenes      # synthetic round-trip
pnpm typecheck
pnpm lint
```

`pnpm test:solar` runs first in CI. Every other number depends on it.

## Layout

```
app/
  [locale]/                 # id (default), en
    bayangan/               # the gnomon
    tanggal/                # your two dates + solar noon breakdown
    kurva/                  # shadow-tip curves + analemma
    eratosthenes/           # the measurement
    sapuan/                 # archipelago sweep
    metode/                 # algorithm, accuracy, what is neglected
components/
  gnomon/                   # stick, shadow, ground plane
  scrubber/                 # date control with ZSD markers
  curves/                   # hyperbolas, analemma
  readout/                  # printed column of values
lib/
  solar/                    # THE CORE. Pure. Extractable. Shared with Falak.
    position.ts             # declination, right ascension, equation of time
    noon.ts                 # solar noon from longitude + EoT
    altitude.ts             # sun altitude and azimuth
    julian.ts               # JD conversion
  shadow/                   # length + bearing from altitude/azimuth. Independent of lib/solar.
  zsd/                      # search: minimise noon shadow over the year
  eratosthenes/             # circumference derivation + error analysis
data/
  cities/                   # Indonesian city coordinates (replaceable by typed input)
tests/
  solar/
  zsd/
  eratosthenes/
```

## Invariants

1. **`lib/solar` is pure, framework-free, and extractable.** No React, no Next, no DOM, no clock, no network, no module-level mutable state. It must be liftable into a package for Falak without edits.

2. **No `Date` objects in the numerical core.** Julian Day numbers and fractional days internally. Local civil time is applied at the display boundary only.

3. **No timezone database, no DST logic.** Indonesia's zones are anchored at 105°E, 120°E, and 135°E; the clock-versus-sun offset is derived from longitude plus the Equation of Time. Do not add `Intl.DateTimeFormat` timezone handling to the core.

4. **Use a proper solar position algorithm.** NOAA's or a truncated VSOP, with its stated accuracy documented in a comment. **Never the simple sinusoidal declination approximation** — it is half a degree off and produces dates that are days wrong and look correct.

5. **ZSD is found by search, not by formula.** Minimise noon shadow length across candidate days. This handles the discrete-day versus continuous-crossing distinction correctly and needs no special case where the two dates converge near the tropic edges.

6. **Report a window, not an instant.** The sun's angular width means minimum shadow, not zero shadow. Every ZSD result carries its window and the minimum shadow ratio.

7. **Outside the tropics returns a structured no-result**, naming the latitude limit. Never a nearest date, never a clamp, never an empty response that reads as an error.

8. **`lib/shadow` shares no code with `lib/solar`.** Shadow geometry is derived independently from altitude and azimuth, so the two cannot validate each other's errors.

9. **Coordinates never leave the device.** No reverse geocoding, no network calls with a location, no analytics on coordinates. Geolocation is used and discarded client-side.

10. **The shadow is the readout.** Its length and bearing are the data. Never render it as decoration beside a separate numeric display, and never scale it for visual effect in a way that breaks the length-to-altitude relationship.

11. **Angles in degrees named `*Deg`; times in fractional days or seconds named accordingly; shadow expressed as a ratio to gnomon height named `*Ratio`.** Convert once, at the boundary.

12. **Vermilion marks the zero shadow day and nothing else. Sun ochre is the sun's own path.** The shadow tone is the darkest thing on the page because it is the subject. See PRD §9.

13. **Zero network requests at runtime.** No font CDN, no analytics, no geocoding service.

14. **Nothing is computed in a component.**

## Working style

- **Verify the solar engine before drawing anything.** M0 has no UI on purpose. Published declination and Equation of Time tables make this cheap and objective.
- **Write `lib/shadow` independently of `lib/solar`.** If one is written as a helper of the other, the tests stop being independent checks.
- **Test the boundaries early** — equator, both tropics, and just outside them. That is where the search behaves differently and where a formula-based approach silently breaks.
- **When a fixture disagrees with published ZSD dates, the engine is wrong.** Not the tolerance, not the published figure.
- **Build Eratosthenes mode properly, not as a footnote.** It is what makes the project useful to a teacher rather than interesting for one visit.
- **Show the error honestly in Eratosthenes mode.** The gap between a schoolyard measurement and the true circumference is the lesson, not an embarrassment to hide.
- **Don't add a dependency for astronomy, dates, or timezones.**
- **Don't introduce a data source.** The absence of one is a feature of this project.
- **Never weaken a test to make something pass**, especially in `tests/solar/`.

## Conventions

- Named exports; defaults only where Next requires them.
- Discriminated unions for results and no-result cases, keyed on `type`. Exhaustive `switch` with a `never` default.
- No `any`. No non-null `!` in `lib/solar` or `lib/shadow`.
- Follow standard astronomical notation in identifiers: `jd`, `dec`, `ra`, `eot`, `ha` for hour angle, `alt`, `az`, `lat`, `lon`. A reader should be able to hold an astronomy text beside the code.
- Comments cite the algorithm and the published table any constant comes from.
- Indonesian first in UI copy; astronomical terms in their standard Indonesian form where one exists — *deklinasi*, *kulminasi*, *perata waktu*.
- Tabular numerals on every angle, time, and ratio readout.
- Tailwind utilities inline; semantic tokens in `tailwind.config.ts` — `bleached`, `concrete`, `shadow`, `sun`, `marker`, `sky`. Never raw hex in components.

## Testing rules

- `pnpm test:run` before every commit; `pnpm test:solar` before any commit touching `lib/solar` or `lib/shadow`.
- Declination and Equation of Time asserted against published values across a year of dates.
- Known Indonesian ZSD dates asserted within a day.
- Boundary fixtures are permanent: equator (near the equinoxes), both tropics (single converged date at the solstice), and latitudes just inside and just outside the tropics (result versus structured no-result).
- Shadow geometry asserted independently: length equals gnomon height over the tangent of altitude; bearing opposite the sun's azimuth.
- Eratosthenes round-trip: synthetic observations generated from a known radius must recover that radius.
- Window width asserted to reflect the sun's angular diameter, not hardcoded.
- Determinism asserted on every computation.
- Bug fix → failing test first.

## Deployment

`main` builds and deploys via Actions. `basePath` must match the repository name; `.nojekyll` must exist in `out/`. Verify with `pnpm preview` before pushing.

## Framing

The site states plainly that it is a personal educational project, gives the algorithm and its accuracy on the method page, explains why the shadow reaches a minimum rather than zero, and notes that location data stays on the device. BMKG publishes official zero shadow day announcements for Indonesian cities and is linked as the authoritative source. No OIKN or government branding anywhere.

## Current state

M0–M5 built, M6 partly. 130 tests pass; `pnpm test:solar` passes.

- **M0** `lib/solar` — NOAA/Meeus ch. 25 position, Equation of Time, solar noon, altitude and azimuth. Asserted against published equinox and solstice instants, the EoT's extrema and zero crossings, and Meeus' worked Julian Day examples.
- **M1** `lib/shadow` written independently of `lib/solar`, with a test asserting the absence of any solar import; `lib/zsd` finds the days by minimising the culmination shadow, reports a window derived from the sun's semi-diameter, and refuses outside the tropics.
- **M2** the gnomon, date scrubber and readout column.
- **M3** shadow-tip hyperbolas and the analemma.
- **M4** `lib/eratosthenes` with the round trip, plus the partner finder, measurement flow and error breakdown.
- **M5** the sweep across the archipelago.
- **M6** the method page, solar noon anywhere, the Pages deployment, shareable links, calendar and spreadsheet export, and the accessibility pass. Contrast ratios are asserted in `tests/a11y/`, so a lightened tone fails the suite.

Additions to the layout above: `lib/day/` composes solar and shadow into the tracks the views read, so nothing is computed in a component; `lib/clock/` is the only place a `Date` is allowed, and the numerical core never sees it; `lib/share/` and `lib/export/` build links and files in the browser.

**Two accent tones were added to the PRD palette.** Sun ochre is 2.4:1 on bleached ground, below the 3:1 a meaningful graphic needs, so `sun-ink` and `marker-ink` carry data lines and small text while the originals keep the washes, fills and display sizes.

`data/cities/indonesia.ts` carries city-centre coordinates to about a kilometre. The zero shadow day fixtures in `tests/zsd/` cover Jakarta and Pontianak against published dates — **worth extending from BMKG's annual release**, and if a fixture ever disagrees, the engine is wrong.
