# RECON — TikTok cards from Zero Shadow Day

Recon only. Nothing in the app was changed, installed or committed. Written **Tuesday 13 October 2026**. Every number below comes from running this repo's own `lib/zsd`, `lib/solar`, `lib/day` and `lib/eratosthenes` on the cities in `data/cities/indonesia.ts`. Appendix B shows how to reproduce them. Anything the repo can't verify is marked **unknown**.

---

## 1. Selling point

**This app computes, for any place in Indonesia, the exact two days a year when the noon sun stands overhead, the local clock time of that culmination to the second, and the one-to-two-minute window when the sun's disc actually covers the zenith.** A phone weather app or a Google search gives "around early March". This app gives "Friday 5 March, 12:04 WIB, window 12:03:09–12:05:15". **It is trustworthy because the solar engine** (NOAA/Meeus ch. 25) **was tested against published declination and Equation of Time tables before any UI existed, and its dates are asserted against BMKG's own published tables.** 75 of 76 dates match exactly, all 76 are within a day, and culmination times are within 5 seconds (`tests/zsd/bmkg.test.ts`). **It matters to curious residents who want "my city, my time", to teachers who can turn the day into Eratosthenes' measurement of the Earth, and to anyone with a stick and a phone camera.**

**Five "why should I care" hooks** (Indonesian, true per the app):

1. *Dua kali setahun, matahari tepat di atas kepalamu — dan bayanganmu nyaris hilang.*
2. *Di kotamu, momen itu cuma sekitar dua menit. Lewat sedikit, bayangannya muncul lagi.*
3. *Jam 12:00 bukan tengah hari: hari ini kulminasi di Banda Aceh 12:25 WIB, di Jayapura 11:23 WIT.*
4. *Dengan sebatang tongkat dan teman di kota lain, kamu bisa mengukur keliling Bumi — seperti Eratosthenes 2.200 tahun lalu.*
5. *Setelah hari itu, bayangan siangmu pindah arah: dari utara ke selatan, atau sebaliknya.*

---

## 2. What it computes

### Outputs

Every output is per place (lat, lon, UTC offset) and per date:

| Output | Function | Notes |
|---|---|---|
| Zero shadow days for a year (1 or 2 dates) | `zeroShadowDays(place, year)` in `lib/zsd/search.ts` | Found by **search**: each day of the year is evaluated at its own culmination, and a crossing is a sign change of (dec − lat). The day with the smaller residual wins. |
| Culmination (solar noon), local civil time | `ZeroShadowDay.localNoonHours`, `solarNoon()` in `lib/solar/noon.ts` | To the second (`formatHoursSeconds`). |
| Zero-shadow **window** (start, end, duration) | `zeroShadowWindow()` | The interval when the zenith distance of the sun's centre is ≤ the apparent semi-diameter that day. It is bisected, not hardcoded. Across the 86 cities it lasts **87–130 s**. Returns `null` if the disc never covers the zenith. |
| Residual noon shadow | `minZenithDeg`, `minShadowRatio` | Never exactly zero. Across the 86 cities it is 0.002°–0.196°, i.e. **0.0–3.4 mm on a 1 m stick**. |
| Next ZSD from a date, plus countdown | `nextZeroShadowDay(place, today)` in `lib/zsd/upcoming.ts` | Used by the home countdown. |
| Places with a ZSD within N days | `upcomingZeroShadowDays(places, today, n)` | Feeds "Hari ini di Nusantara". |
| Outside the tropics | `{type: 'outside-tropics', limitDeg, minZenithDeg, bestDate}` | A structured no-result, never a clamp. It doesn't apply anywhere in Indonesia. |
| Longest noon shadow of the year | `longestShadowDay(place, year)` | Falls at a solstice. |
| Noon-shadow direction runs (N/S) for a year | `shadowDirectionTimeline(place, year)` | Flips at each ZSD. |
| Sun altitude/azimuth, shadow length and bearing at any instant | `horizontalPosition()` in `lib/solar/altitude.ts`, `shadowFromSun()` in `lib/shadow`, `instantAt()` in `lib/day` | `lib/shadow` shares no code with `lib/solar`, by design. |
| Noon of every day of a year (time, altitude, shadow, bearing) | `noonOfYear()` | Gives the earliest and latest noon (Equation of Time extremes). |
| Subsolar latitude on a date, heading, speed | `subsolarOn(date, offset)` | The "sweep" band. |
| Shadow-tip hyperbolas and analemma | `shadowTipCurve()`, `analemma()` | Visual only; these would need a figure slide. |
| Eratosthenes: circumference from two shadows | `measureEarth()`, `syntheticObservation()`, `ratePartner()` in `lib/eratosthenes/measure.ts` | Also returns error %, km per arcminute, and the longitude-gap warning. |
| Exports | `lib/export` | `.ics` calendar and `.csv` culmination table, both built in the browser. |

**Inputs:** latitude, longitude, and a UTC offset of 7, 8 or 9. That's all. There is no feed, no licence and no network (CLAUDE.md invariants 9 and 13). City coordinates are bundled: 86 cities, city-centre positions to about 1 km (2 km for small towns).

**Algorithm and reference:**
- **Solar position:** the NOAA Solar Calculator formulation of Meeus, *Astronomical Algorithms* 2nd ed., ch. 25, with nutation and aberration (`lib/solar/position.ts`).
- **Mean obliquity:** IAU 1980 (Meeus 22.2).
- **Altitude and azimuth:** Meeus ch. 13.
- **Semi-diameter:** 959.63″ / R, the IAU 1976 value.
- **Julian Day:** Meeus' worked examples are asserted in the tests.
- The app does **not** use a hisab method or the sinusoidal declination shortcut.

**Stated accuracy** (method page, `lib/i18n` `method.algorithmBody`):
- Declination is good to about 0.01°, and the Equation of Time to better than 1 minute, for 1800–2100.
- Against BMKG at BMKG's own coordinates, dates agree within a day (75/76 exact) and times within 5 s.
- **Neglected:** refraction (under 0.01° above 45° altitude), observer elevation, and ΔT (≈70 s, which moves declination by under 0.0004°).

**Time zones:** the app has no timezone database. WIB, WITA and WIT are fixed offsets of +7, +8 and +9, anchored at 105°E, 120°E and 135°E, with no DST (`INDONESIA_ZONES`). Clock-versus-sun is split into two parts: the longitude offset (4 min per degree from the zone meridian) and the Equation of Time. For typed coordinates the zone is inferred from longitude: below 112.5°E is WIB, below 127.5°E is WITA, otherwise WIT (`indonesianOffsetForLongitude`). That is a geometric rule, **not the legal zone boundary**.

**Known limits:**
- **Weather.** The app doesn't predict clouds (PRD §3, non-goal), so a cloudy noon shows nothing.
- **City-centre choice can move a date by a day.** With the app's Medan coordinates (3.5952°N), Medan's first 2026 date is **30 March**. BMKG, at its own coordinates (3°34′30.79″ = 3.5752°N), publishes **29 March**. A city spans more latitude than the gap between those two noons.
- **Equator cities.** Near the equator the crossing can fall between two culminations. Pekanbaru 2026 is a documented one-day difference from BMKG.
- **Bad source rows.** Four 2025 BMKG rows (Jayapura, Nabire, Wamena, Merauke) carry first-culmination times. The test proves this rather than skipping them.
- **Coverage.** The city list has 86 entries. Places not on it (e.g. Rote, which lies south of Kupang) need typed coordinates.
- **Not a prayer-time or qibla tool.** PRD §3 leaves that to Falak.

---

## 3. Event calendar — 13 Oct 2026 → 12 Oct 2027

Every date-driven event the code can produce. Times are local, from the engine.

**Posting marks:**
- **H-1–3** means post one to three days before: people need time to find a stick, a flat floor and the time.
- **Hari H** means post on the morning of the day, before culmination.

Every ZSD gets both marks for focus cities. Clusters get one H-1–3 roundup plus a Hari H story.

### 3a. Focus cities — both dates in the window

Each date has a culmination time, the window when the disc covers the zenith, and the residual shadow on a 1 m stick.

