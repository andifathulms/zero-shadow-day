# Hari Tanpa Bayangan — Zero Shadow Day

Twice a year the sun stands directly overhead and vertical things stop casting shadows. It only happens in the tropics, it happens everywhere in Indonesia, and almost nobody here knows it.

A static site that computes it from three numbers — latitude, longitude, date. No backend, no data feed, no runtime network.

See [PRD.md](PRD.md) for scope and [CLAUDE.md](CLAUDE.md) for how to work in the repo.

## What it does

| | |
|---|---|
| **Bayangan** | A vertical stick and its shadow, animated through a chosen day. Drag the date and watch the noon shadow collapse towards nothing, then flip from south to north. |
| **Tanggal** | Both zero shadow days, culmination to the second, and the clock-versus-sun gap split into its two causes. Plus solar noon for any date. |
| **Kurva** | The family of shadow-tip hyperbolas, straight on the equinoxes, and the analemma. |
| **Eratosthenes** | Partner finder, measurement flow, derived circumference, and an honest error breakdown. |
| **Sapuan** | The subsolar band crossing the archipelago, each city marking on its day. |
| **Metode** | The algorithm, its accuracy, and what is neglected. |

## Getting started

```bash
pnpm install
pnpm dev
```

## Commands

```bash
pnpm dev
pnpm build                  # static export to ./out, with .nojekyll
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

## Accuracy

Solar position uses the NOAA Solar Calculator formulation, following Meeus ch. 25 — roughly 0.01° in declination and better than a minute of time in the equation of time, for 1800–2100. Never the sinusoidal approximation, which is half a degree off and produces dates that are days wrong while looking entirely correct.

The engine is asserted against published values, not against itself:

- declination is zero at the published equinox instants and equals the obliquity at the solstices;
- the equation of time's four extrema and four zero crossings land on their published values and dates;
- computed zero shadow days agree with published Indonesian dates within a day;
- at the tropics the two dates converge into one, and outside them the app returns a structured no-result naming the limit — asserted 0.001° either side of the boundary, in both hemispheres;
- shadow geometry is derived independently of the solar engine, so neither can validate the other's errors;
- the Eratosthenes round-trip recovers the radius its synthetic observations were generated from.

**"Zero" has a width.** The sun's disc is about half a degree across, so a real shadow shrinks to a minimum over a couple of minutes rather than vanishing. Every result carries a window, derived from the sun's apparent semi-diameter on the day, and the residual shadow is never reported as zero.

## Privacy

Coordinates are resolved and used entirely in the browser. No reverse geocoding, no analytics on coordinates, no network request after first load. Fonts are self-hosted through `next/font`.

## Deployment

`main` builds and deploys to GitHub Pages via Actions. `basePath` is taken from the repository name; `.nojekyll` is written into `out/` by the build. Verify with `pnpm preview` before pushing.

## Licence and framing

A personal educational project. Not an official product of any institution. [BMKG](https://www.bmkg.go.id/) publishes official zero shadow day announcements for Indonesian cities each year and is the authoritative source.
