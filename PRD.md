# PRD — Zero Shadow Day

**Twice a year the sun stands directly overhead and vertical things stop casting shadows. It only happens in the tropics, it happens everywhere in Indonesia, and almost nobody here knows it.**

| | |
|---|---|
| **Status** | Draft — pre-implementation |
| **Owner** | Andi Fathul Mukminin Salahuddin |
| **Type** | Personal portfolio project, open source, educational |
| **Deployment** | GitHub Pages (static export, no server, no runtime network) |
| **Language** | Indonesian-first UI; English secondary |
| **Data dependency** | **None.** Pure computation from latitude, longitude, and date. |
| **Sibling** | Falak. Shares the solar position engine. |

*Name: explanatory, as asked. Indonesian alternative: **Hari Tanpa Bayangan**, which is the phrase BMKG uses and the better choice if search traffic matters more than the English portfolio read.*

---

## 1. The phenomenon

The latitude directly beneath the sun sweeps between 23.44°N and 23.44°S over the year. When it crosses your latitude, the sun is at your zenith at solar noon, and a vertical object casts no shadow.

**Indonesia lies entirely inside that band** — roughly 6°N at Sabang to 11°S at Rote. So every place in the country gets **two** zero shadow days a year, once as the sweep heads north and once as it returns. Nowhere in Europe, North America, or most of China ever gets one.

Two more things fall out of the same geometry, and both are things tropical residents have noticed without explanation:

- **Shadows point north for part of the year and south for the rest.** Outside the tropics they only ever point one way.
- **Solar noon is not 12:00**, and in Indonesia the gap is large. WIB is anchored to 105°E while Banda Aceh sits near 95°E — nearly ten degrees west, so its solar noon runs roughly forty minutes later than the clock implies. Add the Equation of Time's ±16-minute swing and the discrepancy is substantial.

## 2. Why build it

**Nothing to license.** After three projects in this family were derailed or reshaped by data licensing, this one computes everything from three numbers. There is no feed to verify, no permission to seek, no gate to build. That alone makes it the shortest path to something finished.

**The engine is shared with Falak.** An accurate solar position algorithm is the hard part here and the foundation there. Building it once, tested, serves both.

**It is a real experiment, not a fact.** See §4.

## 3. Non-goals

- **Not a prayer time calculator.** Falak's territory; different requirements, different jurisprudential choices.
- **No weather or cloud forecast.** Whether you can *see* the shadow is a different problem.
- **No sunrise/sunset tables as a headline feature.** They exist everywhere and need refraction handling that isn't the point here.
- **No eclipse prediction.**
- **No accounts, no server, no runtime network.** Location is resolved and used entirely in the browser.
- **No ML.**

## 4. Measure the Earth — the feature that matters

Eratosthenes knew the sun stood overhead at Syene and measured the shadow angle at Alexandria on the same day. From two numbers he got the planet's circumference to within a few percent.

**That experiment is reproducible with this app.** On your zero shadow day, someone a few hundred kilometres north or south measures their noon shadow. The app computes your ZSD, identifies suitable partner locations by latitude separation, walks both parties through the measurement, and does the arithmetic.

Two sticks, one ruler, and the size of the Earth.

This is what turns the project from a curiosity someone visits once into something a teacher uses every year. It should be built as a first-class mode, not a footnote — and the error analysis shown honestly, because the gap between a schoolyard measurement and the true figure is itself the lesson.

## 5. Features

### 5.1 The gnomon — signature view
A vertical stick and its shadow, animated through a chosen day at a chosen place. **The shadow is the readout**, not an illustration beside one: its length and direction are the data.

Drag the date and watch the noon shadow shorten toward nothing as your ZSD approaches, then lengthen again. Watch it flip from pointing south to pointing north as the sun crosses your latitude.

### 5.2 Your two dates
Enter or geolocate a place; get both zero shadow days and the exact solar noon time for each, with the clock-versus-sun offset broken out into its two causes — longitude within the time zone, and the Equation of Time.

### 5.3 The shadow-tip curve
Over one day the tip of a gnomon's shadow traces a hyperbola — and on the equinoxes, exactly a straight line. Drawing the family of curves across a year is mathematically real, quietly beautiful, and it is what every ancient sundial was built around.