| City (zone) | Date 1 | Culmination | Window | Residual | Date 2 | Culmination | Window | Residual |
|---|---|---|---|---|---|---|---|---|
| **Denpasar** (WITA) | **Thu 15 Oct 2026** | 12:04:59 | 12:04:08–12:05:49 (101 s) | 2.9 mm | Fri 26 Feb 2027 | 12:32:06 | 12:31:11–12:33:02 (111 s) | 2.5 mm |
| Surabaya (WIB) | Tue 2 Mar 2027 | 11:41:13 | 11:40:09–11:42:17 (128 s) | 0.8 mm | Tue 12 Oct 2027 | 11:15:36 | 11:14:32–11:16:40 (128 s) | 0.7 mm |
| Bandung (WIB) | Wed 3 Mar 2027 | 12:01:32 | 12:00:27–12:02:37 (130 s) | 0.1 mm | Mon 11 Oct 2027 | 11:36:24 | 11:35:19–11:37:28 (129 s) | 0.1 mm |
| Jakarta (WIB) | Fri 5 Mar 2027 | 12:04:12 | 12:03:09–12:05:15 (126 s) | 1.1 mm | Sat 9 Oct 2027 | 11:40:02 | 11:38:58–11:41:05 (127 s) | 0.7 mm |
| Makassar (WITA) | Mon 8 Mar 2027 | 12:13:09 | 12:12:16–12:14:02 (106 s) | 2.7 mm | Wed 6 Oct 2027 | 11:50:34 | 11:49:39–11:51:28 (110 s) | 2.4 mm |
| Jayapura (WIT) | Sun 14 Mar 2027 | 11:46:28 | 11:45:32–11:47:25 (113 s) | 2.2 mm | Thu 30 Sep 2027 | 11:27:21 | 11:26:25–11:28:16 (110 s) | 2.3 mm |
| Balikpapan (WITA) | Thu 18 Mar 2027 | 12:20:46 | 12:19:59–12:21:33 (94 s) | 3.2 mm | Sun 26 Sep 2027 | 12:04:08 | 12:03:09–12:05:07 (118 s) | 1.7 mm |
| Samarinda (WITA) | Fri 19 Mar 2027 | 12:19:17 | 12:18:25–12:20:09 (104 s) | 2.8 mm | Fri 24 Sep 2027 | 12:03:37 | 12:02:44–12:04:31 (107 s) | 2.5 mm |
| Medan (WIB) | Tue 30 Mar 2027 | 12:29:54 | 12:28:53–12:30:54 (121 s) | 1.5 mm | Tue 14 Sep 2027 | 12:21:05 | 12:20:06–12:22:04 (117 s) | 1.8 mm |
| Banda Aceh (WIB) | Sun 4 Apr 2027 | 12:41:49 | 12:40:46–12:42:51 (125 s) | 1.1 mm | Thu 9 Sep 2027 | 12:36:14 | 12:35:23–12:37:05 (102 s) | 2.8 mm |

**Already past this cycle** (for context):
- Jakarta 9 Oct 2026, 11:39:58
- Bandung 11 Oct 2026, 11:36:20
- Surabaya 12 Oct 2026, 11:15:33
- Makassar 6 Oct 2026
- Jayapura 29 Sep 2026
- Balikpapan 26 Sep 2026
- Samarinda 24 Sep 2026
- Medan 13 Sep 2026
- Banda Aceh 8 Sep 2026

Denpasar's next is 16 Oct 2027, just outside the window.

**How long "near-zero" lasts.** The zenith window is 87–130 s across all cities: roughly **±1 minute around culmination**. Outside it, a 1 m stick's shadow grows back at the same rate everywhere. Computed with `instantAt()`:

| Time from culmination | Shadow of a 1 m stick |
|---|---|
| ±1 min | 0.4–0.5 cm |
| ±5 min | 2.2 cm |
| ±10 min | 4.3 cm |
| ±15 min | 6.5 cm |
| ±30 min | 13 cm |
| ±60 min | 26.5 cm |

These figures were computed for Denpasar 15 Oct 2026, Yogyakarta 13 Oct 2026, Jakarta 5 Mar 2027, Kupang 20 Oct 2026 and Sabang 5 Apr 2027. All five agree to ±0.1 cm. Before noon the shadow points west, after noon it points east.

### 3b. Posting slots (all 86 cities, grouped)

| Post | Event | Cities (local culmination) |
|---|---|---|
| **Hari H** · today, Tue 13 Oct 2026 | ZSD | Yogyakarta 11:24:49, Madiun 11:20:12, Kediri 11:18:14 WIB *(already near or past noon at the time of writing)* |
| **Hari H** · Wed 14 Oct | ZSD | Malang 11:15:32, Jember 11:11:16, Banyuwangi 11:08:35 WIB; Singaraja 12:05:43 WITA |
| **H-1–3 now + Hari H** · Thu 15 Oct | ZSD, biggest cluster of the season | **Denpasar 12:04:59**, Mataram 12:01:22, Sumbawa Besar 11:56:09, Bima 11:50:55, Labuan Bajo 11:46:17, Maumere 11:36:59 WITA; Merauke 11:24:14 WIT |
| Hari H · Fri 16 Oct | ZSD | Ende 11:38:58 WITA |
| H-1–3 · Sun 18 Oct | ZSD | Waingapu 11:44:08 WITA |
| **H-1–3 + Hari H** · Tue 20 Oct | ZSD, **last listed city of 2026** + Ukur Bumi day | **Kupang 11:30:23 WITA** (window 11:29:28–11:31:19) |
| Hari H · Tue 3 Nov 2026 | Earliest solar noon of the year | Jakarta 11:36:08, Bandung 11:33:02, Surabaya 11:12:30, Medan 12:08:49, Banda Aceh 12:22:13 WIB; Makassar 11:45:47, Denpasar 12:02:39, Balikpapan 11:56:06, Samarinda 11:54:54 WITA; Jayapura 11:20:38 WIT |
| Hari H · Tue 22 Dec 2026 | December solstice: 03:50 WIB / 04:50 WITA / 05:50 WIT (UT 21 Dec 20:50). Longest noon shadow for cities north of the equator | Medan: 51 cm per 1 m stick, noon 12:24 WIB. Banda Aceh: 55 cm, 12:37 WIB. Both point north. |
| Hari H · Thu 11 Feb 2027 | Latest solar noon of the year | Jakarta 12:06:50, Bandung 12:03:45, Surabaya 11:43:13, Medan 12:39:32, Banda Aceh 12:52:56 WIB; Makassar 12:16:30, Denpasar 12:33:22, Balikpapan 12:26:49, Samarinda 12:25:37 WITA; Jayapura 11:51:21 WIT. That is a 30.7-minute swing from 3 Nov in every city. |
| H-1–3 · Mon 22 Feb | ZSD, **season opener** | Kupang 11:59:07 WITA |
| H-1–3 roundup (~20 Feb) | "Maret: 69 dari 86 kota" month preview | Feb has 14 listed cities, Mar 69, Apr 3 |
| Hari H · 24–28 Feb | ZSD | Waingapu 24 Feb; **Denpasar 26 Feb 12:32:06** and Ende 26 Feb; Bima, Labuan Bajo, Mataram, Maumere, Sumbawa Besar, Merauke 27 Feb; Malang, Jember, Banyuwangi, Singaraja 28 Feb |
| Hari H · 1–5 Mar | ZSD, Java | Kediri, Madiun, Surakarta, Yogyakarta 1 Mar; **Surabaya 2 Mar**, Magelang, Purwokerto, Tasikmalaya 2 Mar; **Bandung 3 Mar**, Pekalongan, Semarang, Tegal 3 Mar; Bogor, Depok, Cirebon 4 Mar; **Jakarta 5 Mar**, Bekasi, Tangerang, Serang 5 Mar |
| H-1–3 + Hari H · 6–19 Mar | ZSD, Sumatra south / Sulawesi / Kalimantan / Papua | Tual 6; Bandar Lampung, Baubau 7; **Makassar 8**; Timika 9; Wamena 10; Ambon, Bengkulu, Kendari, Parepare 11; Banjarmasin, Lubuklinggau, Nabire 12; Fakfak, Palembang, Palopo 13; **Jayapura 14**, Mamuju, Sampit, Tanjung Pandan 14; Palangka Raya, Pangkalpinang 15; Ketapang 16; Jambi 17; **Balikpapan 18**, Biak, Luwuk, Nusantara, Padang, Palu, Sorong 18; **Samarinda 19**, Manokwari 19 |
| Hari H · Sun 21 Mar 2027 | **March equinox 03:25 WIB** (UT 20 Mar 20:25) + **Pontianak ZSD 11:49:56 WIB** + Bontang 12:17:18 WITA | — |
| Hari H · 20–25 Mar | ZSD, equator belt | Bukittinggi 20; Gorontalo, Pekanbaru 22; Batam, Singkawang, Sofifi, Tanjungpinang, Ternate 23; Bitung, Manado 24; Dumai 25 |
| H-1–3 + Hari H · 28 Mar–5 Apr | ZSD, northward end of the sweep | Pematangsiantar, Tanjung Selor 28; Tarakan 29; **Medan 30 Mar**; Lhokseumawe 3 Apr; **Banda Aceh 4 Apr**; **Sabang 5 Apr, the last listed city** |
| Hari H · Mon 21 Jun 2027 | June solstice 21:07 WIB (UT 14:07). Longest noon shadow for cities south of the equator, pointing south | Per 1 m stick: Denpasar 63 cm (12:21 WITA), Surabaya 59 cm (11:31 WIB), Bandung 59 cm, Jakarta 57 cm (11:54 WIB), Makassar 55 cm, Jayapura 49 cm, Balikpapan 46 cm, Samarinda 44 cm |
| H-1–3 + Hari H · 8 Sep–12 Oct 2027 | Return sweep, all cities again (Appendix A) | Sabang 8 Sep, Banda Aceh 9 Sep, Medan 14 Sep … Jakarta 9 Oct, Bandung 11 Oct, Surabaya 12 Oct |
| Hari H · Thu 23 Sep 2027 | September equinox 12:57 WIB (UT 05:57) + Pontianak ZSD 11:35:13 WIB + Bontang 12:02:35 WITA | — |

