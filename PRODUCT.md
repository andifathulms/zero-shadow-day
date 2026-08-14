# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three co-equal audiences, each served by a different part of the site:

- **The curious Indonesian public** — someone who has noticed the sun going straight overhead, or heard *hari tanpa bayangan*, and wants their own place's dates and an honest explanation of why it happens. Served by Bayangan, Tanggal, and Metode.
- **Teachers** — planning to run the Eratosthenes circumference measurement with students on an actual zero shadow day, needing a partner location, a measurement procedure, and the arithmetic done for them. Served by Eratosthenes mode (§4 of PRD.md — "the feature that matters", built as a first-class mode, not a footnote).
- **Portfolio reviewers** — evaluating this as a demonstration of engineering and design craft (accuracy-first solar engine, hand-rolled 3D scene, zero dependencies on astronomy/date/timezone libraries, tests as the enforcement mechanism for design rules).

## Product Purpose

Computes the two days a year when the sun stands directly overhead at a given tropical location (zero shadow day / *hari tanpa bayangan*), animates the resulting gnomon shadow, and lets a user reproduce Eratosthenes' circumference-of-the-Earth measurement with a real partner location. Exists because almost nobody in Indonesia — where every location gets this phenomenon twice a year — knows about it or has an accessible way to explore it. Success means: dates and times agree with BMKG's published figures within the stated tolerance, the accuracy claims hold up under published-value verification, and a teacher can actually run the Eratosthenes exercise with students using only the app's instructions, two sticks, and a ruler.

## Positioning

Zero data dependency: every result is computed from three numbers (latitude, longitude, date) with no feed, API key, or database to license or keep current — a direct response to prior projects in this family being derailed by data licensing. The solar engine uses a proper position algorithm (NOAA/Meeus ch. 25, ~0.01° declination accuracy) rather than the textbook sinusoidal approximation, which is checked against BMKG's own published tables (76 dates, 75 exact, all within a day) rather than asserted informally. No other Indonesian zero-shadow-day resource reproduces the Eratosthenes measurement as a guided, first-class flow with a real partner-location finder and honest error analysis.

## Operating Context

- Fully static export (`output: 'export'`), deployed to GitHub Pages, zero backend, zero runtime network requests after first load.
- Bilingual: Indonesian first (default locale), English secondary, via `app/[locale]`.
- Astronomical terms in their standard Indonesian form in UI copy: *hari tanpa bayangan*, *kulminasi*, *deklinasi*, *perata waktu*, *matahari di atas kepala*.
- Sibling project **Falak** shares `lib/solar` — that module must stay extractable as a standalone package without modification.
- BMKG (Indonesia's meteorology/geophysics agency) publishes the authoritative annual zero shadow day announcements per city and is linked as the authoritative source; no OIKN or government branding appears anywhere.
- A teacher running Eratosthenes mode needs: their own ZSD, a partner location a useful latitude-distance away, a measurement procedure two people can follow with sticks and a ruler, and the derived circumference with error shown honestly against the true figure.

## Capabilities and Constraints

- **No astronomy, date, or timezone library, ever.** The solar engine, Julian Day handling, and Indonesia's three UTC-anchored zones (105°E / 120°E / 135°E, no DST) are all hand-implemented and are the point of the project.
- **No `Date` objects in the numerical core** — Julian Day and fractional days internally; local civil time applied only at the display boundary (`lib/clock`).
- **ZSD is found by search** (minimising noon shadow across candidate days), never by formula, so it doesn't need special-casing where the two yearly dates converge near the tropic edges.
- **Every ZSD result is a window, not an instant** — the sun's ~0.5° angular diameter means shadow shrinks to a minimum rather than vanishing; window width is derived from the sun's semi-diameter on that day, never hardcoded.
- **Outside the tropics returns a structured no-result** naming the latitude limit — never a nearest date, never a clamp.
- **`lib/shadow` shares no code with `lib/solar`**, enforced by a test asserting the absence of any solar import, so the two can't validate each other's errors.
- **Coordinates never leave the device** — no reverse geocoding, no analytics on location. A bundled list of Indonesian city-centre coordinates (`data/cities/indonesia.ts`, accurate to ~1 km) covers the common case; typed coordinates cover the rest.
- **JS budget ≤150 KB gzipped** (README reports 110 KB shipped); the 3D scene is hand-rolled (~8 KB), not an engine.
- Two documented, tested disagreements with BMKG source tables (Pekanbaru 2026 date choice at a near-equator crossing; four Papua-region rows in the 2025 table carrying stale culmination times) — these are proven correct from first principles in tests, not silently patched to match BMKG.
- Any view is shareable as a link reproducing exact place/date/time; both ZSD dates export to a calendar file and the year's culminations to a spreadsheet, built client-side.

## Brand Commitments

- Name: **Zero Shadow Day**, explanatory as chosen; Indonesian alternate **Hari Tanpa Bayangan** (BMKG's own phrase) used in copy and metadata.
- Designed and built by Andi Fathul Mukminin Salahuddin; credited in-app as a personal educational project, not an official product of any institution.
- Brand asset kit exists at `exports/` (gitignored, source of truth for icons/lockups/wordmark); the served subset is committed at `app/` (favicon, Apple touch icon) and `public/brand/` (PWA icons).
- Contrast rules are binding brand constraints, not taste: shadow tone stays the darkest thing on the page (it's the data, not decoration), vermilion marks the zero shadow day and nothing else, sun ochre is reserved for the sun's own path — and `sun-ink`/`marker-ink` variants exist specifically because the base ochre fails 3:1 for data lines and small text.

## Evidence on Hand

- BMKG's own published tables, transcribed verbatim in `tests/zsd/fixtures/bmkg.ts`: *Kulminasi Utama I 2026* and *Kulminasi Utama II 2025*, 38 provincial capitals each, with culmination times to the second.
- Published solar-position and Equation-of-Time reference tables (Meeus, NOAA) used as the accuracy oracle for `lib/solar`.
- Live production site with screenshots in `docs/screenshots/` (home, gnomon, curves, sweep) and a working GitHub Pages deployment.
- 210 passing tests spanning solar, zsd, shadow, eratosthenes, scene, a11y, and brand — no invented benchmarks; every accuracy or contrast claim in copy must trace to an assertion in `tests/`.
- No user testimonials, case studies, or third-party press exist — none should be fabricated or implied.

## Product Principles

1. **Accuracy is the product; a wrong-but-plausible answer is the worst failure mode.** Every numeric claim traces to a test against a published value, not to visual plausibility.
2. **Report honestly rather than cleanly.** A window instead of an instant, a structured refusal instead of a clamp, a documented BMKG disagreement instead of a silent match — precision is stated, not implied.
3. **Zero dependency, zero data feed, zero network at runtime** is a load-bearing constraint, not an implementation detail — it's what makes the project finishable and license-free, and no future feature should compromise it.
4. **The shared engine (`lib/solar`) serves two products.** Nothing framework-specific, DOM-specific, or Next-specific may leak into it; it must stay liftable into Falak unchanged.
5. **Eratosthenes mode is the feature that converts a one-time visitor into a returning teacher.** It gets first-class treatment — a guided flow with real partner-finding and honest error analysis — not footnote treatment.

## Accessibility & Inclusion

WCAG 2.1 AA contrast is a binding, tested requirement (`tests/a11y/`), not an aspiration — a lightened or "improved" tone that fails AA fails the suite regardless of visual intent. `prefers-reduced-motion` replaces the signature shadow animation with hourly steps rather than disabling motion outright.