### 5.4 The analemma
The figure-eight the sun traces when photographed at the same clock time all year. The Equation of Time made visible, and the explanation for §5.2's offset.

### 5.5 The sweep
The subsolar band moving across the archipelago through the year, each place marking on its day. The map view, and the same mechanism that drives the monsoon.

### 5.6 Eratosthenes mode
Per §4: partner finder by latitude separation, measurement instructions, entry of both observations, derived circumference, and an honest error breakdown.

### 5.7 Solar noon anywhere
For any place and date: solar noon, sun altitude at noon, shadow length ratio for a unit gnomon, and shadow bearing. The practical output — architects, solar installers, and photographers all want exactly this.

### 5.8 Method disclosure
Which algorithm, its stated accuracy, how the ZSD window is defined, what is neglected (refraction at high altitude, observer elevation), and why "zero" has a width. Linked from the gnomon, not buried.

## 6. Precision — where this gets non-trivial

**The simple declination approximation is not good enough.** Textbook formulas carry up to half a degree of error, which near the tropics translates into being *days* wrong about the date. The engine uses a proper solar position algorithm — NOAA's, or a truncated VSOP — with its accuracy stated.

**"Zero" has a width.** The sun's disc is about half a degree across, so a real object's shadow does not mathematically vanish; it shrinks to a minimum over a window of a couple of minutes. **The app reports a window, not an instant**, and says why. Promising an instant would be a small lie that a curious user could disprove with a stick.

**A day is a discrete thing; the crossing is continuous.** The declination equals your latitude at some moment, which may fall at 03:00 local time — in which case the true zero-shadow event happens at noon on the day when declination is *nearest* your latitude, and the residual shadow is small but non-zero. **The app computes the minimum noon shadow across candidate days and names the best one**, rather than rounding a crossing time to a date and calling it exact.

**Time zones are computed, not looked up.** Indonesia's three zones are anchored at 105°E, 120°E, and 135°E, and the offset between clock and sun is derived from longitude plus the Equation of Time. No timezone database, no DST — Indonesia has none.

## 7. Architecture

Static Next.js 14 App Router export. No backend, no runtime network.

```
lat, lon, date
  → solar position (declination, equation of time)
  → solar noon → sun altitude → shadow length + bearing
  → ZSD search: minimise noon shadow over the year
                → gnomon | dates | curves | analemma | sweep
```

**`lib/solar` is pure and runs in Node.** `(jd, lat, lon) → SolarPosition`. No DOM, no React, no clock, no network. **This is the module Falak also needs**, so keep it self-contained and framework-free — it should be extractable as a package without modification.

**Julian Day integers and fractional days internally.** No `Date` objects in the numerical core, no timezone handling inside the computation. Local civil time is a display concern applied at the boundary.

**ZSD is found by search, not by formula.** Minimise noon shadow length over the year's candidate days. That handles the discreteness in §6 correctly and needs no special-casing near the tropic edges, where the two dates converge into one.

**Geolocation never leaves the device.** No reverse geocoding request, no analytics on coordinates. A bundled list of Indonesian cities covers the common case; typed coordinates cover the rest.

## 8. Testing

**Published values as oracle.** Solar declination and Equation of Time for known dates are tabulated in standard references; the engine is asserted against them. This is the strongest available check and it costs nothing.

**Known zero shadow days.** Locations with published ZSD dates — BMKG issues these annually for Indonesian cities — become fixtures. Agreement within a day is the bar.

**Edge behaviour, both directions:** at the equator the two dates fall near the equinoxes; at the Tropic of Cancer they converge into one at the June solstice; **outside the tropics the app must report no zero shadow day at all**, not a nearest guess. Asserted for latitudes on both sides of the boundary.

**Shadow geometry.** Length equals gnomon height divided by the tangent of solar altitude; bearing is opposite the sun's azimuth. Asserted independently of the solar engine so the two can't validate each other's errors.

**Eratosthenes round-trip.** Given two synthetic observations generated from the model, the derived circumference must return the Earth radius used to generate them. Correctness provable rather than plausible.

**Determinism.** Same inputs produce byte-identical output.

## 9. Design direction