**Notes on the solstice and equinox instants.** I found them by scanning the app's own `solarPosition().decDeg` at 1-minute steps.
- Equinoxes are sign changes, good to about a minute. Solstices are slope turns of a very flat curve, so treat them as ±10 min.
- The repo *tests* published equinox and solstice instants, but **no app screen displays them**. A card using them is engine output, not a feature the app shows.

**Monthly count of listed cities with a ZSD in the window:**

| Month | Cities |
|---|---|
| Oct 2026 (from 13th) | 17 |
| Nov 2026 – Jan 2027 | 0 |
| Feb 2027 | 14 |
| Mar 2027 | 69 |
| Apr 2027 | 3 |
| May – Aug 2027 | 0 |
| Sep 2027 | 37 |
| Oct 2027 (to 12th) | 31 |

The full per-city table is in **Appendix A**: 171 rows, one per city per date, with culmination, window and duration.

---

## 4. Twenty card story ideas (ranked)

Ranked by hook strength × timeliness × verifiability. "Numbers" come straight from the runs in Appendix B. Slide types are carousel-press's: `cover`, `card`, `table`, `compare`, `word`, `quote`, `end`. A `figure` slide does not exist (§6).

**Standard caveat line** for every ZSD card: *"Tanggal ±1 hari, jam ±1 menit. Rujukan resmi: BMKG. Butuh langit cerah."*

**1. "Kamis ini, bayanganmu nyaris hilang di Denpasar — 12:05 WITA"**
- **Date:** Thu 15 Oct 2026.
- **Numbers:**
  - Culmination 12:04:59.
  - Window 12:04:08–12:05:49 (101 s).
  - Residual 2.9 mm on a 1 m stick.
  - Same day: Mataram 12:01, Sumbawa Besar 11:56, Bima 11:51, Labuan Bajo 11:46, Maumere 11:37 WITA, Merauke 11:24 WIT.
- **Coba sendiri:** stand a broom or stick upright on flat ground, and photo it at 12:00, 12:05 and 12:10. Post the three photos.
- **Caveat:** "nyaris", not "nol". The sun has width, and the shadow is shortest, not gone.
- **Slides:** cover → card (why) → table (kota | jam) → card (coba sendiri) → end.

**2. "Kupang, 20 Oktober: kota terakhir tahun ini"**
- **Date:** Tue 20 Oct 2026, 11:30:23 WITA, window 11:29:28–11:31:19.
- **Numbers:** after this, none of the 86 listed cities has a ZSD until Kupang again on 22 Feb 2027, a 4-month gap.
- **Coba sendiri:** see #3.
- **Caveat:** "di antara 86 kota di aplikasi". Places further south, like Rote, aren't listed.
- **Slides:** cover, card, card, end.

**3. "Ukur Bumi dari kotamu — Selasa 20 Oktober" (UGC challenge, Eratosthenes)**
- **Setup:** on Kupang's ZSD the sun is overhead at Kupang. Everyone else measures their own noon shadow.
- **Numbers** (1 m stick at local culmination, from `syntheticObservation`):

  | City | Culmination | Shadow (points north) |
  |---|---|---|
  | Jakarta | 11:37 WIB | 7.2 cm |
  | Bandung | 11:34 WIB | 6.0 cm |
  | Surabaya | 11:14 WIB | 5.4 cm |
  | Makassar | 11:47 WITA | 9.1 cm |
  | Balikpapan | 11:57 WITA | 16.0 cm |
  | Samarinda | 11:56 WITA | 17.3 cm |
  | Manado | 11:25 WITA | 20.9 cm |
  | Medan | 12:10 WIB | 24.8 cm |
  | Banda Aceh | 12:24 WIB | 28.5 cm |
  | Jayapura | 11:22 WIT | 13.6 cm |

