---
target: site (multi-page sweep)
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-08-14T03-01-29Z
slug: site-multi-page-sweep
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | Skeletons, `aria-valuetext`, live readouts are consistent; Eratosthenes' numeric fields give zero feedback on a rejected keystroke |
| 2 | Match System / Real World | 4/4 | Plain-language 3-step explainer before jargon; concrete Indonesian examples (Banda Aceh, WIB) |
| 3 | User Control and Freedom | 3/4 | Reduced-motion respected with meaningful fallbacks everywhere; no "reset to synthetic values" once a student overwrites an Eratosthenes field |
| 4 | Consistency and Standards | 3/4 | Vermilion carries a genuine second role in exactly 2 places (see Design Specificity below) — narrower than first read, but still a documented-rule violation |
| 5 | Error Prevention | 2/4 | `fromEntry()` in `EratosthenesLab.tsx:200-209` silently discards unparseable keystrokes and reverts to the prior value — confirmed by direct read, no guardrail message anywhere |
| 6 | Recognition Rather Than Recall | 3/4 | Tabular numerals + persistent labels throughout; partner-finder's `Δφ`/`Δλ` shorthand is undefined at point of use |
| 7 | Flexibility and Efficiency (mixed mode) | 3/4 | Shareable deep links, skip-to-content, year-pill switcher are strong; Eratosthenes has no step structure, just one long scroll |
| 8 | Aesthetic and Minimalist Design | 3/4 | Disciplined palette/type system; detector confirms 7 instances of off-ramp type sizes (10px, 1.05rem) and one dt/dd "Row" pattern reimplemented identically in 4 files |
| 9 | Error Recovery | 2/4 | Outside-tropics is a genuinely good structured no-result; a bad Eratosthenes keystroke produces total silence at the highest-stakes moment in the product |
| 10 | Help and Documentation (mixed mode) | 3/4 | Method explanation woven in exactly where needed; no inline glossary for Δφ/Δλ |