The material world is **hard tropical light on concrete** — bleached surfaces, one crisp shadow edge, no softness. Anyone who has stood outside at noon in Indonesia knows exactly this quality of light, and it is the right register for a tool about it.

**Palette.** Bleached ground `#EDE9DF`. Concrete `#CFC9BC` for surfaces the shadow falls on. **Shadow `#2E2A24`**, deep and hard-edged, the darkest thing on the page — because it is the data. **Sun ochre `#C98A21`** reserved for the sun's own path, the analemma, and the declination curve. Marker vermilion `#B4432F` for the zero shadow day itself, and nothing else. Sky wash `#DCE3E4`, pale.

**Type.** **Instrument Serif** for display — the register of an observatory notice. **Instrument Sans** for controls and prose. **Chivo Mono** with tabular figures for times, angles, and shadow ratios; these update continuously as the date is dragged and must not reflow.

**Structure.** The gnomon occupies the centre with generous empty ground around it, because the shadow needs room to be long. The date scrubber runs beneath, marked with both zero shadow days. Readouts sit as a printed column to the side — solar noon, altitude, shadow ratio, bearing — never overlapping the shadow itself.

**Motion.** One orchestrated moment: the shadow sweeping through the day, shortening, rotating, and collapsing to nothing at noon on the day it does. That is the entire reason the app exists and nothing else should compete with it. `prefers-reduced-motion` steps by hour instead of animating.

**Copy.** Indonesian first, in plain language — *hari tanpa bayangan*, *kulminasi*, *matahari di atas kepala*. The window caveat is stated in the same voice as everything else: *"Bayangan tidak benar-benar nol — matahari punya lebar. Ada jendela beberapa menit."*

## 10. Milestones

| | | |
|---|---|---|
| **M0** | Solar engine | Scaffold; solar position, declination, Equation of Time, solar noon. Verified against published values. **No UI.** |
| **M1** | Shadow + search | Shadow length and bearing; ZSD found by minimising noon shadow; tropic-edge and outside-tropics behaviour. Console only. |
| **M2** | The gnomon | Animated shadow, date scrubber, your two dates, solar noon breakdown. **Ship publicly here.** |
| **M3** | Curves | Shadow-tip hyperbolas, analemma, the clock-versus-sun explanation. |
| **M4** | Eratosthenes | Partner finder, measurement flow, circumference derivation, error analysis. **The feature teachers will use.** |
| **M5** | The sweep | Archipelago map, band animation, city list. |
| **M6** | Polish | Sharing, export, practical readouts, a11y. |

M0 has no interface because a half-degree error in declination produces a date that is days wrong and looks entirely plausible.

## 11. Success criteria

- Declination and Equation of Time match published values within stated tolerance.
- Computed ZSD dates agree with published Indonesian figures within a day.
- Outside the tropics the app reports no zero shadow day, asserted in both directions.
- The reported window reflects the sun's angular width rather than claiming an instant.
- Eratosthenes round-trip recovers the generating radius.
- `lib/solar` is extractable as a standalone package with no framework imports.
- Zero network requests after first load; coordinates never leave the device.
- Fully offline. JS ≤ 150 KB gzipped.

## 12. Deployment

`output: 'export'`, `basePath` matching the repository name, `.nojekyll` in the output root. Fonts self-hosted via `next/font`. Verify under the production `basePath` with `pnpm preview` before pushing.

## 13. Risks

| Risk | Mitigation |
|---|---|
| **A low-accuracy declination formula gives dates that are days wrong and look fine.** | Proper solar position algorithm, verified against published values at M0 before any UI exists. |
| **Claiming an instant when the sun has width.** | Window reported and explained. A curious user with a stick can disprove an over-precise claim. |
| **Mishandling the discrete-day versus continuous-crossing distinction.** | ZSD found by minimising noon shadow across candidate days, not by rounding a crossing time. |
| **Reporting a ZSD outside the tropics.** | Explicit no-result path, asserted on both sides of the boundary. |
| **Location privacy.** | Resolved and used client-side only; no reverse geocoding, no analytics on coordinates. Stated plainly. |
| **Scope creep into prayer times.** | §3 is binding — that is Falak, and it carries jurisprudential choices this project should not make. |