- **Coba sendiri:** measure stick and shadow in cm at your noon, then comment your city with both numbers. A follow-up deck computes the circumference.
- **Caveats:**
  - Pairs with a small longitude gap work best. For Kupang–Manado the gap is 1.2° (the app's `ratePartner`).
  - Separation under 1° is refused by the app.
  - Close pairs amplify ruler error: Kupang–Denpasar costs 438 km of circumference per arcminute of angle error, against 57 km for Kupang–Manado.
  - The north–south distance must come from a map. The app warns that deriving it from coordinates assumes the radius being measured.
- **Slides:** cover → card (Eratosthenes, Syene, 240 SM) → table (kota | jam | panjang bayangan) → card (cara ukur) → card (rumus C = 360°/Δφ × jarak) → end.

**4. "Mulai minggu ini, bayangan siangmu menunjuk ke selatan"** (Java, Bali, Nusa Tenggara)
- **Numbers:** after each city's October ZSD the noon shadow flips from pointing north to pointing south, until the Feb/Mar ZSD (`shadowDirectionTimeline`). For example, Jakarta flipped on 9 Oct 2026 and flips back on 5 Mar 2027.
- **Coba sendiri:** mark the noon shadow tip with chalk today, and again in a week.
- **Caveat:** this is about the noon shadow only.
- **Slides:** cover, compare (`wrong`: "bayangan siang selalu ke utara" / `right`: …), card, end.

**5. "Besok: Malang, Jember, Banyuwangi, Singaraja"**
- **Date:** Wed 14 Oct 2026. Times: Malang 11:15:32, Jember 11:11:16, Banyuwangi 11:08:35 WIB; Singaraja 12:05:43 WITA.
- **Coba sendiri:** as #1.
- **Slides:** cover, table, end.

**6. "Matahari sedang 'berjalan' ke selatan 41 km per hari"**
- **Date:** today (13 Oct 2026). The subsolar latitude is −7.77°, heading south at 41.5 km/day (`subsolarOn`).
- **Numbers:** it turns around on 22 Dec, when the speed is 0.7 km/day.
- **Coba sendiri:** guess when your city gets its turn, then check the app.
- **Caveat:** "subsolar latitude", not literally the sun moving. Explain once.
- **Slides:** cover, card, card, end. A map would help but needs `figure`.

**7. "Jam 12 siang bukan tengah hari"**
- **Date:** today, 13 Oct 2026. Culmination at Banda Aceh is 12:25 WIB, at Jayapura 11:23 WIT, at Kupang 11:32 WITA.
- **Numbers:** Banda Aceh sits about 10° west of the WIB meridian (105°E), which makes noon about 39 minutes later than the clock suggests; the app's own copy says "kira-kira empat puluh menit". The Equation of Time adds another −13.7 min today (`solarNoon` components).
- **Coba sendiri:** find the moment your shadow is shortest.
- **Caveat:** none beyond ±1 min.
- **Slides:** cover, table (kota | kulminasi), card (dua penyebab), end.

**8. "Selasa 3 November: tengah hari paling pagi tahun ini"**
- **Numbers:** Jakarta 11:36:08, Surabaya 11:12:30 WIB; Makassar 11:45:47 WITA; Jayapura 11:20:38 WIT.
- **Hook:** "Pada 11 Februari, tengah hari 31 menit lebih siang."
- **Caveat:** these are the earliest and latest within the window (`noonOfYear`).
- **Slides:** cover, table, card, end.

**9. "Bandung: matahari paling tegak di antara kota besar"**
- **Date:** Wed 3 Mar 2027, 12:01:32 WIB.
- **Numbers:** residual 0.004°, which is 0.1 mm on a 1 m stick. Jakarta's is 1.1 mm, Surabaya's 0.8 mm.
- **Coba sendiri:** the classic stick photo.
- **Caveat:** a 0.1 mm difference is invisible to the eye. Frame it as "secara hitungan".
- **Slides:** cover, table, card, end.

**10. "Jumat 5 Maret, 12:04 WIB: giliran Jakarta"**
- **Numbers:** window 12:03:09–12:05:15. Same day: Bekasi 12:03:41, Tangerang 12:05:03, Serang 12:06:55. Bogor and Depok fall a day earlier, on 4 Mar.
- **Coba sendiri:** gather a kantor or sekolah group for a photo at 12:04.
- **Slides:** cover, table, card, end. Post at H-3 and Hari H.

**11. "Maret 2027: 69 dari 86 kota kehilangan bayangan"**
- **Numbers:** the month count (§3b). The first city is Tual on 6 Mar after the Java run of 1–5 Mar. The last is Medan on 30 Mar.
- **Coba sendiri:** comment your city and get your date (feeds the "Cek Kotamu" series).
- **Caveat:** "nyaris" again.
- **Slides:** cover, table (minggu | kota), end.

**12. "Pontianak: hari tanpa bayangan jatuh di hari ekuinoks"**
- **Date:** Sun 21 Mar 2027. Equinox 03:25 WIB, Pontianak ZSD 11:49:56 WIB.
- **Return:** 23 Sep 2027 11:35:13 WIB, the same day as the September equinox.
- **Caveat:** at the equator the crossing can fall between two noons. Note the Pekanbaru one-day difference with BMKG.
- **Slides:** cover, card, card, end.

**13. "Kenapa 'nol' cuma dua menit"** (evergreen explainer)
- **Numbers:**
  - The sun's disc is about 0.53° across (semi-diameter 0.265°–0.269°).
  - The zenith window is 87–130 s.
  - On a 1 m stick, the shadow regrows to 2.2 cm at ±5 min and 13 cm at ±30 min.
- **Coba sendiri:** the three-photo sequence.
- **Slides:** cover, card, table (menit | cm), end.

**14. "Surabaya, Selasa 2 Maret, 11:41 WIB"**
- **Numbers:** window 11:40:09–11:42:17, residual 0.8 mm.
- **Slides:** cover, card, end ("Cek Kotamu" template).

**15. "Makassar, Senin 8 Maret, 12:13 WITA"**
- **Numbers:** window 12:12:16–12:14:02. Ukur Bumi partner: Tarakan, 939 km north (meridian distance), longitude gap 1.8°.
- **Slides:** cover, card, card, end.

**16. "Jayapura, Minggu 14 Maret, 11:46 WIT"**
- **Numbers:** window 11:45:32–11:47:25. Partner Merauke is 5.96° south with a 0.3° longitude gap, the cleanest pair in Papua per `ratePartner`.
- **Slides:** cover, card, end.

**17. "Balikpapan 18 Maret & Samarinda 19 Maret"**
- **Numbers:** 12:20:46 and 12:19:17 WITA. The two cities are 0.74° apart in latitude, which is why their dates differ by one day.
- **Slides:** cover, compare, end.

**18. "Medan 30 Maret — atau 29? Kenapa kami beda sehari dengan BMKG"** (trust-builder)
- **Numbers:** the app's city-centre is 3.5952°N, BMKG's point is 3.5752°N. At the app's point 2026 gives 30 Mar; BMKG publishes 29 Mar 2026. The 2027 app date is 30 Mar, 12:29:54 WIB.
- **Caveat:** this *is* the caveat. Present BMKG as the official source.
- **Slides:** cover, compare (BMKG | aplikasi), card, end.

**19. "Banda Aceh 4 April, Sabang 5 April: ujung perjalanan matahari ke utara"**
- **Numbers:** Banda Aceh 12:41:49 WIB, Sabang 12:41:32 WIB. These are the last listed ZSDs before September.
- **Caveat:** "kota terakhir di daftar aplikasi".
- **Slides:** cover, card, end.

**20. "21 Juni: bayangan siang terpanjang setahun"** (for cities south of the equator)
- **Numbers per 1 m stick:** Denpasar 63 cm, Surabaya 59 cm, Jakarta 57 cm. All point south. December solstice gives the mirror image for Medan (51 cm) and Banda Aceh (55 cm), pointing north.
- **Coba sendiri:** measure your noon shadow on 21 Jun and compare it with the photo from your ZSD.
- **Slides:** cover, table, end.

**Not ranked (belongs to Falak):** "Matahari di atas Ka'bah".
- The engine *can* compute it. With Kaaba coordinates I typed in (21.4225°N, 39.8262°E — **not in this repo**), Mecca's ZSDs are 28 May 2027 at 12:17:57 local (16:17:57 WIB) and 16 Jul 2027 at 12:26:47 (16:26:47 WIB).
- At that instant the sun's azimuth at Jakarta is 295.2°, so shadows point to 115.2°.
- The claim "your shadow points away from the qibla" needs a qibla bearing, which this app does not compute. It is also explicitly Falak's territory (PRD §3). Leave it to the Falak account.

---

## 5. Engagement mechanics

### Recurring series

| Series | Format | Slide types | Needs `figure`? |
|---|---|---|---|
| **Cek Kotamu** | One city per post: date, culmination, window, residual. Rotate through the 86 cities in the order the sweep reaches them, so the series *is* the calendar. | cover, card, end | No |
| **Bayangan Minggu Ini** | Monday roundup: every city with a ZSD in the next 7 days (`upcomingZeroShadowDays(cities, today, 7)`). Empty weeks (Nov–Jan, May–Aug) switch to explainers. | cover, table, end | No |
| **Tengah Hari Bukan Jam 12** | Noon-time facts: today's culmination across zones, EoT extremes 3 Nov and 11 Feb. | cover, table, card | No |
| **Ukur Bumi** | Eratosthenes challenge days: Kupang 20 Oct 2026; the Java run 1–5 Mar 2027; Medan and Banda Aceh in late Mar–Apr. Follow-up deck computes the community's result and **shows the error honestly**. | table, card, compare | Optional (a two-stick diagram helps) |
| **Mitos vs Hitungan** | `compare` cards: "bayangan hilang total" vs "nyaris hilang, ±2 menit"; "jam 12 = tengah hari" vs "kulminasi 11:15–12:42". | compare | No |
| **Kenapa?** | Explainers: why two days, why a window, why the date can differ by a day from BMKG, why noon shadows flip direction. | card, word (*kulminasi*, *deklinasi*, *perata waktu*) | Helpful, not required |

### Comment loop

- Pin a comment: "Tulis nama kotamu — kami balas dengan tanggal & jamnya."
- Answer with a reply card generated by the app for that city. Only listed cities, or a nearby listed city. **Never ask for or post home coordinates.**
- When a requested city isn't among the 86, answer with the nearest listed city and say so.

### UGC challenge: #BayanganNyarisHilang + #UkurBumi

- **Tier 1:** a three-photo sequence (−5 min, culmination, +5 min) of any upright object, with the city and time in the caption.
- **Tier 2:** on a host-city ZSD (Kupang 20 Oct, Jakarta 5 Mar, Medan 30 Mar), measure stick and shadow in cm at your own culmination. Comment the city with "tinggi / bayangan".
- **Results deck:** compute C from the best pairs using the app's `measureEarth`, with a map distance entered by hand. Publish the spread and the error. CLAUDE.md: "the gap is the lesson".
- **Classroom version:** Ukur Bumi already has a classroom mode ("Mode kelas") and a printable worksheet ("Cetak lembar kerja"). Point teachers there.
- **Safety line on every challenge card:** *"Lihat bayangannya, jangan lihat mataharinya."*

### Diagram needs

These need a figure/diagram slide, which isn't built yet. Carousel-press's `[diagram]` is sports-field only.
- The sweep map (subsolar band over the archipelago)
- The stick-and-shadow diagram for Eratosthenes
- Shadow-tip hyperbolas and the analemma
- The direction-flip diagram

Everything else above is text and table only.

---

## 6. Integration — a "Buat kartu TikTok" page

### What exists today

| Item | Status |
|---|---|
| **carousel-core** `core-v1.0.0` | **Unknown / not verifiable.** The local carousel-press clone has no tags, `git ls-remote --tags` returned nothing, and `package.json` is `carousel-press` with no `exports`, `files` or `browser.js`. `docs/PORTING.md` itself says *"Status: plan only. Nothing here is implemented yet."* `registerVariant` / `renderDeck` / `configureFonts` don't exist in `src/`. |
| NusaStats integration | **Not a package dependency.** It builds deck text (server-side, Python) and hands it to Carousel Press as a link, `https://andifathulms.github.io/carousel-press/#deck=<base64url>`. The user then renders and downloads the ZIP in Carousel Press. |
| Deck grammar (shipped) | Header `template:`, `lang:`, `title:`, `caption:`, `counter:`; `---` separators; tag line `[type attr=…]`. Types: `cover, card, code, quote, end, word, table, compare, ayah, hadith, diagram` (sports only). `table`: title line, 2–4 columns, at most 8 body rows. `\|` is a line break, `*x*` is accent. |

### Fit in this app

- **Route:** `app/[locale]/kartu/page.tsx`. It is an operator tool, so leave it out of the nav and tab bar and set `robots: noindex`. Indonesian copy only.
- **Builder:** **`lib/cards/`**, a pure function `buildDeck({kind, city, today}) → string`. Each story kind from §4 is one builder that calls `lib/zsd`, `lib/day`, `lib/eratosthenes` and formats with `formatHoursSeconds` / `lib/format`.
  - Invariant 14 ("nothing is computed in a component") means the page only picks inputs and shows the string.
  - **No number is ever typed into a template.** Every digit comes from a computed field.
- **Tests:** `tests/cards/` should check three things.
  - For a fixed date, every time and date in the deck equals `formatHours(day.localNoonHours)` etc.
  - A `table` never exceeds 8 rows or 4 columns: split clusters across slides.
  - Determinism.
- **Caption:** carousel-core has no caption helper. Copy NusaStats' approach: `TITLE_MAX = 90`, `DESC_MAX = 2200`. Hashtags are chosen by hand: the repo verifies none.

### Phase A — works now, adds no dependency

- Generate the deck in the browser and open `https://andifathulms.github.io/carousel-press/#deck=<base64url>` in a new tab. Also offer *Salin deck* and *Unduh deck.txt*, as NusaStats does.
- **Network:** the fragment after `#` isn't sent to any server, and this app makes no request. The user navigates. This keeps invariant 13 (zero runtime requests *by this app*).
- **Privacy:** decks carry **city names only, never geolocated coordinates** (invariant 9). If the place came from geolocation, name it via `nearestCity()` and put only the city name in the deck.
- **Template:** Carousel Press' current `template:` must name an existing built-in variant until the host variant (§7) exists there.

### Phase B — once carousel-core really ships

Per the PORTING plan, **verify the tag first**.
- **Dependency:** `"carousel-core": "github:andifathulms/carousel-press#core-v1.0.0"` (pnpm handles git deps). This is a product dependency, not astronomy, dates or timezones, so it doesn't break the CLAUDE.md dependency rules. It is still the owner's call.
- **Loading:** `await import('carousel-core')` from the kartu page's client component only, so no other route's bundle grows. The renderer needs `OffscreenCanvas`/`<canvas>`, so it must not run during `next build` prerender.
- **Fonts:** don't rely on `new URL('../fonts/', import.meta.url)` surviving Next's webpack. Copy the package's woff2 files and `manifest.json` into `public/carousel-core/fonts/` at build time, in `scripts/postbuild.mjs` or a prebuild step, and call `configureFonts({ baseUrl: \`${BASE_PATH}/carousel-core/fonts/\` })`.
  - `BASE_PATH` is `/zero-shadow-day` in production (`lib/site`, `next.config.mjs`), and `trailingSlash: true`.
  - The font gate rejects on a missing face (8 s timeout), so a wrong base path fails loudly, not silently.
- **Alternative:** vendor the planned single-file `browser.js` into `public/`. It's equivalent, still self-hosted, with no CDN.
- **Offline:** after first load everything is local: engine, cities, fonts and renderer. Export uses `OffscreenCanvas` → PNG → ZIP (JSZip, STORE), 1080×1920. Respect the safe zone: content x 96–912, y 196–1500; the caption zone starts at y 1520.
- **Verify** with `pnpm build && pnpm preview` under the real base path. `.nojekyll` is already produced by `scripts/postbuild.mjs`.

---

## 7. Own variant — "Tengah Hari" (proposal)

This proposal keeps the app's meaning-carrying rules: **vermilion marks the zero shadow day and nothing else**, **sun ochre is the sun**, and the shadow tone is the darkest thing on the page.

- **Family:** a host may only add variants to existing families (`editorial | dev | lexicon | serene | sport`). Use `editorial`.
- **Id:** `editorial/tengah-hari`.
- **Status:** the registration API is still planned, not shipped.

### Surfaces

All values are app tokens from `tailwind.config.ts`. Ratios were computed with the WCAG formula.

| Surface | bg | ink | body | muted | accent | badge | blob |
|---|---|---|---|---|---|---|---|
| `siang` (default) | `bleached` #F3F5F4 | `shadow` #0E1318 — **17.05** | `shadow-2` #4B5661 — **6.84** | `shadow-2` — 6.84 | `marker-ink` #B3261E — 5.97 (ZSD date/time only) | `chalk` on `sky-deep` — **6.75** | `sky` #DCEBF5: ink 15.33, body 6.15 |
| `langit` | `sky-deep` #0A5CA8 | `chalk` #FFFFFF — **6.75** | `sky` #DCEBF5 — **5.55** | `sky` — 5.55 | `sun` #FFB020 — 3.69 (display sizes only) | `sky-deep` on `chalk` — 6.75 | none; set blob = bg, or skip blobs |
| `deep` (malam) | `sky-night` #07101D | `chalk` — **19.08** | `sky` — **15.66** | `sky` — 15.66 | `sun` — 10.43 | `shadow` on `sun` — 10.21 | `shadow` #0E1318: chalk 18.67, sky 15.33 |

- **Rules met.** carousel-core's documented rules (`DESIGN.md` §4.4 there) are 4.5:1 for ink and body on bg and blob, and 3:1 for badge and muted. All pass.
- **Not checked by core:** `accent` and `onPhoto`. Keep vermilion off `deep`: `marker` on `sky-night` is 4.49, just under 4.5.
- **Code tokens:** unused (no `code` slides) but required by the shape. Derive them from `dev/*`.

### Fonts

- **Mono:** JetBrains Mono, in carousel-core's set. Use it for every time, date and ratio, with tabular numerals as in the app.
- **Sans:** the app's Bricolage Grotesque (display) and Plus Jakarta Sans (body) are **not** in carousel-core's font set. That set is Inter, DM Sans, Poppins, Instrument Sans, Barlow (+ Condensed), Playfair, Lora, Fraunces, Gentium, Amiri and JetBrains Mono.
  - Either add both via the planned `configureFonts({faces})`, which is unknown until shipped,
  - or use Instrument Sans as the nearest stand-in.

### Deco

- **Existing hooks:** `glow` in `sun` at the top of the canvas (the noon sun) and `dotGrid` as a faint "lantai" texture. Keep `blobs` off.
- **New idea: a gnomon mark.** A short vertical stick at the bottom-left with its shadow drawn **at the true ratio** for the slide's date and city, so it is data, not ornament (invariant 10). A sun-path arc in `sun-ink` would also be new.
  - Neither exists as a carousel-core deco. Both need either a new deco field or the `figure` slide, so this is a **request to carousel-core**.
- **Headline:** sentence case, no prefix, accent only on the ZSD date/time (`*Kamis 15 Okt, 12:05 WITA*`).

---

## 8. Risks

### Tolerances to state on cards

- **Date:** **±1 day**. The engine is within a day of BMKG on all 76 fixtures. The app's city-centre point can differ from BMKG's: Medan 2026 is the 30th versus BMKG's 29th.
- **Time:** **±1 minute**. Times are within 5 s of BMKG at BMKG's coordinates, but noon moves 4 min per degree of longitude across a city.
- **Window:** about 1.5–2 minutes (87–130 s), never "sesaat" and never "seharian".
- Always link BMKG as the official source (method page copy).

### Never claim

- **That the shadow disappears completely.** The app's whole point is that it reaches a minimum (0.0–3.4 mm residual on a 1 m stick). Say *nyaris hilang*, *paling pendek* or *hampir tegak lurus*.
- **Any effect the app doesn't compute:** heat or "hari terpanas", health, gravity, eggs standing upright, animals behaving strangely. The app makes no such claims and has no data for them. Don't amplify these common myths. Use "Mitos vs Hitungan" to debunk them carefully, and only with what the app computes.
- **A precise result for an unlisted place or a geolocated home.** Use the nearest listed city and say so.
- **That a date is "official".** It isn't: *"Proyek pribadi untuk keperluan pendidikan. Bukan produk resmi lembaga mana pun."*
- **That the shadow will be visible.** Clouds are out of scope.

### Sensitive topics

- **Religion.** Qibla, Rashdul Qibla and prayer times are Falak's territory and a PRD non-goal here. Keep them on the Falak side of the shared account, and only with Falak's computation and its own caveats.
- **Government branding.** CLAUDE.md forbids OIKN and government branding. The city list includes "Nusantara" (−0.9971°, 116.7°), so use the name plainly and never OIKN or BMKG logos or styling. Cite BMKG; don't imitate it.
- **Eye safety.** Every challenge card must say to look at the shadow, never at the sun.
- **Children and schools.** UGC from classrooms. Ask for no faces or uniforms with school names if reposting; get permission before reposting.
- **Location privacy.** Never ask commenters for coordinates. The app's promise is that coordinates never leave the device; the account should mirror it.

### Eratosthenes honesty

- A schoolyard result will be off, sometimes by a lot. One arcminute of angle error costs 42–470 km depending on the pair.
- Publish the error.
- Don't use coordinate-derived distances without saying they assume the Earth's radius (the app's own note).

---

## Appendix A — every ZSD in the window, 86 cities

Generated by `zeroShadowDays()` for 2026 and 2027, filtered to 13 Oct 2026 – 12 Oct 2027.
- **Culmination:** local time to the second.
- **Window:** the interval when the disc covers the zenith.
- **Bold:** focus cities.

There are 171 rows. Surakarta has only one date in the window: its dates are 12 Oct 2026, just before the window, and 13 Oct 2027, just after it.

| Tanggal | Kota | Zona | Kulminasi | Jendela (cakram menutup zenit) | Durasi |
|---|---|---|---|---|---|
| Sel 13 Okt 2026 | Kediri | WIB | 11:18:14 | 11:17:12–11:19:15 | 123 dtk |
| Sel 13 Okt 2026 | Madiun | WIB | 11:20:12 | 11:19:16–11:21:08 | 112 dtk |
| Sel 13 Okt 2026 | Yogyakarta | WIB | 11:24:49 | 11:23:45–11:25:54 | 129 dtk |
| Rab 14 Okt 2026 | Banyuwangi | WIB | 11:08:35 | 11:07:34–11:09:36 | 123 dtk |
| Rab 14 Okt 2026 | Jember | WIB | 11:11:16 | 11:10:12–11:12:20 | 128 dtk |
| Rab 14 Okt 2026 | Malang | WIB | 11:15:32 | 11:14:41–11:16:22 | 101 dtk |
| Rab 14 Okt 2026 | Singaraja | WITA | 12:05:43 | 12:04:38–12:06:47 | 129 dtk |
| Kam 15 Okt 2026 | Bima | WITA | 11:50:55 | 11:49:51–11:51:59 | 128 dtk |
| Kam 15 Okt 2026 | **Denpasar** | WITA | 12:04:59 | 12:04:08–12:05:49 | 101 dtk |
| Kam 15 Okt 2026 | Labuan Bajo | WITA | 11:46:17 | 11:45:12–11:47:22 | 130 dtk |
| Kam 15 Okt 2026 | Mataram | WITA | 12:01:22 | 12:00:20–12:02:24 | 124 dtk |
| Kam 15 Okt 2026 | Maumere | WITA | 11:36:59 | 11:36:02–11:37:57 | 115 dtk |
| Kam 15 Okt 2026 | Merauke | WIT | 11:24:14 | 11:23:10–11:25:19 | 129 dtk |
| Kam 15 Okt 2026 | Sumbawa Besar | WITA | 11:56:09 | 11:55:04–11:57:14 | 130 dtk |
| Jum 16 Okt 2026 | Ende | WITA | 11:38:58 | 11:37:53–11:40:02 | 129 dtk |
| Min 18 Okt 2026 | Waingapu | WITA | 11:44:08 | 11:43:05–11:45:12 | 127 dtk |
| Sel 20 Okt 2026 | Kupang | WITA | 11:30:23 | 11:29:28–11:31:19 | 111 dtk |
| Sen 22 Feb 2027 | Kupang | WITA | 11:59:07 | 11:58:08–12:00:06 | 118 dtk |
| Rab 24 Feb 2027 | Waingapu | WITA | 12:12:13 | 12:11:11–12:13:14 | 123 dtk |
| Jum 26 Feb 2027 | **Denpasar** | WITA | 12:32:06 | 12:31:11–12:33:02 | 111 dtk |
| Jum 26 Feb 2027 | Ende | WITA | 12:06:19 | 12:05:13–12:07:24 | 130 dtk |
| Sab 27 Feb 2027 | Bima | WITA | 12:17:53 | 12:16:47–12:18:58 | 130 dtk |
| Sab 27 Feb 2027 | Labuan Bajo | WITA | 12:13:14 | 12:12:10–12:14:18 | 128 dtk |
| Sab 27 Feb 2027 | Mataram | WITA | 12:28:19 | 12:27:24–12:29:14 | 111 dtk |
| Sab 27 Feb 2027 | Maumere | WITA | 12:03:57 | 12:03:07–12:04:47 | 100 dtk |
| Sab 27 Feb 2027 | Merauke | WIT | 11:51:11 | 11:50:06–11:52:16 | 130 dtk |
| Sab 27 Feb 2027 | Sumbawa Besar | WITA | 12:23:06 | 12:22:02–12:24:10 | 128 dtk |
| Min 28 Feb 2027 | Banyuwangi | WIB | 11:35:08 | 11:34:15–11:36:01 | 106 dtk |
| Min 28 Feb 2027 | Jember | WIB | 11:37:48 | 11:36:49–11:38:48 | 119 dtk |
| Min 28 Feb 2027 | Malang | WIB | 11:42:04 | 11:41:03–11:43:06 | 122 dtk |
| Min 28 Feb 2027 | Singaraja | WITA | 12:32:15 | 12:31:11–12:33:19 | 128 dtk |
| Sen 1 Mar 2027 | Kediri | WIB | 11:44:21 | 11:43:30–11:45:12 | 102 dtk |
| Sen 1 Mar 2027 | Madiun | WIB | 11:46:19 | 11:45:15–11:47:23 | 128 dtk |
| Sen 1 Mar 2027 | Surakarta | WIB | 11:49:07 | 11:48:07–11:50:07 | 120 dtk |
| Sen 1 Mar 2027 | Yogyakarta | WIB | 11:50:56 | 11:49:58–11:51:55 | 117 dtk |
| Sel 2 Mar 2027 | Magelang | WIB | 11:51:21 | 11:50:33–11:52:09 | 96 dtk |
| Sel 2 Mar 2027 | Purwokerto | WIB | 11:55:16 | 11:54:18–11:56:13 | 115 dtk |
| Sel 2 Mar 2027 | **Surabaya** | WIB | 11:41:13 | 11:40:09–11:42:17 | 128 dtk |
| Sel 2 Mar 2027 | Tasikmalaya | WIB | 11:59:20 | 11:58:15–12:00:25 | 129 dtk |
| Rab 3 Mar 2027 | **Bandung** | WIB | 12:01:32 | 12:00:27–12:02:37 | 130 dtk |
| Rab 3 Mar 2027 | Pekalongan | WIB | 11:53:19 | 11:52:14–11:54:23 | 129 dtk |
| Rab 3 Mar 2027 | Semarang | WIB | 11:50:20 | 11:49:18–11:51:22 | 125 dtk |
| Rab 3 Mar 2027 | Tegal | WIB | 11:55:27 | 11:54:23–11:56:31 | 128 dtk |
| Kam 4 Mar 2027 | Bogor | WIB | 12:04:35 | 12:03:32–12:05:37 | 126 dtk |
| Kam 4 Mar 2027 | Cirebon | WIB | 11:57:34 | 11:56:45–11:58:23 | 98 dtk |
| Kam 4 Mar 2027 | Depok | WIB | 12:04:37 | 12:03:40–12:05:35 | 115 dtk |
| Jum 5 Mar 2027 | Bekasi | WIB | 12:03:41 | 12:02:40–12:04:41 | 121 dtk |
| Jum 5 Mar 2027 | **Jakarta** | WIB | 12:04:12 | 12:03:09–12:05:15 | 126 dtk |
| Jum 5 Mar 2027 | Serang | WIB | 12:06:55 | 12:05:51–12:08:00 | 129 dtk |
| Jum 5 Mar 2027 | Tangerang | WIB | 12:05:03 | 12:03:59–12:06:07 | 129 dtk |
| Sab 6 Mar 2027 | Tual | WIT | 12:20:22 | 12:19:28–12:21:16 | 107 dtk |
| Min 7 Mar 2027 | Bandar Lampung | WIB | 12:10:03 | 12:08:59–12:11:07 | 129 dtk |
| Min 7 Mar 2027 | Baubau | WITA | 12:00:36 | 11:59:34–12:01:37 | 123 dtk |
| Sen 8 Mar 2027 | **Makassar** | WITA | 12:13:09 | 12:12:16–12:14:02 | 106 dtk |
| Sel 9 Mar 2027 | Timika | WIT | 12:03:07 | 12:02:05–12:04:09 | 124 dtk |
| Rab 10 Mar 2027 | Wamena | WIT | 11:54:36 | 11:53:40–11:55:32 | 112 dtk |
| Kam 11 Mar 2027 | Ambon | WIT | 12:37:24 | 12:36:28–12:38:20 | 112 dtk |
| Kam 11 Mar 2027 | Bengkulu | WIB | 12:21:04 | 12:20:00–12:22:09 | 129 dtk |
| Kam 11 Mar 2027 | Kendari | WITA | 12:00:04 | 11:59:16–12:00:53 | 97 dtk |
| Kam 11 Mar 2027 | Parepare | WITA | 12:11:37 | 12:10:53–12:12:22 | 89 dtk |
| Jum 12 Mar 2027 | Banjarmasin | WITA | 12:31:30 | 12:30:30–12:32:29 | 119 dtk |
| Jum 12 Mar 2027 | Lubuklinggau | WIB | 12:18:24 | 12:17:25–12:19:23 | 117 dtk |
| Jum 12 Mar 2027 | Nabire | WIT | 12:07:56 | 12:06:55–12:08:58 | 124 dtk |
| Sab 13 Mar 2027 | Fakfak | WIT | 12:20:25 | 12:19:27–12:21:23 | 115 dtk |
| Sab 13 Mar 2027 | Palembang | WIB | 12:10:29 | 12:09:25–12:11:32 | 127 dtk |
| Sab 13 Mar 2027 | Palopo | WITA | 12:08:48 | 12:07:45–12:09:52 | 127 dtk |
| Min 14 Mar 2027 | **Jayapura** | WIT | 11:46:28 | 11:45:32–11:47:25 | 113 dtk |
| Min 14 Mar 2027 | Mamuju | WITA | 12:13:46 | 12:12:42–12:14:50 | 128 dtk |
| Min 14 Mar 2027 | Sampit | WIB | 11:37:31 | 11:36:31–11:38:31 | 120 dtk |
| Min 14 Mar 2027 | Tanjung Pandan | WIB | 11:58:42 | 11:57:45–11:59:39 | 114 dtk |
| Sen 15 Mar 2027 | Palangka Raya | WIB | 11:33:24 | 11:32:19–11:34:28 | 128 dtk |
| Sen 15 Mar 2027 | Pangkalpinang | WIB | 12:04:34 | 12:03:34–12:05:34 | 120 dtk |
| Sel 16 Mar 2027 | Ketapang | WIB | 11:48:52 | 11:47:47–11:49:56 | 129 dtk |
| Rab 17 Mar 2027 | Jambi | WIB | 12:14:00 | 12:13:11–12:14:49 | 98 dtk |
| Kam 18 Mar 2027 | **Balikpapan** | WITA | 12:20:46 | 12:19:59–12:21:33 | 94 dtk |
| Kam 18 Mar 2027 | Biak | WIT | 12:03:52 | 12:02:53–12:04:52 | 119 dtk |
| Kam 18 Mar 2027 | Luwuk | WITA | 11:57:02 | 11:56:04–11:58:01 | 117 dtk |
| Kam 18 Mar 2027 | Nusantara | WITA | 12:21:23 | 12:20:20–12:22:26 | 125 dtk |
| Kam 18 Mar 2027 | Padang | WIB | 12:26:30 | 12:25:30–12:27:31 | 121 dtk |
| Kam 18 Mar 2027 | Palu | WITA | 12:08:42 | 12:07:52–12:09:32 | 100 dtk |
| Kam 18 Mar 2027 | Sorong | WIT | 12:23:10 | 12:22:26–12:23:54 | 88 dtk |
| Jum 19 Mar 2027 | Manokwari | WIT | 12:11:39 | 12:10:52–12:12:26 | 94 dtk |
| Jum 19 Mar 2027 | **Samarinda** | WITA | 12:19:17 | 12:18:25–12:20:09 | 104 dtk |
| Sab 20 Mar 2027 | Bukittinggi | WIB | 12:26:06 | 12:25:04–12:27:09 | 125 dtk |
| Min 21 Mar 2027 | Bontang | WITA | 12:17:18 | 12:16:14–12:18:22 | 128 dtk |
| Min 21 Mar 2027 | Pontianak | WIB | 11:49:56 | 11:49:05–11:50:46 | 101 dtk |
| Sen 22 Mar 2027 | Gorontalo | WITA | 11:54:47 | 11:53:43–11:55:51 | 128 dtk |
| Sen 22 Mar 2027 | Pekanbaru | WIB | 12:21:12 | 12:20:08–12:22:16 | 127 dtk |
| Sel 23 Mar 2027 | Batam | WIB | 12:10:29 | 12:09:45–12:11:13 | 87 dtk |
| Sel 23 Mar 2027 | Singkawang | WIB | 11:50:45 | 11:49:41–11:51:49 | 128 dtk |
| Sel 23 Mar 2027 | Sofifi | WIT | 12:36:29 | 12:35:39–12:37:18 | 99 dtk |
| Sel 23 Mar 2027 | Tanjungpinang | WIB | 12:08:52 | 12:07:48–12:09:57 | 128 dtk |
| Sel 23 Mar 2027 | Ternate | WIT | 12:37:10 | 12:36:12–12:38:08 | 117 dtk |
| Rab 24 Mar 2027 | Bitung | WITA | 11:45:56 | 11:45:00–11:46:51 | 111 dtk |
| Rab 24 Mar 2027 | Manado | WITA | 11:47:03 | 11:46:13–11:47:52 | 99 dtk |
| Kam 25 Mar 2027 | Dumai | WIB | 12:20:18 | 12:19:15–12:21:21 | 125 dtk |
| Min 28 Mar 2027 | Pematangsiantar | WIB | 12:28:55 | 12:27:52–12:29:57 | 125 dtk |
| Min 28 Mar 2027 | Tanjung Selor | WITA | 12:15:44 | 12:14:41–12:16:47 | 126 dtk |
| Sen 29 Mar 2027 | Tarakan | WITA | 12:14:22 | 12:13:18–12:15:26 | 128 dtk |
| Sel 30 Mar 2027 | **Medan** | WIB | 12:29:54 | 12:28:53–12:30:54 | 121 dtk |
| Sab 3 Apr 2027 | Lhokseumawe | WIB | 12:34:48 | 12:33:44–12:35:51 | 126 dtk |
| Min 4 Apr 2027 | **Banda Aceh** | WIB | 12:41:49 | 12:40:46–12:42:51 | 125 dtk |
| Sen 5 Apr 2027 | Sabang | WIB | 12:41:32 | 12:40:32–12:42:31 | 119 dtk |
| Rab 8 Sep 2027 | Sabang | WIB | 12:36:35 | 12:35:39–12:37:31 | 112 dtk |
| Kam 9 Sep 2027 | **Banda Aceh** | WIB | 12:36:14 | 12:35:23–12:37:05 | 102 dtk |
| Jum 10 Sep 2027 | Lhokseumawe | WIB | 12:28:35 | 12:27:45–12:29:24 | 99 dtk |
| Sel 14 Sep 2027 | **Medan** | WIB | 12:21:05 | 12:20:06–12:22:04 | 117 dtk |
| Rab 15 Sep 2027 | Pematangsiantar | WIB | 12:19:09 | 12:18:16–12:20:01 | 105 dtk |
| Rab 15 Sep 2027 | Tarakan | WITA | 12:04:54 | 12:04:06–12:05:43 | 97 dtk |
| Kam 16 Sep 2027 | Tanjung Selor | WITA | 12:05:37 | 12:04:37–12:06:36 | 119 dtk |
| Min 19 Sep 2027 | Bitung | WITA | 11:33:32 | 11:32:40–11:34:24 | 104 dtk |
| Min 19 Sep 2027 | Dumai | WIB | 12:08:12 | 12:07:13–12:09:11 | 118 dtk |
| Min 19 Sep 2027 | Manado | WITA | 11:34:39 | 11:33:42–11:35:36 | 114 dtk |
| Sen 20 Sep 2027 | Batam | WIB | 11:57:26 | 11:56:23–11:58:28 | 125 dtk |
| Sel 21 Sep 2027 | Singkawang | WIB | 11:37:20 | 11:36:22–11:38:19 | 117 dtk |
| Sel 21 Sep 2027 | Sofifi | WIT | 12:23:04 | 12:22:04–12:24:05 | 121 dtk |
| Sel 21 Sep 2027 | Tanjungpinang | WIB | 11:55:28 | 11:54:31–11:56:24 | 113 dtk |
| Sel 21 Sep 2027 | Ternate | WIT | 12:23:46 | 12:22:42–12:24:49 | 127 dtk |
| Rab 22 Sep 2027 | Gorontalo | WITA | 11:40:43 | 11:39:46–11:41:40 | 114 dtk |
| Rab 22 Sep 2027 | Pekanbaru | WIB | 12:07:08 | 12:06:10–12:08:07 | 117 dtk |
| Kam 23 Sep 2027 | Bontang | WITA | 12:02:35 | 12:01:37–12:03:34 | 118 dtk |
| Kam 23 Sep 2027 | Pontianak | WIB | 11:35:13 | 11:34:10–11:36:15 | 125 dtk |
| Jum 24 Sep 2027 | Bukittinggi | WIB | 12:10:45 | 12:09:43–12:11:46 | 123 dtk |
| Jum 24 Sep 2027 | **Samarinda** | WITA | 12:03:37 | 12:02:44–12:04:31 | 107 dtk |
| Sab 25 Sep 2027 | Manokwari | WIT | 11:55:39 | 11:54:44–11:56:35 | 111 dtk |
| Sab 25 Sep 2027 | Padang | WIB | 12:10:12 | 12:09:26–12:10:59 | 93 dtk |
| Sab 25 Sep 2027 | Palu | WITA | 11:52:25 | 11:51:31–11:53:18 | 106 dtk |
| Sab 25 Sep 2027 | Sorong | WIT | 12:06:53 | 12:05:59–12:07:46 | 107 dtk |
| Min 26 Sep 2027 | **Balikpapan** | WITA | 12:04:08 | 12:03:09–12:05:07 | 118 dtk |
| Min 26 Sep 2027 | Biak | WIT | 11:47:14 | 11:46:12–11:48:16 | 124 dtk |
| Min 26 Sep 2027 | Luwuk | WITA | 11:40:24 | 11:39:37–11:41:11 | 94 dtk |
| Min 26 Sep 2027 | Nusantara | WITA | 12:04:45 | 12:03:50–12:05:39 | 108 dtk |
| Sen 27 Sep 2027 | Jambi | WIB | 11:56:44 | 11:55:42–11:57:46 | 123 dtk |
| Sel 28 Sep 2027 | Ketapang | WIB | 11:30:58 | 11:29:57–11:31:59 | 122 dtk |
| Rab 29 Sep 2027 | Palangka Raya | WIB | 11:14:52 | 11:13:53–11:15:52 | 119 dtk |
| Rab 29 Sep 2027 | Pangkalpinang | WIB | 11:46:03 | 11:45:17–11:46:48 | 92 dtk |
| Kam 30 Sep 2027 | **Jayapura** | WIT | 11:27:21 | 11:26:25–11:28:16 | 110 dtk |
| Kam 30 Sep 2027 | Mamuju | WITA | 11:54:38 | 11:53:34–11:55:42 | 128 dtk |
| Kam 30 Sep 2027 | Sampit | WIB | 11:18:23 | 11:17:33–11:19:13 | 101 dtk |
| Kam 30 Sep 2027 | Tanjung Pandan | WIB | 11:39:34 | 11:38:31–11:40:37 | 126 dtk |
| Jum 1 Okt 2027 | Fakfak | WIT | 12:00:41 | 11:59:47–12:01:36 | 109 dtk |
| Jum 1 Okt 2027 | Palembang | WIB | 11:50:45 | 11:49:47–11:51:42 | 115 dtk |
| Jum 1 Okt 2027 | Palopo | WITA | 11:49:04 | 11:48:04–11:50:05 | 121 dtk |
| Sab 2 Okt 2027 | Banjarmasin | WITA | 12:11:10 | 12:10:18–12:12:03 | 105 dtk |
| Sab 2 Okt 2027 | Lubuklinggau | WIB | 11:58:04 | 11:57:19–11:58:50 | 91 dtk |
| Sab 2 Okt 2027 | Nabire | WIT | 11:47:37 | 11:46:36–11:48:38 | 122 dtk |
| Min 3 Okt 2027 | Ambon | WIT | 12:16:30 | 12:15:37–12:17:23 | 106 dtk |
| Min 3 Okt 2027 | Bengkulu | WIB | 12:00:10 | 11:59:08–12:01:11 | 122 dtk |
| Min 3 Okt 2027 | Kendari | WITA | 11:39:10 | 11:38:17–11:40:03 | 106 dtk |
| Min 3 Okt 2027 | Parepare | WITA | 11:50:43 | 11:49:52–11:51:34 | 102 dtk |
| Sen 4 Okt 2027 | Wamena | WIT | 11:33:07 | 11:32:10–11:34:05 | 115 dtk |
| Sel 5 Okt 2027 | Timika | WIT | 11:41:04 | 11:40:02–11:42:07 | 125 dtk |
| Rab 6 Okt 2027 | **Makassar** | WITA | 11:50:34 | 11:49:39–11:51:28 | 110 dtk |
| Kam 7 Okt 2027 | Bandar Lampung | WIB | 11:46:55 | 11:45:51–11:47:59 | 128 dtk |
| Kam 7 Okt 2027 | Baubau | WITA | 11:37:28 | 11:36:26–11:38:29 | 123 dtk |
| Jum 8 Okt 2027 | Tual | WIT | 11:56:43 | 11:55:46–11:57:39 | 113 dtk |
| Sab 9 Okt 2027 | Bekasi | WIB | 11:39:31 | 11:38:28–11:40:33 | 124 dtk |
| Sab 9 Okt 2027 | **Jakarta** | WIB | 11:40:02 | 11:38:58–11:41:05 | 127 dtk |
| Sab 9 Okt 2027 | Serang | WIB | 11:42:45 | 11:41:43–11:43:48 | 126 dtk |
| Sab 9 Okt 2027 | Tangerang | WIB | 11:40:53 | 11:39:49–11:41:57 | 129 dtk |
| Min 10 Okt 2027 | Bogor | WIB | 11:39:55 | 11:38:51–11:40:58 | 127 dtk |
| Min 10 Okt 2027 | Cirebon | WIB | 11:32:55 | 11:32:03–11:33:46 | 103 dtk |
| Min 10 Okt 2027 | Depok | WIB | 11:39:58 | 11:39:04–11:40:52 | 108 dtk |
| Sen 11 Okt 2027 | **Bandung** | WIB | 11:36:24 | 11:35:19–11:37:28 | 129 dtk |
| Sen 11 Okt 2027 | Pekalongan | WIB | 11:28:10 | 11:27:06–11:29:14 | 128 dtk |
| Sen 11 Okt 2027 | Semarang | WIB | 11:25:11 | 11:24:09–11:26:14 | 124 dtk |
| Sen 11 Okt 2027 | Tegal | WIB | 11:30:19 | 11:29:15–11:31:22 | 126 dtk |
| Sel 12 Okt 2027 | Magelang | WIB | 11:25:44 | 11:24:57–11:26:32 | 95 dtk |
| Sel 12 Okt 2027 | Purwokerto | WIB | 11:29:39 | 11:28:42–11:30:36 | 114 dtk |
| Sel 12 Okt 2027 | **Surabaya** | WIB | 11:15:36 | 11:14:32–11:16:40 | 128 dtk |
| Sel 12 Okt 2027 | Tasikmalaya | WIB | 11:33:44 | 11:32:39–11:34:48 | 129 dtk |

## Appendix B — how the numbers were produced

The app's own modules were bundled with the esbuild already in `node_modules`, with `@` aliased to the repo root, and run in Node 25. The scratch scripts lived outside the repo and are not committed.

```bash
node_modules/.pnpm/esbuild@0.21.5/node_modules/esbuild/bin/esbuild calc.ts \
  --bundle --platform=node --format=esm --alias:@=. --outfile=calc.mjs && node calc.mjs
```

The core of `calc.ts`:

```ts
import { INDONESIAN_CITIES } from '@/data/cities/indonesia'
import { zeroShadowDays, nextZeroShadowDay, longestShadowDay } from '@/lib/zsd'
import { formatHoursSeconds } from '@/lib/solar/noon'
import { noonOfYear, subsolarOn, instantAt } from '@/lib/day'
import { syntheticObservation, measureEarth, ratePartner } from '@/lib/eratosthenes'

for (const city of INDONESIAN_CITIES)
  for (const year of [2026, 2027]) {
    const r = zeroShadowDays(city, year)            // never 'outside-tropics' for these 86
    if (r.type === 'zero-shadow-days')
      for (const d of r.days)                       // keep 2026-10-13 ≤ date ≤ 2027-10-12
        console.log(d.date, city.name, formatHoursSeconds(d.localNoonHours),
          d.window && formatHoursSeconds(d.window.startLocalHours),
          d.window && formatHoursSeconds(d.window.endLocalHours),
          d.window?.durationSeconds, d.minZenithDeg, d.minShadowRatio)
  }
```

**Other runs:**
- `longestShadowDay` gave the solstice shadows.
- `noonOfYear` gave the earliest and latest noon.
- `subsolarOn` gave the band's position and speed.
- `instantAt` at culmination ± N minutes gave the regrowth table.
- `syntheticObservation`, `measureEarth` and `ratePartner` gave the Ukur Bumi numbers.
- A 1-minute scan of `solarPosition().decDeg` gave the equinox and solstice instants.
- The Mecca figures used typed-in coordinates (not repo data) with `zeroShadowDays` and `horizontalPosition`.

**Cross-check against the repo's BMKG fixtures** (`tests/zsd/fixtures/bmkg.ts`, 2026 first table) using the app's city coordinates. These match the published dates:
- Jakarta 5 Mar, Bandung 3 Mar, Surabaya 2 Mar
- Makassar 7 Mar, Samarinda 19 Mar, Jayapura 14 Mar
- Banda Aceh 4 Apr, Denpasar 26 Feb, Kupang 22 Feb

Medan differs by one day (30 vs 29 Mar) because of the coordinate choice. At BMKG's coordinates the suite passes.