**Total: 29/40 — Good** (all ten heuristics applicable; scored with the Read/Experience + Operate mode mix in mind for #7 and #10 rather than exempting them)

## Design Specificity Verdict

**LLM assessment:** This is not a template with astronomy copy dropped in. The evidence: a hand-authored SVG date-scrubber drawing the actual year-long signed shadow-ratio curve behind a native range input (`components/scrubber/DateScrubber.tsx`); a sweep "map" that is deliberately *not* a basemap but 42 raw lat/lon points, because a coastline is exactly the kind of external data dependency the project refuses (`components/sweep/SweepMap.tsx`); and copy that reaches for a real place and number instead of an abstraction ("WIB berpatokan pada 105° BT, sedangkan Banda Aceh berada di 95° BT..."). The Eratosthenes distance-field disclosure — telling the teacher the pre-filled distance already assumes the Earth's known radius, and that a real measurement is required or the exercise begs its own question — is the kind of intellectually honest microcopy a generic template would never produce.

Where it slips toward generic is narrow and specific, not pervasive: `border-marker/40 bg-marker/5` is a stock "tinted alert box" pattern, and here it's applied to two genuinely non-ZSD states (see below) in a system whose own DESIGN.md calls vermilion's rarity "the point."

**Deterministic scan:** `node detect.mjs --json app components` ran clean (no crash) and returned 10 findings, exit code 2:
- **3× `side-tab`** (`border-l-4 border-l-*`): `DatesDetail.tsx:209`, `DatesSummary.tsx:62`, `EratosthenesLab.tsx:299` — all read directly. Two of these (`DatesDetail`, `DatesSummary`) are `border-l-marker` on the **zero shadow day card itself** — that's the rule's on-label use, not a violation. The third (`EratosthenesLab.tsx:299`) is `border-l-marker` on the **derived circumference result panel** — not literally the ZSD, but the direct payoff of a ZSD-based measurement; a defensible extension of the rule, not a clear violation. **Verdict: false-positive-adjacent — the detector can't distinguish "the zero shadow day" from "a result derived from it," a human judgment call the rule's plain text doesn't resolve.**
- **7× `design-system-font-size`** (10px in `Analemma.tsx:105,132` and `SweepMap.tsx:114`; `1.05rem` in `DatesDetail.tsx:270`, `EratosthenesLab.tsx:359`, `NoonAnywhere.tsx:111`, `Readout.tsx:88`): the sub-agent that ran this scan incorrectly assumed no `DESIGN.md` existed and called these likely-inapplicable — **that assumption was wrong; `DESIGN.md` was written earlier this session** and its type frontmatter has no 10px or 1.05rem step (label is 0.6875rem/11px, mono/value is 0.95rem). **These 7 are genuine, confirmed findings**, not false positives: real off-ramp one-off sizes, and the identical `text-[1.05rem]` "emphasis" escape hatch is duplicated verbatim across four separately-implemented `Row` components (`Readout.tsx`, `NoonAnywhere.tsx`, `DatesDetail.tsx`, `EratosthenesLab.tsx`) rather than defined once.

**Visual overlays:** Not available this run. No browser/screenshot automation tool was exposed in this session (confirmed independently by both the parent context and Assessment B via `ToolSearch`), and `pnpm dev` currently 500s on every route (see Priority Issues), so there was no live page to inject into even if a tool existed. Assessment A fell back to a careful source read; Assessment B fell back to the CLI scan plus source read. No fabricated visual claims are included below — anything about layout/responsiveness is a Tailwind-class inference, flagged as such.

## Overall Impression

The exploratory routes (bayangan, tanggal, sapuan) are genuinely disciplined: one accent color, tabular everything, honest structured no-results. The flagship interactive flow — Eratosthenes, which PRODUCT.md itself names as the feature that turns a visitor into a returning teacher — is where the checklist and the error-handling both come apart: too many simultaneous decisions, and a numeric-entry failure mode that goes completely silent at the exact moment a teacher needs confidence in front of a class. The single biggest opportunity is tightening that one flow, not a system-wide redesign.

## What's Working

1. **Outside-tropics consolation copy** (`components/dates/DatesDetail.tsx:75-88`) — names the latitude limit, explains the geometry, and still offers the nearest day ("bukan jalan buntu, hanya belum cukup dekat" — not a dead end, just not close enough). A structured no-result written as genuine product voice, not boilerplate.
2. **Eratosthenes' honest pre-fill disclosure** — the distance field is pre-populated from the accepted Earth radius, and the copy says so outright, telling the teacher to replace it with a real measurement or the exercise begs its own question. Very few tools admit their own default is circular reasoning.
3. **Reduced-motion handling is systemic**, not a single global kill-switch — `Hero`, `GnomonView`, `SweepMap`, and `TimeScrubber` each substitute a *meaningful* frozen/stepped state (e.g. holding at local noon) rather than just disabling animation.

## Priority Issues

**[P2] `pnpm dev` 500s on every route — a real, reproducible dev-server fault, but not a shipped-product bug.**
What: `next dev` throws `Page "/[locale]/page" is missing exported function "generateStaticParams()"` on every request; confirmed reproducible after a clean `.next` deletion. `app/[locale]/layout.tsx` exports `generateStaticParams`, but no `page.tsx` in the tree does, and this Next 14.2.15 dev server apparently wants it on the page too. **Verified `pnpm build` succeeds cleanly and `pnpm preview` serves the static export correctly** — so the actual deployed site is unaffected; this is scoped to the local dev-server workflow only. Downgraded from Assessment A's P0 (which assumed this would break the shipped product) to P1, since it's still the exact command `pnpm dev` in every workflow doc and blocks any contributor or reviewer trying to run the app locally.
Why it matters: a portfolio reviewer's first move is almost always `pnpm dev`, not `pnpm build && pnpm preview`.
Fix: add `generateStaticParams` re-exports (or a shared helper) to each `app/[locale]/*/page.tsx`, or confirm whether re-exporting from the layout should suffice in this Next version and file it as a Next.js quirk with a workaround noted in the README.
Suggested command: `$impeccable harden`.

**[P1] The zero-shadow-day accent color also marks two states that are not the zero shadow day.**
What: `border-marker/40 bg-marker/5` on the "outside tropics" no-result panel (`DatesDetail.tsx:76`) and the "insufficient separation" no-result panel (`EratosthenesLab.tsx:289`) — both structured refusals per CLAUDE.md invariant 7, neither one the ZSD itself.
Why it matters: DESIGN.md's own **One Accent Rule** states vermilion "marks the zero shadow day and nothing else... not a generic 'primary CTA' color, not an error state." These two panels contradict that in the literal implementation, and it's exactly the kind of internal-consistency gap a craft-focused reviewer (one of this project's three named audiences) is primed to catch by reading the design doc against the code.
Fix: give these two structured-refusal panels a neutral `shadow`-toned treatment (`border-shadow/25 bg-shadow/5`) to match the rest of the system's flat, ink-only "quiet" states, freeing vermilion for its one job.
Suggested command: `$impeccable audit` (then a small `$impeccable polish` pass on the two panels).

**[P1] Eratosthenes crams 6+ simultaneous decisions into one continuous scroll.**
What: partner finder (6 ranked city choices, confirmed via `.slice(0, 6)` at `EratosthenesLab.tsx:42`) → instructions → two pre-filled observation-entry cards → distance field → result, all rendered and editable at once. Cognitive-load checklist: fails "chunking ≤4," "one-thing-at-a-time," and "minimal choices (≤4)" simultaneously, concentrated in the one route PRODUCT.md calls first-class rather than a footnote.
Why it matters: the primary persona for this route is a teacher, plausibly managing this the night before or during class — the moment this flow asks the most of a user is exactly where it currently asks too much at once.
Fix: either collapse the 6 partner cards to a top-3 "recommended" set with a "show more" disclosure, or restructure the page as sequential steps (find partner → measure → result) so only the relevant decision is on-screen.
Suggested command: `$impeccable distill`.

**[P2] Numeric inputs silently discard invalid keystrokes with no feedback, confirmed at the code level.**
What: `fromEntry()` (`EratosthenesLab.tsx:200-209`) parses `gnomonHeight`/`shadowLength` and, on `Number.parseFloat` failure or an out-of-range value, silently falls back to `base` — the previous valid value — with no visible error state. `PlacePicker`'s lat/lon fields have the same shape of problem (parse failure → the coordinate simply isn't applied on submit, `PlacePicker.tsx:46-48`).
Why it matters: a student typing a comma instead of a period, or fat-fingering a digit, gets an edit that silently doesn't take — worst possible failure mode exactly where measurement accuracy is the entire point of the exercise.
Fix: add an inline `text-marker-ink` message on blur/submit when the raw string fails to parse, reusing the pattern already established for `place.denied`/`place.unsupported`.
Suggested command: `$impeccable harden`.

**[P3] A duplicated markup pattern and a small set of off-scale type sizes, both detector-confirmed.**
What: the `dt`/`dd` readout row (label + tabular value, with an "emphasis" branch at `text-[1.05rem]`) is implemented four separate times, verbatim, in `Readout.tsx`, `NoonAnywhere.tsx`, `DatesDetail.tsx`, and `EratosthenesLab.tsx`. Two SVG label sizes (`Analemma.tsx:105,132`, `SweepMap.tsx:114`) sit at a bare `text-[10px]`, off DESIGN.md's type ramp (label is 11px, mono/value is 0.95rem — nothing at 10px or 1.05rem).
Why it matters: no visible bug today, but any future tweak to the emphasis treatment or the small-label size needs four/three manual edits instead of one, and it's the first crack in an otherwise disciplined, single-source type system.
Fix: extract a shared `<ReadoutRow>` component; either add a `label-sm`/`10px` step to DESIGN.md if 10px is intentional for SVG micro-labels, or bump those two instances to the existing 11px label size.
Suggested command: `$impeccable extract`.

## Persona Red Flags

**Ibu Guru (teacher planning the Eratosthenes exercise — project-specific, per PRODUCT.md's named teacher audience):** Opens `/eratosthenes` to prep. Faces 6 simultaneous partner-city cards showing `Δφ`/`Δλ` shorthand defined nowhere on-screen beyond one prose sentence above the list — has to infer the notation cold. Scrolls past instructions, two pre-filled observation cards, and an honestly-disclosed pre-filled distance field, all visible at once. If she test-types a shadow measurement with a comma instead of a decimal point the morning of class, `fromEntry()` just silently reverts it — no error, no hint — the exact moment the tool should be most reassuring is where it goes quiet.

**Sam (accessibility-dependent, screen reader + keyboard-only):** The custom SVG date scrubber (`DateScrubber.tsx`) does the right structural thing — a real `<input type="range">` with `aria-valuetext` sits over the drawing, so the accessible name updates as the date changes. But the two structured no-result panels that misuse vermilion (see P1 above) also rely on `text-marker` color alone plus prose to signal "this is a refusal, not a normal result" — for a low-vision user who can perceive the tint difference but not read it as "error" without the surrounding prose, that's a minor but real gap versus the outside-tropics panel's otherwise-good practice of pairing color with a named limit in text.

**Reviewer (portfolio evaluator reading source — project-specific, per PRODUCT.md's named audience):** Finds `EratosthenesLab.tsx:291` — `Δφ = {formatDeg(result.separationDeg, 3)} < {result.minimumDeg}°.` — hardcoded outside `lib/i18n`, the one string in the reviewed surface not sourced from the dictionary in an otherwise-airtight i18n discipline. Also finds three unused dictionary keys confirmed by grep (`eratosthenes.compute`, `place.search`, `place.zone` — defined in both locale blocks of `lib/i18n/index.ts`, referenced nowhere in `components/` or `app/`), suggesting a Compute button, city search, and zone labels were planned and quietly dropped. Small, but exactly the kind of loose end a craft-focused reviewer notices first.

## Minor Observations

- `NoonAnywhere`'s date input has no visible min/max bound, so a user can enter a year far outside the solar model's stated 1800–2100 accuracy window with no warning.
- The privacy/disclaimer sentence repeats near-verbatim across the hero, the place picker, and the footer on a single homepage load — consistent trust-building, but noticeably redundant.
- `SweepMap`'s bare dot-field (no basemap, by documented design) may not read as "a map" at all to a first-time visitor unfamiliar with Indonesia's outline, until they reach the city list beneath it.
- `PlacePicker`'s city `<select>` can desync (blank/mismatched) after picking a city, then geolocating, then wanting to type coordinates — a low-severity but real edge-case gap.

## Questions to Consider

1. Should the two structured-refusal panels (`outside-tropics`, `insufficient-separation`) get a neutral treatment now, or is a documented, intentional "vermilion also marks a refusal directly caused by geometry" exception worth writing into DESIGN.md instead of changing the code? Right now the code and the doc disagree, and whichever one is "wrong" should be decided on purpose.
2. Given Eratosthenes is named as *the* feature that converts a one-time visitor into a returning teacher, does the current single-scroll "everything visible, print-notice" layout survive contact with a teacher managing this on a phone the morning of class — or does this one flow warrant becoming an actual sequential wizard while every other route stays as-is?
3. Now that `pnpm build`/`pnpm preview` are confirmed clean and only `pnpm dev` is broken, is that distinction documented anywhere a contributor would see it before filing a "the site is broken" report?

## Run Notes

- **Target slug**: `site-multi-page-sweep` (multi-page sweep: home, bayangan, tanggal, eratosthenes, sapuan).
- **Ignore list**: `.impeccable/critique/ignore.md` did not exist; no findings suppressed.
- **Assessment independence**: Assessment A and B ran as two isolated sub-agents via the Agent tool (general-purpose), sequentially dispatched but with no shared context or visibility into each other's output. Sub-agent tool was exposed, so this is the dual-agent path — not degraded.
- **CLI detector**: ran successfully (`detect.mjs --json app components`), exit code 2, 10 findings; all read and verified directly by the parent context against source, not taken on faith.
- **Browser visibility / overlay injection**: skipped for this entire run. No browser/screenshot automation tool is exposed in this session (confirmed independently by the parent context and by Assessment B via `ToolSearch` under several phrasings). `pnpm dev` was also confirmed broken (see P2 above), so a working `pnpm build && pnpm preview` static server was started and confirmed serving `200` at `http://localhost:4173/zero-shadow-day/id/` for Assessment B's use, but with no rendering tool available, no screenshots or console injection could be captured either way.
- **Local servers**: `next dev` and the `pnpm preview` static server were both started for this run and both stopped (`pkill`) before this report was finalized; no server was left running.
- **Corrections made in synthesis**: Assessment A's P0 ("dev server fails to boot") was downgraded to P1 after the parent context independently verified `pnpm build` succeeds and the static export serves correctly — the failure is dev-mode-only. Assessment A's "3 vermilion violations" was narrowed to 2 after the parent context read all three flagged sites directly and found one (`DatesDetail`/`DatesSummary`'s ZSD-day-card border) to be on-rule, not a violation. Assessment B's claim that the 7 font-size findings were "likely false positives due to no DESIGN.md" was corrected — `DESIGN.md` exists (written earlier this session) and its type frontmatter confirms these are genuine off-ramp values.
